export const componentsCopy = {
  retryButton: 'Retry',
  batteryIncrementAction: 'Increase battery level by 10%',
  batteryDecrementAction: 'Decrease battery level by 10%',
  rhythmProgress: (filled: number, total: number) => `${filled} of ${total} sessions`,
  slider: {
    unselectedText: 'Slide to rate',
    unselectedAccessibilityValue: 'Not set',
    accessibilityHint: 'Adjust value with swipe or volume gestures',
    stepLabel: (value: number) => `Rating: ${value}`,
    actionIncrement: 'Increment rating',
    actionDecrement: 'Decrement rating',
    minLabel: 'Min',
    maxLabel: 'Max'
  },
  batteryGauge: {
    accessibilityLabel: 'Social Battery gauge',
    levelLabel: (pct: number) => `Social battery at ${pct}%`,
    dragHint: 'Drag vertically to adjust battery level',
    highEnergyLabel: 'Energised and open',
    midEnergyLabel: 'Steady and balanced',
    lowEnergyLabel: 'Running on reserve',
    batteryIncrementAction: 'Increase battery level by 10%',
    batteryDecrementAction: 'Decrease battery level by 10%'
  },
  rhythmRing: {
    accessibilityLabel: (filled: number, total: number) =>
      `Weekly Rhythm: ${filled} of ${total} sessions completed`,
    sparkleLabel: 'Rhythm milestone sparkle',
    completedBadge: 'Week goal reached',
    rhythmProgress: (filled: number, total: number) => `${filled} of ${total} sessions`
  },
  chatBubble: {
    userSender: 'You',
    partnerSender: 'Partner',
    thoughtSender: 'Inner thought',
    loadingText: 'Composing reply...'
  },
  typingDots: {
    accessibilityLabel: (name?: string) =>
      name ? `${name} is typing...` : 'Partner is typing...',
    liveRegionHint: 'Partner is replying'
  },
  characterAvatar: {
    defaultLabel: (character: string, expression: string) =>
      `${character} avatar looking ${expression}`,
    expressions: {
      neutral: 'neutral',
      warm: 'warm and attentive',
      distracted: 'distracted or thoughtful',
      wrapping_up: 'wrapping up the conversation'
    }
  },
  winceMascot: {
    name: 'Wince',
    accessibilityLabel: (pose: string) => `Wince mascot in ${pose} pose`,
    poses: {
      curious: 'curious with head tilted',
      sleepy: 'sleepy and calm',
      thinking: 'thinking with a gentle squint',
      proud: 'proud with a soft smile',
      peeking: 'peeking shyly from the edge',
      offline: 'offline resting gently'
    }
  },
  bottomSheet: {
    closeAction: 'Close sheet',
    dragHandleLabel: 'Drag handle to dismiss bottom sheet',
    accessibilityHint: 'Swipe down to dismiss'
  },
  skeleton: {
    accessibilityLabel: 'Loading content...',
    busyAnnouncement: 'Content is loading'
  },
  evidenceLine: {
    accessibilityLabel: (quote: string) => `Highlighted evidence: ${quote}`,
    highlighterLabel: 'Mint highlighted key phrase'
  },
  thoughtBubble: {
    accessibilityLabel: (thought: string) => `Drifting thought: ${thought}`,
    accessibilityHint: 'Tap to pop and reveal thought note',
    popSoundLabel: 'Thought popped'
  },
  emptyState: {
    defaultTitle: 'Nothing here yet',
    defaultDescription: 'Take your time. When you are ready, start your first practice.',
    defaultAction: 'Get started'
  },
  errorBubble: {
    accessibilityLabel: (msg: string) => `Notice: ${msg}`,
    defaultTitle: 'Something went sideways',
    dismissAction: 'Dismiss notice',
    retryButton: 'Retry'
  },
  toast: {
    accessibilityLabel: (msg: string) => `Notification: ${msg}`,
    dismissAction: 'Dismiss notification'
  },
  gallery: {
    title: 'Interactive Components Gallery',
    subtitle: '14 Soft Pop interactive components in Daylight & Midnight modes',
    appearanceLabel: 'Appearance Mode:',
    reducedMotionLabel: 'Simulate Reduced Motion:',
    resetAll: 'Reset Demo States',
    sections: {
      slider: '1. NoDefaultSlider (Null until touched)',
      battery: '2. BatteryGauge (Liquid wave, Mint/Honey/Ember)',
      rhythm: '3. RhythmRing (Weekly progress & sparkle)',
      chat: '4. ChatBubble (User, Partner, Dashed Thought)',
      typing: '5. TypingDots (UI thread wobble worklet)',
      avatar: '6. CharacterAvatar (4 SVG expressions & palettes)',
      mascot: '7. WinceMascot (6 SVG poses with squish)',
      bottomSheet: '8. BottomSheet (Glass backdrop & spring physics)',
      skeleton: '9. Skeleton (Shimmering bubble shapes)',
      evidence: '10. EvidenceLine (Tilted sticker & highlighter)',
      thought: '11. ThoughtBubble (Float wobble & tap pop)',
      empty: '12. EmptyState (Mascot illustration & action)',
      error: '13. ErrorBubble (Honey background shake, NEVER RED)',
      toast: '14. Toast (Floating spring banner & auto-dismiss)'
    },
    controls: {
      openSheet: 'Open Bottom Sheet',
      sheetTitle: 'Conversation Details',
      sheetBody: 'Glass surface with 36px squircle corners and spring dismiss physics.',
      sheetButton: 'Got it',
      showToast: 'Show Toast Notification',
      sampleToast: 'Practice session saved to your journal.',
      triggerError: 'Trigger Notice Shake',
      sampleError: 'Couldn’t save that note just now. Tap to try again.',
      popReset: 'Reset Thought Bubble',
      sampleThought: 'She might be waiting for me to ask a follow-up...',
      sampleEvidenceQuote: '“What got you into that?”',
      sampleEvidenceContext: 'This warmed Maya up right away.'
    }
  }
} as const;
