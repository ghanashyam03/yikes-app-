/**
 * User-facing copy for Settings screens and preference controls.
 * Strictly adheres to tone guidelines: warm, candid, zero clinical claims.
 */

export const settingsCopy = {
  header: {
    title: 'Settings',
    searchPlaceholder: 'Search settings...',
    noResults: 'No settings match your search.',
  },
  sections: {
    playbook: {
      id: 'playbook',
      title: 'Playbook',
      subtitle: 'Review and update your core communication answers.',
      badge: 'Profile',
    },
    coach: {
      id: 'coach',
      title: 'Coach & tone',
      subtitle: 'Customize how Maya guides your conversations.',
      tones: {
        gentle: {
          label: 'Gentle',
          description: 'Warm, encouraging, and unhurried reflections.',
        },
        straight: {
          label: 'Direct',
          description: 'Clear, concise, and to-the-point feedback.',
        },
        funny: {
          label: 'Playful',
          description: 'Lighthearted perspective with gentle humour.',
        },
      },
    },
    rhythm: {
      id: 'rhythm',
      title: 'Practice rhythm',
      subtitle: 'Set your pace and optional streak tracking.',
      weeklyGoalLabel: 'Weekly practice target',
      weeklyGoalFormat: (goal: number) => `${goal} sessions per week`,
      streakToggle: {
        title: 'Count consecutive days (Streak)',
        description: 'Track ongoing streaks. Off by default—practice at your own pace.',
      },
      pauseToggle: {
        title: 'Pause for a busy week',
        description: 'Freeze your goals and reminders. Pick up whenever life calms down.',
      },
    },
    reminders: {
      id: 'reminders',
      title: 'Reminders & nudges',
      subtitle: 'Quiet hours, morning anchors, and one-a-day max notifications.',
    },
    appearance: {
      id: 'appearance',
      title: 'Appearance',
      subtitle: 'Theme, text sizing, haptics, and sensory preferences.',
      themeOptions: {
        auto: 'System default',
        light: 'Daylight',
        dark: 'Midnight',
      },
      textScaleLabel: 'Text size multiplier',
      reducedMotion: {
        title: 'Reduced motion override',
        description: 'Turn off drifting ambient backgrounds and bouncy springs.',
      },
      haptics: {
        title: 'Haptic feedback',
        description: 'Gentle tactile taps during taps, sliders, and completions.',
      },
      sound: {
        title: 'Sound effects',
        description: 'Soft chime when finishing a rehearsal or milestone.',
      },
    },
    quietLock: {
      id: 'quiet-lock',
      title: 'Quiet Lock',
      subtitle: 'Require Face ID or passcode when switching back to yikes!.',
      toggleLabel: 'Enable Quiet Lock',
    },
    account: {
      id: 'account',
      title: 'Account',
      subtitle: 'Email, linked phone, devices, and passkeys.',
    },
    privacy: {
      id: 'privacy',
      title: 'Privacy centre',
      subtitle: 'Manage your consent, export your history, or delete text.',
    },
    subscription: {
      id: 'subscription',
      title: 'Subscription',
      subtitle: 'Review your plan, Plus features, and billing details.',
    },
    help: {
      id: 'help',
      title: 'Help & feedback',
      subtitle: 'FAQs, contact our human team, or report a bad AI answer.',
    },
    aboutAi: {
      id: 'about-ai',
      title: 'About the AI',
      subtitle: 'Transparency, character boundaries, and safety disclosures.',
    },
  },
  help: {
    title: 'Help & feedback',
    subtitle: 'Answers to common questions or reach out to human support.',
    searchPlaceholder: 'Search help articles...',
    faqs: [
      {
        question: 'How does yikes! practice work?',
        answer:
          'yikes! gives you a low-stakes simulator to rehearse awkward, intimidating, or everyday conversations. You can try multiple approaches, explore different tones with Maya, and build social confidence step by step.',
      },
      {
        question: 'Are my practice sessions private?',
        answer:
          'Yes. Your conversation text is encrypted in transit and at rest. We never sell your data, and we do not use your conversations to train general AI models unless you explicitly opt in under the Privacy Centre.',
      },
      {
        question: 'What is a Moment?',
        answer:
          'A Moment is an upcoming or past conversation in your real life—like asking for a raise, boundary setting, or making small talk. You can prep for it, rehearse it with an AI partner, and keep pocket cards on hand.',
      },
      {
        question: 'Can I practice offline?',
        answer:
          'Your previously loaded cards, saved Moments, and local notes work completely offline. Live AI partner chat reconnects automatically once your internet returns.',
      },
      {
        question: 'How do I cancel my Plus subscription?',
        answer:
          'You can manage or cancel your subscription at any time with one tap from Settings > Subscription or directly via your App Store / Play Store account.',
      },
    ],
    contact: {
      title: 'Send a message to our team',
      description: 'Have a feature request, bug report, or thoughtful question? We read every note.',
      namePlaceholder: 'Your name (optional)',
      emailPlaceholder: 'Your email address',
      messagePlaceholder: 'How can we help?',
      sendButton: 'Send message',
      sendingButton: 'Sending...',
      successToast: 'Thank you! Your message was sent. We will get back to you soon.',
      errorToast: "Couldn't send your message. Please check your connection and try again.",
    },
    reportSection: {
      title: 'Report a bad AI answer',
      description: 'Did an AI answer feel unfair, unnatural, or unhelpful? Tell us so we can fix it.',
      buttonLabel: 'Report an AI answer',
    },
  },
  aboutAi: {
    title: 'About the AI',
    subtitle: 'How artificial intelligence works in yikes!, what it can and cannot do, and our safety commitments.',
    sections: [
      {
        title: 'Which parts use AI?',
        body: 'Interactive conversation partners (such as Maya, Alex, and Jordan), coaching suggestions, and session reflection debriefs use large language models. Curated guides, step exercises, and emergency safety resources are written entirely by humans.',
      },
      {
        title: 'Characters are not real people',
        body: 'Every conversational partner in yikes! is a synthetic AI persona created for rehearsal. They do not have personal feelings, subjective memories outside your current session, or private lives. They are designed to provide a kind, responsive sounding board.',
      },
      {
        title: 'What the Coach can and cannot do',
        body: 'Maya is built to help you explore phrasing options, spot conversation blind spots, and practice delivery before high-stakes moments. Maya cannot make life decisions for you, predict exact human responses in the real world, or provide professional advice.',
      },
      {
        title: 'Not therapy or healthcare',
        body: 'yikes! is a self-guided communication practice tool for everyday social confidence. It is not healthcare, medical advice, psychotherapy, diagnosis, or crisis support. If you are experiencing acute distress, please use our Support screen to reach certified human helplines.',
      },
      {
        title: 'Your privacy & model training',
        body: 'We strictly protect your practice space. Your practice text is never sold. AI training on your conversational text is completely disabled by default and only occurs if you explicitly turn on AI Improvement Consent in the Privacy Centre.',
      },
    ],
  },
  reportModal: {
    title: 'Tell us about a bad answer',
    subtitle: 'Your report goes directly to our safety and quality team to tune our system prompts.',
    targetLabel: 'Offending answer:',
    consentLabel: 'Attach message text to this report',
    consentHint: 'If unchecked, only an anonymous message identifier will be submitted.',
    notesPlaceholder: 'What felt off about this answer? (optional)',
    submitButton: 'Submit report',
    submittingButton: 'Submitting...',
    cancelButton: 'Cancel',
    successToast: 'Thank you. Your feedback has been recorded.',
    errorToast: "Couldn't submit feedback. Please try again.",
  },
} as const;
