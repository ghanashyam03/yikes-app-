import { QuizAnswers } from './questions';
import { DeeperAnswers } from './deeper';
import { FIRST_STEPS_LIBRARY, FirstStep } from './firstSteps';

export interface DerivedPace {
  title: string;
  description: string;
}

export interface DerivedBattery {
  title: string;
  description: string;
  drainLevel: number;
}

export interface DerivedPlaybook {
  pace: DerivedPace;
  batteryProfile: DerivedBattery;
  hardestPlaces: string[];
  firstSteps: [FirstStep, FirstStep, FirstStep];
  coachTone: 'Gentle' | 'Straight' | 'Funny';
  weeklyGoal: number;
  window: string;
  anchor: string;
  startDifficulty: 1 | 2 | 3 | 4 | 5;
  pathOrder: string[];
  scenarioWorld: string;
}

export const ALL_SKILLS: readonly string[] = [
  'starting_a_chat',
  'asking_follow_ups',
  'acknowledging_what_was_said',
  'pacing_what_you_share',
  'reading_engagement',
  'keeping_balance',
  'handling_silence',
  'graceful_exits',
  'bridging_from_small_talk',
  'participating_in_groups',
  'polite_disagreement',
  'following_up_afterwards'
];

const GOAL_TO_SKILLS: Record<string, string[]> = {
  'Meetings': ['speaking_up_in_meetings', 'polite_disagreement'],
  'Small talk': ['starting_a_chat', 'bridging_from_small_talk'],
  'Networking': ['starting_a_chat', 'graceful_exits'],
  'Making friends': ['asking_follow_ups', 'pacing_what_you_share'],
  'Speaking up': ['speaking_up_in_meetings', 'handling_silence'],
  'Graceful exits': ['graceful_exits', 'reading_engagement'],
  'Following up': ['following_up_afterwards', 'acknowledging_what_was_said'],
  'Groups': ['participating_in_groups', 'keeping_balance']
};

export const DEFAULT_DERIVED_PLAYBOOK: DerivedPlaybook = {
  pace: {
    title: 'Think first, speak with intent',
    description: 'A practice rhythm that respects how you think and talk.'
  },
  batteryProfile: {
    title: 'Quiet time can help after groups',
    description: 'Moderate social endurance that benefits from intentional solo recharge.',
    drainLevel: 3
  },
  hardestPlaces: ['Work meetings', 'New groups'],
  firstSteps: [
    FIRST_STEPS_LIBRARY[0],
    FIRST_STEPS_LIBRARY[1],
    FIRST_STEPS_LIBRARY[2]
  ] as [FirstStep, FirstStep, FirstStep],
  coachTone: 'Gentle',
  weeklyGoal: 3,
  window: 'Morning',
  anchor: 'Morning coffee',
  startDifficulty: 1,
  pathOrder: [...ALL_SKILLS],
  scenarioWorld: 'workplace'
};

