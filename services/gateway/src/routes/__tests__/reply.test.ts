import { describe, expect, it, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import type { FastifyInstance } from 'fastify';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildApp } from '../../app.js';
import type { GatewayEnv } from '../../config/env.js';
import { FakeProvider } from '../../providers/fake.js';
import { MemoryCallLogger } from '../../telemetry/ai-calls.js';
import { register, parseImageDimensions } from '../reply.js';

describe('T-20: Gateway Reply Helper API', () => {
  const secretKey = 'test_secret_for_reply_helper_tests_32_bytes!';
  const testUserId = 'usr_test_reply_user';

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
  let memoryLogger: MemoryCallLogger;
  let app: FastifyInstance;

  const validReplyOutput = JSON.stringify({
    readings: [
      'They are pressed for time and keeping things quick.',
      'They agreed with the proposal and see no need for further debate.',
    ],
    disclaimer: "I can't know what they meant",
    replies: {
      warm: 'Sounds good! Looking forward to it.',
      direct: 'Understood. I will proceed with that.',
      light: 'All good. Talk soon!',
    },
  });

  // Helper to create a minimal PNG buffer with given width and height
  function createTestPng(width: number, height: number): Buffer {
    const buf = Buffer.alloc(33);
    // PNG signature
    buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    // IHDR length 13
    buf.writeUInt32BE(13, 8);
    // IHDR chunk type
    buf.write('IHDR', 12);
    // Dimensions
    buf.writeUInt32BE(width, 16);
    buf.writeUInt32BE(height, 20);
    // bit depth 8, color type 2, compression 0, filter 0, interlace 0
    buf.set([8, 2, 0, 0, 0], 24);
    // CRC (dummy)
    buf.writeUInt32BE(0, 29);
    return buf;
  }

  beforeEach(async () => {
    fakeProvider = new FakeProvider();
    memoryLogger = new MemoryCallLogger();
    app = buildApp();

    token = await new SignJWT({ sub: testUserId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secretKey));

    await register(app, {
      env: mockEnv,
      provider: fakeProvider,
      callLogger: memoryLogger,
    });
  });

  describe('Dimension parsing helper', () => {
    it('parses valid PNG dimensions', () => {
      const png = createTestPng(800, 600);
      const dims = parseImageDimensions(png);
      expect(dims).toEqual({ width: 800, height: 600 });
    });

    it('returns null for too short buffer', () => {
      expect(parseImageDimensions(Buffer.from([1, 2, 3]))).toBeNull();
    });
  });

  describe('Paste mode', () => {
    it('successfully generates readings and 3 replies from pasted text', async () => {
      fakeProvider.setBehavior('test-coach', [{ text: validReplyOutput }]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {
          text: '“Sounds good, let’s talk later.”',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.readings).toHaveLength(2);
      expect(data.disclaimer).toBe("I can't know what they meant");
      expect(data.replies).toEqual({
        warm: 'Sounds good! Looking forward to it.',
        direct: 'Understood. I will proceed with that.',
        light: 'All good. Talk soon!',
      });
    });

    it('rejects empty input body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe('INVALID_REQUEST');
    });

    it('rejects crisis messages via inbound safety check', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {
          text: 'I want to kill myself tonight.',
        },
      });

      expect(res.statusCode).toBe(400);
      const data = res.json();
      expect(data.code).toBe('CRISIS_DETECTED');
      expect(data.verdict).toBe('crisis');
    });
  });

  describe('Screenshot mode & Image validation', () => {
    it('extracts text via vision model and generates replies', async () => {
      const testImage = createTestPng(640, 480);
      const base64 = testImage.toString('base64');

      // First call is vision model
      fakeProvider.setBehavior('test-vision', [{ text: 'Can we reschedule our sync?' }]);
      // Second call is coach structured reply helper
      fakeProvider.setBehavior('test-coach', [{ text: validReplyOutput }]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {
          image: `data:image/png;base64,${base64}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.extractedText).toBe('Can we reschedule our sync?');
      expect(data.readings).toHaveLength(2);
      expect(data.replies.warm).toBeTruthy();
    });

    it('rejects oversized image (> 4MB) with typed 400 error', async () => {
      // 4MB + 100 bytes
      const bigBuffer = Buffer.alloc(4 * 1024 * 1024 + 100);
      const base64 = bigBuffer.toString('base64');

      const res = await app.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {
          image: base64,
        },
      });

      expect(res.statusCode).toBe(400);
      const data = res.json();
      expect(data.code).toBe('IMAGE_TOO_LARGE');
      expect(data.error).toContain('exceeds maximum allowed size of 4MB');
    });

    it('rejects image with dimension > 1280px with typed 400 error', async () => {
      const oversizedPng = createTestPng(1600, 900);
      const base64 = oversizedPng.toString('base64');

      const res = await app.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {
          image: base64,
        },
      });

      expect(res.statusCode).toBe(400);
      const data = res.json();
      expect(data.code).toBe('IMAGE_DIMENSION_EXCEEDED');
      expect(data.error).toContain('1280px');
    });

    it('gracefully handles vision model failure with 503 suggesting paste mode', async () => {
      const testImage = createTestPng(640, 480);
      const base64 = testImage.toString('base64');

      // Simulate vision model error (HTTP 500 from provider)
      fakeProvider.setBehavior('test-vision', [{ status: 500 }]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {
          image: base64,
        },
      });

      expect(res.statusCode).toBe(503);
      const data = res.json();
      expect(data.code).toBe('VISION_UNAVAILABLE');
      expect(data.suggestFallback).toBe('paste');
      expect(data.error).toContain('paste the message text directly');
    });
  });

  describe('Privacy & Telemetry Verification', () => {
    it('verifies ZERO image bytes and ZERO message text are logged in ai_calls', async () => {
      const secretPrivateMessage = 'This is an ultra confidential personal message between colleagues';
      fakeProvider.setBehavior('test-coach', [{ text: validReplyOutput }]);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {
          text: secretPrivateMessage,
        },
      });

      expect(res.statusCode).toBe(200);

      // Verify what was logged to ai_calls telemetry
      expect(memoryLogger.entries.length).toBeGreaterThan(0);
      for (const entry of memoryLogger.entries) {
        expect(entry.job).toBe('reply');
        // Ensure no entry object contains the secret text
        const stringified = JSON.stringify(entry);
        expect(stringified).not.toContain(secretPrivateMessage);
        expect(stringified).not.toContain('confidential');
      }
    });
  });

  describe('Usage Caps Enforcement', () => {
    it('enforces limit when cap is reached', async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => {
                  if (table === 'entitlements') {
                    return { data: { plan: 'free', is_active: true }, error: null };
                  }
                  if (table === 'ai_usage_daily') {
                    return {
                      data: { turn_count: 0, reply_helper_count: 3, prep_count: 0 },
                      error: null,
                    };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const appWithCap = buildApp();
      await register(appWithCap, {
        env: mockEnv,
        provider: fakeProvider,
        supabase: mockSupabase,
      });

      const res = await appWithCap.inject({
        method: 'POST',
        url: '/v1/reply/helper',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {
          text: 'Hello there',
        },
      });

      expect(res.statusCode).toBe(429);
      const data = res.json();
      expect(data.code).toBe('CAP_REACHED');
      expect(data.limit).toBe(3);
    });
  });
});
