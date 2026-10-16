export const letterCopy = {
  header: {
    title: 'Weekly Letter',
    subtitle: 'From your practice coach',
    backLabel: 'Back to practice',
    aiLabel: 'AI Coach Reflection',
  },
  sections: {
    patternNoticedTitle: 'One pattern noticed',
    focusNextTitle: 'Focus for next week',
    planButtonLabel: 'Plan it',
  },
  optOut: {
    title: 'Turn off weekly letters',
    description: 'You can pause Sunday evening letters anytime. Your regular practice stays the same.',
    toggleLabel: 'Toggle weekly letters',
    optedOutNotice: 'Weekly letters are currently turned off. Toggle to turn them back on.',
  },
  states: {
    loading: 'Reading this week’s practice...',
    emptyTitle: 'No letter yet',
    emptyMessage: 'Your first weekly letter will arrive on Sunday evening after you complete practice sessions or real-world moments.',
    errorTitle: 'Couldn’t open your letter',
    errorMessage: 'We couldn’t reach the coach letter right now. Please check your connection and try again.',
    offlineBanner: 'You’re offline. Showing the latest saved letter.',
    retryButton: 'Try again',
  },
  voiceMatch: {
    consentTitle: 'Voice Match',
    consentDescription: 'Summarizes your authentic speaking cadence from practice so suggestions sound like you.',
    analyzing: 'Analyzing speaking style...',
    readyTitle: 'Voice profile updated',
  },
} as const;
