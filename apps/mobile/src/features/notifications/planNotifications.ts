/**
 * planNotifications.ts — Pure planning function for notification engine
 * 
 * PRODUCT RULES & GUARANTEES:
 * 1. Guarantees at most ONE notification per calendar day across all types.
 * 2. Strictly respects quiet hours (never schedules within quiet hours window).
 * 3. Strictly respects pause week (schedules zero notifications when paused).
 * 4. Welcome-back rule (after 3+ days away, at most one warm notification, at most once per 7 days).
 * 5. Respects per-type toggles (disabled types produce zero notifications).
 */

import { NOTIFICATIONS_COPY } from '../../copy/notifications';
import type {
  NotificationType,
  PlanNotificationsState,
  QuietHours,
  ReminderWindow,
  ScheduledNotificationItem,
} from './types';

export const NOTIFICATION_PRIORITY: Record<NotificationType, number> = {
  moment_prompt: 100,
  welcome_back: 90,
  weekly_letter: 80,
  review_due: 60,
  checkin_nudge: 50,
  rhythm_nudge: 40,
};

const DEFAULT_QUIET_HOURS: QuietHours = {
  start: '22:00',
  end: '08:00',
};

const DEFAULT_REMINDER_WINDOW: ReminderWindow = {
  start: '09:00',
  end: '21:00',
};

/**
 * Parse "HH:mm" 24h string into minute-of-day integer [0, 1439]
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hourStr, minStr] = timeStr.split(':');
  const h = Number.parseInt(hourStr ?? '0', 10);
  const m = Number.parseInt(minStr ?? '0', 10);
  return Math.min(1439, Math.max(0, h * 60 + m));
}

/**
 * Checks if a given timestamp falls within quiet hours.
 * Handles overnight windows (e.g. 22:00 -> 08:00) cleanly.
 */
export function isInQuietHours(date: Date, quietHours: QuietHours): boolean {
  const startMins = parseTimeToMinutes(quietHours.start);
  const endMins = parseTimeToMinutes(quietHours.end);

  if (startMins === endMins) {
    return false;
  }

  const curMins = date.getHours() * 60 + date.getMinutes();

  if (startMins > endMins) {
    // Overnight window (e.g. 22:00 to 08:00)
    return curMins >= startMins || curMins < endMins;
  }

  // Same-day window (e.g. 01:00 to 06:00)
  return curMins >= startMins && curMins < endMins;
}

/**
 * Formats a date as calendar key YYYY-MM-DD
 */
export function toCalendarDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Finds a valid notification time on targetDate that respects reminderWindow and quietHours.
 */
function findSafeNotificationTime(
  targetDate: Date,
  preferredHour: number,
  preferredMinute: number,
  quietHours: QuietHours,
  reminderWindow: ReminderWindow
): Date | null {
  const candidate = new Date(targetDate);
  candidate.setHours(preferredHour, preferredMinute, 0, 0);

  if (!isInQuietHours(candidate, quietHours)) {
    return candidate;
  }

  // If candidate is inside quiet hours, try starting right at quiet hours end or reminder window start
  const windowStartMins = parseTimeToMinutes(reminderWindow.start);
  const quietEndMins = parseTimeToMinutes(quietHours.end);

  const safeStartMins = Math.max(windowStartMins, quietEndMins);
  const safeH = Math.floor(safeStartMins / 60);
  const safeM = safeStartMins % 60;

  const adjusted = new Date(targetDate);
  adjusted.setHours(safeH, safeM, 0, 0);

  if (!isInQuietHours(adjusted, quietHours)) {
    return adjusted;
  }

  return null;
}

/**
 * Pure planning function that computes all scheduled notifications.
 */
