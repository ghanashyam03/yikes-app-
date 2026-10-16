import { prepCardOutputSchema } from '../types';
import {
  convertEventsToMoments,
  fetchCandidateEvents,
  filterTickedEvents,
  requestCalendarPermission,
} from '../calendarSync';

describe('Acceptance Check 2 & 3: PrepCard Schema & Scenario Exclusion Guarantees', () => {
  it('validates a complete structured prep output strictly matching prepCardOutputSchema', () => {
    const candidate = {
      openerOptions: [
        'Hey Marcus, mind if I join you at this table?',
        'Hi Marcus, how is your afternoon going so far?',
      ],
      questions: [
        'What part of the current milestone are you most looking forward to?',
        'Have you attended one of these cross-functional reviews before?',
      ] as [string, string],
      exitLine: "I need to run to prepare for my next call—let's touch base soon!",
      quietBreak: 'Step out into the courtyard for 3 minutes to reset.',
      recoveryPlan: 'Block 30 quiet minutes after the meeting with tea.',
    };

    const parsed = prepCardOutputSchema.safeParse(candidate);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.openerOptions).toHaveLength(2);
      expect(parsed.data.questions).toHaveLength(2);
      expect(typeof parsed.data.exitLine).toBe('string');
      expect(typeof parsed.data.quietBreak).toBe('string');
      expect(typeof parsed.data.recoveryPlan).toBe('string');
    }
  });

  it('rejects prep card with fewer than 2 questions', () => {
    const invalid = {
      openerOptions: ['Opener 1', 'Opener 2'],
      questions: ['Only 1 question'], // Missing 2nd question tuple item
      exitLine: 'Exit line',
      quietBreak: 'Quiet break',
      recoveryPlan: 'Recovery plan',
    };

    const parsed = prepCardOutputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects prep card with empty string fields', () => {
    const invalid = {
      openerOptions: ['Opener 1', ''],
      questions: ['Q1', 'Q2'] as [string, string],
      exitLine: '',
      quietBreak: 'Quiet break',
      recoveryPlan: 'Recovery plan',
    };

    const parsed = prepCardOutputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});

describe('Calendar Just-In-Time Permission & Zero-Retention Privacy', () => {
  it('requests calendar permission only on demand', async () => {
    const granted = await requestCalendarPermission();
    expect(granted).toBe(true);
  });

  it('filters and imports ONLY explicitly ticked events, retaining 0 unticked events', async () => {
    const candidateEvents = await fetchCandidateEvents();
    expect(candidateEvents.length).toBeGreaterThan(0);

    // Explicitly tick only the second event
    const userSelections = candidateEvents.map((evt, idx) => ({
      ...evt,
      selected: idx === 1,
    }));

    const ticked = filterTickedEvents(userSelections);
    expect(ticked).toHaveLength(1);
    expect(ticked[0]?.id).toBe(candidateEvents[1]?.id);

    // Convert only ticked events to moment drafts
    const moments = convertEventsToMoments(userSelections);
    expect(moments).toHaveLength(1);
    expect(moments[0]?.title).toBe(candidateEvents[1]?.title);
  });
});
