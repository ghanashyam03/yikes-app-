import type { CoachFeedback } from './coach-feedback.js';
import { PersonaCardSchema, type PersonaCard } from './persona-card.js';
import type { MoodState, SkillStage, TranscriptTurn } from './types.js';
import { PROMPT_VERSIONS } from './versions.js';

export { PersonaCardSchema, type PersonaCard, PROMPT_VERSIONS };

export interface VerifyQuotesResult {
  valid: boolean;
  invalidQuotes: string[];
}

export type TranscriptInput =
  | string
  | TranscriptTurn[]
  | Array<{ speaker?: string | undefined; role?: string | undefined; text: string }>;

export type FeedbackInput =
  | CoachFeedback
  | string[]
  | {
      worked?: Array<{ quote?: string | undefined }> | undefined;
      pivot?: { quote?: string | undefined } | null | undefined;
    };

/**
 * Normalizes internal whitespace and trims.
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Checks that every quote in the feedback exists verbatim (after whitespace normalization)
 * in the conversation transcript.
 */
export function verifyQuotes(
  feedback: FeedbackInput,
  transcript: TranscriptInput
): VerifyQuotesResult {
  // 1. Extract all quotes to check
  const quotesToCheck: string[] = [];

  if (Array.isArray(feedback)) {
    for (const item of feedback) {
      if (typeof item === 'string' && item.trim().length > 0) {
        quotesToCheck.push(item);
      }
    }
  } else if (typeof feedback === 'object' && feedback !== null) {
    if (Array.isArray(feedback.worked)) {
      for (const item of feedback.worked) {
        if (item && typeof item.quote === 'string' && item.quote.trim().length > 0) {
          quotesToCheck.push(item.quote);
        }
      }
    }
    if (feedback.pivot && typeof feedback.pivot.quote === 'string' && feedback.pivot.quote.trim().length > 0) {
      quotesToCheck.push(feedback.pivot.quote);
    }
  }

  // 2. Prepare normalized transcript text
  let normalizedTranscript = '';
  if (typeof transcript === 'string') {
    normalizedTranscript = normalizeWhitespace(transcript);
  } else if (Array.isArray(transcript)) {
    normalizedTranscript = normalizeWhitespace(
      transcript.map((t) => t.text).join(' ')
    );
  }

  // 3. Verify each quote
  const invalidQuotes: string[] = [];
  for (const quote of quotesToCheck) {
    const normalizedQuote = normalizeWhitespace(quote);
    if (!normalizedQuote || !normalizedTranscript.includes(normalizedQuote)) {
      invalidQuotes.push(quote);
    }
  }

  return {
    valid: invalidQuotes.length === 0,
    invalidQuotes,
  };
}

/**
 * Clamps each mood dimension change to at most maxStep (default 0.15)
 * and keeps all values firmly within [0, 1].
 */
export function clampMood(
  prev: MoodState,
  next: MoodState,
  maxStep = 0.15
): MoodState {
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

  const clampDimension = (prevVal: number, nextVal: number): number => {
    const p = clamp01(prevVal);
    const n = clamp01(nextVal);
    const diff = n - p;

    let target = n;
    if (diff > maxStep) {
      target = p + maxStep;
    } else if (diff < -maxStep) {
      target = p - maxStep;
    }

    const clampedTarget = clamp01(target);
    return Math.round(clampedTarget * 10000) / 10000;
  };

  return {
    engagement: clampDimension(prev.engagement, next.engagement),
    rapport: clampDimension(prev.rapport, next.rapport),
    patience: clampDimension(prev.patience, next.patience),
    exitPressure: clampDimension(prev.exitPressure, next.exitPressure),
  };
}

const STAGE_ORDER: readonly SkillStage[] = [
  'starting',
  'practicing',
  'growing',
  'natural',
] as const;

export type SkillVoteInput =
  | SkillStage
  | { stage: SkillStage | string }
  | string;

/**
 * Calculates the median stage of the last 3 skill votes across:
 * 'starting' (0), 'practicing' (1), 'growing' (2), 'natural' (3).
 * If fewer than 3 votes are supplied, computes median across available votes.
 * If empty, defaults to 'starting'.
 */
export function stageFromVotes(votes: readonly SkillVoteInput[]): SkillStage {
  if (!votes || votes.length === 0) {
    return 'starting';
  }

  // Take the last up to 3 votes
  const recent = votes.slice(-3);

  const stageIndices: number[] = [];
  for (const v of recent) {
    const stageStr = typeof v === 'string' ? v : v.stage;
    const idx = STAGE_ORDER.indexOf(stageStr as SkillStage);
    stageIndices.push(idx !== -1 ? idx : 0);
  }

  stageIndices.sort((a, b) => a - b);

  // Median index: for 1 item -> [0], for 2 items -> [0], for 3 items -> [1]
  const mid = Math.floor((stageIndices.length - 1) / 2);
  const medianIdx = stageIndices[mid] ?? 0;

  return STAGE_ORDER[medianIdx] ?? 'starting';
}
