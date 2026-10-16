export const sessionCopy = {
  beats: {
    idea: 'Idea',
    watch: 'Watch',
    read: 'Read',
    try: 'Try',
    coach: 'Coach',
    out_there: 'Out there',
    complete: 'Complete',
  },
  idea: {
    header: 'The move',
    whyWorksToggle: 'Why this works',
    whyWorksCollapse: 'Hide explanation',
    nextButton: 'Next',
    skipButton: 'Skip',
  },
  watch: {
    header: 'Watch the move',
    instruction: 'Tap the line where the move happens',
    correctFeedback: "That's it!",
    wrongFeedback: 'Close. Look at the question',
    showMeButton: 'Show me',
    revealedNote: 'The move happens right here:',
    nextButton: 'Next',
    skipButton: 'Skip',
  },
  read: {
    header: 'Read the room',
    questionPrefix: 'What is ',
    questionSuffix: ' thinking right now?',
    choosePrompt: 'Pick the thought that matches the signals:',
    trueThoughtHeader: 'Honest inner thought',
    cueHeader: 'What tipped you off',
    disclaimer: 'Different people, different signals',
    disclaimerNote: 'This is one character’s thoughts, not a universal rule for everyone.',
    nextButton: 'Next to Try',
    skipButton: 'Skip',
  },
  navigation: {
    back: 'Back',
    pause: 'Pause session',
    resume: 'Resume session',
    saveAndExit: 'Save & exit',
  },
} as const;

export type SessionCopy = typeof sessionCopy;
