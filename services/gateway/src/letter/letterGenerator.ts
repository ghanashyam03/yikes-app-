import type { SupabaseClient } from '@supabase/supabase-js';
import {
  WEEKLY_LETTER_PROMPT_VERSION,
  WeeklyLetterSchema,
  buildWeeklyLetterPrompt,
  type WeeklyLetter,
} from '@yikes/ai-prompts/weekly-letter';
import type { PlaybookSummary } from '@yikes/ai-prompts/types';
import type { GatewayEnv } from '../config/env.js';
import type { AiProvider } from '../providers/types.js';
import type { RateLimiterQueue } from '../queue/rate-limiter.js';
import type { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { callStructured } from '../structured/call-structured.js';
import type { CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';
import type { WeeklyDigest, WeeklyLetterRecord } from './types.js';

// Banned clinical words
const CLINICAL_WORDS = [
  /\b(?:treat|treats|treating|treated|treatment|treatments)\b/i,
  /\b(?:cure|cures|curing|cured|curable)\b/i,
  /\b(?:therapy|therapies|therapist|therapists|therapeutic)\b/i,
  /\b(?:diagnose|diagnoses|diagnosing|diagnosed|diagnosis|diagnostic|diagnostics)\b/i,
];

// Banned personality labels
const PERSONALITY_LABELS = [
  /\b(?:shy|shyness)\b/i,
  /\b(?:anxious|anxiety)\b/i,
  /\b(?:introvert|introverted|introversion)\b/i,
  /\b(?:extrovert|extroverted|extroversion)\b/i,
];

/**
 * Validates word count (<= 150), zero clinical terms, and zero personality labels.
 */
export function validateWeeklyLetterText(text: string): { valid: boolean; reason?: string; wordCount: number } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return { valid: false, reason: 'Letter content is empty', wordCount: 0 };
  }

  if (wordCount > 150) {
    return { valid: false, reason: `Word count exceeds 150 limit (found ${wordCount} words)`, wordCount };
  }

  for (const pattern of CLINICAL_WORDS) {
    if (pattern.test(text)) {
      return { valid: false, reason: 'Forbidden clinical term detected in weekly letter', wordCount };
    }
  }

  for (const pattern of PERSONALITY_LABELS) {
    if (pattern.test(text)) {
      return { valid: false, reason: 'Forbidden personality label detected in weekly letter', wordCount };
    }
  }

  return { valid: true, wordCount };
}

export const FALLBACK_LETTERS = {
  plus: {
    letter:
      "You made steady progress across your conversations this week. The biggest shift was how you gave yourself room to think before responding rather than rushing into silence. That calm pacing made your points land with natural clarity. Next week, keep that same grounded presence in your pocket when Friday team discussions get lively.",
    wordCount: 52,
    patternNoticed: 'You take thoughtful pauses before framing answers in discussions.',
    nextFocus: 'Carry that steady pacing into one real-world group interaction next week.',
  },
  free: {
    letter:
      "You kept your practice rhythm alive this week. Taking a brief breath before speaking created immediate ease in your exchanges. Next week, try carrying that pause into one real-world greeting.",
    wordCount: 29,
    patternNoticed: 'You use natural pauses to settle into conversational exchanges.',
    nextFocus: 'Practice one clean greeting at your own pace.',
  },
};

export interface GenerateLetterOptions {
  env: GatewayEnv;
  provider: AiProvider;
  rateLimiter?: RateLimiterQueue;
  circuitBreaker?: CircuitBreakerRegistry;
  callLogger?: CallLogger;
  supabase?: SupabaseClient | null;
  plan?: 'free' | 'plus';
  playbook?: PlaybookSummary;
  userName?: string;
}

/**
 * Generates a Weekly Letter from a digest, strictly adhering to word limits,
 * zero clinical words, zero labels, and plan variants.
 */
