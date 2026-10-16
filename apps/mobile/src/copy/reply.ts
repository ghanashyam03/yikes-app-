export const replyCopy = {
  header: {
    tag: 'REPLY HELPER',
    title: 'A reply that sounds\nlike you.',
    subtitle: 'We can suggest possibilities, not know what the sender meant.',
    backA11y: 'Back to practice options',
  },
  tabs: {
    paste: 'Paste a message',
    screenshot: 'Upload screenshot',
  },
  pasteMode: {
    label: 'Message to reply to',
    placeholder: 'Paste message text…',
    sample: '“Sounds good, let’s talk later.”',
    clear: 'Clear text',
    clearA11y: 'Clear pasted message',
  },
  screenshotMode: {
    chooseButton: 'Choose screenshot',
    changeButton: 'Change screenshot',
    privacyNote: 'Screenshots are processed in memory and never stored.',
    blurWarningTitle: 'Blur names before sharing',
    blurWarningBody: 'Protect their privacy by covering sender names or numbers before analyzing.',
    blurAction: 'Blur names',
    skipBlurAction: 'Skip & continue',
    unverifiedNotice: 'On-device blurring is a work in progress. Please review before uploading.',
    imageSelectedA11y: 'Screenshot selected',
  },
  fallback: {
    title: 'Vision model unavailable',
    body: 'We couldn’t extract text from this screenshot right now. Try pasting the message text directly.',
    action: 'Switch to paste mode',
  },
  actions: {
    generate: 'Get reply options',
    readingScreenshot: 'Reading screenshot…',
    generating: 'Generating replies…',
    retry: 'Try again',
  },
  readings: {
    title: 'WHAT THEY MAY MEAN',
    disclaimer: "I can't know what they meant",
  },
  replies: {
    title: 'THREE REPLY OPTIONS',
    tones: {
      warm: {
        label: 'WARM',
        description: 'Friendly, empathetic, and approachable.',
      },
      direct: {
        label: 'DIRECT',
        description: 'Clear, concise, and to the point.',
      },
      light: {
        label: 'LIGHT',
        description: 'Casual, breezy, and low-pressure.',
      },
    },
    copyAction: 'Copy',
    copiedFeedback: 'Copied!',
    editAction: 'Edit',
    saveEditAction: 'Done',
    cancelEditAction: 'Cancel',
    copyToneButton: (tone: string) => `Copy ${tone.toLowerCase()} reply`,
  },
  journal: {
    saveButton: 'Save to journal',
    savedFeedback: 'Saved to journal',
    savedToast: 'Reply saved to your Growth Journal',
  },
  caps: {
    title: 'Limit reached',
    description: 'You’ve reached your Reply Helper suggestions limit. Plus members get unlimited suggestions.',
    upgradeButton: 'See Plus options',
  },
  errors: {
    imageTooLarge: 'Image exceeds 4MB. Please pick a smaller image.',
    imageDimensionTooLarge: 'Image dimensions exceed 1280px. Please choose a smaller image.',
    generic: 'Couldn’t generate suggestions. Please try again.',
    safetyBlocked: 'This message cannot be processed due to safety guidelines.',
    crisisDetected: 'If you or someone you know needs support, help is available.',
    supportLink: 'Find support resources',
  },
};
