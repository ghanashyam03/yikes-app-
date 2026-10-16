import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { SESSIONS_CATALOG } from '../session-steps/sessionCatalog';
import type { SessionData } from '../session-steps/types';
import { useGuestProgressStore } from '../today/guestProgress';
import { canonicalSkillKey, type SkillsProgressMap } from '../today/chooseNextSession';

export type GrowthStage = 'starting' | 'practicing' | 'growing' | 'natural';

export interface PathNode {
  session: SessionData;
  stage: GrowthStage;
  isCompleted: boolean;
  isLocked: boolean;
  isNext: boolean;
  unit: 1 | 2;
}

export interface UsePathOptions {
  mockOffline?: boolean;
}

export function usePath(options: UsePathOptions = {}) {
  const router = useRouter();
  const guestProgress = useGuestProgressStore();
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [isOffline] = useState(Boolean(options.mockOffline));

  const completedSet = useMemo(
    () => new Set(guestProgress.completedSessionIds),
    [guestProgress.completedSessionIds]
  );

  const skillsProgress: SkillsProgressMap = guestProgress.skillsProgress;

  // Helper to determine stage of a node
  const getStageForSkill = useCallback(
    (skillKey: string): GrowthStage => {
      const canonical = canonicalSkillKey(skillKey);
      if (skillsProgress[canonical]?.stage) {
        return skillsProgress[canonical]!.stage;
      }
      return 'starting';
    },
    [skillsProgress]
  );

  // Group all sessions by Unit
  const allNodes: PathNode[] = useMemo(() => {
    const list = Object.values(SESSIONS_CATALOG).sort(
      (a, b) => a.sessionNumber - b.sessionNumber
    );

    let foundNext = false;

    return list.map((session, index) => {
      const isCompleted = completedSet.has(session.id);
      const stage = getStageForSkill(session.skillKey);

      // Session 1 is never locked; subsequent sessions are unlocked if previous is completed
      // or if it has been attempted/completed before
      const isPrevCompleted = index === 0 || completedSet.has(list[index - 1]!.id);
      const isLocked = !isCompleted && !isPrevCompleted;

      let isNext = false;
      if (!isCompleted && !foundNext && !isLocked) {
        isNext = true;
        foundNext = true;
      }

      return {
        session,
        stage,
        isCompleted,
        isLocked,
        isNext,
        unit: session.unit,
      };
    });
  }, [completedSet, getStageForSkill]);

  const unit1Nodes = useMemo(() => allNodes.filter((n) => n.unit === 1), [allNodes]);
  const unit2Nodes = useMemo(() => allNodes.filter((n) => n.unit === 2), [allNodes]);

  const selectNode = useCallback((node: PathNode) => {
    setSelectedSession(node.session);
  }, []);

  const dismissDetail = useCallback(() => {
    setSelectedSession(null);
  }, []);

  const startSelectedSession = useCallback(
    (sessionId?: string) => {
      const id = sessionId || selectedSession?.id || 'session-01';
      setSelectedSession(null);
      router.push(`/session/${id}/idea`);
    },
    [router, selectedSession]
  );

  const selectedNodeInfo = useMemo(() => {
    if (!selectedSession) return null;
    const node = allNodes.find((n) => n.session.id === selectedSession.id);
    const stage = node?.stage || 'starting';
    const isLocked = node?.isLocked ?? false;
    const isCompleted = node?.isCompleted ?? false;

    // Find any evidence quote for this skill
    const skillQuotes = guestProgress.evidenceQuotes;
    const evidenceQuote = skillQuotes.length > 0 ? skillQuotes[0] : null;

    return {
      session: selectedSession,
      stage,
      isLocked,
      isCompleted,
      evidenceQuote: evidenceQuote?.quote ?? null,
      contextNote: evidenceQuote?.contextNote ?? null,
    };
  }, [allNodes, guestProgress.evidenceQuotes, selectedSession]);

  return {
    allNodes,
    unit1Nodes,
    unit2Nodes,
    selectedNodeInfo,
    selectedSession,
    isLoading,
    error,
    isOffline,
    selectNode,
    dismissDetail,
    startSelectedSession,
  };
}
