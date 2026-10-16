import type { SupabaseClient } from '@supabase/supabase-js';
import type { SkillStage } from '@yikes/ai-prompts/types';
import type { SkillStageUpdateResult } from './types.js';

export interface StageHistoryEntry {
  stage: SkillStage;
  reason?: string | undefined;
  attemptId?: string | undefined;
  timestamp: string;
}

export interface SkillProgressRecord {
  id: string;
  userId: string;
  skillKey: string;
  stage: SkillStage;
  stageHistory: StageHistoryEntry[];
  updatedAt: string;
}

// In-memory store for test environments or when Supabase client is not available
const inMemoryProgress = new Map<string, SkillProgressRecord>();

export function clearInMemoryProgressStore(): void {
  inMemoryProgress.clear();
}

/**
 * Computes the next skill stage based on historical votes.
 * Core rule from spec 03-ai-system & T-13 contract:
 * A stage changes ONLY when the last 3 consecutive votes all agree on a new stage.
 */
export function computeStageFromHistory(
  currentStage: SkillStage,
  history: Array<SkillStage | StageHistoryEntry>
): { newStage: SkillStage; changed: boolean } {
  if (history.length < 3) {
    return { newStage: currentStage, changed: false };
  }

  const rawLast3 = history.slice(-3);
  const stagesLast3: SkillStage[] = rawLast3.map((entry) =>
    typeof entry === 'string' ? entry : entry.stage
  );

  const first = stagesLast3[0];
  const second = stagesLast3[1];
  const third = stagesLast3[2];

  if (first && first === second && second === third && first !== currentStage) {
    return { newStage: first, changed: true };
  }

  return { newStage: currentStage, changed: false };
}

/**
 * Appends a new vote to skills_progress, applies the 3-agreeing-votes rule,
 * and persists the updated stage and history.
 */
export async function recordSkillVote(
  supabase: SupabaseClient | null | undefined,
  userId: string,
  skillKey: string,
  newVote: { stage: SkillStage; reason?: string | undefined; attemptId?: string | undefined }
): Promise<SkillStageUpdateResult> {
  const storeKey = `${userId}:${skillKey}`;
  const nowIso = new Date().toISOString();

  let record: SkillProgressRecord | null = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('skills_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('skill_key', skillKey)
        .maybeSingle();

      if (data) {
        record = {
          id: data.id,
          userId: data.user_id,
          skillKey: data.skill_key,
          stage: data.stage as SkillStage,
          stageHistory: Array.isArray(data.stage_history) ? data.stage_history : [],
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Fall back to memory
    }
  }

  if (!record) {
    record = inMemoryProgress.get(storeKey) ?? {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      skillKey,
      stage: 'starting',
      stageHistory: [],
      updatedAt: nowIso,
    };
  }

  const newHistoryEntry: StageHistoryEntry = {
    stage: newVote.stage,
    reason: newVote.reason,
    attemptId: newVote.attemptId,
    timestamp: nowIso,
  };

  const updatedHistory = [...record.stageHistory, newHistoryEntry];
  const { newStage, changed } = computeStageFromHistory(record.stage, updatedHistory);

  const previousStage = record.stage;
  record.stage = newStage;
  record.stageHistory = updatedHistory;
  record.updatedAt = nowIso;

  inMemoryProgress.set(storeKey, record);

  if (supabase) {
    try {
      await supabase.from('skills_progress').upsert({
        user_id: userId,
        skill_key: skillKey,
        stage: newStage,
        stage_history: updatedHistory,
        updated_at: nowIso,
      });
    } catch {
      // Ignored in degraded / test modes
    }
  }

  return {
    skill: skillKey,
    previousStage,
    newStage,
    changed,
    historyLength: updatedHistory.length,
  };
}