export async function generateWeeklyLetter(
  digest: WeeklyDigest,
  options: GenerateLetterOptions
): Promise<WeeklyLetter & { plan: 'free' | 'plus' }> {
  const plan = options.plan ?? 'plus';
  const playbook = options.playbook ?? {};

  // Formulate key observations from digest
  const observations: string[] = [];
  if (digest.stageChanges.length > 0) {
    for (const sc of digest.stageChanges) {
      observations.push(`Skill ${sc.skillKey} reached ${sc.toStage} stage`);
    }
  }
  if (digest.gaps.length > 0) {
    observations.push(`Completed ${digest.gaps.length} micro-rep check-ins`);
  }
  if (digest.quotes.length > 0) {
    observations.push(`Spoke naturally in practice: "${digest.quotes[0]}"`);
  }

  const promptMessages = buildWeeklyLetterPrompt({
    userName: options.userName,
    weekSummary: {
      sessionsCompleted: digest.sessionsCompleted,
      momentsLogged: digest.momentsLogged,
      skillsPracticed: digest.stageChanges.map((s) => s.skillKey),
      keyObservations: observations,
    },
    playbook,
  });

  // For free plan, instruct for short version
  if (plan === 'free') {
    promptMessages.push({
      role: 'user',
      content: 'Note: Provide a very concise short version of 60 words or fewer for this summary.',
    });
  }

  let generated: WeeklyLetter;
  try {
    generated = await callStructured({
      job: 'long',
      messages: promptMessages,
      schema: WeeklyLetterSchema,
      provider: options.provider,
      env: options.env,
      rateLimiter: options.rateLimiter,
      circuitBreaker: options.circuitBreaker,
      callLogger: options.callLogger,
      promptVersion: WEEKLY_LETTER_PROMPT_VERSION,
      timeoutMs: options.env.REQUEST_TIMEOUT_MS,
    });

    // Validate the generated text
    const val = validateWeeklyLetterText(generated.letter);
    if (!val.valid) {
      logger.warn({ reason: val.reason }, 'Generated weekly letter violated guardrails; using authored fallback');
      const fallback = FALLBACK_LETTERS[plan];
      return {
        letter: fallback.letter,
        wordCount: fallback.wordCount,
        patternNoticed: fallback.patternNoticed,
        nextFocus: fallback.nextFocus,
        plan,
      };
    }

    return {
      letter: generated.letter,
      wordCount: val.wordCount,
      patternNoticed: generated.patternNoticed,
      nextFocus: generated.nextFocus,
      plan,
    };
  } catch (err: unknown) {
    logger.warn({ error: String(err) }, 'Weekly letter generation failed; using authored fallback');
    const fallback = FALLBACK_LETTERS[plan];
    return {
      letter: fallback.letter,
      wordCount: fallback.wordCount,
      patternNoticed: fallback.patternNoticed,
      nextFocus: fallback.nextFocus,
      plan,
    };
  }
}

/**
 * Persists a generated weekly letter to weekly_letters and creates a journal entry.
 */
export async function persistWeeklyLetter(
  supabase: SupabaseClient,
  userId: string,
  letterData: WeeklyLetter & { plan: 'free' | 'plus' },
  weekStart: string
): Promise<WeeklyLetterRecord> {
  // 1. Insert into weekly_letters
  const metadata = {
    wordCount: letterData.wordCount,
    patternNoticed: letterData.patternNoticed,
    nextFocus: letterData.nextFocus,
    plan: letterData.plan,
  };

  const { data: insertedLetter, error: letterError } = await supabase
    .from('weekly_letters')
    .insert({
      user_id: userId,
      week_start: weekStart,
      content: letterData.letter,
      metadata,
    })
    .select('*')
    .single();

  if (letterError || !insertedLetter) {
    throw new Error(`Failed to save weekly letter: ${letterError?.message || 'Unknown error'}`);
  }

  // 2. Insert into journal_entries
  try {
    await supabase.from('journal_entries').insert({
      user_id: userId,
      entry_kind: 'letter',
      title: 'Weekly Letter',
      body: letterData.letter,
      metadata: {
        letter_id: insertedLetter.id,
        patternNoticed: letterData.patternNoticed,
        nextFocus: letterData.nextFocus,
      },
      favorite: false,
    });
  } catch (journalErr: unknown) {
    logger.warn({ error: String(journalErr) }, 'Failed creating journal entry for weekly letter');
  }

  return {
    id: insertedLetter.id,
    userId: insertedLetter.user_id,
    weekStart: insertedLetter.week_start,
    content: insertedLetter.content,
    metadata: insertedLetter.metadata as WeeklyLetterRecord['metadata'],
    createdAt: insertedLetter.created_at,
  };
}
