/**
 * notify.test.ts — Test suite for Gateway notify routes and jobs
 */

import type { FastifyInstance } from 'fastify';
import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import type { GatewayEnv } from '../../config/env.js';
import { MockPushSender } from '../../jobs/notify/types.js';
import { register } from '../notify.js';

describe('T-21 Gateway Notify Routes & Jobs', () => {
  const secretKey = 'test_secret_for_notify_routes_32_bytes_long!';
  const testUserId = 'usr_notify_tester_123';

  const mockEnv: GatewayEnv = {
    NVIDIA_API_KEY: 'test_key',
    NVIDIA_BASE_URL: 'https://integrate.api.nvidia.com/v1',
    MODEL_PARTNER: 'test-partner',
    MODEL_PARTNER_FALLBACK: 'test-fallback',
    MODEL_COACH: 'test-coach',
    MODEL_COACH_FALLBACK: 'test-coach-fallback',
    MODEL_JUDGE: 'test-judge',
    MODEL_SAFETY: 'test-safety',
    MODEL_VISION: 'test-vision',
    MODEL_LONG: 'test-long',
    MODEL_ALT: 'test-alt',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service_role_key',
    SUPABASE_JWT_SECRET: secretKey,
    AI_PROVIDER: 'fake',
    HOST: '0.0.0.0',
    PORT: 3000,
    REQUEST_TIMEOUT_MS: 8000,
    RPM_LIMIT: 35,
  };

  let token: string;
  let app: FastifyInstance;
  let mockPushSender: MockPushSender;

  beforeEach(async () => {
    mockPushSender = new MockPushSender();
    app = buildApp();
    await register(app, {
      env: mockEnv,
      pushSender: mockPushSender,
    });

    token = await new SignJWT({ sub: testUserId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secretKey));
  });

  describe('POST /v1/notify/token', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/notify/token',
        payload: { pushToken: 'ExponentPushToken[xxxxxxxxxxxxxx]' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('rejects invalid body with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/notify/token',
        headers: { authorization: `Bearer ${token}` },
        payload: { pushToken: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('successfully registers push token for authenticated user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/notify/token',
        headers: { authorization: `Bearer ${token}` },
        payload: { pushToken: 'ExponentPushToken[test-valid-push-token-123]' },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.ok).toBe(true);
      expect(json.pushToken).toBe('ExponentPushToken[test-valid-push-token-123]');
    });
  });

  describe('GET & PATCH /v1/notify/prefs', () => {
    it('retrieves default notification preferences for authenticated user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/notify/prefs',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.ok).toBe(true);
      expect(json.prefs.quiet_hours_start).toBe('22:00');
      expect(json.prefs.quiet_hours_end).toBe('08:00');
      expect(json.prefs.toggles.rhythm_nudge).toBe(true);
    });

    it('updates preferences via PATCH /v1/notify/prefs', async () => {
      const patchRes = await app.inject({
        method: 'PATCH',
        url: '/v1/notify/prefs',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          quietHoursStart: '23:00',
          quietHoursEnd: '07:00',
          toggles: {
            rhythm_nudge: false,
            moment_prompt: true,
          },
        },
      });

      expect(patchRes.statusCode).toBe(200);
      const json = patchRes.json();
      expect(json.ok).toBe(true);
      expect(json.prefs.quiet_hours_start).toBe('23:00');
      expect(json.prefs.quiet_hours_end).toBe('07:00');
      expect(json.prefs.toggles.rhythm_nudge).toBe(false);
    });
  });

  describe('POST /v1/jobs/notify/welcome-back', () => {
    // Local date at 14:00 (2 PM) so getHours() is strictly 14 across all timezones
    const fixedNow = new Date(2026, 9, 20, 14, 0, 0);

    it('rejects requests without job secret with 403', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/jobs/notify/welcome-back',
        payload: {},
      });

      expect(response.statusCode).toBe(403);
    });

    it('processes eligible users and enforces quiet hours, pause week, away >= 3 days, and 7-day cooldown', async () => {
      const candidates = [
        // 1. Eligible candidate: away 4 days, not paused, outside quiet hours
        {
          userId: 'user-eligible-1',
          pushToken: 'push-token-1',
          lastActiveAt: new Date(fixedNow.getTime() - 4 * 86400000).toISOString(),
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        },
        // 2. Ineligible: away for only 1 day (< 3 days)
        {
          userId: 'user-away-1-day',
          pushToken: 'push-token-2',
          lastActiveAt: new Date(fixedNow.getTime() - 1 * 86400000).toISOString(),
        },
        // 3. Ineligible: paused for a week
        {
          userId: 'user-paused',
          pushToken: 'push-token-3',
          lastActiveAt: new Date(fixedNow.getTime() - 5 * 86400000).toISOString(),
          pausedUntil: new Date(fixedNow.getTime() + 3 * 86400000).toISOString(),
        },
        // 4. Ineligible: welcome back already sent 3 days ago (< 7 days)
        {
          userId: 'user-recent-welcome',
          pushToken: 'push-token-4',
          lastActiveAt: new Date(fixedNow.getTime() - 6 * 86400000).toISOString(),
          lastWelcomeBackAt: new Date(fixedNow.getTime() - 3 * 86400000).toISOString(),
        },
        // 5. Ineligible: currently in quiet hours (custom window covering 2 PM)
        {
          userId: 'user-in-quiet-hours',
          pushToken: 'push-token-5',
          lastActiveAt: new Date(fixedNow.getTime() - 5 * 86400000).toISOString(),
          quietHoursStart: '13:00',
          quietHoursEnd: '16:00',
        },
      ];

      const response = await app.inject({
        method: 'POST',
        url: '/v1/jobs/notify/welcome-back',
        headers: {
          'x-job-secret': 'dev-job-secret',
        },
        payload: {
          candidates,
          now: fixedNow.toISOString(),
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.processed).toBe(5);
      expect(json.sent).toBe(1);
      expect(json.skipped).toBe(4);

      // Verify sent payload
      expect(mockPushSender.sentPushes.length).toBe(1);
      const push = mockPushSender.sentPushes[0]!;
      expect(push.to).toBe('push-token-1');
      expect(push.title).toBe('yikes!');
      expect(push.body).toBe('Good to see you again. Maya is ready whenever you are.');
    });
  });

  describe('POST /v1/jobs/notify/weekly-letter', () => {
    // Local Sunday at 19:30 so getHours() is 19 across all timezones
    const sundayNight = new Date(2026, 9, 25, 19, 30, 0);

    it('sends Sunday Weekly Letter to eligible users', async () => {
      const candidates = [
        {
          userId: 'user-wl-1',
          pushToken: 'token-wl-1',
          letterId: 'letter-week-42',
        },
        {
          userId: 'user-wl-disabled',
          pushToken: 'token-wl-2',
          letterId: 'letter-week-42',
          toggles: { weekly_letter: false },
        },
      ];

      const response = await app.inject({
        method: 'POST',
        url: '/v1/jobs/notify/weekly-letter',
        headers: {
          'x-job-secret': 'dev-job-secret',
        },
        payload: {
          candidates,
          now: sundayNight.toISOString(),
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.processed).toBe(2);
      expect(json.sent).toBe(1);
      expect(json.skipped).toBe(1);

      expect(mockPushSender.sentPushes.length).toBe(1);
      expect(mockPushSender.sentPushes[0]!.title).toBe('Weekly Letter');
      expect(mockPushSender.sentPushes[0]!.body).toContain('Sunday Weekly Letter is ready');
    });
  });
});
