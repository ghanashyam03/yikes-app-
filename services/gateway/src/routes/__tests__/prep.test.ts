import { describe, expect, it, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import type { GatewayEnv } from '../../config/env.js';
import { FakeProvider } from '../../providers/fake.js';
import { register, prepCardOutputSchema } from '../prep.js';

describe('T-16 Gateway Prep Route (/v1/prep)', () => {
  const secretKey = 'test_secret_for_prep_routes_32_bytes_long!!';
  const testUserId = 'usr_prep_tester_01';

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

  const validPrepOutput = {
    openers: [
      'Hey Sarah, great to catch you before the quarterly roadmap review.',
      'Hi Sarah, mind if I join you at this table? Looking forward to the roadmap discussion.',
    ],
    questions: [
      'What part of the Q3 deliverables are you most focused on right now?',
      'How has the cross-team alignment been feeling from your side?',
    ],
    exitLine: "I need to review a couple notes before we kick off—let's regroup afterwards!",
    recoverySuggestion: 'Take a sip of water if a silence arises; pacing your responses shows calm confidence.',
    quietBreakIdea: 'Step out to the terrace for a 3-minute breather between presentations.',
  };

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

  it('rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/prep',
      payload: {
        title: 'Project kick-off',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('rejects request with missing title with 400 Bad Request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/prep',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        description: 'Meeting without a title',
      },
    });

    expect(res.statusCode).toBe(400);
  });

  describe('Acceptance Check 2: Prep response strictly matches prepCardOutputSchema', () => {
    it('returns structured prep card matching contract schema', async () => {
      fakeProvider.setBehavior(mockEnv.MODEL_COACH, [
        { text: JSON.stringify(validPrepOutput) },
      ]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/prep',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: 'Quarterly roadmap meeting',
          description: 'Catching up with team lead about milestones',
          formality: 7,
          eventDate: '2026-10-20T10:00:00Z',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);

      expect(data.ok).toBe(true);
      expect(data.openerOptions).toHaveLength(2);
      expect(data.questions).toHaveLength(2);
      expect(typeof data.exitLine).toBe('string');
      expect(typeof data.quietBreak).toBe('string');
      expect(typeof data.recoveryPlan).toBe('string');

      // Strict validation with prepCardOutputSchema
      const validated = prepCardOutputSchema.parse(data);
      expect(validated.openerOptions[0]).toBe(validPrepOutput.openers[0]);
      expect(validated.questions[0]).toBe(validPrepOutput.questions[0]);
      expect(validated.exitLine).toBe(validPrepOutput.exitLine);
      expect(validated.quietBreak).toBe(validPrepOutput.quietBreakIdea);
      expect(validated.recoveryPlan).toBe(validPrepOutput.recoverySuggestion);
    });
  });

  describe('Acceptance Check 3: Excluded-topic description is blocked kindly with no AI prep generated', () => {
    it('blocks domestic abuse kindly with { ok: false, reason: ... } and 0 AI completions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/prep',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: 'Difficult talk at home',
          description: 'Practicing a conversation about domestic violence with my partner',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(false);
      expect(data.reason).toMatch(/excluded category/i);
      expect(data.category).toBe('abuse');
      // Proves no AI completion was called!
      expect(fakeProvider.getCallCount(mockEnv.MODEL_COACH)).toBe(0);
    });

    it('blocks bereavement and funeral discussion kindly with 0 AI completions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/prep',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: 'Family gathering',
          description: 'Talking about the death of my mother and planning the funeral',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(false);
      expect(data.category).toBe('bereavement');
      expect(fakeProvider.getCallCount(mockEnv.MODEL_COACH)).toBe(0);
    });

    it('blocks confronting an abuser kindly with 0 AI completions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/prep',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: 'Upcoming face-to-face',
          description: 'Confronting someone who assaulted me in college',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(false);
      expect(data.category).toBe('confronting_harm');
      expect(fakeProvider.getCallCount(mockEnv.MODEL_COACH)).toBe(0);
    });

    it('blocks formal harassment complaints with HR kindly with 0 AI completions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/prep',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: 'HR Appointment',
          description: 'Filing a sexual harassment complaint with HR',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(false);
      expect(data.category).toBe('harassment_reporting');
      expect(fakeProvider.getCallCount(mockEnv.MODEL_COACH)).toBe(0);
    });

    it('blocks severe terminal medical news kindly with 0 AI completions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/prep',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          title: 'Medical talk',
          description: 'Telling my family I received a terminal illness diagnosis',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(false);
      expect(data.category).toBe('medical_news');
      expect(fakeProvider.getCallCount(mockEnv.MODEL_COACH)).toBe(0);
    });
  });
});
