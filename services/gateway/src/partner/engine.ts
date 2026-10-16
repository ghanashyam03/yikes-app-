import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  PartnerTurnOutputSchema,
  buildPartnerTurnPrompt,
  type PartnerTurnOutput,
} from '@yikes/ai-prompts/partner-turn';
import type { PersonaCard } from '@yikes/ai-prompts/persona-card';
import type { MoodState, PlaybookSummary, ScenarioInfo } from '@yikes/ai-prompts/types';
import { clampMood } from '@yikes/ai-prompts/utilities';
import { PARTNER_TURN_VERSION } from '@yikes/ai-prompts/versions';
import type { GatewayEnv } from '../config/env.js';
import type { AiProvider } from '../providers/types.js';
import type { RateLimiterQueue } from '../queue/rate-limiter.js';
import type { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { checkText } from '../safety/checker.js';
import { guardOutput } from '../safety/output-guard.js';
import { callStructured } from '../structured/call-structured.js';
import type { CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';
import { checkDailyCap, incrementDailyUsage } from '../usage/daily-caps.js';
import {
  DEFAULT_MAYA_PERSONA,
  FALLBACK_HINTS,
  FALLBACK_SUGGESTIONS,
  getFallbackReply,
} from './fallbackLines.js';
import {
  CapReachedError,
  type AttemptRecord,
  type PartnerEndResponse,
  type PartnerHintResponse,
  type PartnerMode,
  type PartnerStartRequest,
  type PartnerStartResponse,
  type PartnerSuggestResponse,
  type PartnerTurnResponse,
  type RevealedThought,
  type TurnRecord,
} from './types.js';

// In-memory store for fallback / testing when Supabase client is not available or for mocking
const inMemoryAttempts = new Map<string, AttemptRecord>();
const inMemoryTurns = new Map<string, TurnRecord[]>();

export function clearInMemoryPartnerStore(): void {
  inMemoryAttempts.clear();
  inMemoryTurns.clear();
}

export function getTurnCapForMode(mode: PartnerMode): number {
  switch (mode) {
    case 'warmup':
      return 4;
    case 'try':
    case 'rehearsal':
      return 6;
    case 'free':
    default:
      return 0; // 0 means unlimited
  }
}

export interface PartnerEngineOptions {
  env: GatewayEnv;
  provider: AiProvider;
  supabase?: SupabaseClient | null | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
}

export class PartnerEngine {
  constructor(private readonly options: PartnerEngineOptions) {}

  /**
   * Start a new practice attempt.
   */
  async startAttempt(
    userId: string,
    request: PartnerStartRequest
  ): Promise<PartnerStartResponse> {
    const { supabase } = this.options;

    // Daily caps check
    const capCheck = await checkDailyCap(supabase ?? null, userId, 'turn');
    if (!capCheck.allowed) {
      throw new CapReachedError(`Daily turn limit reached (${capCheck.current}/${capCheck.limit})`);
    }

    const mode: PartnerMode = request.mode;
    const turnCap = getTurnCapForMode(mode);
    const persona: PersonaCard = request.persona ?? DEFAULT_MAYA_PERSONA;
    const initialMood: MoodState = persona.baseMood ?? {
      engagement: 0.5,
      rapport: 0.5,
      patience: 0.7,
      exitPressure: 0.2,
    };

    const openingText =
      request.openingText ??
      `Hey, thanks for coming by. Did you want to go over the "${request.scenario.title}" situation now?`;

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();

    const attemptRecord: AttemptRecord = {
      id: attemptId,
      userId,
      sessionId: request.sessionId,
      personaId: persona.id,
      mode,
      persona,
      scenario: request.scenario,
      playbookSummary: request.playbookSummary ?? {},
      currentMood: initialMood,
      turnsCount: 0,
      createdAt: nowIso,
    };

    // Store opening turn (idx 0)
    const openingTurnRecord: TurnRecord = {
      id: `turn_${Date.now()}_0`,
      attemptId,
      idx: 0,
      role: 'partner',
      text: openingText,
      thought: "Let's see what they bring up today.",
      mood: initialMood,
      createdAt: nowIso,
    };

    if (supabase) {
      try {
        await supabase.from('attempts').insert({
          id: attemptId,
          user_id: userId,
          session_id: request.sessionId ?? null,
          persona_id: persona.id,
          mode,
          state: {
            persona,
            scenario: request.scenario,
            playbookSummary: request.playbookSummary ?? {},
            currentMood: initialMood,
          },
          turns_count: 0,
          created_at: nowIso,
        });

        await supabase.from('turns').insert({
          id: openingTurnRecord.id,
          attempt_id: attemptId,
          idx: 0,
          role: 'partner',
          text: openingText,
          thought: openingTurnRecord.thought,
          mood: initialMood,
          created_at: nowIso,
        });
      } catch (err: unknown) {
        logger.warn({ errorMsg: String(err) }, 'Supabase insert failed; using in-memory attempt');
      }
    }

    inMemoryAttempts.set(attemptId, attemptRecord);
    inMemoryTurns.set(attemptId, [openingTurnRecord]);

    return {
      attemptId,
      openingTurn: {
        role: 'partner',
        text: openingText,
      },
      initialMood,
      mode,
      turnCap,
    };
  }

  /**
   * Execute a single turn.
   */
  async executeTurn(
    userId: string,
    attemptId: string,
    userText: string
  ): Promise<PartnerTurnResponse> {
    const { env, provider, supabase, rateLimiter, circuitBreaker, callLogger } = this.options;

    // 1. Fetch attempt and past turns
    const attempt = await this.getAttempt(attemptId, userId);
    if (!attempt) {
      throw new Error(`Attempt ${attemptId} not found`);
    }

    const pastTurns = await this.getTurns(attemptId);
    const userTurnsCount = pastTurns.filter((t) => t.role === 'user').length;
    const turnCap = getTurnCapForMode(attempt.mode);

    // 2. Daily caps check
    const capCheck = await checkDailyCap(supabase ?? null, userId, 'turn');
    if (!capCheck.allowed) {
      throw new CapReachedError(`Daily turn limit reached (${capCheck.current}/${capCheck.limit})`);
    }

    // 3. Inbound safety check on userText (T-09)
    const safetyCheck = await checkText(userText, 'input', {
      env,
      provider,
      rateLimiter,
      circuitBreaker,
      callLogger,
      skipModel: env.AI_PROVIDER === 'fake',
    });

    if (safetyCheck.verdict === 'crisis') {
      // Save user turn and terminate attempt with crisis reason
      const userTurnIdx = pastTurns.length;
      await this.saveTurn({
        id: `turn_${Date.now()}_${userTurnIdx}`,
        attemptId,
        idx: userTurnIdx,
        role: 'user',
        text: userText,
        createdAt: new Date().toISOString(),
      });

      await this.markAttemptEnded(attemptId, 'crisis');

      // EXPLICIT REQUIREMENT: Return { crisis: true } with NO AI text!
      return { crisis: true };
    }

    // 4. Save user turn
    const userTurnIdx = pastTurns.length;
    const userTurn: TurnRecord = {
      id: `turn_${Date.now()}_${userTurnIdx}`,
      attemptId,
      idx: userTurnIdx,
      role: 'user',
      text: userText,
      createdAt: new Date().toISOString(),
    };
    await this.saveTurn(userTurn);

    // 5. Construct prompt using buildPartnerTurnPrompt from @yikes/ai-prompts
    const recentTurnsHistory = pastTurns
      .filter((t) => t.role === 'user' || t.role === 'partner')
      .map((t) => ({
        speaker: (t.role === 'user' ? 'user' : 'partner') as 'user' | 'partner',
        text: t.text,
      }));
    recentTurnsHistory.push({ speaker: 'user', text: userText });

    const promptMessages = buildPartnerTurnPrompt({
      persona: attempt.persona,
      scenario: attempt.scenario,
      playbookSummary: attempt.playbookSummary,
      recentTurns: recentTurnsHistory,
      hiddenMood: attempt.currentMood,
    });

    // 6. Call structured AI model with fallback handling
    let rawOutput: PartnerTurnOutput;
    let isDegraded = false;

    try {
      rawOutput = await callStructured({
        job: 'partner',
        messages: promptMessages,
        schema: PartnerTurnOutputSchema,
        provider,
        env,
        rateLimiter,
        circuitBreaker,
        callLogger,
        promptVersion: PARTNER_TURN_VERSION,
        timeoutMs: 8000,
      });
    } catch (err: unknown) {
      logger.warn({ errorMsg: String(err) }, 'Primary and fallback models failed; using persona authored lines');
      isDegraded = true;

      const fallbackLine = getFallbackReply(attempt.persona, userTurnsCount);
      rawOutput = {
        reply: fallbackLine,
        thought: 'Taking a moment to process this.',
        mood: {
          engagement: Math.max(0.2, attempt.currentMood.engagement - 0.05),
          rapport: attempt.currentMood.rapport,
          patience: Math.max(0.2, attempt.currentMood.patience - 0.05),
          exitPressure: Math.min(1.0, attempt.currentMood.exitPressure + 0.05),
        },
        wantsToEnd: turnCap > 0 && userTurnsCount + 1 >= turnCap,
        cue: 0.5,
      };
    }

    // 7. Clamp mood changes using clampMood (max 0.15 step)
    const clampedMood = clampMood(attempt.currentMood, rawOutput.mood, 0.15);

    // 8. Output guardrails: check clinical words and human claims
    let replyText = rawOutput.reply;
    const guardResult = guardOutput(replyText, 'partner');
    if (!guardResult.ok) {
      logger.warn({ reason: guardResult.reason }, 'Output guardrail violation detected; replacing with safe fallback');
      replyText = getFallbackReply(attempt.persona, userTurnsCount);
      isDegraded = true;
    }

    // Outbound safety check
    const outboundSafety = await checkText(replyText, 'output', {
      env,
      provider,
      rateLimiter,
      circuitBreaker,
      callLogger,
      skipModel: env.AI_PROVIDER === 'fake',
    });

    if (outboundSafety.verdict !== 'allow') {
      logger.warn({ verdict: outboundSafety.verdict }, 'Outbound safety check failed; replacing with safe fallback');
      replyText = getFallbackReply(attempt.persona, userTurnsCount);
      isDegraded = true;
    }

    // 9. Check turn cap
    const nextUserTurnsCount = userTurnsCount + 1;
    const isCapReached = turnCap > 0 && nextUserTurnsCount >= turnCap;
    const wantsToEnd = rawOutput.wantsToEnd || isCapReached;

    // 10. Save partner turn into turns table (thought is saved in DB, but NEVER returned in turn response!)
    const partnerTurnIdx = userTurnIdx + 1;
    const partnerTurn: TurnRecord = {
      id: `turn_${Date.now()}_${partnerTurnIdx}`,
      attemptId,
      idx: partnerTurnIdx,
      role: 'partner',
      text: replyText,
      thought: rawOutput.thought, // Saved for later reveal!
      mood: clampedMood,
      createdAt: new Date().toISOString(),
    };
    await this.saveTurn(partnerTurn);

    // Update attempt state
    attempt.currentMood = clampedMood;
    attempt.turnsCount = partnerTurnIdx + 1;
    if (isDegraded) attempt.degraded = true;
    await this.updateAttemptState(attempt);

    // Increment daily usage count
    await incrementDailyUsage(supabase ?? null, userId, 'turn');

    // 11. STRICT PRIVACY GUARANTEE: The thought is NEVER returned in turn response!
    return {
      reply: replyText,
      mood: clampedMood,
      wantsToEnd,
      cue: rawOutput.cue,
      degraded: isDegraded,
      turnIdx: partnerTurnIdx,
      turnsCount: partnerTurnIdx + 1,
    };
  }

  /**
   * Suggest 3 replies in the user's register.
   */
  async suggestReplies(
    userId: string,
    attemptId: string
  ): Promise<PartnerSuggestResponse> {
    const { env, provider, rateLimiter, circuitBreaker, callLogger } = this.options;
    const attempt = await this.getAttempt(attemptId, userId);
    if (!attempt) {
      return { suggestions: FALLBACK_SUGGESTIONS };
    }

    const pastTurns = await this.getTurns(attemptId);
    const lastPartnerTurn = [...pastTurns].reverse().find((t) => t.role === 'partner');

    const SuggestionOutputSchema = z.object({
      suggestions: z.array(z.string().min(1)).min(1).max(3),
    });

    try {
      const messages = [
        {
          role: 'system' as const,
          content: `You are generating 3 short, realistic reply suggestions for a user practicing in yikes!.
The user has social anxiety / introversion and is practicing awkward conversations.
Suggestions must:
1. Match the user's register and style: ${attempt.playbookSummary.communicationStyle ?? 'calm, natural, grounded'}.
2. Be concise (1-2 short sentences each).
3. Offer 3 distinct angles: (a) direct acknowledgment, (b) curious question, (c) gentle boundary or alternative.
4. Sound like real speech, not stiff templates.

Output JSON ONLY matching:
{
  "suggestions": ["reply 1", "reply 2", "reply 3"]
}`,
        },
        {
          role: 'user' as const,
          content: `Last partner line from ${attempt.persona.name}: "${lastPartnerTurn?.text ?? attempt.scenario.title}"\nGenerate 3 suggestions in JSON:`,
        },
      ];

      const res = await callStructured({
        job: 'alt',
        messages,
        schema: SuggestionOutputSchema,
        provider,
        env,
        rateLimiter,
        circuitBreaker,
        callLogger,
        promptVersion: 'suggest-v1',
        timeoutMs: 4000,
      });

      if (res.suggestions.length >= 3) {
        return { suggestions: res.suggestions.slice(0, 3) };
      }
      return {
        suggestions: [
          ...res.suggestions,
          ...FALLBACK_SUGGESTIONS.slice(res.suggestions.length),
        ].slice(0, 3),
      };
    } catch {
      return { suggestions: FALLBACK_SUGGESTIONS };
    }
  }

  /**
   * Get 1 coaching perspective or idea hint.
   */
  async getHint(
    userId: string,
    attemptId: string
  ): Promise<PartnerHintResponse> {
    const { env, provider, rateLimiter, circuitBreaker, callLogger } = this.options;
    const attempt = await this.getAttempt(attemptId, userId);
    if (!attempt) {
      return { hint: FALLBACK_HINTS[0]! };
    }

    const pastTurns = await this.getTurns(attemptId);
    const lastPartnerTurn = [...pastTurns].reverse().find((t) => t.role === 'partner');

    const HintOutputSchema = z.object({
      hint: z.string().min(1),
    });

    try {
      const messages = [
        {
          role: 'system' as const,
          content: `You are a gentle communication coach for yikes!. Provide ONE short perspective or idea for what the user could focus on in their next turn.
Rules:
- Give an idea or perspective, NOT a word-for-word script.
- Keep it under 2 sentences.
- Tone: warm, pragmatic, zero shame.

Output JSON:
{
  "hint": "coaching perspective"
}`,
        },
        {
          role: 'user' as const,
          content: `Scenario: "${attempt.scenario.title}"
Partner (${attempt.persona.name}): "${lastPartnerTurn?.text ?? ''}"
User goal: "${attempt.scenario.userGoal}"`,
        },
      ];

      const res = await callStructured({
        job: 'coach',
        messages,
        schema: HintOutputSchema,
        provider,
        env,
        rateLimiter,
        circuitBreaker,
        callLogger,
        promptVersion: 'hint-v1',
        timeoutMs: 4000,
      });

      return { hint: res.hint };
    } catch {
      const hintIdx = Math.floor(Math.random() * FALLBACK_HINTS.length);
      return { hint: FALLBACK_HINTS[hintIdx] ?? FALLBACK_HINTS[0]! };
    }
  }

  /**
   * End practice attempt and return revealed inner thoughts.
   */
  async endAttempt(
    userId: string,
    attemptId: string,
    endedReason = 'user_finished'
  ): Promise<PartnerEndResponse> {
    const attempt = await this.getAttempt(attemptId, userId);
    if (!attempt) {
      throw new Error(`Attempt ${attemptId} not found`);
    }

    const endedAt = new Date().toISOString();
    await this.markAttemptEnded(attemptId, endedReason, endedAt);

    const turns = await this.getTurns(attemptId);
    const revealedThoughts: RevealedThought[] = [];

    for (const turn of turns) {
      if (turn.thought && turn.role === 'partner') {
        revealedThoughts.push({
          turnIdx: turn.idx,
          role: turn.role,
          thought: turn.thought,
        });
      }
    }

    return {
      attemptId,
      endedAt,
      turnsCount: turns.length,
      endedReason,
      thoughts: revealedThoughts,
    };
  }

  // --- Internal Storage Helpers ---

  private async getAttempt(
    attemptId: string,
    userId: string
  ): Promise<AttemptRecord | null> {
    const memory = inMemoryAttempts.get(attemptId);
    if (memory) {
      if (memory.userId !== userId) return null;
      return memory;
    }

    const { supabase } = this.options;
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      const state = (data.state as Record<string, unknown>) ?? {};
      const record: AttemptRecord = {
        id: data.id,
        userId: data.user_id,
        sessionId: data.session_id,
        personaId: data.persona_id,
        mode: data.mode as PartnerMode,
        persona: (state.persona as PersonaCard) ?? DEFAULT_MAYA_PERSONA,
        scenario: (state.scenario as ScenarioInfo) ?? {
          title: 'Practice',
          setting: 'Casual',
          userGoal: 'Chat',
        },
        playbookSummary: (state.playbookSummary as PlaybookSummary) ?? {},
        currentMood: (state.currentMood as MoodState) ?? {
          engagement: 0.5,
          rapport: 0.5,
          patience: 0.7,
          exitPressure: 0.2,
        },
        turnsCount: data.turns_count ?? 0,
        endedAt: data.ended_at,
        endedReason: data.ended_reason,
        createdAt: data.created_at,
      };

      inMemoryAttempts.set(attemptId, record);
      return record;
    } catch {
      return null;
    }
  }

  private async getTurns(attemptId: string): Promise<TurnRecord[]> {
    const memory = inMemoryTurns.get(attemptId);
    if (memory && memory.length > 0) {
      return [...memory].sort((a, b) => a.idx - b.idx);
    }

    const { supabase } = this.options;
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('turns')
        .select('*')
        .eq('attempt_id', attemptId)
        .order('idx', { ascending: true });

      if (error || !data) return [];

      const records: TurnRecord[] = data.map((d) => ({
        id: d.id,
        attemptId: d.attempt_id,
        idx: d.idx,
        role: d.role as 'user' | 'partner' | 'coach' | 'system',
        text: d.text,
        thought: d.thought,
        mood: d.mood as MoodState | undefined,
        createdAt: d.created_at,
      }));

      inMemoryTurns.set(attemptId, records);
      return records;
    } catch {
      return [];
    }
  }

  private async saveTurn(turn: TurnRecord): Promise<void> {
    const current = inMemoryTurns.get(turn.attemptId) ?? [];
    current.push(turn);
    inMemoryTurns.set(turn.attemptId, current);

    const { supabase } = this.options;
    if (supabase) {
      try {
        await supabase.from('turns').insert({
          id: turn.id,
          attempt_id: turn.attemptId,
          idx: turn.idx,
          role: turn.role,
          text: turn.text,
          thought: turn.thought ?? null,
          mood: turn.mood ?? null,
          created_at: turn.createdAt,
        });
      } catch (err: unknown) {
        logger.warn({ errorMsg: String(err) }, 'Failed to insert turn into Supabase');
      }
    }
  }

  private async updateAttemptState(attempt: AttemptRecord): Promise<void> {
    inMemoryAttempts.set(attempt.id, attempt);

    const { supabase } = this.options;
    if (supabase) {
      try {
        await supabase
          .from('attempts')
          .update({
            turns_count: attempt.turnsCount,
            state: {
              persona: attempt.persona,
              scenario: attempt.scenario,
              playbookSummary: attempt.playbookSummary,
              currentMood: attempt.currentMood,
            },
          })
          .eq('id', attempt.id);
      } catch (err: unknown) {
        logger.warn({ errorMsg: String(err) }, 'Failed to update attempt in Supabase');
      }
    }
  }

  private async markAttemptEnded(
    attemptId: string,
    reason: string,
    endedAt = new Date().toISOString()
  ): Promise<void> {
    const mem = inMemoryAttempts.get(attemptId);
    if (mem) {
      mem.endedAt = endedAt;
      mem.endedReason = reason;
      inMemoryAttempts.set(attemptId, mem);
    }

    const { supabase } = this.options;
    if (supabase) {
      try {
        await supabase
          .from('attempts')
          .update({
            ended_at: endedAt,
            ended_reason: reason,
          })
          .eq('id', attemptId);
      } catch (err: unknown) {
        logger.warn({ errorMsg: String(err) }, 'Failed to mark attempt ended in Supabase');
      }
    }
  }
}
