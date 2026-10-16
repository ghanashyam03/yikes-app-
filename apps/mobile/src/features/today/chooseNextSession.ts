import type { DerivedPlaybook } from '@yikes/shared/playbook/derivePlaybook';
import { SESSIONS_CATALOG } from '../session-steps/sessionCatalog';
import type { SessionData } from '../session-steps/types';
import { todayCopy } from '../../copy/today';

export interface SkillProgressRecord {
  stage: 'starting' | 'practicing' | 'growing' | 'natural';
  updatedAt?: string;
  lastPracticedAt?: string;
}

export type SkillsProgressMap = Record<string, SkillProgressRecord>;

export interface ChooseNextSessionOptions {
  isTakeItEasy?: boolean;
  completedTodaySessionIds?: string[];
  allCompletedSessionIds?: string[];
  lastPracticedDateBySkill?: Record<string, string>;
  referenceDate?: Date;
}

export interface NextSessionRecommendation {
  session: SessionData;
  reason: string;
  lengthMinutes: number;
}

export const SKILL_KEY_ALIASES: Record<string, string> = {
  starting_a_chat: 'starting_chat',
  starting_chat: 'starting_chat',
  asking_follow_ups: 'asking_followups',
  asking_followups: 'asking_followups',
  acknowledging_what_was_said: 'acknowledging',
  acknowledging: 'acknowledging',
  pacing_what_you_share: 'pacing_sharing',
  pacing_sharing: 'pacing_sharing',
  reading_engagement: 'reading_engagement',
  keeping_balance: 'keeping_balance',
  handling_silence: 'handling_silence',
  graceful_exits: 'graceful_exits',
  bridging_from_small_talk: 'bridging_small_talk',
  bridging_small_talk: 'bridging_small_talk',
  participating_in_groups: 'groups',
  groups: 'groups',
  polite_disagreement: 'polite_disagreement',
  following_up_afterwards: 'following_up',
  following_up: 'following_up',
  speaking_up_in_meetings: 'starting_chat',
};

export function canonicalSkillKey(rawKey: string): string {
  return SKILL_KEY_ALIASES[rawKey] || rawKey;
}

export const ALL_ORDERED_SESSIONS: SessionData[] = Object.values(SESSIONS_CATALOG).sort(
  (a, b) => a.sessionNumber - b.sessionNumber
);