export function planNotifications(state: PlanNotificationsState): ScheduledNotificationItem[] {
  const now = typeof state.now === 'string' ? new Date(state.now) : state.now;

  // RULE 3: Pause week — schedules zero notifications when paused
  if (state.pausedUntil) {
    const pauseEnd =
      typeof state.pausedUntil === 'string' ? new Date(state.pausedUntil) : state.pausedUntil;
    if (pauseEnd.getTime() > now.getTime()) {
      return [];
    }
  }

  const quietHours = state.quietHours ?? DEFAULT_QUIET_HOURS;
  const reminderWindow = state.reminderWindow ?? DEFAULT_REMINDER_WINDOW;
  const toggles = {
    rhythm_nudge: true,
    moment_prompt: true,
    checkin_nudge: true,
    review_due: true,
    weekly_letter: true,
    welcome_back: true,
    ...state.toggles,
  };

  const alreadyScheduledDates = new Set<string>(state.alreadyScheduledDates ?? []);
  const candidates: ScheduledNotificationItem[] = [];
  const planningDays = state.planningDaysAhead ?? 7;

  // RULE 4: Welcome-back rule
  // After 3+ days away: at most ONE warm notification, at most once per 7 days
  if (toggles.welcome_back && state.userActivity?.lastActiveAt) {
    const lastActive =
      typeof state.userActivity.lastActiveAt === 'string'
        ? new Date(state.userActivity.lastActiveAt)
        : state.userActivity.lastActiveAt;

    const msAway = now.getTime() - lastActive.getTime();
    const daysAway = msAway / (1000 * 60 * 60 * 24);

    if (daysAway >= 3) {
      let canSendWelcomeBack = true;

      if (state.userActivity.lastWelcomeBackSentAt) {
        const lastSent =
          typeof state.userActivity.lastWelcomeBackSentAt === 'string'
            ? new Date(state.userActivity.lastWelcomeBackSentAt)
            : state.userActivity.lastWelcomeBackSentAt;
        const daysSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSent < 7) {
          canSendWelcomeBack = false;
        }
      }

      if (canSendWelcomeBack) {
        // Schedule warm welcome back for today if possible, or tomorrow
        const targetDate = new Date(now);
        let welcomeTime = findSafeNotificationTime(targetDate, 10, 30, quietHours, reminderWindow);

        if (!welcomeTime || welcomeTime.getTime() <= now.getTime()) {
          targetDate.setDate(targetDate.getDate() + 1);
          welcomeTime = findSafeNotificationTime(targetDate, 10, 30, quietHours, reminderWindow);
        }

        if (welcomeTime && welcomeTime.getTime() > now.getTime() && !isInQuietHours(welcomeTime, quietHours)) {
          candidates.push({
            id: `welcome_back_${toCalendarDateKey(welcomeTime)}`,
            type: 'welcome_back',
            title: NOTIFICATIONS_COPY.welcomeBack.title,
            body: NOTIFICATIONS_COPY.welcomeBack.warm,
            scheduledAt: welcomeTime.toISOString(),
            dateKey: toCalendarDateKey(welcomeTime),
            priority: NOTIFICATION_PRIORITY.welcome_back,
          });
        }
      }
    }
  }

  // Moment prompts
  if (toggles.moment_prompt && state.upcomingMoments && state.upcomingMoments.length > 0) {
    for (const moment of state.upcomingMoments) {
      const momentDate =
        typeof moment.scheduledAt === 'string' ? new Date(moment.scheduledAt) : moment.scheduledAt;

      // 1. Evening before (e.g. 20:00 the day prior)
      const eveningBefore = new Date(momentDate);
      eveningBefore.setDate(eveningBefore.getDate() - 1);
      eveningBefore.setHours(20, 0, 0, 0);

      if (
        eveningBefore.getTime() > now.getTime() &&
        !isInQuietHours(eveningBefore, quietHours)
      ) {
        candidates.push({
          id: `moment_prompt_eve_${moment.id}`,
          type: 'moment_prompt',
          title: NOTIFICATIONS_COPY.momentPrompt.previewTitle,
          body: NOTIFICATIONS_COPY.momentPrompt.eveningBefore(moment.title),
          scheduledAt: eveningBefore.toISOString(),
          dateKey: toCalendarDateKey(eveningBefore),
          priority: NOTIFICATION_PRIORITY.moment_prompt,
          data: { momentId: moment.id, timing: 'evening_before' },
        });
      }

      // 2. 1 hour before
      const oneHourBefore = new Date(momentDate.getTime() - 60 * 60 * 1000);
      if (
        oneHourBefore.getTime() > now.getTime() &&
        !isInQuietHours(oneHourBefore, quietHours)
      ) {
        candidates.push({
          id: `moment_prompt_hour_${moment.id}`,
          type: 'moment_prompt',
          title: NOTIFICATIONS_COPY.momentPrompt.previewTitle,
          body: NOTIFICATIONS_COPY.momentPrompt.hourBefore(moment.title),
          scheduledAt: oneHourBefore.toISOString(),
          dateKey: toCalendarDateKey(oneHourBefore),
          priority: NOTIFICATION_PRIORITY.moment_prompt + 1, // slightly higher than evening before
          data: { momentId: moment.id, timing: 'hour_before' },
        });
      }

      // 3. 30 minutes after
      const halfHourAfter = new Date(momentDate.getTime() + 30 * 60 * 1000);
      if (
        halfHourAfter.getTime() > now.getTime() &&
        !isInQuietHours(halfHourAfter, quietHours)
      ) {
        candidates.push({
          id: `moment_prompt_after_${moment.id}`,
          type: 'moment_prompt',
          title: NOTIFICATIONS_COPY.momentPrompt.previewTitle,
          body: NOTIFICATIONS_COPY.momentPrompt.halfHourAfter(moment.title),
          scheduledAt: halfHourAfter.toISOString(),
          dateKey: toCalendarDateKey(halfHourAfter),
          priority: NOTIFICATION_PRIORITY.moment_prompt + 2,
          data: { momentId: moment.id, timing: 'half_hour_after' },
        });
      }
    }
  }

  // Sunday Weekly Letter
  if (toggles.weekly_letter && state.weeklyLetterDue) {
    const sundayLetterTime = new Date(now);
    // If today is Sunday (day 0) and it's before 19:30
    const dayOfWeek = sundayLetterTime.getDay();
    if (dayOfWeek === 0) {
      sundayLetterTime.setHours(19, 30, 0, 0);
      if (
        sundayLetterTime.getTime() > now.getTime() &&
        !isInQuietHours(sundayLetterTime, quietHours)
      ) {
        candidates.push({
          id: `weekly_letter_${toCalendarDateKey(sundayLetterTime)}`,
          type: 'weekly_letter',
          title: NOTIFICATIONS_COPY.weeklyLetter.title,
          body: NOTIFICATIONS_COPY.weeklyLetter.body,
          scheduledAt: sundayLetterTime.toISOString(),
          dateKey: toCalendarDateKey(sundayLetterTime),
          priority: NOTIFICATION_PRIORITY.weekly_letter,
        });
      }
    }
  }

  // Check-in nudge
  if (toggles.checkin_nudge && state.checkinDue) {
    const checkinTime = new Date(now);
    checkinTime.setHours(17, 30, 0, 0);
    if (
      checkinTime.getTime() > now.getTime() &&
      !isInQuietHours(checkinTime, quietHours)
    ) {
      candidates.push({
        id: `checkin_nudge_${toCalendarDateKey(checkinTime)}`,
        type: 'checkin_nudge',
        title: NOTIFICATIONS_COPY.checkinNudge.title,
        body: NOTIFICATIONS_COPY.checkinNudge.energy,
        scheduledAt: checkinTime.toISOString(),
        dateKey: toCalendarDateKey(checkinTime),
        priority: NOTIFICATION_PRIORITY.checkin_nudge,
      });
    }
  }

  // Review due skills (14+ days without practice)
  if (toggles.review_due && state.reviewDueSkills && state.reviewDueSkills.length > 0) {
    for (const skill of state.reviewDueSkills) {
      const lastPracticed =
        typeof skill.lastPracticedAt === 'string'
          ? new Date(skill.lastPracticedAt)
          : skill.lastPracticedAt;
      const daysSince = (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince >= 14) {
        const reviewDate = new Date(now);
        reviewDate.setDate(reviewDate.getDate() + 1); // next day
        const safeTime = findSafeNotificationTime(reviewDate, 11, 0, quietHours, reminderWindow);

        if (safeTime && safeTime.getTime() > now.getTime() && !isInQuietHours(safeTime, quietHours)) {
          candidates.push({
            id: `review_due_${skill.skillKey}_${toCalendarDateKey(safeTime)}`,
            type: 'review_due',
            title: NOTIFICATIONS_COPY.reviewDue.title,
            body: NOTIFICATIONS_COPY.reviewDue.body(skill.skillName),
            scheduledAt: safeTime.toISOString(),
            dateKey: toCalendarDateKey(safeTime),
            priority: NOTIFICATION_PRIORITY.review_due,
            data: { skillKey: skill.skillKey },
          });
          // One review prompt is sufficient per planning run
          break;
        }
      }
    }
  }

  // Rhythm nudge across planning days horizon
  if (toggles.rhythm_nudge) {
    const anchor = state.rhythmAnchor ?? { timeOfDay: 'morning' };
    let defaultH = 9;
    let defaultM = 0;

    if (anchor.preferredHour !== undefined) {
      defaultH = anchor.preferredHour;
      defaultM = anchor.preferredMinute ?? 0;
    } else if (anchor.timeOfDay === 'lunch') {
      defaultH = 12;
      defaultM = 30;
    } else if (anchor.timeOfDay === 'evening') {
      defaultH = 19;
      defaultM = 0;
    }

    const rhythmBody =
      anchor.timeOfDay === 'lunch'
        ? NOTIFICATIONS_COPY.rhythmNudge.lunch
        : anchor.timeOfDay === 'evening'
          ? NOTIFICATIONS_COPY.rhythmNudge.evening
          : NOTIFICATIONS_COPY.rhythmNudge.morning;

    for (let dayOffset = 0; dayOffset < planningDays; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);

      const scheduledTime = findSafeNotificationTime(
        targetDate,
        defaultH,
        defaultM,
        quietHours,
        reminderWindow
      );

      if (
        scheduledTime &&
        scheduledTime.getTime() > now.getTime() &&
        !isInQuietHours(scheduledTime, quietHours)
      ) {
        candidates.push({
          id: `rhythm_nudge_${toCalendarDateKey(scheduledTime)}`,
          type: 'rhythm_nudge',
          title: NOTIFICATIONS_COPY.rhythmNudge.title,
          body: rhythmBody,
          scheduledAt: scheduledTime.toISOString(),
          dateKey: toCalendarDateKey(scheduledTime),
          priority: NOTIFICATION_PRIORITY.rhythm_nudge,
        });
      }
    }
  }

  // RULE 1: Guarantees at most ONE notification per calendar day.
  // Group candidates by dateKey and pick the highest priority item.
  const candidatesByDate = new Map<string, ScheduledNotificationItem[]>();

  for (const item of candidates) {
    // Extra safety: enforce quiet hours check unconditionally
    if (isInQuietHours(new Date(item.scheduledAt), quietHours)) {
      continue;
    }

    // Skip if date already had a notification
    if (alreadyScheduledDates.has(item.dateKey)) {
      continue;
    }

    const existing = candidatesByDate.get(item.dateKey) ?? [];
    existing.push(item);
    candidatesByDate.set(item.dateKey, existing);
  }

  const finalSchedule: ScheduledNotificationItem[] = [];

  for (const [_, itemsForDate] of candidatesByDate) {
    if (itemsForDate.length === 0) continue;

    // Sort by priority descending (highest priority first)
    itemsForDate.sort((a, b) => b.priority - a.priority);

    // Pick strictly ONE item per day
    finalSchedule.push(itemsForDate[0]!);
  }

  // Sort chronologically
  finalSchedule.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return finalSchedule;
}
