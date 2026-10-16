import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from '../auth/useSession';
import { useOnboardingStore } from '../onboarding/store';
import { derivePlaybook, type DerivedPlaybook } from '@yikes/shared/playbook/derivePlaybook';
import { supabase } from '../auth/supabaseClient';
import { chooseNextSession, type NextSessionRecommendation } from './chooseNextSession';
import { useGuestProgressStore, type LocalMicroRep, type LocalMoment } from './guestProgress';
import { todayCopy } from '../../copy/today';

export function getCalendarWeekRange(refDate = new Date()): { start: Date; end: Date } {
  const d = new Date(refDate);
  const day = d.getDay();
  // Sunday is 0, Monday is 1
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

export function countSessionsInWeek(logs: { completedAt: string }[], refDate = new Date()): number {
  const { start, end } = getCalendarWeekRange(refDate);
  const startTime = start.getTime();
  const endTime = end.getTime();
  return logs.filter((log) => {
    const t = new Date(log.completedAt).getTime();
    return t >= startTime && t <= endTime;
  }).length;
}

export function getGreetingText(name?: string | null, refDate = new Date()): string {
  const hour = refDate.getHours();
  const cleanName = name?.trim() || undefined;
  if (hour < 12) return todayCopy.greeting.morning(cleanName);
  if (hour < 17) return todayCopy.greeting.afternoon(cleanName);
  if (hour < 22) return todayCopy.greeting.evening(cleanName);
  return todayCopy.greeting.night(cleanName);
}

export interface UseTodayOptions {
  mockOffline?: boolean;
}

export function useToday(options: UseTodayOptions = {}) {
  const { session, profile, isGuest } = useSession();
  const storedPlaybook = useOnboardingStore((s) => s.derivedPlaybook);
  const answers = useOnboardingStore((s) => s.answers);
  const deeperAnswers = useOnboardingStore((s) => s.deeperAnswers);

  const playbook: DerivedPlaybook = useMemo(
    () => storedPlaybook ?? derivePlaybook(answers, deeperAnswers),
    [storedPlaybook, answers, deeperAnswers]
  );

  const guestProgress = useGuestProgressStore();
  const [isTakeItEasy, setIsTakeItEasy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(Boolean(options.mockOffline));

  // Remote data when signed in
  const [remoteLogs, setRemoteLogs] = useState<{ sessionId: string; completedAt: string; mode: string }[]>([]);
  const [remoteMoments, setRemoteMoments] = useState<LocalMoment[]>([]);
  const [remoteCheckin, setRemoteCheckin] = useState<LocalMicroRep | null>(null);
  const [remoteEvidence, setRemoteEvidence] = useState<{ quote: string; contextNote: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (options.mockOffline) {
      setIsOffline(true);
      setIsLoading(false);
      return;
    }

    try {
      if (!isGuest && session?.user?.id) {
        const userId = session.user.id;

        // 1. Fetch sessions log
        const { data: logData, error: logError } = await supabase
          .from('sessions_log')
          .select('session_id, completed_at, mode')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });

        if (!logError && logData) {
          setRemoteLogs(
            logData.map((r: { session_id: string; completed_at: string; mode: string }) => ({
              sessionId: r.session_id,
              completedAt: r.completed_at,
              mode: r.mode,
            }))
          );
        }

        // 2. Fetch upcoming moments
        const { data: momentsData } = await supabase
          .from('moments')
          .select('id, title, description, event_date, status')
          .eq('user_id', userId)
          .eq('status', 'upcoming')
          .order('event_date', { ascending: true })
          .limit(1);

        if (momentsData && momentsData.length > 0) {
          setRemoteMoments(
            momentsData.map((m: { id: string; title: string; description?: string; event_date?: string; status: string }) => ({
              id: m.id,
              title: m.title,
              description: m.description,
              eventDate: m.event_date,
              status: 'upcoming',
            }))
          );
        }

        // 3. Fetch due check-in (latest micro_reps without landed answer)
        const { data: repData } = await supabase
          .from('micro_reps')
          .select('id, outcome, forecast_drain, forecast_warmth, landed, created_at')
          .eq('user_id', userId)
          .is('landed', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (repData && repData.length > 0) {
          const r = repData[0]!;
          setRemoteCheckin({
            id: r.id,
            prompt: r.outcome || 'your question',
            forecastDrain: r.forecast_drain,
            forecastWarmth: r.forecast_warmth,
            landed: r.landed,
            createdAt: r.created_at,
          });
        } else {
          setRemoteCheckin(null);
        }

        // 4. Fetch latest coach feedback quote
        const { data: coachData } = await supabase
          .from('coach_feedback')
          .select('payload')
          .order('created_at', { ascending: false })
          .limit(1);

        if (coachData && coachData.length > 0 && coachData[0]?.payload) {
          const payload = coachData[0].payload as {
            worked?: { quote: string; why?: string }[];
          };
          if (payload.worked && payload.worked.length > 0 && payload.worked[0]?.quote) {
            setRemoteEvidence({
              quote: payload.worked[0].quote,
              contextNote: payload.worked[0].why || 'Demonstrated clear skill',
            });
          }
        }
      }
      setIsOffline(false);
    } catch {
      setIsOffline(true);
      // Fallback gracefully to offline/guest store
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, options.mockOffline, session?.user?.id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Aggregate logs (combine remote and local guest)
  const allLogs = useMemo(() => {
    return isGuest ? guestProgress.sessionsLog : remoteLogs;
  }, [isGuest, guestProgress.sessionsLog, remoteLogs]);

  // Rhythm calculation
  const totalRhythmSegments = Math.max(2, Math.min(5, playbook.weeklyGoal || 3));
  const filledRhythmSegments = useMemo(() => {
    return countSessionsInWeek(allLogs);
  }, [allLogs]);

  // Check today's completed session ids
  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }, []);

  const completedTodaySessionIds = useMemo(() => {
    return allLogs
      .filter((l) => {
        const t = new Date(l.completedAt).getTime();
        return t >= todayRange.start && t <= todayRange.end;
      })
      .map((l) => l.sessionId);
  }, [allLogs, todayRange]);

  const allCompletedSessionIds = useMemo(() => {
    return Array.from(new Set(allLogs.map((l) => l.sessionId)));
  }, [allLogs]);

  // Hero next session recommendation
  const recommendation: NextSessionRecommendation = useMemo(() => {
    return chooseNextSession(playbook, guestProgress.skillsProgress, {
      isTakeItEasy,
      completedTodaySessionIds,
      allCompletedSessionIds,
    });
  }, [playbook, guestProgress.skillsProgress, isTakeItEasy, completedTodaySessionIds, allCompletedSessionIds]);

  // Greeting
  const greeting = useMemo(() => {
    const name = profile?.displayName || undefined;
    return getGreetingText(name);
  }, [profile?.displayName]);

  // Battery level
  const batteryLevel = guestProgress.energyLevel;

  // Moment tile
  const upcomingMoment: LocalMoment | null = useMemo(() => {
    if (isGuest) {
      return guestProgress.moments.find((m) => m.status === 'upcoming') || null;
    }
    return remoteMoments[0] || guestProgress.moments.find((m) => m.status === 'upcoming') || null;
  }, [isGuest, guestProgress.moments, remoteMoments]);

  // Check-in tile
  const dueCheckin: LocalMicroRep | null = useMemo(() => {
    if (isGuest) {
      return guestProgress.microReps.find((r) => r.landed === undefined || r.landed === null) || null;
    }
    return remoteCheckin || guestProgress.microReps.find((r) => r.landed === undefined || r.landed === null) || null;
  }, [isGuest, guestProgress.microReps, remoteCheckin]);

  const submitCheckin = useCallback(
    async (outcome: string, landed: boolean) => {
      if (dueCheckin) {
        guestProgress.resolveCheckin(dueCheckin.id, outcome, landed);
        if (!isGuest && session?.user?.id) {
          try {
            await supabase
              .from('micro_reps')
              .update({ outcome, landed })
              .eq('id', dueCheckin.id);
          } catch {
            // Local state is already updated
          }
        }
        setRemoteCheckin(null);
      }
    },
    [dueCheckin, guestProgress, isGuest, session?.user?.id]
  );

  // Evidence tile
  const evidence = useMemo(() => {
    if (remoteEvidence) return remoteEvidence;
    if (guestProgress.evidenceQuotes.length > 0) {
      const latest = guestProgress.evidenceQuotes[0]!;
      return { quote: latest.quote, contextNote: latest.contextNote };
    }
    return {
      quote: todayCopy.evidence.fallbackQuote,
      contextNote: todayCopy.evidence.fallbackNote,
    };
  }, [remoteEvidence, guestProgress.evidenceQuotes]);

  // Empty first day check: total sessions completed is 0
  const isEmptyFirstDay = allCompletedSessionIds.length === 0;

  const toggleTakeItEasy = useCallback(() => {
    setIsTakeItEasy((prev) => !prev);
  }, []);

  return {
    greeting,
    batteryLevel,
    rhythm: {
      filled: filledRhythmSegments,
      total: totalRhythmSegments,
      percent: Math.min(100, Math.round((filledRhythmSegments / totalRhythmSegments) * 100)),
    },
    hero: {
      session: recommendation.session,
      reason: recommendation.reason,
      lengthMinutes: recommendation.lengthMinutes,
      partner: recommendation.session.persona,
      isTakeItEasy,
      toggleTakeItEasy,
    },
    moment: {
      upcoming: upcomingMoment,
      hasUpcoming: upcomingMoment !== null,
    },
    checkin: {
      due: dueCheckin,
      submit: submitCheckin,
    },
    evidence,
    isEmptyFirstDay,
    isLoading,
    error,
    isOffline,
    refresh: fetchData,
  };
}
