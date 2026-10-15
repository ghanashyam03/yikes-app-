export const onboardingCopy = {
  intro: {
    eyebrow: 'YOUR PERSONAL STARTING POINT',
    headline: "Let's build your\nPlaybook.",
    subtitle: 'About three minutes. Every answer changes something you can see.',
    tiles: {
      pace: {
        title: 'YOUR PACE',
        description: 'A practice rhythm that respects how you think and talk.'
      },
      firstSteps: {
        title: 'YOUR FIRST STEPS',
        description: 'Small, realistic reps picked for your world.'
      },
      coach: {
        title: 'YOUR COACH',
        description: 'Feedback in a voice you can hear.'
      },
      privacy: {
        title: 'PRIVATE BY DEFAULT',
        description: 'Nothing is shared unless you opt in.'
      }
    },
    beginButton: 'Begin',
    skipButton: 'Skip, use defaults'
  },
  quiz: {
    backButtonLabel: 'Go back to previous step',
    nextButton: 'Next',
    skipButton: 'Skip',
    changeLaterNote: 'You can change this later in your Playbook.',
    progressText: (current: number, total: number) => `Question ${current} of ${total}`,
    momentForm: {
      typePrompt: 'Select event type',
      whatLabel: 'What is happening?',
      whatPlaceholder: 'e.g. Q4 Planning sync, Friend dinner',
      whenLabel: 'When is it?',
      whenPlaceholder: 'e.g. Thursday 2:00 PM, Tomorrow evening'
    },
    customAnchor: {
      placeholder: 'e.g. Morning coffee, Commute, Lunch',
      label: 'Your daily routine anchor'
    }
  },
  deeper: {
    eyebrow: 'OPTIONAL · 2 MINUTES',
    headline: 'Want to go a little\ndeeper?',
    subtitle: 'Eight short statements tune starting difficulty. This never becomes a personality label.',
    progressText: (current: number, total: number) => `STATEMENT ${current} OF ${total}`,
    promptText: 'How much does this sound like you?',
    minLabel: 'Strongly disagree',
    maxLabel: 'Strongly agree',
    continueButton: 'Continue',
    skipButton: 'Skip for now'
  },
  playbook: {
    eyebrow: 'MADE FOR YOU',
    headline: 'Your Playbook',
    subtitle: 'A starting point, not a label. Edit any part whenever you like.',
    readyBadge: 'Your first session is ready',
    saveButton: 'Save my Playbook',
    editButtonLabel: (tileName: string) => `Edit ${tileName}`,
    tiles: {
      pace: 'YOUR PACE',
      battery: 'YOUR BATTERY',
      hardestPlaces: 'HARDEST PLACES',
      firstSteps: 'FIRST STEPS',
      coach: 'YOUR COACH'
    },
    editModal: {
      title: 'Edit Playbook Entry',
      doneButton: 'Done',
      cancelButton: 'Cancel'
    }
  }
} as const;
