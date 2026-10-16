import { countSessionsInWeek, getCalendarWeekRange } from '../useToday';

describe('Rhythm calculation and weekly calendar range', () => {
  it('computes correct Monday-to-Sunday boundaries for a Wednesday reference date', () => {
    // 2026-10-14 is a Wednesday
    const wednesday = new Date('2026-10-14T12:00:00Z');
    const { start, end } = getCalendarWeekRange(wednesday);

    // Monday should be 2026-10-12
    expect(start.getDate()).toBe(12);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);

    // Sunday should be 2026-10-18
    expect(end.getDate()).toBe(18);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it('counts only sessions completed within the active calendar week', () => {
    const wednesday = new Date('2026-10-14T12:00:00Z');

    const logs = [
      // Within this week (Mon 12th to Sun 18th)
      { completedAt: '2026-10-12T09:00:00Z', mode: 'full' },
      { completedAt: '2026-10-13T14:30:00Z', mode: 'take_it_easy' },
      { completedAt: '2026-10-14T10:00:00Z', mode: 'full' },
      // Prior week
      { completedAt: '2026-10-10T11:00:00Z', mode: 'full' },
      // Next week
      { completedAt: '2026-10-20T08:00:00Z', mode: 'full' },
    ];

    const count = countSessionsInWeek(logs, wednesday);
    expect(count).toBe(3);
  });

  it('proves Take it easy mode counts 100% identically toward Rhythm', () => {
    const ref = new Date('2026-10-14T12:00:00Z');

    const normalOnlyLogs = [
      { completedAt: '2026-10-13T10:00:00Z', mode: 'full' },
      { completedAt: '2026-10-14T10:00:00Z', mode: 'full' },
    ];

    const mixedLogs = [
      { completedAt: '2026-10-13T10:00:00Z', mode: 'take_it_easy' },
      { completedAt: '2026-10-14T10:00:00Z', mode: 'take_it_easy' },
    ];

    expect(countSessionsInWeek(normalOnlyLogs, ref)).toBe(2);
    expect(countSessionsInWeek(mixedLogs, ref)).toBe(2);
  });

  it('returns 0 when no sessions are completed this week', () => {
    const ref = new Date('2026-10-14T12:00:00Z');
    const oldLogs = [{ completedAt: '2026-09-01T10:00:00Z', mode: 'full' }];
    expect(countSessionsInWeek(oldLogs, ref)).toBe(0);
  });
});
