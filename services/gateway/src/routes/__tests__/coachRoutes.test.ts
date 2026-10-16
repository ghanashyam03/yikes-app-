import { describe, expect, it, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { CoachEngine, AttemptNotEndedError, clearInMemoryCoachStore } from '../../coach/engine.js';
import { clearInMemoryRewindStore, seedInMemoryAttempt } from '../../coach/rewindManager.js';
import type { GatewayEnv } from '../../config/env.js';
import { FakeProvider } from '../../providers/fake.js';
import { register } from '../coach.js';

describe('T-13 Coach Routes & Thoughts Guard', () => {
  const secretKey = 'test_secret_for_coach_routes_32_bytes_long!!';
  const testUserId = 'usr_coach_route_tester';

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
  let fakeProvider: FakeProvider;

  beforeEach(async () => {
    clearInMemoryCoachStore();
    clearInMemoryRewindStore();
    fakeProvider = new FakeProvider();
    app = buildApp();
    await register(app, {
      env: mockEnv,
      provider: fakeProvider,
    });

    token = await new SignJWT({ sub: testUserId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secretKey));
  });

  describe('Acceptance Check 3: Confidential Thoughts Access Guard', () => {
    it('proves GET /v1/attempts/:id/thoughts returns 403 Forbidden before attempt has ended', async () => {
      // Create a mock engine that simulates an ongoing (unended) attempt
      const customApp = buildApp();
      const mockEngine = new CoachEngine({
        env: mockEnv,
        provider: fakeProvider,
      });

      // Stub getAttemptThoughts to throw AttemptNotEndedError
      mockEngine.getAttemptThoughts = async () => {
        throw new AttemptNotEndedError('Attempt is still active. Thoughts are confidential.');
      };

      await register(customApp, {
        env: mockEnv,
        provider: fakeProvider,
        engine: mockEngine,
      });

      const response = await customApp.inject({
        method: 'GET',
        url: '/v1/attempts/att_active_123/thoughts',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const json = JSON.parse(response.body);
      expect(json.code).toBe('ATTEMPT_NOT_ENDED');
      expect(json.error).toContain('confidential');
    });

    it('proves GET /v1/attempts/:id/thoughts returns thoughts array after attempt has ended', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/attempts/att_finished_123/thoughts',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.attemptId).toBe('att_finished_123');
      expect(Array.isArray(json.thoughts)).toBe(true);
      expect(json.thoughts.length).toBeGreaterThan(0);
      expect(json.thoughts[0]).toHaveProperty('thought');
      expect(json.thoughts[0]).toHaveProperty('role');
    });
  });

  describe('POST /v1/coach/feedback', () => {
    it('returns structured coach feedback for a practice attempt', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/coach/feedback',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: 'att_feedback_test',
          skillKey: 'starting_chat',
          toneVariant: 'gentle',
        }),
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('attemptId', 'att_feedback_test');
      expect(json).toHaveProperty('feedback');
      expect(json.feedback).toHaveProperty('worked');
      expect(json.feedback).toHaveProperty('tryNext');
      expect(json).toHaveProperty('verified');
    });

    it('returns 400 for invalid request body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/coach/feedback',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /v1/partner/rewind', () => {
    it('branches attempt and returns copied turns strictly before fromTurn', async () => {
      seedInMemoryAttempt(
        {
          id: 'att_parent_test',
          userId: testUserId,
          mode: 'try',
          state: {},
          turnsCount: 4,
          createdAt: new Date().toISOString(),
        },
        [
          { id: 't0', idx: 0, role: 'partner', text: 'Hey' },
          { id: 't1', idx: 1, role: 'user', text: 'Hi' },
          { id: 't2', idx: 2, role: 'partner', text: 'How are you?' },
          { id: 't3', idx: 3, role: 'user', text: 'Good thanks' },
        ]
      );

      const response = await app.inject({
        method: 'POST',
        url: '/v1/partner/rewind',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: 'att_parent_test',
          fromTurn: 2,
        }),
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json).toHaveProperty('newAttemptId');
      expect(json).toHaveProperty('parentAttemptId', 'att_parent_test');
      expect(json.turns).toHaveLength(2);
      expect(json.turns.map((t: { idx: number }) => t.idx)).toEqual([0, 1]);
    });
  });

  describe('POST /v1/coach/compare', () => {
    it('summarises two paths side by side', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/coach/compare',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          attemptId1: 'att_path1',
          attemptId2: 'att_path2',
        }),
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json).toHaveProperty('summary');
      expect(json).toHaveProperty('differences');
      expect(json).toHaveProperty('partnerShift');
    });
  });

  describe('POST /v1/ai/feedback', () => {
    it('records thumbs rating into ai_feedback', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/ai/feedback',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetKind: 'coach',
          targetId: 'fb_12345',
          rating: 1,
        }),
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json).toEqual({ success: true });
    });
  });
});
