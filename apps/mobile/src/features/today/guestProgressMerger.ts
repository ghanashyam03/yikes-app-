import { registerGuestMerger } from '../auth/guestStorage';
import { supabase } from '../auth/supabaseClient';
import { useGuestProgressStore } from './guestProgress';

export async function mergeGuestProgressData(userId: string): Promise<void> {
  const guestState = useGuestProgressStore.getState();

  // 1. Sync skills_progress
  for (const [skillKey, record] of Object.entries(guestState.skillsProgress)) {
    try {
      await supabase.from('skills_progress').upsert(
        {
          user_id: userId,
          skill_key: skillKey,
          stage: record.stage,
          stage_history: [{ stage: record.stage, timestamp: record.updatedAt || new Date().toISOString() }],
          updated_at: record.updatedAt || new Date().toISOString(),
        },
        { onConflict: 'user_id,skill_key' }
      );
    } catch {
      // Ignore conflict/error to continue
    }
  }

  // 2. Sync sessions_log
  for (const log of guestState.sessionsLog) {
    try {
      await supabase.from('sessions_log').insert({
        user_id: userId,
        session_id: log.sessionId,
        completed_at: log.completedAt,
        mode: log.mode,
      });
    } catch {
      // Ignore
    }
  }

  // 3. Sync micro_reps
  for (const rep of guestState.microReps) {
    try {
      await supabase.from('micro_reps').insert({
        user_id: userId,
        forecast_drain: rep.forecastDrain ?? null,
        forecast_warmth: rep.forecastWarmth ?? null,
        outcome: rep.outcome ?? rep.prompt,
        landed: rep.landed ?? null,
        created_at: rep.createdAt,
      });
    } catch {
      // Ignore
    }
  }
}

export function registerProgressGuestMerger(): () => void {
  return registerGuestMerger(mergeGuestProgressData);
}

// Auto-register on load
registerProgressGuestMerger();
