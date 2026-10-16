import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import type { SessionBeat } from '../session-steps/types';
import {
  clearSessionRunnerState,
  loadSessionRunnerState,
  saveSessionRunnerState,
  type SavedRunnerState,
} from './runnerStorage';

export const NORMAL_BEATS: readonly SessionBeat[] = [
  'idea',
  'watch',
  'read',
  'try',
  'coach',
  'out_there',
  'complete',
];

export const TAKE_IT_EASY_BEATS: readonly SessionBeat[] = [
  'idea',
  'try',
  'coach',
  'complete',
];

export function getBeatRoutePath(sessionId: string, beat: SessionBeat, isTakeItEasy = false): string {
  const query = isTakeItEasy ? '?easy=true' : '';
  switch (beat) {
    case 'idea':
      return `/session/${sessionId}/idea${query}`;
    case 'watch':
      return `/session/${sessionId}/watch${query}`;
    case 'read':
      return `/session/${sessionId}/read${query}`;
    case 'try':
      return `/session/${sessionId}/try${query}`;
    case 'coach':
      return `/session/${sessionId}/coach${query}`;
    case 'out_there':
      return `/session/${sessionId}/out-there${query}`;
    case 'complete':
      return `/session/${sessionId}/complete${query}`;
  }
}

export interface UseSessionRunnerOptions {
  sessionId: string;
  isTakeItEasy?: boolean;
  initialBeat?: SessionBeat;
  autoResume?: boolean;
}

export function useSessionRunner({
  sessionId,
  isTakeItEasy = false,
  initialBeat = 'idea',
  autoResume = true,
}: UseSessionRunnerOptions) {
  const router = useRouter();

  const beats = useMemo(
    () => (isTakeItEasy ? TAKE_IT_EASY_BEATS : NORMAL_BEATS),
    [isTakeItEasy]
  );

  const [currentBeat, setCurrentBeat] = useState<SessionBeat>(initialBeat);
  const [status, setStatus] = useState<'in_progress' | 'paused' | 'completed'>('in_progress');
  const [history, setHistory] = useState<SessionBeat[]>([initialBeat]);
  const [stepData, setStepData] = useState<Record<string, unknown>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Resume from saved storage if available
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      if (autoResume) {
        const saved = await loadSessionRunnerState();
        if (!isCancelled && saved && saved.sessionId === sessionId && saved.status !== 'completed') {
          setCurrentBeat(saved.currentBeat);
          setStatus(saved.status);
          setHistory(saved.history);
          setStepData(saved.stepData || {});
          setIsLoaded(true);
          return;
        }
      }
      setIsLoaded(true);
    }

    void init();
    return () => {
      isCancelled = true;
    };
  }, [autoResume, sessionId]);

  // Autosave state on change
  const persistState = useCallback(
    async (
      beat: SessionBeat,
      nextStatus: 'in_progress' | 'paused' | 'completed',
      nextHistory: SessionBeat[],
      nextData: Record<string, unknown>
    ) => {
      const now = new Date().toISOString();
      const payload: SavedRunnerState = {
        sessionId,
        currentBeat: beat,
        isTakeItEasy,
        status: nextStatus,
        history: nextHistory,
        startedAt: now,
        updatedAt: now,
        stepData: nextData,
      };
      await saveSessionRunnerState(payload);
    },
    [isTakeItEasy, sessionId]
  );

  const beatIndex = beats.indexOf(currentBeat);
  const totalBeats = beats.length;

  const navigateToBeat = useCallback(
    (targetBeat: SessionBeat) => {
      const path = getBeatRoutePath(sessionId, targetBeat, isTakeItEasy);
      router.replace(path as never);
    },
    [isTakeItEasy, router, sessionId]
  );

  const goToBeat = useCallback(
    (beat: SessionBeat) => {
      const nextHistory = [...history, beat];
      const nextStatus = beat === 'complete' ? 'completed' : 'in_progress';
      setCurrentBeat(beat);
      setStatus(nextStatus);
      setHistory(nextHistory);
      void persistState(beat, nextStatus, nextHistory, stepData);
      navigateToBeat(beat);
    },
    [history, navigateToBeat, persistState, stepData]
  );

  const nextBeat = useCallback(() => {
    const nextIdx = beatIndex + 1;
    if (nextIdx < beats.length) {
      const next = beats[nextIdx]!;
      goToBeat(next);
    } else {
      goToBeat('complete');
    }
  }, [beatIndex, beats, goToBeat]);

  const previousBeat = useCallback(() => {
    const prevIdx = beatIndex - 1;
    if (prevIdx >= 0) {
      const prev = beats[prevIdx]!;
      goToBeat(prev);
    }
  }, [beatIndex, beats, goToBeat]);

  const skipBeat = useCallback(() => {
    nextBeat();
  }, [nextBeat]);

  const pauseSession = useCallback(() => {
    setStatus('paused');
    void persistState(currentBeat, 'paused', history, stepData);
  }, [currentBeat, history, persistState, stepData]);

  const resumeSession = useCallback(() => {
    setStatus('in_progress');
    void persistState(currentBeat, 'in_progress', history, stepData);
  }, [currentBeat, history, persistState, stepData]);

  const updateStepData = useCallback(
    (data: Record<string, unknown>) => {
      const merged = { ...stepData, ...data };
      setStepData(merged);
      void persistState(currentBeat, status, history, merged);
    },
    [currentBeat, history, persistState, status, stepData]
  );

  const finishSession = useCallback(async () => {
    setStatus('completed');
    await clearSessionRunnerState();
    router.replace('/(tabs)');
  }, [router]);

  return {
    sessionId,
    currentBeat,
    beats,
    beatIndex,
    totalBeats,
    isTakeItEasy,
    status,
    history,
    stepData,
    isLoaded,
    goToBeat,
    nextBeat,
    previousBeat,
    skipBeat,
    pauseSession,
    resumeSession,
    updateStepData,
    finishSession,
    navigateToBeat,
  };
}
