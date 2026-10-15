import { describe, expect, it } from 'vitest';
import {
  QUIZ_QUESTIONS,
  MultiChoiceQuestion,
  SingleChoiceQuestion,
  SliderQuestion,
  MomentFormQuestion,
  SingleChoiceWithCustomQuestion
} from '../questions';
import { DEEPER_STATEMENTS } from '../deeper';
import { FIRST_STEPS_LIBRARY } from '../firstSteps';

describe('Specification Conformance', () => {
  it('proves exactly 14 questions exist with matching IDs q1 to q14', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(14);
    for (let i = 1; i <= 14; i++) {
      const q = QUIZ_QUESTIONS.find((item) => item.number === i);
      expect(q).toBeDefined();
      expect(q?.id).toBe(`q${i}`);
    }
  });

  it('proves Q1 matches spec: Goals, up to 3, with 8 specific options', () => {
    const q1 = QUIZ_QUESTIONS[0] as MultiChoiceQuestion;
    expect(q1.number).toBe(1);
    expect(q1.section).toBe('Goals');
    expect(q1.title).toBe('What do you most want to get better at?');
    expect(q1.type).toBe('multi-choice');
    expect(q1.maxSelections).toBe(3);
    expect(q1.options).toEqual([
      'Meetings',
      'Small talk',
      'Networking',
      'Making friends',
      'Speaking up',
      'Graceful exits',
      'Following up',
      'Groups'
    ]);
  });

  it('proves Q2 matches spec: Goals, top 2, with 8 specific options', () => {
    const q2 = QUIZ_QUESTIONS[1] as MultiChoiceQuestion;
    expect(q2.number).toBe(2);
    expect(q2.section).toBe('Goals');
    expect(q2.title).toBe('Where do conversations get hardest?');
    expect(q2.type).toBe('multi-choice');
    expect(q2.maxSelections).toBe(2);
    expect(q2.options).toEqual([
      'Work meetings',
      'Parties',
      'Calls',
      'New groups',
      'Senior people',
      'Strangers',
      'Family',
      'Online chat'
    ]);
  });

  it('proves Q3 matches spec: Goals, Moment form with 4 types', () => {
    const q3 = QUIZ_QUESTIONS[2] as MomentFormQuestion;
    expect(q3.number).toBe(3);
    expect(q3.section).toBe('Goals');
    expect(q3.title).toBe('Is something coming up?');
    expect(q3.type).toBe('moment-form');
    expect(q3.momentTypes).toEqual(['Meeting', 'Party', 'Call', 'Networking']);
  });

  it('proves Q4 matches spec: Context with Student, Working, Both, Other', () => {
    const q4 = QUIZ_QUESTIONS[3] as SingleChoiceQuestion;
    expect(q4.number).toBe(4);
    expect(q4.section).toBe('Context');
    expect(q4.title).toBe('What does your week look like?');
    expect(q4.type).toBe('single-choice');
    expect(q4.options).toEqual(['Student', 'Working', 'Both', 'Other']);
  });

  it('proves Q5 matches spec: Energy slider 1 to 5, Charged to Need a day alone', () => {
    const q5 = QUIZ_QUESTIONS[4] as SliderQuestion;
    expect(q5.number).toBe(5);
    expect(q5.section).toBe('Energy');
    expect(q5.title).toBe('After an hour of socialising I feel...');
    expect(q5.type).toBe('slider');
    expect(q5.min).toBe(1);
    expect(q5.max).toBe(5);
    expect(q5.minLabel).toBe('Charged');
    expect(q5.maxLabel).toBe('Need a day alone');
  });

  it('proves Q6 matches spec: Energy single-choice think vs speak', () => {
    const q6 = QUIZ_QUESTIONS[5] as SingleChoiceQuestion;
    expect(q6.number).toBe(6);
    expect(q6.section).toBe('Energy');
    expect(q6.type).toBe('single-choice');
    expect(q6.options).toEqual(['Think first, then speak', 'Speak as I think']);
  });

  it('proves Q7 matches spec: Energy replay, forget, feel mostly fine', () => {
    const q7 = QUIZ_QUESTIONS[6] as SingleChoiceQuestion;
    expect(q7.number).toBe(7);
    expect(q7.section).toBe('Energy');
    expect(q7.type).toBe('single-choice');
    expect(q7.options).toEqual(['Replay it', 'Forget it', 'Feel mostly fine']);
  });

  it('proves Q8 matches spec: Worry with 5 defined worries', () => {
    const q8 = QUIZ_QUESTIONS[7] as SingleChoiceQuestion;
    expect(q8.number).toBe(8);
    expect(q8.section).toBe('Worry');
    expect(q8.type).toBe('single-choice');
    expect(q8.options).toEqual([
      'Sounding awkward',
      'Being boring',
      'Not knowing how to end',
      'Being judged',
      'Running out of things to say'
    ]);
  });

  it('proves Q9 matches spec: Comfort slider 1 to 5, Easy to Very hard', () => {
    const q9 = QUIZ_QUESTIONS[8] as SliderQuestion;
    expect(q9.number).toBe(9);
    expect(q9.section).toBe('Comfort');
    expect(q9.type).toBe('slider');
    expect(q9.min).toBe(1);
    expect(q9.max).toBe(5);
    expect(q9.minLabel).toBe('Easy');
    expect(q9.maxLabel).toBe('Very hard');
  });

  it('proves Q10 matches spec: Style talking/texting register', () => {
    const q10 = QUIZ_QUESTIONS[9] as SingleChoiceQuestion;
    expect(q10.number).toBe(10);
    expect(q10.section).toBe('Style');
    expect(q10.type).toBe('single-choice');
    expect(q10.options).toEqual(['Short and dry', 'Warm and chatty', 'Formal', 'Mixed']);
  });

  it('proves Q11 matches spec: Style coach tone Gentle, Straight, Funny', () => {
    const q11 = QUIZ_QUESTIONS[10] as SingleChoiceQuestion;
    expect(q11.number).toBe(11);
    expect(q11.section).toBe('Style');
    expect(q11.type).toBe('single-choice');
    expect(q11.options).toEqual(['Gentle', 'Straight', 'Funny']);
  });

  it('proves Q12 matches spec: Habit sessions a week (2..5)', () => {
    const q12 = QUIZ_QUESTIONS[11] as SingleChoiceQuestion;
    expect(q12.number).toBe(12);
    expect(q12.section).toBe('Habit');
    expect(q12.type).toBe('single-choice');
    expect(q12.options).toEqual(['2 a week', '3 a week', '4 a week', '5 a week']);
  });

  it('proves Q13 matches spec: Habit times of day', () => {
    const q13 = QUIZ_QUESTIONS[12] as SingleChoiceQuestion;
    expect(q13.number).toBe(13);
    expect(q13.section).toBe('Habit');
    expect(q13.type).toBe('single-choice');
    expect(q13.options).toEqual(['Early morning', 'Morning', 'Lunch', 'Afternoon', 'Evening']);
  });

  it('proves Q14 matches spec: Habit routine anchors + custom option', () => {
    const q14 = QUIZ_QUESTIONS[13] as SingleChoiceWithCustomQuestion;
    expect(q14.number).toBe(14);
    expect(q14.section).toBe('Habit');
    expect(q14.type).toBe('single-choice-with-custom');
    expect(q14.options).toEqual(['Morning coffee', 'Commute', 'Lunch', 'Evening wind-down']);
    expect(q14.customOption).toBe('Write my own');
  });

  it('proves Deeper profile contains the 8 exact statements from the spec', () => {
    expect(DEEPER_STATEMENTS).toHaveLength(8);
    const expectedStatements = [
      'I feel energised after time with a group',
      'I prefer one-to-one conversations',
      'I start conversations easily',
      'I think before I speak',
      'I feel nervous before meetings',
      'I recover quickly after an awkward moment',
      'I enjoy meeting new people',
      'I need time alone to recharge'
    ];
    DEEPER_STATEMENTS.forEach((stmt, idx) => {
      expect(stmt.number).toBe(idx + 1);
      expect(stmt.text).toBe(expectedStatements[idx]);
    });
  });

  it('proves firstStepsLibrary contains 24 small real-world steps graded 1 to 5', () => {
    expect(FIRST_STEPS_LIBRARY).toHaveLength(24);
    for (const step of FIRST_STEPS_LIBRARY) {
      expect(step.id).toBeDefined();
      expect(step.title).toBeDefined();
      expect(step.category).toBeDefined();
      expect(step.action).toBeDefined();
      expect(step.difficulty).toBeGreaterThanOrEqual(1);
      expect(step.difficulty).toBeLessThanOrEqual(5);
    }
    const difficulties = new Set(FIRST_STEPS_LIBRARY.map((s) => s.difficulty));
    expect(difficulties.size).toBe(5);
  });
});
