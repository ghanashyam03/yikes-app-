import { secureStorageAdapter } from '../auth/supabaseClient';
import type { SessionBeat } from '../session-steps/types';

export const RUNNER_STORAGE_KEY = 'yikes_session_runner_state';

export interface SavedRunnerState {
  sessionId: string;
  currentBeat: SessionBeat;
  isTakeItEasy: boolean;
  status: 'in_progress' | 'paused' | 'completed';
  history: SessionBeat[];
  startedAt: string;
  updatedAt: string;
  attemptId?: string | undefined;
  stepData?: Record<string, unknown> | undefined;
}

export async function saveSessionRunnerState(state: SavedRunnerState): Promise<void> {
  try {
    const raw = JSON.stringify(state);
    await secureStorageAdapter.setItem(RUNNER_STORAGE_KEY, raw);
  } catch {
    // Best-effort autosave
  }
}

export async function loadSessionRunnerState(): Promise<SavedRunnerState | null> {
  try {
    const raw = await secureStorageAdapter.getItem(RUNNER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedRunnerState;
  } catch {
    return null;
  }
}

export async function clearSessionRunnerState(): Promise<void> {
  try {
    await secureStorageAdapter.removeItem(RUNNER_STORAGE_KEY);
  } catch {
    // Best-effort cleanup
  }
}
