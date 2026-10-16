import { isPaywallForbiddenRoute, normalizeRoute } from '../routeGuard';

describe('T-23: Paywall Forbidden Route Guard', () => {
  describe('Acceptance Check 3: Forbidden Routes', () => {
    it('strictly forbids /session/*/try routes (live chat)', () => {
      expect(isPaywallForbiddenRoute('/session/123/try')).toBe(true);
      expect(isPaywallForbiddenRoute('/session/intro-session/try')).toBe(true);
      expect(isPaywallForbiddenRoute('/session/s_42/try/')).toBe(true);
      expect(isPaywallForbiddenRoute('/session/abc-def/try?step=2')).toBe(true);
    });

    it('strictly forbids /debrief/* routes (post-moment debriefing)', () => {
      expect(isPaywallForbiddenRoute('/debrief/123')).toBe(true);
      expect(isPaywallForbiddenRoute('/debrief/moment_456/takeaway')).toBe(true);
      expect(isPaywallForbiddenRoute('/debrief')).toBe(true);
      expect(isPaywallForbiddenRoute('/debrief/')).toBe(true);
    });

    it('strictly forbids /support route (crisis safety screen)', () => {
      expect(isPaywallForbiddenRoute('/support')).toBe(true);
      expect(isPaywallForbiddenRoute('/support/')).toBe(true);
      expect(isPaywallForbiddenRoute('/support?ref=crisis')).toBe(true);
    });

    it('strictly forbids /tools/free-chat route (open chat practice)', () => {
      expect(isPaywallForbiddenRoute('/tools/free-chat')).toBe(true);
      expect(isPaywallForbiddenRoute('/tools/free-chat/')).toBe(true);
      expect(isPaywallForbiddenRoute('/tools/free-chat?mode=sandbox')).toBe(true);
    });

    it('permits paywall mounting on allowed routes', () => {
      expect(isPaywallForbiddenRoute('/')).toBe(false);
      expect(isPaywallForbiddenRoute('/(tabs)')).toBe(false);
      expect(isPaywallForbiddenRoute('/(tabs)/you')).toBe(false);
      expect(isPaywallForbiddenRoute('/(tabs)/moments')).toBe(false);
      expect(isPaywallForbiddenRoute('/settings/subscription')).toBe(false);
      expect(isPaywallForbiddenRoute('/paywall')).toBe(false);
      expect(isPaywallForbiddenRoute('/session/123/idea')).toBe(false);
      expect(isPaywallForbiddenRoute('/session/123/watch')).toBe(false);
      expect(isPaywallForbiddenRoute('/session/123/read')).toBe(false);
      expect(isPaywallForbiddenRoute('/session/123/coach')).toBe(false);
      expect(isPaywallForbiddenRoute('/session/123/complete')).toBe(false);
    });
  });

  describe('normalizeRoute helper', () => {
    it('handles query strings, hashes, and slashes consistently', () => {
      expect(normalizeRoute('session/1/try?mode=fast#top')).toBe('/session/1/try');
      expect(normalizeRoute('/support///')).toBe('/support');
      expect(normalizeRoute('')).toBe('');
    });
  });
});
