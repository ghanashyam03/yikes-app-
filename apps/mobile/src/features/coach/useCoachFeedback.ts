import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useSession } from '../auth/useSession';
import {
  fetchCoachFeedback,
  submitAiFeedback,
  type CoachFeedbackPayload,
  type CoachFeedbackResponse,
} from './coachApi';

export interface UseCoachFeedbackParams {
  attemptId?: string | undefined;
  skillKey?: string | undefined;
  toneVariant?: 'gentle' | 'straight' | 'funny' | undefined;
}

export interface UseCoachFeedbackResult {
  feedback: CoachFeedbackPayload | null;
  feedbackId: string | null;
  verified: boolean;
  isLoading: boolean;
  isRevealing: boolean;
  revealedWorkedCount: number;
  revealedPivot: boolean;
  revealedTryNext: boolean;
  isError: boolean;
  isOffline: boolean;
  errorMessage: string | null;
  fairnessRating: number | null;
  isSubmittingFairness: boolean;
  journalSavedQuotes: string[];
  refetch: () => Promise<void>;
  rateFeedback: (rating: number) => Promise<void>;
  saveQuoteToJournal: (quote: string, reason: string) => Promise<void>;
}

export function useCoachFeedback({
  attemptId,
  skillKey,
  toneVariant,
}: UseCoachFeedbackParams): UseCoachFeedbackResult {
  const session = useSession((s) => s.session);
  const token = session?.accessToken ?? null;

  const [feedbackResponse, setFeedbackResponse] = useState<CoachFeedbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedWorkedCount, setRevealedWorkedCount] = useState(0);
  const [revealedPivot, setRevealedPivot] = useState(false);
  const [revealedTryNext, setRevealedTryNext] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fairnessRating, setFairnessRating] = useState<number | null>(null);
  const [isSubmittingFairness, setIsSubmittingFairness] = useState(false);
  const [journalSavedQuotes, setJournalSavedQuotes] = useState<string[]>([]);

  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearRevealTimers = () => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  const startProgressiveReveal = useCallback((payload: CoachFeedbackPayload) => {
    setIsRevealing(true);
    setRevealedWorkedCount(0);
    setRevealedPivot(false);
    setRevealedTryNext(false);

    const totalWorked = payload.worked.length;

    // Step 1: Reveal first worked item
    revealTimerRef.current = setTimeout(() => {
      setRevealedWorkedCount(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      // Step 2: Reveal all worked items
      revealTimerRef.current = setTimeout(() => {
        setRevealedWorkedCount(totalWorked);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        // Step 3: Reveal pivot moment
        revealTimerRef.current = setTimeout(() => {
          setRevealedPivot(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

          // Step 4: Reveal try next time
          revealTimerRef.current = setTimeout(() => {
            setRevealedTryNext(true);
            setIsRevealing(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }, 350);
        }, 350);
      }, 350);
    }, 250);
  }, []);

  const loadFeedback = useCallback(async () => {
    if (!attemptId) {
      setIsLoading(false);
      return;
    }

    clearRevealTimers();
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      const response = await fetchCoachFeedback(token, attemptId, skillKey, toneVariant);
      setFeedbackResponse(response);
      setIsLoading(false);
      startProgressiveReveal(response.feedback);
    } catch (err: unknown) {
      setIsLoading(false);
      setIsError(true);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('offline')) {
        setIsOffline(true);
      }
    }
  }, [attemptId, skillKey, token, toneVariant, startProgressiveReveal]);

  useEffect(() => {
    loadFeedback();
    return () => {
      clearRevealTimers();
    };
  }, [loadFeedback]);

  const rateFeedback = useCallback(
    async (rating: number) => {
      if (!feedbackResponse?.id || isSubmittingFairness) return;

      setIsSubmittingFairness(true);
      setFairnessRating(rating);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      try {
        await submitAiFeedback(token, 'coach', feedbackResponse.id, rating);
      } catch {
        // Keep optimistic selection
      } finally {
        setIsSubmittingFairness(false);
      }
    },
    [feedbackResponse?.id, isSubmittingFairness, token]
  );

  const saveQuoteToJournal = useCallback(async (quote: string, _reason: string) => {
    setJournalSavedQuotes((prev) => (prev.includes(quote) ? prev : [...prev, quote]));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  return {
    feedback: feedbackResponse?.feedback ?? null,
    feedbackId: feedbackResponse?.id ?? null,
    verified: feedbackResponse?.verified ?? false,
    isLoading,
    isRevealing,
    revealedWorkedCount,
    revealedPivot,
    revealedTryNext,
    isError,
    isOffline,
    errorMessage,
    fairnessRating,
    isSubmittingFairness,
    journalSavedQuotes,
    refetch: loadFeedback,
    rateFeedback,
    saveQuoteToJournal,
  };
}
