import { chooseNextSession, canonicalSkillKey } from '../chooseNextSession';
import { DEFAULT_DERIVED_PLAYBOOK, type DerivedPlaybook } from '@yikes/shared/playbook/derivePlaybook';

describe('chooseNextSession', () => {
  it('Scenario 1: Fresh user with no progress -> recommends Session 1 with foundation reason', () => {
    const recommendation = chooseNextSession(DEFAULT_DERIVED_PLAYBOOK, {}, {
      completedTodaySessionIds: [],
      allCompletedSessionIds: [],
    });

    expect(recommendation.session.id).toBe('session-01');
    expect(recommendation.reason).toBe('Because starting a chat is your foundation.');
    expect(recommendation.lengthMinutes).toBe(4);
  });

  it('Scenario 2: User with asking_followups priority -> recommends Session 2 with first step reason', () => {
    const customPlaybook: DerivedPlaybook = {
      ...DEFAULT_DERIVED_PLAYBOOK,
      pathOrder: ['asking_follow_ups', 'starting_a_chat', 'acknowledging_what_was_said'],
      firstSteps: [
        {
          id: 'step_q1_making_friends_1',
          title: 'Ask one curious follow-up question',
          difficulty: 1,
          action: 'Ask one question about what they just said.',
          category: 'Making friends',
        },
        DEFAULT_DERIVED_PLAYBOOK.firstSteps[1]!,
        DEFAULT_DERIVED_PLAYBOOK.firstSteps[2]!,
      ],
    };

    const recommendation = chooseNextSession(customPlaybook, {}, {
      completedTodaySessionIds: [],
      allCompletedSessionIds: ['session-01'],
    });

    expect(recommendation.session.id).toBe('session-02');
    expect(recommendation.reason).toBe('Because follow-up questions are your first step.');
    expect(recommendation.lengthMinutes).toBe(4);
  });

  it('Scenario 3: User with hardest place "Work meetings" -> recommends meeting-related session with meeting reason', () => {
    const meetingPlaybook: DerivedPlaybook = {
      ...DEFAULT_DERIVED_PLAYBOOK,
      hardestPlaces: ['Work meetings'],
      pathOrder: ['polite_disagreement', 'starting_a_chat'],
    };

    const recommendation = chooseNextSession(meetingPlaybook, {}, {
      completedTodaySessionIds: [],
      allCompletedSessionIds: ['session-01'],
    });

    expect(recommendation.session.skillKey).toBe('polite_disagreement');
    expect(recommendation.reason).toBe('Because you wanted to get better at work meetings.');
  });

  it('Scenario 4: Skill in practicing stage -> recommends session with practicing reason', () => {
    const progress = {
      starting_chat: { stage: 'growing' as const },
      acknowledging: { stage: 'practicing' as const },
    };

    const playbook: DerivedPlaybook = {
      ...DEFAULT_DERIVED_PLAYBOOK,
      pathOrder: ['acknowledging', 'starting_chat'],
      firstSteps: [
        {
          id: 'other',
          title: 'Unrelated step',
          difficulty: 2,
          action: 'Unrelated action',
          category: 'Small talk',
        },
        DEFAULT_DERIVED_PLAYBOOK.firstSteps[1]!,
        DEFAULT_DERIVED_PLAYBOOK.firstSteps[2]!,
      ],
      hardestPlaces: ['Parties'],
    };

    const recommendation = chooseNextSession(playbook, progress, {
      completedTodaySessionIds: [],
      allCompletedSessionIds: ['session-01', 'session-02'],
    });

    expect(recommendation.session.skillKey).toBe('acknowledging');
    expect(recommendation.reason).toBe('Because you’re practicing acknowledging what was said.');
  });

  it('Scenario 5: Session 1 completed today -> skips Session 1 and picks next eligible session', () => {
    const recommendation = chooseNextSession(DEFAULT_DERIVED_PLAYBOOK, {}, {
      completedTodaySessionIds: ['session-01'],
      allCompletedSessionIds: ['session-01'],
    });

    expect(recommendation.session.id).not.toBe('session-01');
    expect(recommendation.session.id).toBe('session-02');
  });

  it('Scenario 6: All sessions completed -> picks session needing refresh with refresh reason', () => {
    const allSessionIds = [
      'session-01', 'session-02', 'session-03', 'session-04',
      'session-05', 'session-06', 'session-07', 'session-08',
      'session-09', 'session-10', 'session-11', 'session-12',
      'session-13', 'session-14', 'session-15', 'session-16',
    ];

    const lastPracticedDateBySkill = {
      starting_chat: '2026-09-01T00:00:00Z', // oldest
      asking_followups: '2026-10-15T00:00:00Z',
    };

    const progress = {
      starting_chat: { stage: 'natural' as const },
      asking_followups: { stage: 'natural' as const },
      acknowledging: { stage: 'natural' as const },
      graceful_exits: { stage: 'natural' as const },
      reading_engagement: { stage: 'natural' as const },
      pacing_sharing: { stage: 'natural' as const },
      handling_silence: { stage: 'natural' as const },
      keeping_balance: { stage: 'natural' as const },
      groups: { stage: 'natural' as const },
      bridging_small_talk: { stage: 'natural' as const },
      polite_disagreement: { stage: 'natural' as const },
      following_up: { stage: 'natural' as const },
    };

    const recommendation = chooseNextSession(DEFAULT_DERIVED_PLAYBOOK, progress, {
      completedTodaySessionIds: ['session-02'],
      allCompletedSessionIds: allSessionIds,
      lastPracticedDateBySkill,
    });

    expect(recommendation.session.id).toBe('session-01');
    expect(recommendation.reason).toBe('Because you haven’t visited this move in a while.');
  });

  it('Take it easy mode sets length to 2 minutes', () => {
    const recommendation = chooseNextSession(DEFAULT_DERIVED_PLAYBOOK, {}, {
      isTakeItEasy: true,
      completedTodaySessionIds: [],
      allCompletedSessionIds: [],
    });

    expect(recommendation.lengthMinutes).toBe(2);
  });

  it('canonicalSkillKey correctly maps aliases', () => {
    expect(canonicalSkillKey('starting_a_chat')).toBe('starting_chat');
    expect(canonicalSkillKey('asking_follow_ups')).toBe('asking_followups');
    expect(canonicalSkillKey('participating_in_groups')).toBe('groups');
    expect(canonicalSkillKey('following_up_afterwards')).toBe('following_up');
  });
});
