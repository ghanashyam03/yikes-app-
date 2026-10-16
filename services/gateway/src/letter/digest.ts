import type { SupabaseClient } from '@supabase/supabase-js';
import type { DigestGap, DigestMoment, StageChange, WeeklyDigest } from './types.js';

// Common persona and third-party names to strictly guard against
const KNOWN_NAMES_REGEX = new RegExp(
  '\\b(' +
    [
      // Persona names
      'maya', 'alex', 'sam', 'dev', 'priya', 'jordan',
      // Common names frequently used in scenarios
      'sarah', 'john', 'mike', 'michael', 'emma', 'david',
      'lisa', 'rachel', 'chris', 'tom', 'james', 'robert',
      'mary', 'patricia', 'jennifer', 'elizabeth', 'rahul',
      'amit', 'rohit', 'sneha', 'pooja', 'ananya', 'vikram',
      'arjun', 'neha', 'kavita', 'suresh', 'anil', 'rajesh',
    ].join('|') +
    ')\\b',
  'i'
);

// Pattern for names addressed or referenced in sentences: e.g. "Hey Alex", "to Sam", "with Maya"
const ADDRESS_PATTERN = /\b(?:hey|hi|hello|dear|thanks|thank you|with|to|from)\s+([A-Z][a-z]+)\b/i;

/**
 * Checks if a piece of text contains any third-party or persona names.
 */
export function containsThirdPartyName(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  // Check against known persona and common names
  if (KNOWN_NAMES_REGEX.test(text)) {
    return true;
  }

  // Check addressing pattern (e.g. "Hi Alex", "Thanks Priya")
  const addressMatch = text.match(ADDRESS_PATTERN);
  if (addressMatch && addressMatch[1]) {
    const candidate = addressMatch[1].toLowerCase();
    // Ignore false positives like "Today", "Now", "All"
    const commonWords = new Set(['today', 'now', 'all', 'everyone', 'team', 'folks', 'there', 'again']);
    if (!commonWords.has(candidate)) {
      return true;
    }
  }

  return false;
}

export interface DigestSourceData {
  sessions: Array<{ id: string; completed_at?: string }>;
  moments: Array<{ id: string; title: string; status?: string; created_at?: string }>;
  skillsProgress: Array<{
    skill_key: string;
    stage: string;
    stage_history?: Array<{
      from?: string;
      to: string;
      timestamp?: string;
      date?: string;
    }>;
    updated_at?: string;
  }>;
  microReps: Array<{
    forecast_drain?: number | null;
    actual_drain?: number | null;
    forecast_warmth?: number | null;
    actual_warmth?: number | null;
    landed?: boolean | null;
    outcome?: string | null;
  }>;
  userTurns: Array<{
    id?: string;
    text: string;
    created_at?: string;
  }>;
}

/**
 * Pure digest builder: builds a WeeklyDigest from raw data.
 * Guarantees:
 * 1. Counts: sessions and moments.
 * 2. Stage changes.
 * 3. Moments and Gaps.
 * 4. At most THREE verbatim user quotes from turns.
 * 5. Strictly ZERO third-party names in quotes.
 */
export function buildDigestFromData(data: DigestSourceData): WeeklyDigest {
  // 1. Counts
  const sessionsCompleted = data.sessions.length;
  const momentsLogged = data.moments.length;

  // 2. Stage changes
  const stageChanges: StageChange[] = [];
  for (const sp of data.skillsProgress) {
    if (Array.isArray(sp.stage_history) && sp.stage_history.length > 0) {
      const latestTransition = sp.stage_history[sp.stage_history.length - 1];
      if (latestTransition && latestTransition.to) {
        stageChanges.push({
          skillKey: sp.skill_key,
          fromStage: latestTransition.from,
          toStage: latestTransition.to,
        });
      }
    }
  }

  // 3. Moments
  const moments: DigestMoment[] = data.moments.map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
  }));

  // 4. Gaps
  const gaps: DigestGap[] = data.microReps.map((rep) => {
    const drainGap =
      rep.actual_drain != null && rep.forecast_drain != null
        ? rep.actual_drain - rep.forecast_drain
        : undefined;
    const warmthGap =
      rep.actual_warmth != null && rep.forecast_warmth != null
        ? rep.actual_warmth - rep.forecast_warmth
        : undefined;
    return {
      drainGap,
      warmthGap,
      landed: rep.landed ?? undefined,
      outcome: rep.outcome ?? undefined,
    };
  });

  // 5. Quotes: At most 3 verbatim user quotes with strictly ZERO third-party names
  const validQuotes: string[] = [];
  for (const turn of data.userTurns) {
    const trimmed = turn.text.trim();
    if (!trimmed) continue;

    // Discard any quote containing third-party names
    if (!containsThirdPartyName(trimmed)) {
      validQuotes.push(trimmed);
    }

    if (validQuotes.length >= 3) {
      break;
    }
  }

  return {
    sessionsCompleted,
    momentsLogged,
    stageChanges,
    moments,
    gaps,
    quotes: validQuotes.slice(0, 3),
  };
}

/**
 * Fetches user weekly data from Supabase and compiles the digest.
 */
export async function fetchAndBuildWeeklyDigest(
  supabase: SupabaseClient,
  userId: string,
  options?: { since?: Date; until?: Date }
): Promise<WeeklyDigest> {
  const until = options?.until ?? new Date();
  const since = options?.since ?? new Date(until.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();
  const untilIso = until.toISOString();

  // 1. Sessions completed in week
  const { data: sessions } = await supabase
    .from('sessions_log')
    .select('id, completed_at')
    .eq('user_id', userId)
    .gte('completed_at', sinceIso)
    .lte('completed_at', untilIso);

  // 2. Moments logged in week
  const { data: moments } = await supabase
    .from('moments')
    .select('id, title, status, created_at')
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
    .lte('created_at', untilIso);

  // 3. Skills progress
  const { data: skillsProgress } = await supabase
    .from('skills_progress')
    .select('skill_key, stage, stage_history, updated_at')
    .eq('user_id', userId);

  // 4. Micro reps / Gaps
  const { data: microReps } = await supabase
    .from('micro_reps')
    .select('forecast_drain, actual_drain, forecast_warmth, actual_warmth, landed, outcome')
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
    .lte('created_at', untilIso);

  // 5. User turns from attempts in this week
  const { data: attempts } = await supabase
    .from('attempts')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
    .lte('created_at', untilIso);

  const attemptIds = (attempts || []).map((a) => a.id);
  let userTurns: Array<{ text: string }> = [];

  if (attemptIds.length > 0) {
    const { data: turns } = await supabase
      .from('turns')
      .select('text, speaker, role')
      .in('attempt_id', attemptIds)
      .or('speaker.eq.user,role.eq.user')
      .order('created_at', { ascending: false });

    userTurns = (turns || []).map((t) => ({ text: t.text }));
  }

  return buildDigestFromData({
    sessions: sessions || [],
    moments: moments || [],
    skillsProgress: (skillsProgress || []).map((sp) => ({
      skill_key: sp.skill_key,
      stage: sp.stage,
      stage_history: Array.isArray(sp.stage_history) ? sp.stage_history : [],
      updated_at: sp.updated_at,
    })),
    microReps: microReps || [],
    userTurns,
  });
}
