import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useSession } from '../auth/useSession';
import { fetchAttemptThoughts, type ThoughtItem } from './coachApi';

export interface UseInnerVoiceParams {
  attemptId?: string | undefined;
}

export interface UseInnerVoiceResult {
  thoughts: ThoughtItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  activeTurnIndex: number;
  totalTurns: number;
  selectedThoughtIndex: number | null;
  isPlaying: boolean;
  setActiveTurnIndex: (index: number) => void;
  selectThought: (index: number | null) => void;
  toggleReplay: () => void;
  refetch: () => Promise<void>;
}

export function useInnerVoice({ attemptId }: UseInnerVoiceParams): UseInnerVoiceResult {
  const session = useSession((s) => s.session);
  const token = session?.accessToken ?? null;

  const [thoughts, setThoughts] = useState<ThoughtItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [selectedThoughtIndex, setSelectedThoughtIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearReplayTimer = () => {
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  };

  const loadThoughts = useCallback(async () => {
    if (!attemptId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      const response = await fetchAttemptThoughts(token, attemptId);
      setThoughts(response.thoughts);
      setIsLoading(false);
      if (response.thoughts.length > 0) {
        setActiveTurnIndex(response.thoughts[0]!.turnIndex);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setIsError(true);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  }, [attemptId, token]);

  useEffect(() => {
    loadThoughts();
    return () => {
      clearReplayTimer();
    };
  }, [loadThoughts]);

  // Turn scrubbing handler with tactile soft tick
  const handleSetTurnIndex = useCallback((index: number) => {
    setActiveTurnIndex(index);
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const selectThought = useCallback((index: number | null) => {
    setSelectedThoughtIndex(index);
    if (index !== null) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  const toggleReplay = useCallback(() => {
    if (isPlaying) {
      clearReplayTimer();
      setIsPlaying(false);
    } else {
      if (thoughts.length === 0) return;
      setIsPlaying(true);
      clearReplayTimer();

      replayTimerRef.current = setInterval(() => {
        setActiveTurnIndex((prev) => {
          const nextIndex = prev + 1;
          const maxTurn = Math.max(...thoughts.map((t) => t.turnIndex), 0);
          if (nextIndex > maxTurn) {
            clearReplayTimer();
            setIsPlaying(false);
            return 0;
          }
          Haptics.selectionAsync().catch(() => {});
          return nextIndex;
        });
      }, 1800); // 1.8s calm slow replay rhythm
    }
  }, [isPlaying, thoughts]);

  const totalTurns = thoughts.length > 0 ? Math.max(...thoughts.map((t) => t.turnIndex)) + 1 : 1;

  return {
    thoughts,
    isLoading,
    isError,
    errorMessage,
    activeTurnIndex,
    totalTurns,
    selectedThoughtIndex,
    isPlaying,
    setActiveTurnIndex: handleSetTurnIndex,
    selectThought,
    toggleReplay,
    refetch: loadThoughts,
  };
}
