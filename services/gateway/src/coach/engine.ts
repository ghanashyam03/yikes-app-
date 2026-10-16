import type { SupabaseClient } from '@supabase/supabase-js';
import {
  COACH_FEEDBACK_PROMPT_VERSION,
  CoachFeedbackSchema,
  buildCoachFeedbackPrompt,
  type CoachFeedback,
} from '@yikes/ai-prompts/coach-feedback';
import type { CoachToneVariant, PlaybookSummary, SkillRubric, TranscriptTurn } from '@yikes/ai-prompts/types';
import { verifyQuotes } from '@yikes/ai-prompts/utilities';
import type { GatewayEnv } from '../config/env.js';
import type { AiProvider } from '../providers/types.js';
import type { RateLimiterQueue } from '../queue/rate-limiter.js';
import type { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { callStructured } from '../structured/call-structured.js';
import type { CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';
import { DEFAULT_SKILL_RUBRICS, getAuthoredRubricFallback } from './fallbackTemplates.js';
import { sampleAndEvaluateFeedbackInBackground } from './judgeSampler.js';
import { recordSkillVote } from './stageTracker.js';
import type {
  CoachFeedbackRequest,
  CoachFeedbackResponse,
  SkillStageUpdateResult,
  ThoughtItem,
  ThoughtsResponse,
} from './types.js';

export class AttemptNotEndedError extends Error {
  constructor(message = 'Attempt has not ended yet. Thoughts are confidential until completion.') {
    super(message);
    this.name = 'AttemptNotEndedError';
  }
}

export class AttemptNotFoundError extends Error {
  constructor(message = 'Attempt not found') {
    super(message);
    this.name = 'AttemptNotFoundError';
  }
}

export interface CoachEngineOptions {
  env: GatewayEnv;
  provider: AiProvider;
  supabase?: SupabaseClient | null | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
}

export interface StoredFeedbackEntry {
  id: string;
  attemptId: string;
  payload: CoachFeedback;
  model: string;
  promptVersion: string;
  verified: boolean;
  createdAt: string;
}

const inMemoryFeedbacks = new Map<string, StoredFeedbackEntry>();

export function clearInMemoryCoachStore(): void {
  inMemoryFeedbacks.clear();
}

export class CoachEngine {
  constructor(private readonly options: CoachEngineOptions) {}

  /**
   * Generates coach feedback with verbatim quote verification,
   * single-retry regeneration on invalid quotes, dropping unverified quotes,
   * and authored rubric fallback when no valid quotes remain.
   */
  async generateFeedback(
    userId: string,
    request: CoachFeedbackRequest
  ): Promise<CoachFeedbackResponse> {
    const { env, provider, supabase, rateLimiter, circuitBreaker, callLogger } = this.options;
    const { attemptId } = request;

    // 1. Fetch attempt and turns
    const { attempt, turns } = await this.loadAttemptAndTurns(userId, attemptId);
    if (!attempt) {
      throw new AttemptNotFoundError(`Attempt ${attemptId} not found`);
    }

    const transcriptTurns: TranscriptTurn[] = turns.map((t) => ({
      role: t.role === 'partner' ? 'partner' : 'user',
      text: t.text,
    }));

    const thoughts: Array<{ turnIndex: number; thought: string }> = turns
      .filter((t) => t.thought && t.thought.trim().length > 0)
      .map((t) => ({
        turnIndex: t.idx,
        thought: t.thought!,
      }));

    // 2. Resolve Playbook & Skill Rubric
    const playbookSummary = this.resolvePlaybookSummary(attempt.state);
    const skillKey = request.skillKey || (attempt.state?.skillKey as string) || 'starting_chat';
    const skillRubric = this.resolveSkillRubric(skillKey);

    const rawTone = (request.toneVariant || playbookSummary.coachTone || 'gentle').toLowerCase();
    const toneVariant: CoachToneVariant =
      rawTone === 'straight' || rawTone === 'funny' ? rawTone : 'gentle';

    // 3. Build Coach Prompt
    const prompt = buildCoachFeedbackPrompt({
      transcript: transcriptTurns,
      thoughts,
      playbook: playbookSummary,
      skillRubric,
      toneVariant,
    });

    const model = env.MODEL_COACH || 'meta/llama-3.1-70b-instruct';
    let rawFeedback: CoachFeedback;

    try {
      rawFeedback = await callStructured({
        job: 'coach',
        messages: prompt,
        schema: CoachFeedbackSchema,
        provider,
        env,
        rateLimiter,
        circuitBreaker,
        callLogger,
        promptVersion: COACH_FEEDBACK_PROMPT_VERSION,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ errorMsg: msg }, 'Coach structured call failed; using authored fallback');
      const firstUserLine = transcriptTurns.find((t) => t.role === 'user')?.text;
      rawFeedback = getAuthoredRubricFallback(skillKey, firstUserLine);
    }

    // 4. Verbatim Quote Verification & Regeneration
    let verification = verifyQuotes(rawFeedback, transcriptTurns);
    let finalFeedback = rawFeedback;
    let verified = verification.valid;

    // Retry once if invalid quotes found
    if (!verification.valid) {
      logger.info(
        { invalidQuotes: verification.invalidQuotes },
        'Initial coach output had invalid quotes. Attempting regeneration once.'
      );

      const retryPrompt = [
        ...prompt,
        {
          role: 'assistant' as const,
          content: JSON.stringify(rawFeedback),
        },
        {
          role: 'user' as const,
          content: `CRITICAL HONESTY RULE VIOLATION: The following quotes were NOT found verbatim in the user's transcript:
${verification.invalidQuotes.map((q) => `- "${q}"`).join('\n')}

Every quote in "worked" and "pivot" must be an exact substring from the user's lines in the transcript. Regenerate your feedback using ONLY exact quotes from the transcript.`,
        },
      ];

      try {
        const regeneratedFeedback = await callStructured({
          job: 'coach',
          messages: retryPrompt,
          schema: CoachFeedbackSchema,
          provider,
          env,
          rateLimiter,
          circuitBreaker,
          callLogger,
          promptVersion: COACH_FEEDBACK_PROMPT_VERSION,
        });

        const retryVerification = verifyQuotes(regeneratedFeedback, transcriptTurns);
        if (retryVerification.valid) {
          finalFeedback = regeneratedFeedback;
          verified = true;
          verification = retryVerification;
        } else {
          // Drops unverified quotes
          finalFeedback = this.cleanUnverifiedQuotes(regeneratedFeedback, retryVerification.invalidQuotes);
          verified = false;
        }
      } catch {
        finalFeedback = this.cleanUnverifiedQuotes(rawFeedback, verification.invalidQuotes);
        verified = false;
      }
    }

    // 5. If no valid worked items remain, apply authored rubric fallback
    if (!finalFeedback.worked || finalFeedback.worked.length === 0) {
      logger.info('No valid worked quotes remain. Applying authored rubric fallback.');
      const firstUserLine = transcriptTurns.find((t) => t.role === 'user')?.text;
      const fallback = getAuthoredRubricFallback(skillKey, firstUserLine);
      finalFeedback = {
        ...finalFeedback,
        worked: fallback.worked,
        tryNext: fallback.tryNext,
      };
      verified = false;
    }

    // 6. Persist to coach_feedback
    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const storedEntry: StoredFeedbackEntry = {
      id: feedbackId,
      attemptId,
      payload: finalFeedback,
      model,
      promptVersion: COACH_FEEDBACK_PROMPT_VERSION,
      verified,
      createdAt: nowIso,
    };
    inMemoryFeedbacks.set(feedbackId, storedEntry);

    if (supabase) {
      try {
        await supabase.from('coach_feedback').insert({
          id: feedbackId,
          attempt_id: attemptId,
          payload: finalFeedback,
          model,
          prompt_version: COACH_FEEDBACK_PROMPT_VERSION,
          verified,
          created_at: nowIso,
        });
      } catch (err: unknown) {
        logger.warn({ errorMsg: String(err) }, 'Failed to persist coach_feedback to Supabase');
      }
    }

    // 7. Update skill progress stage (agreeing across last 3 votes)
    let stageUpdate: SkillStageUpdateResult | undefined;
    const primaryVote = finalFeedback.skillVotes?.[0];
    if (primaryVote) {
      try {
        stageUpdate = await recordSkillVote(supabase, userId, skillKey, {
          stage: primaryVote.stage,
          reason: primaryVote.reason,
          attemptId,
        });
      } catch (err: unknown) {
        logger.warn({ errorMsg: String(err) }, 'Failed to record skill progress vote');
      }
    }

    // 8. Sample 20% in background to Judge model
    sampleAndEvaluateFeedbackInBackground({
      feedbackId,
      feedback: finalFeedback,
      transcript: transcriptTurns,
      env,
      provider,
      supabase,
      sampleRatio: 0.2,
    });

    return {
      id: feedbackId,
      attemptId,
      feedback: finalFeedback,
      verified,
      model,
      promptVersion: COACH_FEEDBACK_PROMPT_VERSION,
      stageUpdate,
      createdAt: nowIso,
    };
  }

  /**
   * Confidential Thoughts Access:
   * Returns thoughts only if attempt.ended_at is non-null.
   * Throws AttemptNotEndedError (403) otherwise!
   */
  async getAttemptThoughts(userId: string, attemptId: string): Promise<ThoughtsResponse> {
    const { attempt, turns } = await this.loadAttemptAndTurns(userId, attemptId);
    if (!attempt) {
      throw new AttemptNotFoundError(`Attempt ${attemptId} not found`);
    }

    if (!attempt.endedAt) {
      throw new AttemptNotEndedError(
        `Attempt ${attemptId} has not ended yet. Thoughts are confidential until practice completes.`
      );
    }

    const thoughts: ThoughtItem[] = turns
      .filter((t) => t.thought && t.thought.trim().length > 0)
      .map((t) => ({
        turnIndex: t.idx,
        role: t.role,
        thought: t.thought!,
      }));

    return {
      attemptId,
      thoughts,
    };
  }

  private cleanUnverifiedQuotes(
    feedback: CoachFeedback,
    invalidQuotes: string[]
  ): CoachFeedback {
    const cleanedWorked = feedback.worked.filter(
      (item) => !invalidQuotes.includes(item.quote)
    );

    let cleanedPivot = feedback.pivot;
    if (cleanedPivot && invalidQuotes.includes(cleanedPivot.quote)) {
      cleanedPivot = null;
    }

    return {
      ...feedback,
      worked: cleanedWorked,
      pivot: cleanedPivot,
    };
  }

  private resolvePlaybookSummary(attemptState?: Record<string, unknown>): PlaybookSummary {
    const raw = (attemptState?.playbookSummary as Record<string, unknown>) || {};
    return {
      pace: typeof raw.pace === 'string' ? raw.pace : undefined,
      coachTone: typeof raw.coachTone === 'string' ? (raw.coachTone as CoachToneVariant) : 'gentle',
      communicationStyle: typeof raw.communicationStyle === 'string' ? raw.communicationStyle : undefined,
      hardestPlaces: Array.isArray(raw.hardestPlaces) ? (raw.hardestPlaces as string[]) : undefined,
    };
  }

  private resolveSkillRubric(skillKey: string): SkillRubric {
    const skill = DEFAULT_SKILL_RUBRICS[skillKey] ?? DEFAULT_SKILL_RUBRICS.starting_chat!;
    return {
      skill: skill.name,
      description: skill.description,
      targetBehaviors: [
        'Notice conversational momentum',
        'Respond to cues rather than rushing',
        'Keep balance between curiosity and personal sharing',
      ],
      stageRubrics: {
        starting: 'Hesitant or abrupt; requires conscious effort to keep rhythm.',
        practicing: 'Moves are deliberate and recognisable, occasionally missing subtle cues.',
        growing: 'Smooth and responsive across typical workplace and social scenarios.',
        natural: 'Effortless and empathetic; intuitively adjusts to partner register.',
      },
    };
  }

  private async loadAttemptAndTurns(
    userId: string,
    attemptId: string
  ): Promise<{
    attempt: { id: string; endedAt: string | null; state?: Record<string, unknown> } | null;
    turns: Array<{ id: string; idx: number; role: string; text: string; thought?: string | null }>;
  }> {
    const { supabase } = this.options;
    if (supabase) {
      try {
        const { data: attemptRow } = await supabase
          .from('attempts')
          .select('id, user_id, ended_at, state')
          .eq('id', attemptId)
          .eq('user_id', userId)
          .maybeSingle();

        if (attemptRow) {
          const { data: turnRows } = await supabase
            .from('turns')
            .select('id, idx, role, text, thought')
            .eq('attempt_id', attemptId)
            .order('idx', { ascending: true });

          return {
            attempt: {
              id: attemptRow.id,
              endedAt: attemptRow.ended_at,
              state: attemptRow.state || {},
            },
            turns: turnRows || [],
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    // Default mock / test attempt if not in DB
    return {
      attempt: {
        id: attemptId,
        endedAt: new Date().toISOString(),
        state: {},
      },
      turns: [
        { id: '1', idx: 0, role: 'partner', text: 'Hey there!', thought: 'Wonder who this is.' },
        { id: '2', idx: 1, role: 'user', text: 'Good morning! Quick question for you.' },
        { id: '3', idx: 2, role: 'partner', text: 'Sure, what is on your mind?', thought: 'Sounds focused.' },
      ],
    };
  }
}
