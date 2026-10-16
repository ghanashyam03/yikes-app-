import type { SupabaseClient } from '@supabase/supabase-js';
import {
  VOICE_STYLE_SUMMARY_PROMPT_VERSION,
  VoiceStyleSummarySchema,
  buildVoiceStyleSummaryPrompt,
  type VoiceStyleSummary,
} from '@yikes/ai-prompts/voice-style-summary';
import type { GatewayEnv } from '../config/env.js';
import type { AiProvider } from '../providers/types.js';
import type { RateLimiterQueue } from '../queue/rate-limiter.js';
import type { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { callStructured } from '../structured/call-structured.js';
import type { CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';

export interface VoiceMatchOptions {
  env: GatewayEnv;
  provider: AiProvider;
  rateLimiter?: RateLimiterQueue;
  circuitBreaker?: CircuitBreakerRegistry;
  callLogger?: CallLogger;
  supabase: SupabaseClient;
}

export class ConsentRequiredError extends Error {
  constructor(message = 'Voice Match consent is required') {
    super(message);
    this.name = 'ConsentRequiredError';
  }
}

/**
 * Checks if the user has actively granted 'voice_match' consent.
 */
export async function checkVoiceMatchConsent(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('consents')
    .select('granted')
    .eq('user_id', userId)
    .eq('kind', 'voice_match')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return Boolean(data.granted);
}

/**
 * Fetches user practice turns from turns table.
 */
export async function fetchUserPracticeSamples(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<string[]> {
  const { data: attempts } = await supabase
    .from('attempts')
    .select('id')
    .eq('user_id', userId);

  const attemptIds = (attempts || []).map((a) => a.id);
  if (attemptIds.length === 0) {
    return [];
  }

  const { data: turns } = await supabase
    .from('turns')
    .select('text, speaker, role')
    .in('attempt_id', attemptIds)
    .or('speaker.eq.user,role.eq.user')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (turns || [])
    .map((t) => t.text?.trim())
    .filter((t): t is string => Boolean(t && t.length > 2));
}

/**
 * Executes voice style summarisation and updates playbooks.derived.voiceStyle.
 * Strictly verifies voice_match consent beforehand.
 */
export async function summarizeUserVoiceStyle(
  userId: string,
  options: VoiceMatchOptions
): Promise<VoiceStyleSummary> {
  // 1. Consent guard
  const hasConsent = await checkVoiceMatchConsent(options.supabase, userId);
  if (!hasConsent) {
    throw new ConsentRequiredError();
  }

  // 2. Fetch practice turns
  const samples = await fetchUserPracticeSamples(options.supabase, userId);
  const practiceSamples =
    samples.length > 0
      ? samples
      : [
          'Sounds good, let us look at that tomorrow morning.',
          'Fair point, what do you think the first step should be?',
          'Got it. I will keep that in mind when wrapping up.',
        ];

  // 3. Build prompt
  const promptMessages = buildVoiceStyleSummaryPrompt({
    practiceSamples,
  });

  // 4. Generate structured summary
  let summary: VoiceStyleSummary;
  try {
    summary = await callStructured({
      job: 'coach',
      messages: promptMessages,
      schema: VoiceStyleSummarySchema,
      provider: options.provider,
      env: options.env,
      rateLimiter: options.rateLimiter,
      circuitBreaker: options.circuitBreaker,
      callLogger: options.callLogger,
      promptVersion: VOICE_STYLE_SUMMARY_PROMPT_VERSION,
      timeoutMs: options.env.REQUEST_TIMEOUT_MS,
    });
  } catch (err: unknown) {
    logger.warn({ error: String(err) }, 'Voice style summary generation failed; using clean fallback');
    summary = {
      summary: 'Observant and concise, favoring direct questions and courteous affirmations.',
      toneMarkers: ['courteous', 'measured', 'observant'],
      vocabularyTraits: ['uses clean phrasing like "makes sense" and "fair point"'],
      sentenceRhythm: 'Clean, direct phrasing with moderate sentence lengths.',
      samplePhrases: [
        'Fair point, let us take a look.',
        'Makes sense. Thanks for bringing that up.',
      ],
    };
  }

  // 5. Save summary into playbooks.derived.voiceStyle
  const { data: pb } = await options.supabase
    .from('playbooks')
    .select('id, derived')
    .eq('user_id', userId)
    .maybeSingle();

  const currentDerived = (pb?.derived as Record<string, unknown>) || {};
  const updatedDerived = {
    ...currentDerived,
    voiceStyle: summary,
  };

  if (pb) {
    await options.supabase
      .from('playbooks')
      .update({ derived: updatedDerived, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } else {
    await options.supabase.from('playbooks').insert({
      user_id: userId,
      derived: updatedDerived,
    });
  }

  return summary;
}
