/**
 * types.ts — Types and contracts for notification engine
 */

export type NotificationType =
  | 'rhythm_nudge'
  | 'moment_prompt'
  | 'checkin_nudge'
  | 'review_due'
  | 'weekly_letter'
  | 'welcome_back';

export type NotificationToggles = {
  rhythm_nudge: boolean;
  moment_prompt: boolean;
  checkin_nudge: boolean;
  review_due: boolean;
  weekly_letter: boolean;
  welcome_back: boolean;
};

export interface QuietHours {
  /** Format "HH:mm" in 24-hour time (e.g. "22:00") */
  start: string;
  /** Format "HH:mm" in 24-hour time (e.g. "08:00") */
  end: string;
}

export interface ReminderWindow {
  /** Format "HH:mm" in 24-hour time (e.g. "09:00") */
  start: string;
  /** Format "HH:mm" in 24-hour time (e.g. "21:00") */
  end: string;
}

export interface ScheduledNotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO 8601 string representation of exact trigger time */
  scheduledAt: string;
  /** Calendar date key in user timezone "YYYY-MM-DD" */
  dateKey: string;
  /** Priority integer (higher wins when multiple fall on the same day) */
  priority: number;
  data?: Record<string, unknown>;
}

export type MomentPromptTiming = 'evening_before' | 'hour_before' | 'half_hour_after';

export interface UpcomingMoment {
  id: string;
  title: string;
  scheduledAt: string | Date;
  personName?: string;
}

export interface ReviewDueSkill {
  skillKey: string;
  skillName: string;
  lastPracticedAt: string | Date;
}

export interface UserActivity {
  lastActiveAt: string | Date;
  lastWelcomeBackSentAt?: string | Date | null;
}

export interface RhythmAnchor {
  timeOfDay: 'morning' | 'lunch' | 'evening';
  preferredHour?: number;
  preferredMinute?: number;
}

export interface PlanNotificationsState {
  /** Current reference timestamp */
  now: string | Date;
  /** Per-type toggles */
  toggles?: Partial<NotificationToggles>;
  /** Quiet hours (default: 22:00 -> 08:00) */
  quietHours: QuietHours;
  /** Allowed reminder window (default: 09:00 -> 21:00) */
  reminderWindow?: ReminderWindow;
  /** Paused until timestamp (pause week) */
  pausedUntil?: string | Date | null;
  /** User activity tracking for welcome-back logic */
  userActivity?: UserActivity;
  /** Upcoming moments */
  upcomingMoments?: UpcomingMoment[];
  /** Skills with no practice for 14+ days */
  reviewDueSkills?: ReviewDueSkill[];
  /** User's rhythm anchor */
  rhythmAnchor?: RhythmAnchor;
  /** Sunday weekly letter ready flag */
  weeklyLetterDue?: boolean;
  /** Daily energy/battery check-in due */
  checkinDue?: boolean;
  /** Dates (YYYY-MM-DD) that already received/scheduled a notification */
  alreadyScheduledDates?: string[];
  /** How many days ahead to plan (default: 7) */
  planningDaysAhead?: number;
}
