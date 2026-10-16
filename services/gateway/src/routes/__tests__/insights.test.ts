import { describe, expect, it, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import type { GatewayEnv } from '../../config/env.js';
import { FakeProvider } from '../../providers/fake.js';
import { register } from '../insights.js';

describe('T-18 Gateway Insights & Ladder Routes (/v1/insights/battery, /v1/ladder/suggest)', () => {
  const secretKey = 'test_secret_for_insights_routes_32_bytes_long!';
  const testUserId = 'usr_insights_tester_01';

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

  describe('POST /v1/insights/battery', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/insights/battery',
        payload: {
          dayTimeAverages: [],
          topCostTags: [],
          topRechargeTags: [],
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects any request containing message text or transcript fields with 400', async () => {
      // Test payload with forbidden 'message' key
      const payloadWithMessage = {
        dayTimeAverages: [{ dayOfWeek: 1, timeSlot: 'morning', avgEnergy: 65, count: 4 }],
        topCostTags: [{ tag: 'Meetings', count: 3, avgImpact: -25 }],
        topRechargeTags: [{ tag: 'Walks', count: 2, avgImpact: 30 }],
        message: 'This is private user chat text that must not reach insights',
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/insights/battery',
        headers: { authorization: `Bearer ${token}` },
        payload: payloadWithMessage,
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('FORBIDDEN_TEXT_PAYLOAD');
    });

    it('rejects any request containing transcript key with 400', async () => {
      const payloadWithTranscript = {
        dayTimeAverages: [],
        topCostTags: [],
        topRechargeTags: [],
        transcript: [{ role: 'user', text: 'Hello' }],
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/insights/battery',
        headers: { authorization: `Bearer ${token}` },
        payload: payloadWithTranscript,
      });

      expect(res.statusCode).toBe(400);
    });

    it('accepts valid aggregated statistics and returns 3 insight cards and Plan my week suggestion', async () => {
      const validAggregates = {
        dayTimeAverages: [
          { dayOfWeek: 1, timeSlot: 'morning', avgEnergy: 75, count: 5 },
          { dayOfWeek: 3, timeSlot: 'afternoon', avgEnergy: 35, count: 4 },
          { dayOfWeek: 5, timeSlot: 'evening', avgEnergy: 60, count: 3 },
        ],
        topCostTags: [
          { tag: 'Large group meeting', count: 4, avgImpact: -35 },
          { tag: 'Client presentation', count: 2, avgImpact: -25 },
        ],
        topRechargeTags: [
          { tag: 'Solo walk', count: 5, avgImpact: 30 },
          { tag: 'Reading quiet time', count: 3, avgImpact: 20 },
        ],
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/insights/battery',
        headers: { authorization: `Bearer ${token}` },
        payload: validAggregates,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.insights).toHaveLength(3);
      expect(body.insights[0]).toHaveProperty('title');
      expect(body.insights[0]).toHaveProperty('takeaway');
      expect(body.insights[0]).toHaveProperty('category');
      expect(body.planMyWeek).toBeDefined();
      expect(body.planMyWeek).toHaveProperty('headline');
      expect(body.planMyWeek).toHaveProperty('recommendation');
    });
  });

  describe('POST /v1/ladder/suggest', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/ladder/suggest',
        payload: {
          currentRungs: [],
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns a suggested next micro-rep rung given current ladder rungs', async () => {
      const payload = {
        currentRungs: [
          { title: 'Say hi to a neighbour', sortOrder: 1, completed: true },
          { title: 'Ask a colleague about their weekend', sortOrder: 2, completed: true },
          { title: 'Speak up in a 3-person sync', sortOrder: 3, completed: false },
        ],
        playbookSummary: {
          communicationStyle: 'Direct and thoughtful',
          scenarioWorld: 'workplace',
          hardestPlaces: ['Large group discussions'],
          coachTone: 'gentle' as const,
        },
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/ladder/suggest',
        headers: { authorization: `Bearer ${token}` },
        payload,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.suggestedRung).toBeDefined();
      expect(body.suggestedRung.title).toBeTruthy();
      expect(body.suggestedRung.microRepSuggestion).toBeTruthy();
      expect(body.suggestedRung.rationale).toBeTruthy();
    });
  });
});
