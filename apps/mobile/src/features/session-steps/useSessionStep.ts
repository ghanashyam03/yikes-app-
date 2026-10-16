import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { fetchReadScene, fetchWatchExchange } from './sessionApi';
import { getSessionData } from './sessionCatalog';
import type { SessionBeat, SessionData, SessionReadStep, SessionWatchStep } from './types';

export const BEAT_FLOW: SessionBeat[] = [
  'idea',
  'watch',
  'read',
  'try',
  'coach',
  'out_there',
  'complete',
];

export interface UseSessionStepOptions {
  sessionId?: string | undefined;
  currentBeat: SessionBeat;
}

export function useSessionStep({ sessionId, currentBeat }: UseSessionStepOptions) {
  const router = useRouter();
  const session: SessionData = getSessionData(sessionId);

  const [watchStep, setWatchStep] = useState<SessionWatchStep>(session.watch);
  const [readStep, setReadStep] = useState<SessionReadStep>(session.read);

  // Watch interaction state
  const [selectedWatchLine, setSelectedWatchLine] = useState<number | null>(null);
  const [watchFeedback, setWatchFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showWatchTarget, setShowWatchTarget] = useState<boolean>(false);

  // Read interaction state
  const [selectedThoughtIndex, setSelectedThoughtIndex] = useState<number | null>(null);
  const [isReadRevealed, setIsReadRevealed] = useState<boolean>(false);

  // Load personalized content from gateway if possible
  useEffect(() => {
    let isMounted = true;
    if (sessionId) {
      if (currentBeat === 'watch') {
        fetchWatchExchange(sessionId)
          .then((data) => {
            if (isMounted) setWatchStep(data);
          })
          .catch(() => {});
      } else if (currentBeat === 'read') {
        fetchReadScene(sessionId)
          .then((data) => {
            if (isMounted) setReadStep(data);
          })
          .catch(() => {});
      }
    }
    return () => {
      isMounted = false;
    };
  }, [sessionId, currentBeat]);

  const beatIndex = BEAT_FLOW.indexOf(currentBeat);
  const totalBeats = BEAT_FLOW.length;

  const navigateToBeat = useCallback(
    (beat: SessionBeat) => {
      const id = session.id;
      switch (beat) {
        case 'idea':
          router.replace(`/session/${id}/idea`);
          break;
        case 'watch':
          router.replace(`/session/${id}/watch`);
          break;
        case 'read':
          router.replace(`/session/${id}/read`);
          break;
        case 'try':
          router.replace(`/session/${id}/try`);
          break;
        case 'coach':
          router.replace(`/session/${id}/coach`);
          break;
        case 'out_there':
          router.replace(`/session/${id}/out-there`);
          break;
        case 'complete':
          router.replace(`/session/${id}/complete`);
          break;
      }
    },
    [router, session.id]
  );

  const handleNext = useCallback(() => {
    const nextIdx = beatIndex + 1;
    if (nextIdx < BEAT_FLOW.length) {
      const nextBeat = BEAT_FLOW[nextIdx]!;
      navigateToBeat(nextBeat);
    } else {
      router.replace('/(tabs)');
    }
  }, [beatIndex, navigateToBeat, router]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Watch step handlers
  const handleTapWatchLine = useCallback(
    (lineIndex: number) => {
      setSelectedWatchLine(lineIndex);
      if (lineIndex === watchStep.targetLineIndex) {
        setWatchFeedback('correct');
      } else {
        setWatchFeedback('wrong');
      }
    },
    [watchStep.targetLineIndex]
  );

  const handleShowMe = useCallback(() => {
    setShowWatchTarget(true);
    setSelectedWatchLine(watchStep.targetLineIndex);
    setWatchFeedback('correct');
  }, [watchStep.targetLineIndex]);

  // Read step handlers
  const handleSelectThought = useCallback((index: number) => {
    setSelectedThoughtIndex(index);
    setIsReadRevealed(true);
  }, []);

  return {
    session,
    persona: session.persona,
    currentBeat,
    beatIndex,
    totalBeats,
    // Step content
    watchStep,
    readStep,
    // Watch interactions
    selectedWatchLine,
    watchFeedback,
    showWatchTarget,
    handleTapWatchLine,
    handleShowMe,
    // Read interactions
    selectedThoughtIndex,
    isReadRevealed,
    handleSelectThought,
    // Navigation
    handleNext,
    handleSkip,
    navigateToBeat,
  };
}
