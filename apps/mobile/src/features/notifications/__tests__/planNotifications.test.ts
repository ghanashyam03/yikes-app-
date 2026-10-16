/**
 * planNotifications.test.ts — Comprehensive tests for pure planning function
 * 
 * Acceptance check 1:
 * - max one a day
 * - quiet hours respected
 * - pause respected
 * - welcome-back frequency
 */

import {
  isInQuietHours,
  parseTimeToMinutes,
  planNotifications,
  toCalendarDateKey,
} from '../planNotifications';
import type { PlanNotificationsState, QuietHours } from '../types';

describe('T-21 Acceptance Check 1: planNotifications', () => {
  const baseDate = new Date('2026-10-19T10:00:00.000Z'); // Monday 10:00 AM

  const defaultQuietHours: QuietHours = {
    start: '22:00',
    end: '08:00',
  };

  const defaultReminderWindow = {
    start: '09:00',
    end: '21:00',
  };

  describe('Quiet hours calculation & enforcement', () => {
    it('accurately parses 24h time to minutes', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('08:30')).toBe(510);
      expect(parseTimeToMinutes('22:00')).toBe(1320);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('correctly detects overnight quiet hours (22:00 to 08:00)', () => {
      const qh: QuietHours = { start: '22:00', end: '08:00' };

      // Inside quiet hours
      const night = new Date(baseDate);
      night.setHours(22, 0, 0, 0);
      expect(isInQuietHours(night, qh)).toBe(true);

      const midnight = new Date(baseDate);
      midnight.setHours(23, 30, 0, 0);
      expect(isInQuietHours(midnight, qh)).toBe(true);

      const early = new Date(baseDate);
      early.setHours(4, 15, 0, 0);
      expect(isInQuietHours(early, qh)).toBe(true);

      const justBeforeEnd = new Date(baseDate);
      justBeforeEnd.setHours(7, 59, 0, 0);
      expect(isInQuietHours(justBeforeEnd, qh)).toBe(true);

      // Outside quiet hours
      const morningSafe = new Date(baseDate);
      morningSafe.setHours(8, 0, 0, 0);
      expect(isInQuietHours(morningSafe, qh)).toBe(false);

      const noonSafe = new Date(baseDate);
      noonSafe.setHours(12, 30, 0, 0);
      expect(isInQuietHours(noonSafe, qh)).toBe(false);

      const eveningSafe = new Date(baseDate);
      eveningSafe.setHours(21, 59, 0, 0);
      expect(isInQuietHours(eveningSafe, qh)).toBe(false);
    });

    it('never schedules any notification inside quiet hours', () => {
      // Create moment prompt during quiet hours (e.g. event at 04:00 AM)
      const earlyEvent = new Date(baseDate);
      earlyEvent.setDate(earlyEvent.getDate() + 1);
      earlyEvent.setHours(4, 0, 0, 0);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        upcomingMoments: [
          {
            id: 'm1',
            title: 'Early Flight',
            scheduledAt: earlyEvent,
          },
        ],
        planningDaysAhead: 3,
      };

      const planned = planNotifications(state);

      // Verify EVERY single scheduled notification is strictly outside quiet hours
      for (const item of planned) {
        const itemDate = new Date(item.scheduledAt);
        expect(isInQuietHours(itemDate, defaultQuietHours)).toBe(false);
      }
    });
  });

  describe('Max ONE notification per day rule', () => {
    it('guarantees at most ONE notification per calendar day even when multiple qualify', () => {
      // Day 1: Moment prompt + rhythm nudge + checkin nudge all due
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        checkinDue: true,
        upcomingMoments: [
          {
            id: 'm-sync',
            title: 'Team Sync',
            scheduledAt: tomorrow,
          },
        ],
        planningDaysAhead: 5,
      };

      const planned = planNotifications(state);

      // Check unique dates
      const seenDates = new Set<string>();
      for (const item of planned) {
        expect(seenDates.has(item.dateKey)).toBe(false);
        seenDates.add(item.dateKey);
      }
    });

    it('prioritizes Moment prompts over generic rhythm nudges on the same day', () => {
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const tomorrowKey = toCalendarDateKey(tomorrow);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        upcomingMoments: [
          {
            id: 'm-client',
            title: 'Client Demo',
            scheduledAt: tomorrow,
          },
        ],
        planningDaysAhead: 2,
      };

      const planned = planNotifications(state);
      const tomorrowItem = planned.find((item) => item.dateKey === tomorrowKey);

      expect(tomorrowItem).toBeDefined();
      expect(tomorrowItem?.type).toBe('moment_prompt');
      expect(tomorrowItem?.body).toContain('Client Demo');
    });

    it('schedules zero notifications for dates present in alreadyScheduledDates', () => {
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = toCalendarDateKey(tomorrow);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        alreadyScheduledDates: [tomorrowKey],
        planningDaysAhead: 3,
      };

      const planned = planNotifications(state);
      const itemOnAlreadyScheduledDate = planned.find((item) => item.dateKey === tomorrowKey);

      expect(itemOnAlreadyScheduledDate).toBeUndefined();
    });
  });

  describe('Pause week rule', () => {
    it('schedules strictly ZERO notifications when pausedUntil is in the future', () => {
      const oneWeekLater = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const state: PlanNotificationsState = {
        now: baseDate,
        pausedUntil: oneWeekLater,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        checkinDue: true,
        weeklyLetterDue: true,
        upcomingMoments: [
          {
            id: 'm-vacation',
            title: 'Meeting',
            scheduledAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
        ],
        planningDaysAhead: 7,
      };

      const planned = planNotifications(state);
      expect(planned).toEqual([]);
      expect(planned.length).toBe(0);
    });

    it('resumes scheduling when pausedUntil is in the past', () => {
      const yesterday = new Date(baseDate.getTime() - 24 * 60 * 60 * 1000);

      const state: PlanNotificationsState = {
        now: baseDate,
        pausedUntil: yesterday,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        planningDaysAhead: 3,
      };

      const planned = planNotifications(state);
      expect(planned.length).toBeGreaterThan(0);
    });
  });

  describe('Welcome-back frequency rule', () => {
    it('does not send welcome back if away for less than 3 days', () => {
      const twoDaysAgo = new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        userActivity: {
          lastActiveAt: twoDaysAgo,
        },
        toggles: { rhythm_nudge: false }, // isolate welcome back
        planningDaysAhead: 2,
      };

      const planned = planNotifications(state);
      const welcomeBack = planned.find((item) => item.type === 'welcome_back');
      expect(welcomeBack).toBeUndefined();
    });

    it('schedules at most one warm welcome-back notification if away for 3+ days', () => {
      const fourDaysAgo = new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        userActivity: {
          lastActiveAt: fourDaysAgo,
        },
        planningDaysAhead: 3,
      };

      const planned = planNotifications(state);
      const welcomeBackItems = planned.filter((item) => item.type === 'welcome_back');

      expect(welcomeBackItems.length).toBe(1);
      expect(welcomeBackItems[0]!.body).toContain('Maya is ready');
    });

    it('suppresses welcome-back if already sent within the last 7 days', () => {
      const fiveDaysAway = new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000);
      const welcomeBackSent3DaysAgo = new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        userActivity: {
          lastActiveAt: fiveDaysAway,
          lastWelcomeBackSentAt: welcomeBackSent3DaysAgo,
        },
        toggles: { rhythm_nudge: false },
        planningDaysAhead: 3,
      };

      const planned = planNotifications(state);
      const welcomeBack = planned.find((item) => item.type === 'welcome_back');
      expect(welcomeBack).toBeUndefined();
    });

    it('allows welcome-back if previous welcome-back was sent 8+ days ago', () => {
      const tenDaysAway = new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000);
      const welcomeBackSent8DaysAgo = new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        userActivity: {
          lastActiveAt: tenDaysAway,
          lastWelcomeBackSentAt: welcomeBackSent8DaysAgo,
        },
        planningDaysAhead: 3,
      };

      const planned = planNotifications(state);
      const welcomeBack = planned.find((item) => item.type === 'welcome_back');
      expect(welcomeBack).toBeDefined();
    });
  });

  describe('Per-type toggles', () => {
    it('produces zero notifications for types that have been toggled off', () => {
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const state: PlanNotificationsState = {
        now: baseDate,
        quietHours: defaultQuietHours,
        reminderWindow: defaultReminderWindow,
        toggles: {
          rhythm_nudge: false,
          moment_prompt: false,
          checkin_nudge: false,
          review_due: false,
          weekly_letter: false,
          welcome_back: false,
        },
        upcomingMoments: [
          {
            id: 'm-off',
            title: 'Dinner',
            scheduledAt: tomorrow,
          },
        ],
        planningDaysAhead: 5,
      };

      const planned = planNotifications(state);
      expect(planned).toEqual([]);
    });
  });
});
