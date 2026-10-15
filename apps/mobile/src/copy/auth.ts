export const authCopy = {
  welcome: {
    cards: [
      {
        id: 'dread',
        title: 'Conversations you dread, rehearsed in private.',
        subtitle: 'Try things you wouldn\'t risk in real life.'
      },
      {
        id: 'partner',
        title: 'An AI partner that thinks out loud afterwards.',
        subtitle: 'See how your words really landed, without guessing.'
      },
      {
        id: 'steps',
        title: 'Small steps into the real thing.',
        subtitle: 'Quiet confidence built rep by rep at your own pace.'
      }
    ],
    startQuiz: 'Start with a 3-minute quiz',
    alreadyHaveAccount: 'I already have an account'
  },
  signIn: {
    titleSavePlaybook: 'Save your Playbook',
    subtitleSavePlaybook: 'Keep your baseline, scenarios, and progress safely saved.',
    titleWelcomeBack: 'Welcome back',
    subtitleWelcomeBack: 'Sign in to pick up right where you left off.',
    apple: 'Continue with Apple',
    google: 'Continue with Google',
    email: 'Continue with Email',
    phone: 'Continue with Phone',
    passkey: 'Sign in with Passkey',
    notNow: 'Not now',
    guestNotice: 'Guest progress is saved on this device for 7 days.',
    privacyPromise: 'Your practice text is private to you.',
    terms: 'Terms of Service',
    privacy: 'Privacy Notice',
    and: 'and',
    passkeyUnverifiedNote: 'Passkey login is currently in preview.'
  },
  code: {
    emailPhonePrompt: "We'll send a 6-digit code",
    emailPlaceholder: 'you@example.com',
    phonePlaceholder: '+91 98765 43210',
    sendCode: 'Send code',
    enterCodeTitle: 'Enter the 6-digit code',
    codeSentTo: (target: string) => `We sent a 6-digit code to ${target}`,
    resend: 'Resend code',
    resendIn: (seconds: number) => `Resend code in ${seconds}s`,
    wrongCode: (triesLeft: number) =>
      `That code didn't match. ${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left.`,
    lockedOut: (minutes: number, seconds: number) =>
      `Please pause and try again in ${minutes}:${seconds.toString().padStart(2, '0')}.`,
    boxAccessibilityLabel: (index: number) => `Digit ${index + 1} of 6`,
    backAction: 'Go back'
  },
  consent: {
    title: 'Your data, your choice',
    subtitle: 'We believe privacy is built into the product, not buried in legal fine print.',
    required: {
      id: 'required',
      title: 'Required',
      description: 'Essential for your account, session safety, and progress sync.',
      detail:
        'Allows us to store your profile, Playbook progress, and authenticate your device securely.'
    },
    analytics: {
      id: 'analytics',
      title: 'Product analytics',
      description: 'Content-free usage events to see which features help most.',
      detail:
        'Never collects your message text or conversation practice. Only measures feature interaction patterns.'
    },
    improveAi: {
      id: 'improve_ai',
      title: 'Improve the AI',
      description: 'Your practice text, with names removed, used to improve the app.',
      detail:
        'De-identified practice transcripts help make coach feedback more natural. You can withdraw anytime in Settings.'
    },
    marketing: {
      id: 'marketing',
      title: 'Tips and updates',
      description: 'Gentle weekly summaries, product updates, and conversation tips.',
      detail:
        'Occasional emails or notifications to encourage your progress. Zero spam, easy unsubscribe.'
    },
    learnMore: 'Learn more',
    closeSheet: 'Done',
    continue: 'Continue'
  },
  age: {
    title: 'Confirm your birth year',
    subtitle: 'yikes! is tailored for adults. We only verify your age once.',
    privacyNote: 'We never store your birth date or birth year in our database.',
    pickerLabel: 'Birth year picker',
    confirm: 'Confirm',
    under18Title: 'Take care!',
    under18Message: 'yikes! is designed for adults 18 and older. Thank you for checking out yikes!',
    under18Button: 'Understood'
  },
  quietLock: {
    promptReason: 'Unlock yikes! with Face ID or fingerprint',
    unlockButton: 'Unlock with biometrics',
    lockedMessage: 'yikes! is locked to protect your personal reflections.'
  },
  devices: {
    title: 'Signed-in devices',
    thisDevice: 'This device (Active)',
    signOutEverywhere: 'Sign out everywhere',
    confirmSignOutTitle: 'Sign out everywhere?',
    confirmSignOutMessage:
      'This will log you out from all other phones, tablets, and web browsers.'
  },
  passkey: {
    title: 'Sign in with Face ID next time',
    subtitle: 'Set up biometrics for passwordless one-tap sign-in on this device.',
    setUp: 'Set up Face ID',
    maybeLater: 'Maybe later',
    unverifiedNotice: 'Passkey library is not yet linked. Stub preview mode.'
  },
  deleteAccount: {
    buttonLabel: 'Delete account',
    disabledNotice: 'Account deletion is pending the privacy service rollout (T-07).'
  },
  errors: {
    generic: 'Something didn’t quite work. Please try again.',
    network: 'Network connection is unavailable. Please check your signal.',
    invalidEmail: 'Please enter a valid email address.',
    invalidPhone: 'Please enter a valid phone number.',
    otpExpired: 'This code has expired. Please request a new one.',
    lockoutActive: 'Too many tries. Please take a pause and try again in 15 minutes.'
  }
} as const;
