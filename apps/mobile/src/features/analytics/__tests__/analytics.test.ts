import {
  AnalyticsValidationError,
  validateEvent,
} from '../events';
import {
  AnalyticsTracker,
  MemoryPostHogClient,
} from '../tracker';
import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  type SentryBreadcrumb,
  type SentryEvent,
} from '../sentryScrubber';

describe('T-24 Analytics & Observability (Mobile)', () => {
  let mockPostHog: MemoryPostHogClient;
  let tracker: AnalyticsTracker;

  beforeEach(() => {
    mockPostHog = new MemoryPostHogClient();
    tracker = new AnalyticsTracker({
      client: mockPostHog,
      initialConsent: false,
    });
  });

  // Acceptance Check 1: A test proves track() rejects an unknown event or any free-text property.
  describe('Acceptance Check 1: Schema Enforcement & Zero Free-Text Guarantee', () => {
    it('rejects an unknown event name with AnalyticsValidationError', async () => {
      await expect(
        tracker.track('completely_unknown_event', {})
      ).rejects.toThrow(AnalyticsValidationError);

      await expect(
        tracker.track('arbitrary_user_action', { foo: 'bar' })
      ).rejects.toThrow(
        /Unknown event 'arbitrary_user_action'/
      );
    });

    it('rejects free-text property keys (e.g. text, message, prompt, transcript)', async () => {
      const validSessionId = '123e4567-e89b-12d3-a456-426614174000';

      // 1. Trying to inject 'text' property
      await expect(
        tracker.track('session_started', {
          session_id: validSessionId,
          scenario_id: 'smalltalk_coffee',
          mode: 'try',
          text: 'This is my private message text',
        })
      ).rejects.toThrow(AnalyticsValidationError);

      // 2. Trying to inject 'message' property
      await expect(
        tracker.track('session_started', {
          session_id: validSessionId,
          scenario_id: 'smalltalk_coffee',
          mode: 'try',
          message: 'My private thoughts',
        })
      ).rejects.toThrow(/Banned free-text property 'message'/);

      // 3. Trying to inject 'prompt' property
      await expect(
        tracker.track('step_completed', {
          session_id: validSessionId,
          step_index: 0,
          step_type: 'read',
          duration_seconds: 12,
          prompt: 'System prompt instructions',
        })
      ).rejects.toThrow(/Banned free-text property 'prompt'/);

      // 4. Trying to inject 'transcript' property
      await expect(
        tracker.track('session_completed', {
          session_id: validSessionId,
          scenario_id: 'boundary_setting',
          turns_count: 4,
          duration_seconds: 45,
          completed_all_steps: true,
          transcript: ['Turn 1: Hello', 'Turn 2: Hi there'],
        })
      ).rejects.toThrow(/Banned free-text property 'transcript'/);
    });

    it('rejects any unapproved non-schema property due to strict schema mode', async () => {
      const validSessionId = '123e4567-e89b-12d3-a456-426614174000';

      await expect(
        tracker.track('session_started', {
          session_id: validSessionId,
          scenario_id: 'smalltalk_coffee',
          mode: 'try',
          unapproved_extra_prop: 12345,
        })
      ).rejects.toThrow(/Unrecognized key/i);
    });

    it('rejects non-enum string values where finite enums are expected', async () => {
      const validSessionId = '123e4567-e89b-12d3-a456-426614174000';

      await expect(
        tracker.track('session_started', {
          session_id: validSessionId,
          scenario_id: 'not_an_approved_scenario',
          mode: 'try',
        })
      ).rejects.toThrow(/Invalid enum value/);
    });

    it('accepts valid conformant event payloads', () => {
      const validSessionId = '123e4567-e89b-12d3-a456-426614174000';

      expect(() =>
        validateEvent('session_started', {
          session_id: validSessionId,
          scenario_id: 'smalltalk_coffee',
          mode: 'try',
        })
      ).not.toThrow();

      expect(() =>
        validateEvent('checkin_done', {
          checkin_type: 'energy',
          energy_level: 4,
        })
      ).not.toThrow();

      expect(() =>
        validateEvent('paywall_viewed', {
          placement: 'settings',
          current_plan: 'free',
        })
      ).not.toThrow();
    });
  });

  // Acceptance Check 2: A test proves nothing is sent when consent is off or after it is withdrawn.
  describe('Acceptance Check 2: Consent Gating & Withdrawal Guarantee', () => {
    const validSessionId = '123e4567-e89b-12d3-a456-426614174000';
    const validPayload = {
      session_id: validSessionId,
      scenario_id: 'smalltalk_coffee' as const,
      mode: 'try' as const,
    };

    it('proves nothing is sent when consent is initially off', async () => {
      expect(tracker.hasConsent()).toBe(false);

      const result = await tracker.track('session_started', validPayload);

      expect(result).toBe(false);
      expect(mockPostHog.capturedEvents).toHaveLength(0);
      expect(mockPostHog.optedOut).toBe(true);
    });

    it('proves events are sent only when consent is granted', async () => {
      tracker.setConsent(true);
      expect(tracker.hasConsent()).toBe(true);
      expect(mockPostHog.optedOut).toBe(false);

      const result = await tracker.track('session_started', validPayload);

      expect(result).toBe(true);
      expect(mockPostHog.capturedEvents).toHaveLength(1);
      expect(mockPostHog.capturedEvents[0]?.event).toBe('session_started');
      expect(mockPostHog.capturedEvents[0]?.properties).toEqual(validPayload);
    });

    it('proves nothing is sent after consent is withdrawn', async () => {
      // 1. Grant consent and send one event
      tracker.setConsent(true);
      await tracker.track('session_started', validPayload);
      expect(mockPostHog.capturedEvents).toHaveLength(1);

      // 2. Withdraw consent
      tracker.withdrawConsent();
      expect(tracker.hasConsent()).toBe(false);
      expect(mockPostHog.optedOut).toBe(true);

      // 3. Subsequent track call must be dropped completely
      const secondResult = await tracker.track('step_completed', {
        session_id: validSessionId,
        step_index: 1,
        step_type: 'watch',
        duration_seconds: 30,
      });

      expect(secondResult).toBe(false);
      // Still only 1 event recorded from prior consent
      expect(mockPostHog.capturedEvents).toHaveLength(1);
    });

    it('proves identify() drops user identity when consent is off', () => {
      tracker.setConsent(false);
      tracker.identify('user-anonymous-123');

      expect(mockPostHog.currentDistinctId).toBeNull();

      // If consent is granted, identify works
      tracker.setConsent(true);
      tracker.identify('user-anonymous-123');
      expect(mockPostHog.currentDistinctId).toBe('user-anonymous-123');
    });
  });

  // Acceptance Check 3: A scrubber test proves Sentry events never contain message text.
  describe('Acceptance Check 3: Sentry Scrubber Removes Message Text & Transcripts', () => {
    it('proves message text in breadcrumb data is strictly redacted', () => {
      const breadcrumb: SentryBreadcrumb = {
        category: 'chat',
        message: 'Sent message turn',
        data: {
          session_id: 'session-123',
          text: 'Can we talk about my compensation review?',
          prompt: 'System prompt instructions with private dialogue',
          transcript: [
            { role: 'user', content: 'Secret transcript line' },
            { role: 'partner', content: 'Secret response' },
          ],
          thought: 'Partner should feel hesitant',
          reply: 'I think that makes sense',
          safe_metric: 42,
        },
      };

      const scrubbed = scrubSentryBreadcrumb(breadcrumb);

      expect(scrubbed.data?.safe_metric).toBe(42);
      expect(scrubbed.data?.session_id).toBe('session-123');
      expect(scrubbed.data?.text).toBe('[REDACTED]');
      expect(scrubbed.data?.prompt).toBe('[REDACTED]');
      expect(scrubbed.data?.transcript).toBe('[REDACTED]');
      expect(scrubbed.data?.thought).toBe('[REDACTED]');
      expect(scrubbed.data?.reply).toBe('[REDACTED]');
      expect(JSON.stringify(scrubbed)).not.toContain('Can we talk about my compensation');
      expect(JSON.stringify(scrubbed)).not.toContain('Secret transcript line');
    });

    it('proves message text in breadcrumb message string and URLs is strictly redacted', () => {
      const breadcrumb: SentryBreadcrumb = {
        category: 'navigation',
        message: 'User prompt: "How do I ask my boss for a raise?"',
        data: {
          url: 'https://api.yikes.app/v1/partner/turn?text=MySecretMessageText&prompt=MoreText',
        },
      };

      const scrubbed = scrubSentryBreadcrumb(breadcrumb);

      expect(scrubbed.message).not.toContain('How do I ask my boss');
      expect(scrubbed.message).toContain('User prompt: "[REDACTED]"');
    });

    it('proves exception values containing prompt or dialogue text are redacted', () => {
      const sentryEvent: SentryEvent = {
        event_id: 'event-err-1',
        message: 'Uncaught error in practice turn',
        exception: {
          values: [
            {
              type: 'ModelError',
              value: 'Model rejected prompt: "Please coach the user through boundary setting with their mom"',
              stacktrace: {
                frames: [
                  {
                    filename: 'chatEngine.ts',
                    function: 'sendTurn',
                    vars: {
                      attempt_id: 'att-123',
                      text: 'I really hate when you interrupt me',
                      thought: 'Feeling anxious',
                    },
                  },
                ],
              },
            },
          ],
        },
        extra: {
          raw_prompt: 'You are Maya, practice partner for introverts...',
          dialogue_history: ['User: "Hello"', 'Maya: "Hey there"'],
          status_code: 500,
        },
        request: {
          url: 'https://api.yikes.app/v1/coach/feedback?message=SecretUserQuery',
          data: {
            text: 'I froze in the meeting',
            prompt: 'Explain what went well',
          },
        },
      };

      const scrubbed = scrubSentryEvent(sentryEvent);

      const serialized = JSON.stringify(scrubbed);

      // Verify no sensitive text leaks exist
      expect(serialized).not.toContain('boundary setting with their mom');
      expect(serialized).not.toContain('I really hate when you interrupt me');
      expect(serialized).not.toContain('Feeling anxious');
      expect(serialized).not.toContain('You are Maya, practice partner');
      expect(serialized).not.toContain('SecretUserQuery');
      expect(serialized).not.toContain('I froze in the meeting');

      // Verify safe metadata was preserved
      expect(scrubbed.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars?.attempt_id).toBe('att-123');
      expect(scrubbed.extra?.status_code).toBe(500);
      expect(scrubbed.request?.data).toEqual({
        text: '[REDACTED]',
        prompt: '[REDACTED]',
      });
    });
  });
});
