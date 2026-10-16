import { describe, expect, it, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import type { GatewayEnv } from '../../config/env.js';
import { FakeProvider } from '../../providers/fake.js';
import { register } from '../debrief.js';

describe('T-17 Gateway Debrief & Check-in Routes (/v1/debrief, /v1/checkin)', () => {
  const secretKey = 'test_secret_for_debrief_routes_32_bytes_long!';
  const testUserId = 'usr_debrief_tester_01';

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

  describe('POST /v1/debrief/start', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/debrief/start',
        payload: {},
      });
      expect(res.statusCode).toBe(401);
    });

    it('starts a debrief session and returns debriefId and 4-5 gentle questions', async () => {
      const sampleQuestions = [
        'How did the opening few minutes feel?',
        'Was there a moment your energy felt lower?',
        'What surprised you about their reaction?',
        'What took the most effort overall?',
      ];
      fakeProvider.setBehavior(mockEnv.MODEL_COACH, [
        { text: JSON.stringify({ questions: sampleQuestions }) },
      ]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/debrief/start',
        headers: { authorization: `Bearer ${token}` },
        payload: { momentId: 'mock-moment-id-123' },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.debriefId).toBeDefined();
      expect(Array.isArray(data.questions)).toBe(true);
      expect(data.questions.length).toBeGreaterThanOrEqual(4);
      expect(data.questions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /v1/debrief/answer', () => {
    it('appends safe answer and advances to next question or completes', async () => {
      // First start debrief
      fakeProvider.setBehavior(mockEnv.MODEL_COACH, [
        {
          text: JSON.stringify({
            questions: ['Question 1?', 'Question 2?', 'Question 3?', 'Question 4?'],
          }),
        },
      ]);

      const startRes = await app.inject({
        method: 'POST',
        url: '/v1/debrief/start',
        headers: { authorization: `Bearer ${token}` },
        payload: {},
      });
      const { debriefId } = JSON.parse(startRes.body);

      // Answer question 1
      const ansRes = await app.inject({
        method: 'POST',
        url: '/v1/debrief/answer',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          debriefId,
          answerText: 'I felt a bit nervous at first, but calmed down.',
          questionIndex: 0,
        },
      });

      expect(ansRes.statusCode).toBe(200);
      const ansData = JSON.parse(ansRes.body);
      expect(ansData.crisis).toBe(false);
      expect(ansData.done).toBe(false);
      expect(ansData.nextQuestionIndex).toBe(1);
    });

    it('CRITICAL: Crisis phrase in answer returns { crisis: true } with NO AI text', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/debrief/answer',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          debriefId: 'debrief-crisis-test',
          answerText: 'I want to end my life, everything is hopeless and I want to kill myself',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.crisis).toBe(true);
      // Guarantee NO AI text is present in the response
      expect(data.reply).toBeUndefined();
      expect(data.text).toBeUndefined();
      expect(data.aiText).toBeUndefined();
      expect(data.nextQuestion).toBeUndefined();
      expect(Object.keys(data)).toEqual(['crisis']);
    });
  });

  describe('POST /v1/debrief/finish', () => {
    it('generates editable takeaway card with headline, coreEssence, quoteContext', async () => {
      fakeProvider.setBehavior(mockEnv.MODEL_COACH, [
        {
          text: JSON.stringify({
            takeaway: 'You found a natural hook early that eased pressure.',
            coreEssence: 'Asking about their week did the heavy lifting.',
            oneNextFocus: 'Next time, take one quiet breath before wrapping up.',
          }),
        },
      ]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/debrief/finish',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          debriefId: 'debrief-finish-test',
          answers: [
            { question: 'How did it go?', answer: 'Better than I anticipated.' },
            { question: 'What drained you?', answer: 'The initial waiting was worst.' },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.takeaway).toBeDefined();
      expect(data.takeaway.headline).toBe('You found a natural hook early that eased pressure.');
      expect(data.takeaway.coreEssence).toBe('Asking about their week did the heavy lifting.');
      expect(data.takeaway.quoteContext).toBe('Next time, take one quiet breath before wrapping up.');
    });
  });

  describe('POST /v1/checkin/reflect', () => {
    it('returns exactly 1 neutral line of reflection with no score, grade, or judgement words', async () => {
      fakeProvider.setBehavior(mockEnv.MODEL_COACH, [
        {
          text: JSON.stringify({
            reflection: 'You expected 7 out of 10 draining; it was 4, with warmth landing close to what you forecasted.',
          }),
        },
      ]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/checkin/reflect',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          forecast: { draining: 7, warmth: 5 },
          actual: { draining: 4, warmth: 6 },
          landed: true,
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(typeof data.reflection).toBe('string');
      expect(data.reflection.length).toBeGreaterThan(0);

      // Verify strict neutrality: no grades, scores, or judgement words
      const bannedJudgements = [
        'great job',
        'you failed',
        'failure',
        'points',
        'score',
        'grade',
        'rating',
        'success',
        'won',
        'lost',
      ];
      for (const banned of bannedJudgements) {
        expect(data.reflection.toLowerCase()).not.toContain(banned);
      }
    });
  });
});
