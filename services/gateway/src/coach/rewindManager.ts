import type { SupabaseClient } from '@supabase/supabase-js';
import type { RewindResponse, RewoundTurn } from './types.js';

export interface StoredAttemptData {
  id: string;
  userId: string;
  sessionId?: string | null | undefined;
  personaId?: string | null | undefined;
  mode: string;
  state: Record<string, unknown>;
  parentAttemptId?: string | null | undefined;
  turnsCount: number;
  endedAt?: string | null | undefined;
  endedReason?: string | null | undefined;
  createdAt: string;
}

// In-memory fallback store for attempts and turns
const inMemoryAttempts = new Map<string, StoredAttemptData>();
const inMemoryTurns = new Map<string, RewoundTurn[]>();

export function seedInMemoryAttempt(
  attempt: StoredAttemptData,
  turns: RewoundTurn[]
): void {
  inMemoryAttempts.set(attempt.id, attempt);
  inMemoryTurns.set(attempt.id, [...turns]);
}

export function clearInMemoryRewindStore(): void {
  inMemoryAttempts.clear();
  inMemoryTurns.clear();
}

/**
 * Creates a branched attempt starting from `fromTurn`.
 * Copies turns with `idx < fromTurn`, links parent_attempt_id,
 * and inserts the new attempt record and turns.
 */
export async function branchAttemptAtTurn(
  supabase: SupabaseClient | null | undefined,
  userId: string,
  attemptId: string,
  fromTurn: number
): Promise<RewindResponse> {
  let originalAttempt: StoredAttemptData | null = null;
  let originalTurns: RewoundTurn[] = [];

  if (supabase) {
    try {
      const { data: attemptRow } = await supabase
        .from('attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('user_id', userId)
        .maybeSingle();

      if (attemptRow) {
        originalAttempt = {
          id: attemptRow.id,
          userId: attemptRow.user_id,
          sessionId: attemptRow.session_id,
          personaId: attemptRow.persona_id,
          mode: attemptRow.mode,
          state: attemptRow.state || {},
          parentAttemptId: attemptRow.parent_attempt_id,
          turnsCount: attemptRow.turns_count,
          endedAt: attemptRow.ended_at,
          endedReason: attemptRow.ended_reason,
          createdAt: attemptRow.created_at,
        };
      }

      const { data: turnRows } = await supabase
        .from('turns')
        .select('*')
        .eq('attempt_id', attemptId)
        .order('idx', { ascending: true });

      if (turnRows && turnRows.length > 0) {
        originalTurns = turnRows.map((t) => ({
          id: t.id,
          idx: t.idx,
          role: t.role,
          text: t.text,
          thought: t.thought,
          mood: t.mood,
        }));
      }
    } catch {
      // Fall through to memory
    }
  }

  // Check in-memory store if not loaded from Supabase
  if (!originalAttempt) {
    originalAttempt = inMemoryAttempts.get(attemptId) ?? null;
  }
  if (originalTurns.length === 0) {
    originalTurns = inMemoryTurns.get(attemptId) ?? [];
  }

  if (!originalAttempt) {
    // Fabricate or throw
    throw new Error(`Attempt ${attemptId} not found`);
  }

  // Filter turns strictly with idx < fromTurn
  const keptTurns = originalTurns
    .filter((t) => t.idx < fromTurn)
    .sort((a, b) => a.idx - b.idx);

  const newAttemptId = `att_rewind_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  // Create new turn records
  const branchedTurns: RewoundTurn[] = keptTurns.map((t) => ({
    id: `turn_${Date.now()}_${t.idx}_${Math.random().toString(36).substring(2, 6)}`,
    idx: t.idx,
    role: t.role,
    text: t.text,
    thought: t.thought,
    mood: t.mood,
  }));

  const newAttemptData: StoredAttemptData = {
    id: newAttemptId,
    userId,
    sessionId: originalAttempt.sessionId,
    personaId: originalAttempt.personaId,
    mode: originalAttempt.mode,
    state: {
      ...originalAttempt.state,
      rewoundFrom: attemptId,
      rewoundAtTurn: fromTurn,
    },
    parentAttemptId: attemptId,
    turnsCount: branchedTurns.length,
    endedAt: null,
    endedReason: null,
    createdAt: nowIso,
  };

  // Persist to Supabase
  if (supabase) {
    try {
      await supabase.from('attempts').insert({
        id: newAttemptId,
        user_id: userId,
        session_id: originalAttempt.sessionId ?? null,
        persona_id: originalAttempt.personaId ?? null,
        mode: originalAttempt.mode,
        state: newAttemptData.state,
        parent_attempt_id: attemptId,
        turns_count: branchedTurns.length,
        created_at: nowIso,
      });

      if (branchedTurns.length > 0) {
        await supabase.from('turns').insert(
          branchedTurns.map((t) => ({
            id: t.id,
            attempt_id: newAttemptId,
            idx: t.idx,
            role: t.role,
            text: t.text,
            thought: t.thought ?? null,
            mood: t.mood ?? null,
            created_at: nowIso,
          }))
        );
      }
    } catch {
      // Ignored for fallback
    }
  }

  // Persist to memory
  inMemoryAttempts.set(newAttemptId, newAttemptData);
  inMemoryTurns.set(newAttemptId, branchedTurns);

  return {
    newAttemptId,
    parentAttemptId: attemptId,
    turns: branchedTurns,
  };
}
