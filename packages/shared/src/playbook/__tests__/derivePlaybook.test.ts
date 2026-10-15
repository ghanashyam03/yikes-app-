import { describe, expect, it } from 'vitest';
import { derivePlaybook, DEFAULT_DERIVED_PLAYBOOK } from '../derivePlaybook';
import { QuizAnswers } from '../questions';
import { DeeperAnswers } from '../deeper';

describe('derivePlaybook', () => {
  // Answer set 1: All skipped
  it('handles answer set 1: all-skipped returning documented defaults', () => {
    const playbook = derivePlaybook({}, {});
    expect(playbook.coachTone).toBe('Gentle');
    expect(playbook.weeklyGoal).toBe(3);
    expect(playbook.window).toBe('Morning');
    expect(playbook.anchor).toBe('Morning coffee');
    expect(playbook.hardestPlaces).toEqual(['Work meetings', 'New groups']);
    expect(playbook.pace.title).toBe(DEFAULT_DERIVED_PLAYBOOK.pace.title);
    expect(playbook.batteryProfile.title).toBe(DEFAULT_DERIVED_PLAYBOOK.batteryProfile.title);
    expect(playbook.startDifficulty).toBe(1);
    expect(playbook.scenarioWorld).toBe('workplace');
    expect(playbook.firstSteps).toHaveLength(3);
    expect(playbook.pathOrder).toHaveLength(12);
  });

  // Answer set 2: Fast-paced student with straight coach
  it('handles answer set 2: active student with straight coach and high difficulty tolerance', () => {
    const answers: QuizAnswers = {
      q1: ['Meetings', 'Speaking up'],
      q2: ['Parties', 'Online chat'],
      q4: 'Student',
      q5: 1, // Charged
      q6: 'Speak as I think',
      q7: 'Feel mostly fine',
      q8: 'Sounding awkward',
      q9: 1, // Easy
      q10: 'Short and dry',
      q11: 'Straight',
      q12: '5 a week',
      q13: 'Early morning',
      q14: 'Morning coffee'
    };
    const playbook = derivePlaybook(answers);
    expect(playbook.coachTone).toBe('Straight');
    expect(playbook.weeklyGoal).toBe(5);
    expect(playbook.window).toBe('Early morning');
    expect(playbook.scenarioWorld).toBe('campus');
    expect(playbook.pace.title).toBe('Speak as you think, refine with practice');
    expect(playbook.batteryProfile.title).toBe('Resilient social endurance');
    expect(playbook.hardestPlaces).toEqual(['Parties', 'Online chat']);
    expect(playbook.startDifficulty).toBe(3);
    expect(playbook.pathOrder[0]).toBe('speaking_up_in_meetings');
  });

  // Answer set 3: Introverted professional needing high recharge
  it('handles answer set 3: reserved working professional with gentle coach', () => {
    const answers: QuizAnswers = {
      q1: ['Small talk', 'Graceful exits'],
      q2: ['Work meetings', 'Senior people'],
      q4: 'Working',
      q5: 5, // Need a day alone
      q6: 'Think first, then speak',
      q7: 'Replay it',
      q8: 'Being judged',
      q9: 5, // Very hard
      q10: 'Warm and chatty',
      q11: 'Gentle',
      q12: '2 a week',
      q13: 'Evening',
      q14: 'Evening wind-down'
    };
    const playbook = derivePlaybook(answers);
    expect(playbook.coachTone).toBe('Gentle');
    expect(playbook.weeklyGoal).toBe(2);
    expect(playbook.window).toBe('Evening');
    expect(playbook.anchor).toBe('Evening wind-down');
    expect(playbook.scenarioWorld).toBe('workplace');
    expect(playbook.pace.title).toBe('Think first, speak with intent');
    expect(playbook.batteryProfile.title).toBe('Quiet time can help after groups');
    expect(playbook.batteryProfile.drainLevel).toBe(5);
    expect(playbook.startDifficulty).toBe(1);
    expect(playbook.firstSteps).toHaveLength(3);
  });

  // Answer set 4: Funny coach with custom habit anchor and both working/student
  it('handles answer set 4: custom anchor and funny coach', () => {
    const answers: QuizAnswers = {
      q1: ['Networking', 'Groups'],
      q2: ['Strangers', 'Family'],
      q4: 'Both',
      q5: 3, // Steady
      q6: 'Think first, then speak',
      q8: 'Running out of things to say',
      q9: 3,
      q11: 'Funny',
      q12: '4 a week',
      q13: 'Lunch',
      q14: 'Write my own',
      q14Custom: 'After my 3pm green tea'
    };
    const playbook = derivePlaybook(answers);
    expect(playbook.coachTone).toBe('Funny');
    expect(playbook.weeklyGoal).toBe(4);
    expect(playbook.window).toBe('Lunch');
    expect(playbook.anchor).toBe('After my 3pm green tea');
    expect(playbook.scenarioWorld).toBe('workplace and campus');
    expect(playbook.batteryProfile.title).toBe('Steady burn, recharges with quiet time');
  });

  // Answer set 5: Deeper answers nudging start difficulty upwards
  it('handles answer set 5: moderate quiz answers + high confidence deeper profile nudge', () => {
    const answers: QuizAnswers = {
      q1: ['Making friends', 'Following up'],
      q2: ['New groups', 'Calls'],
      q4: 'Other',
      q5: 2,
      q9: 3 // base difficulty = 2
    };
    const deeper: DeeperAnswers = {
      d1: 5, // group energy high
      d3: 5, // starts easily
      d5: 1, // low meeting nervousness (6 - 1 = 5)
      d6: 5, // recovers quickly
      d7: 5 // enjoys new people
    };
    const playbook = derivePlaybook(answers, deeper);
    // Base 2 nudged up to 3
    expect(playbook.startDifficulty).toBe(3);
    expect(playbook.scenarioWorld).toBe('everyday community');
  });

  // Answer set 6: Deeper answers nudging start difficulty downwards
  it('handles answer set 6: easy quiz comfort + low confidence deeper profile nudge', () => {
    const answers: QuizAnswers = {
      q1: ['Speaking up'],
      q9: 2 // base difficulty = 3
    };
    const deeper: DeeperAnswers = {
      d1: 1,
      d3: 1,
      d5: 5, // high meeting nervousness (6 - 5 = 1)
      d6: 1,
      d7: 1
    };
    const playbook = derivePlaybook(answers, deeper);
    // Base 3 nudged down to 2
    expect(playbook.startDifficulty).toBe(2);
  });
});
