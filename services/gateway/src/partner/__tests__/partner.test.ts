import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import type { GatewayEnv } from '../../config/env.js';
import { FakeProvider } from '../../providers/fake.js';
import { register } from '../../routes/partner.js';
import { clearInMemoryPartnerStore } from '../engine.js';
import { DEFAULT_MAYA_PERSONA } from '../fallbackLines.js';

describe('T-12: Gateway Practice Partner API & Engine', () => {
  const secretKey = 'test_secret_for_partner_tests_32_bytes_long!!';
  const testUserId = 'usr_test_12345';

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
  let fakeProvider: FakeProvider;
  let app: FastifyInstance;

  beforeEach(async () => {
    clearInMemoryPartnerStore();
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

  const validStartBody = {
    scenario: {
      title: 'Discussing sprint scope',
      setting: 'Office breakout area',
      userGoal: 'Push back on extra task',
    },
    mode: 'try',
  };

  it('1. POST /v1/partner/start starts an attempt and returns opening dialogue and initial mood', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.attemptId).toBeDefined();
    expect(body.openingTurn).toBeDefined();
    expect(body.openingTurn.role).toBe('partner');
    expect(typeof body.openingTurn.text).toBe('string');
    expect(body.initialMood).toBeDefined();
    expect(body.turnCap).toBe(6);
  });

  it('2. Thought leakage prevention: thought is saved but STRICTLY NEVER returned in POST /v1/partner/turn', async () => {
    // Start attempt
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    // Mock partner AI output with secret thought
    fakeProvider.setBehavior('test-partner', [
      {
        text: JSON.stringify({
          reply: 'I hear what you are saying about the timeline.',
          thought: 'SECRET_INNER_VOICE_THEY_MUST_NOT_SEE_YET',
          mood: {
            engagement: 0.55,
            rapport: 0.55,
            patience: 0.70,
            exitPressure: 0.20,
          },
          wantsToEnd: false,
          cue: 0.6,
        }),
      },
    ]);

    const turnRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/turn',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        attemptId,
        userText: "I'm concerned about taking on this extra scope.",
      },
    });

    expect(turnRes.statusCode).toBe(200);
    const turnBody = JSON.parse(turnRes.body);

    // Explicit check: response must NOT contain thought property
    expect(turnBody).not.toHaveProperty('thought');
    expect(JSON.stringify(turnBody)).not.toContain('SECRET_INNER_VOICE_THEY_MUST_NOT_SEE_YET');
    expect(turnBody.reply).toBe('I hear what you are saying about the timeline.');
    expect(turnBody.mood).toBeDefined();
    expect(turnBody.wantsToEnd).toBe(false);

    // Now end the attempt and verify thoughts are ONLY returned at the end!
    const endRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/end',
      headers: { authorization: `Bearer ${token}` },
      payload: { attemptId },
    });

    expect(endRes.statusCode).toBe(200);
    const endBody = JSON.parse(endRes.body);
    expect(endBody.thoughts).toBeInstanceOf(Array);
    expect(endBody.thoughts.length).toBeGreaterThanOrEqual(1);

    const revealed = endBody.thoughts.find(
      (t: { thought: string }) => t.thought === 'SECRET_INNER_VOICE_THEY_MUST_NOT_SEE_YET'
    );
    expect(revealed).toBeDefined();
    expect(revealed.role).toBe('partner');
  });

  it('3. Mood clamping: mood dimension changes are clamped to at most 0.15 step', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId, initialMood } = JSON.parse(startRes.body);

    // Initial mood has engagement 0.5. Mock AI returning drastic jump to 1.0!
    fakeProvider.setBehavior('test-partner', [
      {
        text: JSON.stringify({
          reply: 'That is really interesting!',
          thought: 'Excited now.',
          mood: {
            engagement: 1.0, // +0.50 jump!
            rapport: 0.9,    // +0.40 jump!
            patience: 0.1,   // -0.60 jump!
            exitPressure: 0.8, // +0.60 jump!
          },
          wantsToEnd: false,
          cue: 0.8,
        }),
      },
    ]);

    const turnRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/turn',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        attemptId,
        userText: 'Let me explain the new proposal.',
      },
    });

    expect(turnRes.statusCode).toBe(200);
    const turnBody = JSON.parse(turnRes.body);

    // Must be clamped to at most 0.15 delta from initial
    expect(turnBody.mood.engagement).toBeCloseTo(initialMood.engagement + 0.15, 2);
    expect(turnBody.mood.rapport).toBeCloseTo(initialMood.rapport + 0.15, 2);
    expect(turnBody.mood.patience).toBeCloseTo(initialMood.patience - 0.15, 2);
    expect(turnBody.mood.exitPressure).toBeCloseTo(initialMood.exitPressure + 0.15, 2);
  });

  it('4. Crisis inbound path returns { crisis: true } with strictly NO AI text', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    const turnRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/turn',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        attemptId,
        userText: 'I feel completely hopeless and want to end my life',
      },
    });

    expect(turnRes.statusCode).toBe(200);
    const turnBody = JSON.parse(turnRes.body);

    // Strict requirements: { crisis: true } and NO AI text!
    expect(turnBody.crisis).toBe(true);
    expect(turnBody.reply).toBeUndefined();
    expect(turnBody.thought).toBeUndefined();
    expect(turnBody.mood).toBeUndefined();
  });

  it('5. Schema retry: if AI returns invalid JSON once, it retries and validates', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    // First attempt: malformed JSON. Second attempt: valid schema JSON.
    fakeProvider.setBehavior('test-partner', [
      { text: 'Not valid json at all!' },
      {
        text: JSON.stringify({
          reply: 'Valid partner reply after retry.',
          thought: 'Valid thought.',
          mood: {
            engagement: 0.5,
            rapport: 0.5,
            patience: 0.6,
            exitPressure: 0.3,
          },
          wantsToEnd: false,
          cue: 0.5,
        }),
      },
    ]);

    const turnRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/turn',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        attemptId,
        userText: 'Can you hear me?',
      },
    });

    expect(turnRes.statusCode).toBe(200);
    const turnBody = JSON.parse(turnRes.body);
    expect(turnBody.reply).toBe('Valid partner reply after retry.');
  });

  it('6. Provider failure: uses persona authored fallback lines and marks attempt degraded: true', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    // Primary and fallback models both fail with 500 error
    fakeProvider.setBehavior('test-partner', [
      { status: 500 },
      { status: 500 },
    ]);
    fakeProvider.setBehavior('test-fallback', [
      { status: 500 },
      { status: 500 },
    ]);

    const turnRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/turn',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        attemptId,
        userText: 'Hello?',
      },
    });

    expect(turnRes.statusCode).toBe(200);
    const turnBody = JSON.parse(turnRes.body);
    expect(turnBody.degraded).toBe(true);
    // Reply must be one of Maya's authored fallback lines
    expect(DEFAULT_MAYA_PERSONA.fallbackLines).toContain(turnBody.reply);
  });

  it('7. Daily cap enforcement: blocks new turns and returns CAP_REACHED 429 when cap is exceeded', async () => {
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'entitlements') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { plan: 'free', is_active: true }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_usage_daily') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  // Current count matches free limit (24)
                  maybeSingle: async () => ({
                    data: { turn_count: 24, reply_helper_count: 0, prep_count: 0 },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          insert: async () => ({ error: null }),
          update: () => ({ eq: async () => ({ error: null }) }),
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        };
      }),
    };

    const cappedApp = buildApp();
    await register(cappedApp, {
      env: mockEnv,
      provider: fakeProvider,
      supabase: mockSupabase as unknown as import('@supabase/supabase-js').SupabaseClient,
    });

    const res = await cappedApp.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });

    expect(res.statusCode).toBe(429);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CAP_REACHED');
  });

  it('8. Turn caps by mode: try mode wraps up after 6 turns', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    // Simulate 5 normal turns
    for (let i = 1; i <= 5; i++) {
      fakeProvider.setBehavior('test-partner', [
        {
          text: JSON.stringify({
            reply: `Turn ${i} reply.`,
            thought: `Turn ${i} thought.`,
            mood: { engagement: 0.5, rapport: 0.5, patience: 0.6, exitPressure: 0.2 },
            wantsToEnd: false,
            cue: 0.5,
          }),
        },
      ]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/partner/turn',
        headers: { authorization: `Bearer ${token}` },
        payload: { attemptId, userText: `Message ${i}` },
      });
      const data = JSON.parse(res.body);
      expect(data.wantsToEnd).toBe(false);
    }

    // 6th turn should trigger wantsToEnd = true because cap is 6
    fakeProvider.setBehavior('test-partner', [
      {
        text: JSON.stringify({
          reply: 'Final turn wrap up.',
          thought: 'Done with this chat.',
          mood: { engagement: 0.5, rapport: 0.5, patience: 0.5, exitPressure: 0.8 },
          wantsToEnd: false, // Model says false, but engine enforces turn cap!
          cue: 0.4,
        }),
      },
    ]);

    const turn6Res = await app.inject({
      method: 'POST',
      url: '/v1/partner/turn',
      headers: { authorization: `Bearer ${token}` },
      payload: { attemptId, userText: 'Message 6' },
    });
    const turn6Data = JSON.parse(turn6Res.body);
    expect(turn6Data.wantsToEnd).toBe(true);
  });

  it('9. POST /v1/partner/suggest returns 3 reply suggestions in user register', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    const suggestRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/suggest',
      headers: { authorization: `Bearer ${token}` },
      payload: { attemptId },
    });

    expect(suggestRes.statusCode).toBe(200);
    const suggestBody = JSON.parse(suggestRes.body);
    expect(suggestBody.suggestions).toBeInstanceOf(Array);
    expect(suggestBody.suggestions.length).toBe(3);
    for (const s of suggestBody.suggestions) {
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
    }
  });

  it('10. POST /v1/partner/hint returns 1 coaching perspective', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    const hintRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/hint',
      headers: { authorization: `Bearer ${token}` },
      payload: { attemptId },
    });

    expect(hintRes.statusCode).toBe(200);
    const hintBody = JSON.parse(hintRes.body);
    expect(typeof hintBody.hint).toBe('string');
    expect(hintBody.hint.length).toBeGreaterThan(5);
  });

  it('11. SSE streaming turn produces typing, reply chunks, and done events without thought', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    fakeProvider.setBehavior('test-partner', [
      {
        text: JSON.stringify({
          reply: 'Streaming works smoothly.',
          thought: 'SECRET_STREAMING_THOUGHT',
          mood: { engagement: 0.5, rapport: 0.5, patience: 0.6, exitPressure: 0.2 },
          wantsToEnd: false,
          cue: 0.5,
        }),
      },
    ]);

    const sseRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/turn',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        attemptId,
        userText: 'Test streaming',
        stream: true,
      },
    });

    expect(sseRes.statusCode).toBe(200);
    expect(sseRes.headers['content-type']).toContain('text/event-stream');
    const sseBody = sseRes.body;

    expect(sseBody).toContain('event: typing');
    expect(sseBody).toContain('event: reply');
    expect(sseBody).toContain('event: done');
    // Ensure secret thought is not in SSE payload
    expect(sseBody).not.toContain('SECRET_STREAMING_THOUGHT');
  });

  it('12. Pino log audit: zero user message text logged in logs', async () => {
    const sensitivePhrase = 'UNUSUAL_CONFIDENTIAL_USER_STRING_991823';

    const startRes = await app.inject({
      method: 'POST',
      url: '/v1/partner/start',
      headers: { authorization: `Bearer ${token}` },
      payload: validStartBody,
    });
    const { attemptId } = JSON.parse(startRes.body);

    const logSpy = vi.spyOn(console, 'log');

    await app.inject({
      method: 'POST',
      url: '/v1/partner/turn',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        attemptId,
        userText: sensitivePhrase,
      },
    });

    for (const call of logSpy.mock.calls) {
      for (const arg of call) {
        expect(JSON.stringify(arg)).not.toContain(sensitivePhrase);
      }
    }
    logSpy.mockRestore();
  });
});
