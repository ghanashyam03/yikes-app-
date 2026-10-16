/**
 * System state copy across mobile applications.
 *
 * Rules:
 * 1. ZERO CLINICAL CLAIMS: Never use diagnose, treat, therapy, cure, or clinical terms.
 * 2. ZERO RED: Visuals and copy lean into warm Honey amber and serene Midnight/Daylight tones.
 * 3. ZERO GUILT: Never shame users for missing days or resetting rhythm.
 * 4. SUPPORT SCREEN COPY IS 100% HUMAN AUTHORED: No generative text anywhere.
 */

export interface CrisisHelpline {
  id: string;
  name: string;
  country: string;
  description: string;
  phone?: string;
  phoneDisplay?: string;
  sms?: string;
  smsDisplay?: string;
  smsBody?: string;
  hours: string;
  confidential: boolean;
  website?: string;
}

export const CRISIS_RESOURCES: CrisisHelpline[] = [
  {
    id: 'india-telemanas',
    name: 'Tele-MANAS',
    country: 'India',
    description: 'National Tele Mental Health Programme (Ministry of Health & Family Welfare)',
    phone: '14416',
    phoneDisplay: '14416',
    hours: '24/7 Toll-Free, Multilingual',
    confidential: true,
    website: 'https://telemanas.mohfw.gov.in',
  },
  {
    id: 'india-vandrevala',
    name: 'Vandrevala Foundation',
    country: 'India',
    description: 'Free mental wellness counselling & WhatsApp helpline',
    phone: '+919999666555',
    phoneDisplay: '+91 9999 666 555',
    hours: '24/7 Free & Confidential',
    confidential: true,
    website: 'https://www.vandrevalafoundation.com',
  },
  {
    id: 'us-988',
    name: '988 Suicide & Crisis Lifeline',
    country: 'United States',
    description: 'Free, confidential crisis counseling via call or text',
    phone: '988',
    phoneDisplay: '988',
    sms: '988',
    smsDisplay: 'Text 988',
    hours: '24/7 Free & Confidential',
    confidential: true,
    website: 'https://988lifeline.org',
  },
  {
    id: 'us-crisistextline',
    name: 'Crisis Text Line',
    country: 'United States',
    description: 'Connect with a crisis counselor over text message',
    sms: '741741',
    smsDisplay: 'Text HOME to 741741',
    smsBody: 'HOME',
    hours: '24/7 Free & Confidential',
    confidential: true,
    website: 'https://www.crisistextline.org',
  },
  {
    id: 'uk-samaritans',
    name: 'Samaritans',
    country: 'United Kingdom',
    description: 'Round-the-clock emotional support across the UK',
    phone: '116123',
    phoneDisplay: '116 123',
    hours: '24/7 Free from any phone',
    confidential: true,
    website: 'https://www.samaritans.org',
  },
  {
    id: 'uk-shout',
    name: 'Shout 85258',
    country: 'United Kingdom',
    description: 'Free, confidential, 24/7 text support service',
    sms: '85258',
    smsDisplay: 'Text SHOUT to 85258',
    smsBody: 'SHOUT',
    hours: '24/7 Free on major networks',
    confidential: true,
    website: 'https://giveusashout.org',
  },
];

export const systemCopy = {
  support: {
    title: "It sounds like things are really heavy right now. You're not alone.",
    subtitle:
      'Practice is paused. When feelings get overwhelming, talking with someone who knows how to listen can make a real difference. Free, confidential support is available 24/7.',
    localePickerLabel: 'Region',
    primaryCallButton: (name: string, phone: string) => `Call ${name} (${phone})`,
    primaryTextButton: (name: string, sms: string) => `Text ${name} (${sms})`,
    contactTrustedButton: 'Contact someone you trust',
    shareSheetMessage:
      "Hey, things feel pretty heavy right now and I could use a listening ear. Can we talk?",
    backToPracticeButton: "Back to practice when you're ready",
    internationalNotice:
      'Outside these regions? You can find immediate crisis support worldwide at findahelpline.com.',
    internationalUrl: 'https://findahelpline.com',
  },

  offline: {
    banner: "You're offline. Previously loaded content and Moments are still available.",
    cardTitle: 'Reconnect to chat with Maya',
    cardBody:
      'Live AI coaching and interactive chats need an active connection. Your local notes and pocket cards remain ready.',
    retryAction: 'Check connection',
  },

  busy: {
    title: 'Maya is taking a moment',
    subtitle: 'Simulations can take a few seconds during busy periods.',
    fallbackMessage:
      'Maya is taking a bit longer than usual. You can try our backup model, switch to a scripted version, or come back in a minute.',
    retryBackupAction: 'Try backup model',
    switchScriptedAction: 'Switch to scripted session',
    waitAction: 'Wait a moment',
  },

  dailyLimit: {
    title: "You've had a full day of practice",
    subtitle:
      'Rest is part of the process. Come back tomorrow, or switch to a scripted session to keep exploring.',
    switchScriptedAction: 'Explore scripted sessions',
    learnPlusAction: 'Learn about Plus',
  },

  welcomeBack: {
    title: 'Good to see you',
    subtitle: 'Want a one-minute warm-up?',
    subtext: 'Your rhythm is reset and ready whenever you are.',
    startWarmupAction: 'Start warm-up',
    maybeLaterAction: 'Maybe later',
  },

  emptyStates: {
    moments: {
      title: 'No Moments saved yet',
      description: 'Capture an upcoming conversation you want to prepare for or a past one to reflect on.',
      actionLabel: 'Create a Moment',
    },
    journal: {
      title: 'Your journal is quiet',
      description: "Jot down a quick thought, communication win, or social observation whenever you're ready.",
      actionLabel: 'Write first entry',
    },
    gap: {
      title: 'The Gap Game is waiting',
      description: "Practice spotting the difference between what's spoken and what's really meant.",
      actionLabel: 'Play a round',
    },
    ladder: {
      title: 'Your comfort ladder is open',
      description: 'Add small, progressive social steps to try at your own pace without pressure.',
      actionLabel: 'Add first step',
    },
    history: {
      title: 'No practice history yet',
      description: 'Your completed sessions, reflections, and insights will gather here as you practice.',
      actionLabel: 'Start practice',
    },
  },

  errorBoundary: {
    title: "Couldn't save that. Try again.",
    description: "Something didn't go quite right on our side. We didn't lose your progress.",
    retryAction: 'Try again',
    goBackAction: 'Go back',
  },
} as const;
