import { describe, expect, it, beforeEach } from 'vitest';
import type { CoachFeedback } from '@yikes/ai-prompts/coach-feedback';
import type { GatewayEnv } from '../../config/env.js';
import type { AiProvider, CompletionRequest, CompletionResponse, StreamChunk } from '../../providers/types.js';
import { CoachEngine, clearInMemoryCoachStore } from '../engine.js';

describe('T-13 Acceptance Check 1: Verbatim Quote Verification, Regeneration & Dropping', () => {
  const mockEnv: GatewayEnv = {
    NVIDIA_API_KEY: 'test_key',
    NVIDIA_BASE_URL: 'https://integrate.api.nvidia.com/v1',
    MODEL_PARTNER: 'test-partner',
    MODEL_PARTNER_FALLBACK: 'test-fallback',
    MODEL_COACH: 'test-coach',
    MODEL_COACH_FALLBACK: 'test-coach-fallback',
    MODEL_JUDGE: 'test-judge',
    MODEL_SAFETY: 'test-safety',
    MODEL_VISION: 'test-vision',
    MODEL_LONG: 'test-long',
    MODEL_ALT: 'test-alt',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service_role_key',
    AI_PROVIDER: 'fake',
    HOST: '0.0.0.0',
    PORT: 3000,
    REQUEST_TIMEOUT_MS: 8000,
    RPM_LIMIT: 35,
  };

  beforeEach(() => {
    clearInMemoryCoachStore();
  });

  it('proves regeneration when initial quote is paraphrased, and quote dropping when second try still fails', async () => {
    let callCount = 0;
    const sentPrompts: CompletionRequest[] = [];

    // Transcript user line is: "Good morning! Quick question for you."
    // Provider response 1 returns paraphrased quote: "Hey do you have a minute for questions?"
    const paraphrasedFeedback1: CoachFeedback = {
      intro: 'Good conversational start.',
      worked: [
        {
          quote: 'Hey do you have a minute for questions?', // PARAPHRASED! Not in transcript
          why: 'Direct and polite inquiry.',
        },
      ],
      pivot: {
        quote: 'Hey do you have a minute for questions?',
        whatHappened: 'A bit fast.',
        rewrite: 'Could I ask you one quick thing?',
      },
      tryNext: 'Give them a pause before following up.',
      skillVotes: [{ skill: 'Starting a chat', stage: 'practicing', reason: 'Solid opener' }],
      partnerArc: 'Maya was ready to engage.',
    };

    // Provider response 2 (regeneration) returns another quote:
    // One exact quote: "Good morning!"
    // One unverified quote: "Invented non-existent line"
    const retryFeedback2: CoachFeedback = {
      intro: 'Regenerated feedback.',
      worked: [
        {
          quote: 'Good morning!', // VERBATIM! Substring of "Good morning! Quick question for you."
          why: 'Friendly opening greeting.',
        },
        {
          quote: 'Invented non-existent line', // Still INVALID!
          why: 'This line never occurred.',
        },
      ],
      pivot: {
        quote: 'Still invented pivot line', // INVALID!
        whatHappened: 'Did not match',
        rewrite: 'Better rewrite',
      },
      tryNext: 'Keep practicing open questions.',
      skillVotes: [{ skill: 'Starting a chat', stage: 'practicing', reason: 'Good progress' }],
      partnerArc: 'Maya warmed up.',
    };

    const mockProvider: AiProvider = {
      async complete(request: CompletionRequest): Promise<CompletionResponse> {
        callCount++;
        sentPrompts.push(request);

        let text: string;
        if (request.model === mockEnv.MODEL_JUDGE) {
          text = JSON.stringify({
            adheresToRules: true,
            verbatimHonesty: true,
            noShaming: true,
            noClinicalWords: true,
            score: 0.95,
            notes: 'Feedback adheres strictly to rules.',
          });
        } else if (callCount === 1) {
          text = JSON.stringify(paraphrasedFeedback1);
        } else {
          text = JSON.stringify(retryFeedback2);
        }

        return {
          id: `res_${callCount}`,
          model: request.model,
          text,
        };
      },
      async *stream(): AsyncIterable<StreamChunk> {
        yield { text: '', done: true };
      },
    };

    const engine = new CoachEngine({
      env: mockEnv,
      provider: mockProvider,
    });

    const result = await engine.generateFeedback('usr_quote_test', {
      attemptId: 'att_quote_test',
      skillKey: 'starting_chat',
    });

    // 1. Proves prompt regeneration happened: provider was called at least 2 times
    const coachCalls = sentPrompts.filter((p) => p.model === mockEnv.MODEL_COACH);
    expect(coachCalls.length).toBeGreaterThanOrEqual(2);

    // 2. Proves the retry prompt included the invalid quote hint
    const retryPromptMessages = coachCalls[1]!.messages;
    const lastUserMessage = retryPromptMessages[retryPromptMessages.length - 1]!.content;
    expect(lastUserMessage).toContain('CRITICAL HONESTY RULE VIOLATION');
    expect(lastUserMessage).toContain('Hey do you have a minute for questions?');

    // 3. Proves unverified quotes were dropped:
    // "Invented non-existent line" dropped from worked
    // "Still invented pivot line" dropped -> pivot is null
    expect(result.feedback.worked).toHaveLength(1);
    expect(result.feedback.worked[0]!.quote).toBe('Good morning!');
    expect(result.feedback.pivot).toBeNull();

    // 4. Proves verified is false because quotes had to be dropped / regenerated
    expect(result.verified).toBe(false);
  });

  it('proves that if all worked quotes are invalid, authored rubric fallback is applied', async () => {
    const invalidFeedback: CoachFeedback = {
      intro: 'Intro with no real quotes.',
      worked: [
        {
          quote: 'Totally made up user phrase',
          why: 'Reason',
        },
      ],
      pivot: null,
      tryNext: 'Next advice',
      skillVotes: [{ skill: 'Starting a chat', stage: 'starting', reason: 'Fallback' }],
      partnerArc: 'Partner stayed engaged',
    };

    const mockProvider: AiProvider = {
      async complete(request: CompletionRequest): Promise<CompletionResponse> {
        if (request.model === mockEnv.MODEL_JUDGE) {
          return {
            id: 'res_judge',
            model: request.model,
            text: JSON.stringify({
              adheresToRules: true,
              verbatimHonesty: true,
              noShaming: true,
              noClinicalWords: true,
              score: 0.9,
              notes: 'Clean.',
            }),
          };
        }
        return {
          id: 'res_invalid',
          model: request.model,
          text: JSON.stringify(invalidFeedback),
        };
      },
      async *stream(): AsyncIterable<StreamChunk> {
        yield { text: '', done: true };
      },
    };

    const engine = new CoachEngine({
      env: mockEnv,
      provider: mockProvider,
    });

    const result = await engine.generateFeedback('usr_fallback_test', {
      attemptId: 'att_fallback_test',
      skillKey: 'starting_chat',
    });

    // Authored fallback applied because all worked quotes were dropped
    expect(result.feedback.worked.length).toBeGreaterThan(0);
    expect(result.verified).toBe(false);
    expect(result.feedback.tryNext).toContain('starting a chat');
  });
});
