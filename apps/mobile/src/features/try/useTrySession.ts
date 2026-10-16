import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import type { CharacterExpression } from '../../ui/components/CharacterAvatar';
import { useSession } from '../auth/useSession';
import { useSafetyRoute } from '../safety/useSafetyRoute';
import {
  endPartnerAttempt,
  fetchPartnerHint,
  fetchSuggestedReplies,
  PartnerApiError,
  sendPartnerTurn,
  startPartnerAttempt,
  type MoodState,
  type StartAttemptParams,
} from './partnerApi';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'partner';
  text: string;
  mood?: MoodState | undefined;
  degraded?: boolean | undefined;
}

export function moodToExpression(mood?: MoodState | undefined, wantsToEnd = false): CharacterExpression {
  if (!mood) return 'neutral';
  if (wantsToEnd || mood.exitPressure >= 0.7) {
    return 'wrapping_up';
  }
  if (mood.patience <= 0.35 || mood.engagement <= 0.35) {
    return 'distracted';
  }
  if (mood.rapport >= 0.6 && mood.engagement >= 0.5) {
    return 'warm';
  }
  return 'neutral';
}

export interface UseTrySessionOptions {
  sessionId?: string | undefined;
  scenario?: {
    title: string;
    setting: string;
    userGoal: string;
    partnerGoal?: string | undefined;
    background?: string | undefined;
  } | undefined;
  personaId?: string | undefined;
  mode?: 'try' | 'warmup' | 'free' | 'rehearsal' | undefined;
  initialOpeningText?: string | undefined;
}

