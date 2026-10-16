/**
 * Copy strings for Subscription screen (D4) and Paywall sheet (D5).
 * Non-negotiable product rules:
 * - Equal visual weight for "Not now" and "Try free"; strictly no dark patterns.
 * - Zero clinical words (treat, cure, therapy, diagnose).
 * - Never red; use Honey (amber) for limits or notes.
 * - No guilt copy or countdown timers.
 */
export const billingCopy = {
  subscription: {
    title: 'Your practice plan',
    subtitle: 'Everything you need to build conversational ease on your own terms.',
    cards: {
      free: {
        badge: 'Current plan',
        title: 'Free',
        description: 'Solid daily foundations and essentials.',
        features: [
          '40 chat turns every day',
          'Daily core sessions & Playbook',
          'Moments timeline & Gap Game',
          '3 Reply Helper uses a week',
          '1 Moment Prep a week',
        ],
      },
      plus: {
        badge: 'Recommended',
        title: 'Plus',
        description: 'Unlimited practice gym and deeper personal reflection.',
        features: [
          '120 chat turns every day',
          'Unlimited Reply Helper readings',
          'Unlimited Prep with real-world Rehearsal',
          'Sunday Weekly Letter reflection',
          'Personalized Voice Match style',
          'Deeper Social Battery pattern insights',
        ],
      },
      philosophy: {
        badge: 'Our promise',
        title: 'Calm & honest',
        description:
          'No guilt, no tricky timers, no hidden catches. Cancel anytime in one tap.',
        features: [
          '7-day free trial on monthly and yearly plans',
          'Equal choice: keep free or try Plus',
          'Restore purchases on any device',
          'Your progress stays safe even if you pause',
        ],
      },
    },
    pricing: {
      trialText: '7 days free, then {price}/month',
      trialDuration: '7-day free trial',
      cancelAnytime: 'Cancel anytime in store settings. One tap away.',
      placeholderPrice: '$7.99',
      annualDiscountBadge: 'Save 30%',
    },
    actions: {
      tryFree: 'Try free for 7 days',
      notNow: 'Keep Free',
      manageSubscription: 'Manage or cancel subscription',
      restorePurchases: 'Restore purchases',
      restoring: 'Checking purchases...',
      restoredSuccess: 'Purchases restored successfully.',
      restoreNotFound: 'No active subscription found for this account.',
    },
  },
  paywall: {
    title: 'Unlock your full practice gym',
    subtitle: 'Support your real-world communication with unlimited practice tools.',
    journeyBadge: "You've done {sessionsCount} sessions and {stepsCount} real steps",
    journeyFallback: "You're building steady momentum in your conversation practice",
    perksTitle: "What you'll unlock with Plus:",
    perks: [
      {
        title: 'Unlimited Reply Helper',
        description: 'Explore multiple readings and draft confident replies anytime.',
      },
      {
        title: 'Moment Prep & Rehearsal',
        description: 'Test conversations before high-stakes real-world moments.',
      },
      {
        title: 'Triple daily practice turns',
        description: '120 turns every day to experiment without pressure.',
      },
      {
        title: 'Sunday Weekly Letter',
        description: 'A personal weekly summary tracking your conversational growth.',
      },
    ],
    terms: '7 days free, then {price}/month. Cancel anytime in 1 tap.',
    reassurance: 'No artificial urgency. Free is always here for you.',
    actions: {
      tryFree: 'Try free for 7 days',
      notNow: 'Not now',
      restore: 'Restore purchases',
    },
  },
  errors: {
    purchaseFailed: 'Could not complete purchase. Please try again.',
    restoreFailed: 'Could not restore purchases right now. Please check your connection.',
    offline: "You're offline. Reconnect to manage your subscription.",
  },
};
