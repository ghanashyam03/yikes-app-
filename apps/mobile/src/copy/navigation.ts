export interface RouteCopy {
  title: string;
  subtitle?: string;
}

export const navigationCopy = {
  notBuiltYet: 'Not built yet',
  notBuiltYetSubtitle: 'This space is being crafted with calm care. Coming soon.',
  backButton: {
    accessibilityLabel: 'Go back'
  },
  tabs: {
    today: {
      label: 'Today',
      accessibilityLabel: 'Today tab, your daily practice and rhythm'
    },
    path: {
      label: 'Path',
      accessibilityLabel: 'Path tab, your map of conversation skills'
    },
    moments: {
      label: 'Moments',
      accessibilityLabel: 'Moments tab, upcoming real conversations and debriefs'
    },
    you: {
      label: 'You',
      accessibilityLabel: 'You tab, your progress, playbook and growth journal'
    }
  },
  practiceButton: {
    label: 'Practice',
    accessibilityLabel: 'Start practice',
    accessibilityHint: 'Opens practice options modal'
  },
  routes: {
    // Auth
    authWelcome: { title: 'Welcome to yikes!' },
    authSignIn: { title: 'Sign In' },
    authCode: { title: 'Enter Verification Code' },
    authConsent: { title: 'Privacy & Permissions' },
    authAge: { title: 'Age Confirmation' },

    // Onboarding
    onboardingIntro: { title: "Let's build your Playbook" },
    onboardingQuiz: { title: 'Playbook Quiz' },
    onboardingDeeper: { title: 'Go Deeper' },
    onboardingWarmup: { title: 'Warm-up Chat' },
    onboardingCoachRead: { title: "Coach's First Read" },
    onboardingPlaybook: { title: 'Your Playbook' },

    // Tabs
    tabToday: { title: 'Today' },
    tabPath: { title: 'Path' },
    tabMoments: { title: 'Moments' },
    tabYou: { title: 'You' },

    // Modals
    practice: { title: 'Practice Sheet' },
    support: { title: 'Support & Helplines' },
    paywall: { title: 'yikes! Plus' },

    // Session player
    sessionIdea: { title: 'The Idea' },
    sessionWatch: { title: 'Watch the Move' },
    sessionRead: { title: 'Read the Room' },
    sessionTry: { title: 'Try It Out' },
    sessionCoach: { title: 'Coach Feedback' },
    sessionInnerVoice: { title: 'Inner Voice Reveal' },
    sessionOutThere: { title: 'Take It Out There' },
    sessionComplete: { title: 'Session Complete' },

    // Moments
    momentsNew: { title: 'Add a Moment' },
    momentsPrep: { title: 'Prep for Moment' },
    momentsRehearse: { title: 'Rehearsal Chat' },
    momentsPocket: { title: 'Pocket Card' },

    // Energy & Check-ins
    energy: { title: 'Social Battery Check-in' },
    checkin: { title: 'Micro-rep Check-in' },
    debrief: { title: 'Debrief Chat' },

    // AI Tools
    toolsFreeChat: { title: 'Free Chat' },
    toolsReplyHelper: { title: 'Reply Helper' },

    // Progress & Detail
    journal: { title: 'Growth Journal' },
    letter: { title: 'Weekly Letter' },
    skill: { title: 'Skill Detail' },
    gap: { title: 'The Gap Game' },
    battery: { title: 'Battery Patterns' },
    ladder: { title: 'Quiet Ladder' },

    // Settings
    settingsIndex: { title: 'Settings' },
    settingsNotifications: { title: 'Notification Preferences' },
    settingsPrivacy: { title: 'Privacy Centre' },
    settingsSubscription: { title: 'Subscription' },
    settingsHelp: { title: 'Help & Feedback' },
    settingsAboutAi: { title: 'About the AI' }
  }
} as const;

export type RouteKey = keyof typeof navigationCopy.routes;