export function chooseNextSession(
  playbook?: DerivedPlaybook | null,
  progress: SkillsProgressMap = {},
  options: ChooseNextSessionOptions = {}
): NextSessionRecommendation {
  const isTakeItEasy = Boolean(options.isTakeItEasy);
  const lengthMinutes = isTakeItEasy ? 2 : 4;
  const completedToday = new Set(options.completedTodaySessionIds || []);
  const allCompleted = new Set(options.allCompletedSessionIds || []);
  const lastPracticed = options.lastPracticedDateBySkill || {};

  // 1. Gather all sessions not completed today
  const candidateSessions = ALL_ORDERED_SESSIONS.filter((s) => !completedToday.has(s.id));
  const pool = candidateSessions.length > 0 ? candidateSessions : ALL_ORDERED_SESSIONS;

  // 2. Identify priority order based on playbook.pathOrder
  const pathOrder = (playbook?.pathOrder || []).map(canonicalSkillKey);

  // Group pool by canonical skill key
  const poolBySkill = new Map<string, SessionData[]>();
  for (const session of pool) {
    const key = canonicalSkillKey(session.skillKey);
    const existing = poolBySkill.get(key) || [];
    existing.push(session);
    poolBySkill.set(key, existing);
  }

  // Helper to get stage for a skill
  const getStage = (canonicalKey: string): 'starting' | 'practicing' | 'growing' | 'natural' => {
    // Check direct match or any alias match
    if (progress[canonicalKey]?.stage) return progress[canonicalKey]!.stage;
    for (const [alias, target] of Object.entries(SKILL_KEY_ALIASES)) {
      if (target === canonicalKey && progress[alias]?.stage) {
        return progress[alias]!.stage;
      }
    }
    return 'starting';
  };

  let selectedSession: SessionData | null = null;
  let selectionContext: 'firstStep' | 'hardestPlace' | 'practicing' | 'foundation' | 'refresh' | 'ordered' = 'ordered';

  // Helper to check if a skill has any completed session
  const hasCompletedSessionForSkill = (key: string): boolean => {
    return ALL_ORDERED_SESSIONS.some(
      (s) => canonicalSkillKey(s.skillKey) === key && allCompleted.has(s.id)
    );
  };

  // Are there any skills in pathOrder that haven't been practiced yet at all?
  const hasUnstartedSkillsInPath = pathOrder.some(
    (key) => !hasCompletedSessionForSkill(key) && (poolBySkill.get(key)?.length || 0) > 0
  );

  // Strategy A: Find earliest skill in pathOrder that is 'starting' or 'practicing'
  for (const skillKey of pathOrder) {
    const stage = getStage(skillKey);
    if (stage === 'starting' || stage === 'practicing') {
      // If there are unstarted skills in pathOrder, skip skills that already have completed sessions
      // unless this skill is explicitly in 'practicing' stage
      if (hasUnstartedSkillsInPath && stage !== 'practicing' && hasCompletedSessionForSkill(skillKey)) {
        continue;
      }

      const available = poolBySkill.get(skillKey);
      if (available && available.length > 0) {
        // Pick earliest not fully completed, or earliest in available
        const notDone = available.find((s) => !allCompleted.has(s.id));
        selectedSession = notDone || available[0]!;
        if (stage === 'practicing') {
          selectionContext = 'practicing';
        }
        break;
      }
    }
  }

  // Strategy B: If none found from pathOrder starting/practicing, pick earliest session not yet completed at all
  if (!selectedSession) {
    selectedSession = pool.find((s) => !allCompleted.has(s.id)) || null;
  }

  // Strategy C: Pick earliest in pathOrder that needs a refresh (longest time since practice)
  if (!selectedSession) {
    let oldestTimestamp = Infinity;
    for (const session of pool) {
      const key = canonicalSkillKey(session.skillKey);
      const dateStr = lastPracticed[key] || lastPracticed[session.skillKey];
      if (dateStr) {
        const time = new Date(dateStr).getTime();
        if (time < oldestTimestamp) {
          oldestTimestamp = time;
          selectedSession = session;
        }
      }
    }
    if (!selectedSession && pool.length > 0) {
      selectedSession = pool[0]!;
    }
    selectionContext = 'refresh';
  }

  // Fallback to Session 1
  if (!selectedSession) {
    selectedSession = SESSIONS_CATALOG['session-01'] || ALL_ORDERED_SESSIONS[0]!;
  }

  // Reason generation logic
  const selectedSkillKey = canonicalSkillKey(selectedSession.skillKey);
  const selectedStage = getStage(selectedSkillKey);

  // Check if first step in playbook
  const firstStepsTitles = (playbook?.firstSteps || []).map((s) => s.title.toLowerCase());
  const isFirstStep =
    selectedSession.sessionNumber === 1 ||
    firstStepsTitles.some(
      (t) =>
        t.includes(selectedSession.skillName.toLowerCase()) ||
        (selectedSkillKey === 'asking_followups' && t.includes('follow-up')) ||
        (selectedSkillKey === 'starting_chat' && t.includes('opening'))
    );

  // Check if matches hardest place
  const hardestPlaces = playbook?.hardestPlaces || [];
  const matchingHardestPlace = hardestPlaces.find((place) => {
    const p = place.toLowerCase();
    if (p.includes('meeting') && (selectedSkillKey === 'polite_disagreement' || selectedSkillKey === 'handling_silence' || selectedSkillKey === 'starting_chat')) {
      return true;
    }
    if (p.includes('group') && selectedSkillKey === 'groups') {
      return true;
    }
    return false;
  });

  let reason: string = todayCopy.reasons.ordered;

  if (selectionContext === 'refresh') {
    reason = todayCopy.reasons.refresh;
  } else if (selectedSession.sessionNumber === 1 && allCompleted.size === 0) {
    reason = todayCopy.reasons.foundation;
  } else if (isFirstStep) {
    if (selectedSkillKey === 'asking_followups') {
      reason = 'Because follow-up questions are your first step.';
    } else {
      reason = todayCopy.reasons.firstStep(selectedSession.skillName);
    }
  } else if (matchingHardestPlace) {
    reason = todayCopy.reasons.hardestPlace(matchingHardestPlace);
  } else if (selectedStage === 'practicing' || selectionContext === 'practicing') {
    reason = todayCopy.reasons.practicing(selectedSession.skillName);
  } else if (selectedSession.sessionNumber === 1) {
    reason = todayCopy.reasons.foundation;
  }

  return {
    session: selectedSession,
    reason,
    lengthMinutes,
  };
}
