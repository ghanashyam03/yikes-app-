/**
 * notifications.ts — Copy library for notifications and settings
 * 
 * PRODUCT RULES:
 * - Strictly NO guilt language, NO streak threats, NO countdowns.
 * - Must fail if any line contains:
 *   "you missed", "streak", "don't lose", "hurry", "last chance", "only X left"
 * - Zero clinical words: "treat", "cure", "therapy", "diagnose".
 * - Never use red; warm and specific lines only.
 */

export const NOTIFICATIONS_COPY = {
  // Notification Types copy & templates
  rhythmNudge: {
    title: 'yikes!',
    morning: "Morning quiet moment. 3 minutes when you're ready.",
    lunch: 'Midday reset. Take 3 minutes for yourself.',
    evening: 'Unwind with a quick low-pressure chat.',
    generic: 'Your daily practice is ready whenever you are.',
    previewTitle: 'Rhythm nudge',
  },

  momentPrompt: {
    eveningBefore: (title: string) => `Getting ready for ${title} tomorrow? Take a look at your prep.`,
    hourBefore: (title: string) => `1 hour until ${title}. Your pocket card is ready.`,
    halfHourAfter: (title: string) => `How did ${title} go? A quick 30-second check-in.`,
    sampleEvening: 'Getting ready for Team sync tomorrow? Take a look at your prep.',
    sampleHour: '1 hour until Coffee with Alex. Your pocket card is ready.',
    sampleAfter: 'How did Coffee with Alex go? A quick 30-second check-in.',
    previewTitle: 'Moment prompt',
  },

  checkinNudge: {
    title: 'Social battery check-in',
    energy: 'How is your social battery feeling right now?',
    prompt: "Take a breath. A 10-second check-in on how you're doing.",
    previewTitle: 'Check-in nudge',
  },

  reviewDue: {
    title: 'Skill refresh',
    body: (skillName: string) => `Ready for a quick refresh on ${skillName}? Only when you feel like it.`,
    sample: 'Ready for a quick refresh on Graceful exits? Only when you feel like it.',
    previewTitle: 'Review due',
  },

  weeklyLetter: {
    title: 'Weekly Letter',
    body: 'Your Sunday Weekly Letter is ready to read.',
    previewTitle: 'Weekly Letter',
  },

  welcomeBack: {
    title: 'yikes!',
    warm: "Good to see you again. Maya is ready whenever you are.",
    shortWarmup: 'Welcome back! How about an easy 1-minute warm-up?',
    previewTitle: 'Welcome back',
  },

  // Settings Screen D2 copy
  screen: {
    title: 'Notification preferences',
    subtitle: 'We protect your peace of mind. Warm prompts, strictly one a day.',
    maxOneADayBadge: 'Max one a day',
    maxOneADayNote: 'We will never send more than one notification in a day, no matter what.',
    quietHoursTitle: 'Quiet hours',
    quietHoursSubtitle: 'We never notify you during these hours. Rest comes first.',
    reminderWindowTitle: 'Reminder window',
    reminderWindowSubtitle: 'The window when you are open to a single daily prompt.',
    pauseWeekButton: 'Pause everything for a week',
    pauseWeekActive: (untilFormatted: string) => `Notifications paused until ${untilFormatted}`,
    resumeButton: 'Resume notifications',
    pauseWeekSuccessToast: 'All notifications paused for 7 days.',
    resumeSuccessToast: 'Notifications resumed.',
    previewHeader: 'Sample preview',
    toggleOn: 'Enabled',
    toggleOff: 'Muted',
  },

  // Per-type settings labels & descriptions
  types: {
    rhythm_nudge: {
      name: 'Rhythm nudge',
      description: 'A gentle daily practice prompt based on your chosen anchor.',
      samplePreview: "Morning quiet moment. 3 minutes when you're ready.",
    },
    moment_prompt: {
      name: 'Moment prompts',
      description: 'Prep card reminders before real conversations, debriefs after.',
      samplePreview: '1 hour until Team sync. Your pocket card is ready.',
    },
    checkin_nudge: {
      name: 'Check-in nudges',
      description: 'Quick social battery check-ins to notice your energy.',
      samplePreview: 'How is your social battery feeling right now?',
    },
    review_due: {
      name: 'Review due',
      description: 'A calm nudge when a skill has gone 14 days without practice.',
      samplePreview: 'Ready for a quick refresh on Graceful exits? Only when you feel like it.',
    },
    weekly_letter: {
      name: 'Weekly Letter',
      description: 'Your Sunday reflection and highlights from the week.',
      samplePreview: 'Your Sunday Weekly Letter is ready to read.',
    },
  },

  // Just-in-time permission flow copy
  permissionModal: {
    tag: 'Notification preview',
    headline: 'Thoughtful, gentle reminders',
    body: "Here is what a reminder from yikes! looks like. We send at most one per day and always respect your quiet hours.",
    sampleTimestamp: 'Tomorrow at 8:30 PM',
    allowButton: 'Enable notifications',
    dismissButton: 'Maybe later',
    deniedNotice: 'Notifications are turned off in device settings. You can re-enable them anytime in system settings.',
  },
} as const;
