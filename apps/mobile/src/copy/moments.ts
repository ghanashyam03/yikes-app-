export const momentsCopy = {
  tab: {
    title: 'Moments',
    batteryLabel: 'Social Battery',
    batteryA11y: (level: number) => `Social Battery at ${level}%`,
    segments: {
      upcoming: 'Upcoming',
      past: 'Past',
    },
    recoveryTips: {
      high: 'Battery recharged—great time to connect or take on a stretch moment.',
      mid: 'Thursday is heavy. Keep Friday evening free.',
      low: 'Energy running low. Protect some quiet time today and keep moments low-key.',
      defaultTip: 'Plan small breathing pauses before and after social events.',
    },
    status: {
      prepReady: 'Prep ready',
      needsPrep: 'Needs prep',
      completed: 'Completed',
    },
    card: {
      batteryCost: (cost?: number) => `~${cost ?? 20}% energy cost`,
      prepAction: 'View Prep',
      rehearseAction: 'Rehearse',
      pocketAction: 'Pocket Card',
      debriefChip: 'Debrief ready',
      energyChip: (level?: number) => `Energy: ${level ?? 3}/5`,
    },
    emptyState: {
      title: 'No upcoming moments',
      description: "Add the next conversation you're nervous about. It takes 15 seconds.",
      action: 'Add a Moment',
    },
    pastEmptyState: {
      title: 'No past moments yet',
      description: 'Moments you have prepared or completed will appear here.',
      action: 'Add a Moment',
    },
    floatingAdd: 'Add Moment',
    floatingAddA11y: 'Add a new conversation or event to prepare',
  },

  addSheet: {
    title: 'Add a Moment',
    subtitle: 'Takes 15 seconds to set up your prep',
    fields: {
      typeLabel: 'What is it?',
      types: [
        { id: 'meeting', label: 'Meeting' },
        { id: 'party', label: 'Party' },
        { id: 'call', label: 'Call' },
        { id: 'networking', label: 'Networking' },
        { id: 'one-to-one', label: 'One-to-one' },
        { id: 'other', label: 'Other' },
      ],
      titleLabel: 'Title / Event name',
      titlePlaceholder: 'e.g. 10am sync with Sam, Dinner at Jordan’s',
      attendeesLabel: 'Who will be there?',
      attendeesPlaceholder: 'First names only (optional)',
      dateLabel: 'When is it?',
      datePlaceholder: 'YYYY-MM-DD or pick date',
      formalityLabel: 'How formal?',
      formalityDescription: 'Casual chat (0) to High stakes (10)',
      formalityMinLabel: 'Casual',
      formalityMaxLabel: 'Formal',
      successVisionLabel: 'What would make it go well?',
      successVisionPlaceholder: 'e.g. Ask one good question and leave smoothly before getting drained',
      remindToggle: 'Remind me the evening before',
      remindToggleA11y: 'Toggle reminder for the evening before this moment',
    },
    buttons: {
      saveAndPrep: 'Save and prep',
      addFromCalendar: 'Add from calendar',
      saving: 'Saving…',
      cancel: 'Cancel',
    },
    calendarModal: {
      title: 'Add from calendar',
      rationale:
        'yikes! only checks your calendar right now to help you pick events. Choose only the events you want to prep. We never store or upload your other calendar data.',
      selectEventsTitle: 'Select events to import:',
      importButton: (count: number) => `Import ${count} event${count === 1 ? '' : 's'}`,
      noEvents: 'No upcoming calendar events found in the next 14 days.',
      permissionDenied: 'Calendar access was not granted. You can still add any event by hand in 15 seconds.',
      close: 'Cancel',
    },
    errors: {
      titleRequired: 'Please give this moment a title.',
    },
  },

  prep: {
    title: 'Prep Card',
    subtitle: 'Your calm playbook for this conversation',
    loading: 'Building your pocket prep in your voice…',
    exclusionNotice: {
      title: 'A gentle note from yikes!',
      body:
        'This sounds like a really difficult or heavy situation. yikes! is built for everyday social battery and awkward conversations, not for navigating harm, grief, or trauma. We strongly encourage talking with a trusted person, counselor, or support service who can give you the real care you deserve.',
      backButton: 'Back to moments',
    },
    sections: {
      openers: {
        title: 'Your opener',
        subtitle: 'Two options in your natural voice',
        optionBadge: (idx: number) => `Option ${idx + 1}`,
      },
      questions: {
        title: 'Two questions to ask',
        subtitle: 'Curious, low-pressure follow-ups',
        questionBadge: (idx: number) => `Question ${idx + 1}`,
      },
      exitLine: {
        title: 'Your exit line',
        subtitle: 'A warm, graceful way to wrap up without awkwardness',
      },
      quietBreak: {
        title: 'If it gets draining',
        subtitle: 'A quiet-break idea to recharge during the event',
      },
      recoveryPlan: {
        title: 'Recovery plan',
        subtitle: 'What to protect afterwards to reset your battery',
      },
    },
    actions: {
      regenerate: 'Regenerate line',
      regenerateA11y: (section: string) => `Regenerate ${section} while keeping other edits`,
      edit: 'Edit line',
      editA11y: (section: string) => `Edit text for ${section}`,
      saveEdit: 'Save edit',
      cancelEdit: 'Cancel',
      rehearseButton: 'Rehearse it (2 min)',
      saveToMoment: 'Save to Moment',
      savedToast: 'Prep saved to your Moment.',
      openPocketCard: 'Open Pocket Card',
    },
    errorState: {
      title: 'Could not load prep',
      body: 'We could not reach the prep assistant. Check your connection or use your offline cached prep.',
      retry: 'Retry',
    },
  },

  rehearse: {
    title: 'Rehearsal',
    badge: 'PRACTICE PARTNER',
    partnerSubtitle: (roleOrName: string, momentTitle: string) =>
      `${roleOrName} at "${momentTitle}"`,
    focusGoal: (goal?: string) => `Focus: ${goal || 'Stay curious and keep your exit line ready'}`,
    finishButton: 'Finish rehearsal',
    coachDebrief: {
      title: 'Rehearsal Complete',
      body: 'You kept the conversation natural and carried your moves well. You are ready for the real thing!',
      doneButton: 'Back to Prep',
    },
  },

  pocket: {
    title: 'Pocket Card',
    badge: 'OFFLINE READY · HIGH CONTRAST',
    quickAdvice: 'Glance here whenever you need a calm prompt.',
    openerHeading: 'OPENER',
    questionsHeading: 'QUESTIONS TO ASK',
    exitHeading: 'EXIT LINE',
    quietBreakHeading: 'DRAINING? TAKE A PAUSE',
    recoveryHeading: 'AFTERWARDS',
    doneButton: 'Done, how drained?',
    backToMoments: '← Moments',
    offlineNote: 'Saved locally on your device. Works 100% without internet.',
  },
};
