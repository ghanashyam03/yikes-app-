export const privacyCopy = {
  header: {
    title: 'Privacy centre',
    subtitle:
      'You own your practice data. We collect only what is needed to make practice feel personal.',
    backLabel: 'Back to settings',
  },
  consents: {
    sectionTitle: 'Your consents',
    sectionSubtitle: 'Choose how your data is used. Change these at any time.',
    required: {
      id: 'required',
      title: 'Required account data',
      description: 'Stores your profile and Playbook to sync your progress securely.',
      alwaysActiveBadge: 'Always on',
      plainDetail:
        'Essential for your account, session safety, and progress sync across devices.',
    },
    analytics: {
      id: 'analytics',
      title: 'Product analytics',
      description:
        'Content-free usage counts to see which features help most. Never includes message text.',
      plainDetail:
        'Tracks button taps and screen visits without collecting any conversation content.',
    },
    improveAi: {
      id: 'improve_ai',
      title: 'Improve the AI models',
      description:
        'Your practice conversations, with all personal identifiers removed, used to refine coaching.',
      plainDetail:
        'Helps our practice partners and coach give more natural responses. You can withdraw anytime.',
    },
    marketing: {
      id: 'marketing',
      title: 'Tips and updates',
      description:
        'Occasional gentle summaries and product updates. Easy one-tap unsubscribe.',
      plainDetail:
        'Quiet weekly encouragement and notifications about new practice sessions.',
    },
    toggleAccessibility: (name: string, active: boolean) =>
      `${name} consent toggle, currently ${active ? 'enabled' : 'disabled'}`,
  },
  export: {
    sectionTitle: 'Download your data',
    sectionSubtitle:
      'Generate a portable JSON archive of all your conversations, reflections, and account data.',
    buttonLabel: 'Download my data',
    requesting: 'Preparing your export...',
    readyTitle: 'Export ready to download',
    readyDescription:
      'Your download link is valid for 24 hours. The file is saved directly to your device.',
    downloadButton: 'Download file',
    expiresIn: (hours: number) => `Link valid for ${hours} hours`,
    expiredNotice:
      'This export link has expired after 24 hours. You can request a fresh export anytime.',
    successToast: 'Data export downloaded successfully.',
  },
  deleteText: {
    sectionTitle: 'Delete practice text',
    sectionSubtitle:
      'Remove all message content, conversation transcripts, and journal reflections.',
    buttonLabel: 'Delete my practice text',
    modalTitle: 'Delete all practice text?',
    modalExplanation:
      'This permanently clears all dialogue turns, partner transcripts, and written reflections from our servers.',
    keptGuarantee:
      'What stays: Your skills progress, stage levels, and session counts remain completely intact.',
    confirmButton: 'Yes, clear practice text',
    cancelButton: 'Keep my text',
    deleting: 'Clearing practice text...',
    successToast:
      'Practice text has been cleared. Your skills and progress are preserved.',
  },
  deleteAccount: {
    sectionTitle: 'Delete account',
    sectionSubtitle:
      'Permanently delete your entire account, profile, and all saved progress.',
    buttonLabel: 'Delete my account',
    modalTitle: 'Delete your yikes! account?',
    notice30Days:
      'This action is permanent and cannot be undone. All your progress, Playbook, and profile data will be permanently wiped.',
    otpPrompt:
      'Please enter the 6-digit verification code sent to your email or phone to confirm.',
    otpPlaceholder: '6-digit code',
    confirmButton: 'Permanently delete account',
    cancelButton: 'Cancel',
    deleting: 'Deleting account...',
    successToast: 'Your account has been deleted.',
  },
  disclaimer: {
    title: 'Model training disclaimer',
    text:
      'Already-trained models cannot be untrained. When you withdraw consent or delete your text, your conversations are immediately and permanently excluded from all future model training and fine-tuning.',
  },
  errors: {
    generic: 'Something didn’t quite work. Please check your signal and try again.',
    otpInvalid: 'The verification code didn’t match. Please enter the latest 6-digit code.',
    exportFailed: 'Could not generate data export. Please try again in a few moments.',
    deleteTextFailed: 'Could not delete practice text. Please try again.',
    deleteAccountFailed: 'Account deletion failed. Please check the code and try again.',
  },
} as const;
