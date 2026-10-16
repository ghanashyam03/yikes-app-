import { billingCopy } from '../../../copy/billing';

describe('T-23: Billing Copy & Non-Negotiable Product Rules', () => {
  const allCopyStrings: string[] = [];

  function collectStrings(obj: unknown) {
    if (typeof obj === 'string') {
      allCopyStrings.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(collectStrings);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(collectStrings);
    }
  }

  collectStrings(billingCopy);

  it('contains zero clinical words (treat, cure, therapy, diagnose)', () => {
    const bannedWords = ['treat', 'cure', 'therapy', 'diagnose'];
    const matches: { word: string; text: string }[] = [];

    for (const text of allCopyStrings) {
      const lower = text.toLowerCase();
      for (const word of bannedWords) {
        // match whole word or partial clinical forms
        const regex = new RegExp(`\\b${word}[a-z]*\\b`, 'i');
        if (regex.test(lower)) {
          matches.push({ word, text });
        }
      }
    }

    expect(matches).toEqual([]);
  });

  it('contains zero guilt copy or countdown urgency language', () => {
    const urgencyPatterns = [
      /\bhits zero\b/i,
      /\blost forever\b/i,
      /\bh当店\b/i,
      /\bcountdown\b/i,
      /\blimited time\b/i,
      /\bhurry\b/i,
      /\bact now\b/i,
    ];

    const matches: string[] = [];
    for (const text of allCopyStrings) {
      for (const pattern of urgencyPatterns) {
        if (pattern.test(text)) {
          matches.push(text);
        }
      }
    }

    expect(matches).toEqual([]);
  });

  it('defines equal weight button copy for paywall and subscription', () => {
    // D4 Subscription
    expect(billingCopy.subscription.actions.notNow).toBe('Keep Free');
    expect(billingCopy.subscription.actions.tryFree).toBe('Try free for 7 days');

    // D5 Paywall
    expect(billingCopy.paywall.actions.notNow).toBe('Not now');
    expect(billingCopy.paywall.actions.tryFree).toBe('Try free for 7 days');
  });

  it('provides explicit cancellation and restore purchases terms', () => {
    expect(billingCopy.subscription.actions.manageSubscription).toBe(
      'Manage or cancel subscription'
    );
    expect(billingCopy.subscription.actions.restorePurchases).toBe('Restore purchases');
    expect(billingCopy.subscription.pricing.cancelAnytime).toContain('Cancel anytime');
  });

  it('binds paywall copy to user personal journey', () => {
    expect(billingCopy.paywall.journeyBadge).toContain('{sessionsCount}');
    expect(billingCopy.paywall.journeyBadge).toContain('{stepsCount}');
  });
});
