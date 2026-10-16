import { useMemo } from 'react';
import { TWELVE_SKILLS } from './skillsData';
import { useSession } from '../auth/useSession';
import { useCheckin } from '../checkin/useCheckin';
import { computeWeeklyTrend } from '../checkin/computeGap';
import { useEnergy } from '../energy/useEnergy';
import { useJournal } from '../journal/useJournal';
import { useLadder } from '../ladder/useLadder';
import { useGuestProgressStore } from '../today/guestProgress';
import { isReviewDue } from './reviewDue';
import type { SkillProgressSummary, YouOverviewData } from './types';
import { youCopy } from '../../copy/you';

export function useYou(): {
  data: YouOverviewData;
  getSkillDetail: (skillKey: string) => SkillProgressSummary | null;
} {
  const { profile, isGuest } = useSession();
  const { skillsProgress, evidenceQuotes, sessionsLog } = useGuestProgressStore();
  const { submissions } = useCheckin();
  const { currentLevel, logs } = useEnergy();
  const { entries } = useJournal();
  const { rungs } = useLadder();

  const overviewData = useMemo<YouOverviewData>(() => {
    // 1. Display name
    const rawName = profile?.displayName;
    const displayName = rawName ? rawName : isGuest ? 'Guest' : 'You';

    // 2. Quiet line of evidence
    const latestQuote =
      evidenceQuotes && evidenceQuotes.length > 0
        ? evidenceQuotes[evidenceQuotes.length - 1]
        : null;

    const evidenceLine = latestQuote
      ? {
          quote: latestQuote.quote,
          contextNote: latestQuote.contextNote || youCopy.bento.evidenceContext,
        }
      : {
          quote: youCopy.bento.evidenceDefault,
          contextNote: youCopy.bento.evidenceContext,
        };

    // 3. Skills summaries (12 skills)
    const skillKeys = Object.keys(TWELVE_SKILLS);
    const skillsList: SkillProgressSummary[] = skillKeys.map((key) => {
      const skillDef = TWELVE_SKILLS[key]!;
      const stage = skillsProgress[key]?.stage || 'starting';

      // Find sessions where this skill was practiced
      const relevantLogs = (sessionsLog || []).filter((s) => s.sessionId.includes(key));
      const lastSession = relevantLogs[relevantLogs.length - 1];
      const lastPracticedAt = lastSession ? lastSession.completedAt : null;
      const reviewDue = isReviewDue(lastPracticedAt);

      // Verbatim evidence quotes (sample from store or authored evidence)
      const matchedQuotes = (evidenceQuotes || [])
        .filter((eq) => eq.contextNote.toLowerCase().includes(skillDef.name.toLowerCase()))
        .map((eq, idx) => ({
          quote: eq.quote,
          sessionId: `session_${idx + 1}`,
          sessionTitle: skillDef.name,
          date: eq.createdAt,
        }));

      // Default evidence quotes if none in store
      const defaultQuotes = [
        {
          quote: `“${skillDef.coachRubric.worked}”`,
          sessionId: 'session_base_1',
          sessionTitle: 'Foundation practice',
          date: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          quote: '“You acknowledged what they said before advancing your own thought.”',
          sessionId: 'session_base_2',
          sessionTitle: 'Live rehearsal',
          date: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        {
          quote: '“Kept natural balance without rushing into silence.”',
          sessionId: 'session_base_3',
          sessionTitle: 'Quick exchange',
          date: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
      ];

      return {
        skillKey: key,
        name: skillDef.name,
        description: skillDef.description,
        stage,
        lastPracticedAt,
        isReviewDue: reviewDue,
        evidenceQuotes: matchedQuotes.length >= 3 ? matchedQuotes.slice(0, 3) : defaultQuotes,
      };
    });

    // 4. Gap summary
    const gaps = (submissions || []).map((s) => {
      const diff = s.forecastDrain - s.actualDrain;
      return {
        drainingGap: diff,
        absoluteDrainingGap: Math.abs(diff),
      };
    });
    const trendResult = computeWeeklyTrend(gaps);
    const firstSub = submissions[0];
    const latestGap = firstSub ? firstSub.forecastDrain - firstSub.actualDrain : undefined;

    // 5. Battery summary
    const batterySummary = {
      currentLevel,
      hasLogs: logs.length > 0,
    };

    // 6. Ladder summary
    const completedCount = rungs.filter((r) => r.completed).length;
    const currentUncompleted = rungs.find((r) => !r.completed);
    const ladderSummary = {
      completedCount,
      totalCount: rungs.length,
      currentRungTitle: currentUncompleted ? currentUncompleted.title : null,
    };

    return {
      displayName,
      evidenceLine,
      skills: skillsList,
      journalCount: entries.length,
      gapSummary: {
        totalCheckins: submissions.length,
        trend: trendResult.trendDirection,
        latestGap,
      },
      batterySummary,
      ladderSummary,
    };
  }, [
    profile?.displayName,
    isGuest,
    evidenceQuotes,
    skillsProgress,
    sessionsLog,
    submissions,
    currentLevel,
    logs.length,
    rungs,
    entries.length,
  ]);

  const getSkillDetail = (skillKey: string): SkillProgressSummary | null => {
    return overviewData.skills.find((s) => s.skillKey === skillKey) || null;
  };

  return {
    data: overviewData,
    getSkillDetail,
  };
}
