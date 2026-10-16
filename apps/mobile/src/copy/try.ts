export const tryCopy = {
  header: {
    backA11y: 'Back to session menu',
    turnPill: (current: number, total: number) => `Turn ${current} of ${total}`,
    freeTurnPill: (current: number) => `Turn ${current}`,
    partnerSubtitle: (role: string) => role,
    endEarly: 'Finish chat',
    endEarlyA11y: 'Finish this practice chat now',
  },
  bubbles: {
    userA11y: (text: string) => `You said: ${text}`,
    partnerA11y: (name: string, text: string) => `${name} said: ${text}`,
  },
  status: {
    typing: (name: string) => `${name} is typing…`,
    thinking: (name: string) => `${name} is thinking…`,
    degradedNote: 'Using offline character lines',
    idleCue: 'Take your time',
  },
  input: {
    placeholder: 'Type your reply…',
    sendA11y: 'Send reply',
    passThisOne: 'Pass this one',
    passA11y: 'Pass this turn and let your partner continue',
    needHint: 'Need a hint?',
    hintA11y: 'Ask for a coaching hint',
    hintTitle: 'Coaching perspective',
    hintClose: 'Got it',
    suggestionsLabel: 'Suggested replies (tap to edit):',
  },
  edgeStates: {
    offlineTitle: 'You are offline',
    offlineBody: 'Practice continues with offline responses so you never lose your flow.',
    capTitle: 'Daily practice limit reached',
    capBody: 'You have completed your daily practice turns. Great work today! You can revisit past sessions or continue tomorrow.',
    capButton: 'See summary',
    retryA11y: 'Retry sending message',
  },
  freeChat: {
    title: 'Free Practice',
    subtitle: 'Chat freely with no turn limits',
    reset: 'Start fresh',
  },
  actions: {
    finishPractice: 'Review with Coach',
  },
};