export function useTrySession(options: UseTrySessionOptions = {}) {
  const router = useRouter();
  const { session } = useSession();
  const token = session?.accessToken;
  const { handleSafetyVerdict } = useSafetyRoute();

  const mode = options.mode ?? 'try';
  const scenario = options.scenario ?? {
    title: 'Discussing scope',
    setting: 'Breakout room',
    userGoal: 'Push back politely on extra scope',
  };

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [partnerMood, setPartnerMood] = useState<MoodState>({
    engagement: 0.5,
    rapport: 0.5,
    patience: 0.7,
    exitPressure: 0.2,
  });
  const [wantsToEnd, setWantsToEnd] = useState(false);
  const [turnCap, setTurnCap] = useState(mode === 'try' ? 6 : mode === 'warmup' ? 4 : 0);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [idleBannerVisible, setIdleBannerVisible] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isCapReached, setIsCapReached] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [inputText, setInputText] = useState('');

  // Timers
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slowReplyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIdleBannerVisible(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIdleBannerVisible(true);
    }, 20000); // 20s idle cue
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (slowReplyTimerRef.current) clearTimeout(slowReplyTimerRef.current);
    };
  }, []);

  // Initialize session
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      try {
        const startParams: StartAttemptParams = {
          scenario,
          personaId: options.personaId ?? 'maya',
          mode,
          sessionId: options.sessionId,
          openingText: options.initialOpeningText,
        };

        const res = await startPartnerAttempt(token, startParams);
        if (isCancelled) return;

        setAttemptId(res.attemptId);
        setPartnerMood(res.initialMood);
        setTurnCap(res.turnCap);
        setMessages([
          {
            id: `msg_0_${Date.now()}`,
            role: 'partner',
            text: res.openingTurn.text,
            mood: res.initialMood,
          },
        ]);

        // Load initial suggestions
        fetchSuggestedReplies(token, res.attemptId)
          .then((s) => {
            if (!isCancelled && s.length > 0) setSuggestedReplies(s);
          })
          .catch(() => {});

        resetIdleTimer();
      } catch (err: unknown) {
        if (isCancelled) return;
        if (err instanceof PartnerApiError && err.code === 'CAP_REACHED') {
          setIsCapReached(true);
          return;
        }
        // Offline / fallback mode
        setIsOffline(true);
        const fallbackOpening =
          options.initialOpeningText ??
          `Hey, thanks for coming by. Did you want to go over the "${scenario.title}" situation now?`;
        setAttemptId(`offline_${Date.now()}`);
        setMessages([
          {
            id: `msg_0_${Date.now()}`,
            role: 'partner',
            text: fallbackOpening,
          },
        ]);
        setSuggestedReplies([
          'I wanted to check in on the timeline.',
          'Can we go over the first priority together?',
          'I have a quick thought on the workload.',
        ]);
        resetIdleTimer();
      }
    }

    init();
    return () => {
      isCancelled = true;
    };
  }, []); // Run once on mount

  const userTurnsCount = messages.filter((m) => m.role === 'user').length;
  const currentTurn = userTurnsCount + 1;
  const expression = moodToExpression(partnerMood, wantsToEnd);

  // Send turn with silent retry and 8s slow reply thinking state
  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputText).trim();
      if (!text || !attemptId || isTyping || isThinking) return;

      setInputText('');
      setIdleBannerVisible(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      const userMsg: ChatMessageItem = {
        id: `user_${Date.now()}`,
        role: 'user',
        text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setIsThinking(false);

      // 8-second slow reply transition to calm thinking state
      slowReplyTimerRef.current = setTimeout(() => {
        setIsThinking(true);
      }, 8000);

      const executeCall = async (retryCount = 0): Promise<void> => {
        try {
          const res = await sendPartnerTurn(token, attemptId, text, false);

          if (slowReplyTimerRef.current) clearTimeout(slowReplyTimerRef.current);
          setIsTyping(false);
          setIsThinking(false);

          if (res.crisis) {
            handleSafetyVerdict({ verdict: 'crisis' });
            return;
          }

          if (res.mood) setPartnerMood(res.mood);
          if (res.wantsToEnd) setWantsToEnd(true);

          const partnerMsg: ChatMessageItem = {
            id: `partner_${Date.now()}`,
            role: 'partner',
            text: res.reply ?? 'I understand.',
            mood: res.mood,
            degraded: res.degraded,
          };

          setMessages((prev) => [...prev, partnerMsg]);

          // Refresh suggestions for next turn if not ending
          if (!res.wantsToEnd && (turnCap === 0 || currentTurn + 1 <= turnCap)) {
            fetchSuggestedReplies(token, attemptId)
              .then((s) => setSuggestedReplies(s))
              .catch(() => {});
          }

          // If turn cap or wantsToEnd reached, auto end
          if (res.wantsToEnd || (turnCap > 0 && currentTurn >= turnCap)) {
            setWantsToEnd(true);
          }

          resetIdleTimer();
        } catch (err: unknown) {
          if (err instanceof PartnerApiError && err.code === 'CAP_REACHED') {
            if (slowReplyTimerRef.current) clearTimeout(slowReplyTimerRef.current);
            setIsTyping(false);
            setIsThinking(false);
            setIsCapReached(true);
            return;
          }

          // Silent retry once on failure
          if (retryCount === 0) {
            await new Promise((r) => setTimeout(r, 600));
            return executeCall(1);
          }

          if (slowReplyTimerRef.current) clearTimeout(slowReplyTimerRef.current);
          setIsTyping(false);
          setIsThinking(false);

          // Scripted fallback response
          const partnerMsg: ChatMessageItem = {
            id: `partner_${Date.now()}`,
            role: 'partner',
            text: 'I hear you, though with this timeline we really need to decide today.',
            degraded: true,
          };
          setMessages((prev) => [...prev, partnerMsg]);
          resetIdleTimer();
        }
      };

      await executeCall();
    },
    [inputText, attemptId, isTyping, isThinking, token, currentTurn, turnCap, resetIdleTimer, handleSafetyVerdict]
  );

  const passTurn = useCallback(() => {
    sendMessage('… (I will pass on this one)');
  }, [sendMessage]);

  const selectSuggestion = useCallback((suggestion: string) => {
    setInputText(suggestion);
    resetIdleTimer();
  }, [resetIdleTimer]);

  const requestHint = useCallback(async () => {
    if (!attemptId || isHintLoading) return;
    setIsHintLoading(true);
    try {
      const hintText = await fetchPartnerHint(token, attemptId);
      setHint(hintText);
    } catch {
      setHint('Try acknowledging their core concern before offering your perspective.');
    } finally {
      setIsHintLoading(false);
    }
  }, [attemptId, isHintLoading, token]);

  const closeHint = useCallback(() => {
    setHint(null);
  }, []);

  const finishSession = useCallback(async () => {
    if (!attemptId || isEnding) return;
    setIsEnding(true);

    try {
      await endPartnerAttempt(token, attemptId, 'user_finished');
    } catch {
      // Continue to coach anyway
    }

    const sessionIdParam = options.sessionId ?? 'session_1';
    router.push(`/session/${sessionIdParam}/coach?attemptId=${attemptId}`);
  }, [attemptId, isEnding, options.sessionId, router, token]);

  return {
    attemptId,
    messages,
    partnerMood,
    expression,
    currentTurn,
    turnCap,
    isTyping,
    isThinking,
    idleBannerVisible,
    suggestedReplies,
    hint,
    isHintLoading,
    isOffline,
    isCapReached,
    isEnding,
    wantsToEnd,
    inputText,
    setInputText,
    sendMessage,
    passTurn,
    selectSuggestion,
    requestHint,
    closeHint,
    finishSession,
    resetIdleTimer,
  };
}