export function derivePlaybook(
  answers: QuizAnswers = {},
  deeperAnswers?: DeeperAnswers
): DerivedPlaybook {
  // 1. Coach tone (Q11)
  let coachTone: 'Gentle' | 'Straight' | 'Funny' = 'Gentle';
  if (answers.q11 === 'Straight' || answers.q11 === 'Funny' || answers.q11 === 'Gentle') {
    coachTone = answers.q11;
  }

  // 2. Weekly goal (Q12)
  let weeklyGoal = 3;
  if (answers.q12) {
    const match = answers.q12.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed >= 2 && parsed <= 5) {
        weeklyGoal = parsed;
      }
    }
  }

  // 3. Window (Q13)
  const window = answers.q13 || DEFAULT_DERIVED_PLAYBOOK.window;

  // 4. Anchor (Q14)
  let anchor = DEFAULT_DERIVED_PLAYBOOK.anchor;
  if (answers.q14) {
    if (answers.q14 === 'Write my own' && answers.q14Custom?.trim()) {
      anchor = answers.q14Custom.trim();
    } else if (answers.q14 !== 'Write my own') {
      anchor = answers.q14;
    }
  }

  // 5. Hardest places (Q2)
  let hardestPlaces = [...DEFAULT_DERIVED_PLAYBOOK.hardestPlaces];
  if (answers.q2 && answers.q2.length > 0) {
    hardestPlaces = answers.q2.slice(0, 2);
  }

  // 6. Pace (Q6 & Q10)
  let pace: DerivedPace = { ...DEFAULT_DERIVED_PLAYBOOK.pace };
  if (answers.q6 === 'Speak as I think') {
    pace = {
      title: 'Speak as you think, refine with practice',
      description: 'An adaptive pace that turns conversational impulses into polished exchanges.'
    };
  } else if (answers.q6 === 'Think first, then speak') {
    pace = {
      title: 'Think first, speak with intent',
      description: 'A deliberate pace that gives you space to form your thoughts before sharing.'
    };
  }

  // 7. Battery profile (Q5)
  let batteryProfile: DerivedBattery = { ...DEFAULT_DERIVED_PLAYBOOK.batteryProfile };
  if (typeof answers.q5 === 'number' && answers.q5 >= 1 && answers.q5 <= 5) {
    const q5 = answers.q5;
    if (q5 >= 4) {
      batteryProfile = {
        title: 'Quiet time can help after groups',
        description: 'Drains quickly in high-stimulation settings. Needs dedicated solo recharge time.',
        drainLevel: q5
      };
    } else if (q5 === 3) {
      batteryProfile = {
        title: 'Steady burn, recharges with quiet time',
        description: 'Moderate social energy. Balanced mix of active conversation and calm buffers.',
        drainLevel: 3
      };
    } else {
      batteryProfile = {
        title: 'Resilient social endurance',
        description: 'Social battery holds steady across longer gatherings with light recovery.',
        drainLevel: q5
      };
    }
  }

  // 8. Scenario world (Q4)
  let scenarioWorld = DEFAULT_DERIVED_PLAYBOOK.scenarioWorld;
  if (answers.q4) {
    switch (answers.q4) {
      case 'Student':
        scenarioWorld = 'campus';
        break;
      case 'Working':
        scenarioWorld = 'workplace';
        break;
      case 'Both':
        scenarioWorld = 'workplace and campus';
        break;
      case 'Other':
        scenarioWorld = 'everyday community';
        break;
    }
  }

  // 9. Start difficulty (Q9 & deeper)
  let startDiff = 1;
  if (typeof answers.q9 === 'number') {
    if (answers.q9 <= 2) {
      startDiff = 3;
    } else if (answers.q9 === 3) {
      startDiff = 2;
    } else {
      startDiff = 1;
    }
  }

  // Deeper statements nudge if present
  if (deeperAnswers && Object.keys(deeperAnswers).length > 0) {
    let sum = 0;
    let count = 0;
    const weights: Record<string, number> = {
      d1: 1, // group energy (+)
      d3: 1, // conversation ease (+)
      d5: -1, // meeting nervous (-)
      d6: 1, // awkward recovery (+)
      d7: 1 // new people enjoyment (+)
    };

    for (const [key, weight] of Object.entries(weights)) {
      const val = deeperAnswers[key];
      if (typeof val === 'number') {
        const score = weight === 1 ? val : 6 - val;
        sum += score;
        count += 1;
      }
    }

    if (count > 0) {
      const avg = sum / count;
      if (avg >= 3.8 && startDiff < 5) {
        startDiff += 1;
      } else if (avg <= 2.2 && startDiff > 1) {
        startDiff -= 1;
      }
    }
  }

  const startDifficulty = Math.max(1, Math.min(5, startDiff)) as 1 | 2 | 3 | 4 | 5;

  // 10. Path order (Q1 & Q8)
  const prioritizedSkills: string[] = [];
  if (answers.q1 && Array.isArray(answers.q1)) {
    for (const goal of answers.q1) {
      const mapped = GOAL_TO_SKILLS[goal] || [];
      for (const skill of mapped) {
        if (!prioritizedSkills.includes(skill)) {
          prioritizedSkills.push(skill);
        }
      }
    }
  }

  const pathOrder = [...prioritizedSkills];
  for (const skill of ALL_SKILLS) {
    if (!pathOrder.includes(skill)) {
      pathOrder.push(skill);
    }
  }

  // 11. First steps (3 items)
  // Match candidate steps around startDifficulty and goals
  const candidates: FirstStep[] = [];
  const goals = answers.q1 || [];

  for (const step of FIRST_STEPS_LIBRARY) {
    if (goals.includes(step.category) && Math.abs(step.difficulty - startDifficulty) <= 1) {
      candidates.push(step);
    }
  }

  // Add more from the library around startDifficulty if fewer than 3
  for (const step of FIRST_STEPS_LIBRARY) {
    if (candidates.length >= 3) break;
    if (!candidates.find((s) => s.id === step.id) && step.difficulty <= startDifficulty + 1) {
      candidates.push(step);
    }
  }

  // Ensure fallback fills up to 3
  for (const step of FIRST_STEPS_LIBRARY) {
    if (candidates.length >= 3) break;
    if (!candidates.find((s) => s.id === step.id)) {
      candidates.push(step);
    }
  }

  const firstSteps: [FirstStep, FirstStep, FirstStep] = [
    (candidates[0] ?? FIRST_STEPS_LIBRARY[0]) as FirstStep,
    (candidates[1] ?? FIRST_STEPS_LIBRARY[1]) as FirstStep,
    (candidates[2] ?? FIRST_STEPS_LIBRARY[2]) as FirstStep
  ];

  return {
    pace,
    batteryProfile,
    hardestPlaces,
    firstSteps,
    coachTone,
    weeklyGoal,
    window,
    anchor,
    startDifficulty,
    pathOrder,
    scenarioWorld
  };
}
