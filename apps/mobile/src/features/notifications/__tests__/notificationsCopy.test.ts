/**
 * notificationsCopy.test.ts — Rigorous zero-guilt, zero-clinical copy checks
 * 
 * Acceptance check 2:
 * A copy test fails if any line contains:
 * "you missed", "streak", "don't lose", "hurry", "last chance", "only X left"
 * 
 * Non-negotiable product rules:
 * Zero clinical words: treat, cure, therapy, diagnose
 */

import { NOTIFICATIONS_COPY } from '../../../copy/notifications';

describe('T-21 Acceptance Check 2: Notifications Copy Library', () => {
  const BANNED_GUILT_PHRASES = [
    'you missed',
    'streak',
    "don't lose",
    'dont lose',
    'hurry',
    'last chance',
    /only \w+ left/i,
  ];

  const BANNED_CLINICAL_WORDS = [
    'treat',
    'cure',
    'therapy',
    'diagnose',
  ];

  /**
   * Helper that collects all strings recursively from an object or function
   */
  function extractAllStrings(obj: unknown, prefix = ''): { path: string; text: string }[] {
    const results: { path: string; text: string }[] = [];

    if (typeof obj === 'string') {
      results.push({ path: prefix, text: obj });
    } else if (typeof obj === 'function') {
      try {
        // Evaluate dynamic template functions with sample strings
        const sampleResult = obj('Test Conversation');
        if (typeof sampleResult === 'string') {
          results.push({ path: `${prefix}()`, text: sampleResult });
        }
      } catch {
        // Skip un-invokable
      }
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const nextPath = prefix ? `${prefix}.${key}` : key;
        results.push(...extractAllStrings(value, nextPath));
      }
    }

    return results;
  }

  const allCopyEntries = extractAllStrings(NOTIFICATIONS_COPY);

  it('contains at least 20 copy strings and templates', () => {
    expect(allCopyEntries.length).toBeGreaterThanOrEqual(20);
  });

  describe('Zero guilt language & streak threat enforcement', () => {
    it.each(BANNED_GUILT_PHRASES)(
      'asserts no copy line contains guilt phrase: %s',
      (bannedPattern) => {
        const violations: string[] = [];

        for (const { path, text } of allCopyEntries) {
          const lower = text.toLowerCase();
          const matches =
            typeof bannedPattern === 'string'
              ? lower.includes(bannedPattern.toLowerCase())
              : bannedPattern.test(lower);

          if (matches) {
            violations.push(`Violation at ${path}: "${text}" contains banned phrase "${bannedPattern}"`);
          }
        }

        expect(violations).toEqual([]);
      }
    );
  });

  describe('Zero clinical language enforcement', () => {
    it.each(BANNED_CLINICAL_WORDS)(
      'asserts no copy line contains clinical word: %s',
      (clinicalWord) => {
        const violations: string[] = [];
        const regex = new RegExp(`\\b${clinicalWord}\\w*\\b`, 'i');

        for (const { path, text } of allCopyEntries) {
          if (regex.test(text)) {
            violations.push(`Violation at ${path}: "${text}" contains clinical word "${clinicalWord}"`);
          }
        }

        expect(violations).toEqual([]);
      }
    );
  });

  describe('Content completeness & quality', () => {
    it('has previews and titles for all required notification categories', () => {
      expect(NOTIFICATIONS_COPY.types.rhythm_nudge.name).toBe('Rhythm nudge');
      expect(NOTIFICATIONS_COPY.types.moment_prompt.name).toBe('Moment prompts');
      expect(NOTIFICATIONS_COPY.types.checkin_nudge.name).toBe('Check-in nudges');
      expect(NOTIFICATIONS_COPY.types.review_due.name).toBe('Review due');
      expect(NOTIFICATIONS_COPY.types.weekly_letter.name).toBe('Weekly Letter');
    });

    it('includes permission flow copy with preview headline and tag', () => {
      expect(NOTIFICATIONS_COPY.permissionModal.tag).toBe('Notification preview');
      expect(NOTIFICATIONS_COPY.permissionModal.headline).toBe('Thoughtful, gentle reminders');
      expect(NOTIFICATIONS_COPY.permissionModal.allowButton).toBe('Enable notifications');
      expect(NOTIFICATIONS_COPY.permissionModal.dismissButton).toBe('Maybe later');
    });

    it('includes Max one a day badge and explanation', () => {
      expect(NOTIFICATIONS_COPY.screen.maxOneADayBadge).toBe('Max one a day');
      expect(NOTIFICATIONS_COPY.screen.maxOneADayNote).toContain('never send more than one notification');
    });
  });
});
