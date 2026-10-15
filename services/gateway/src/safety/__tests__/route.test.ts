import Fastify from 'fastify';
import { SignJWT } from 'jose';
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GatewayEnv } from '../../config/env.js';
import { register as registerSafetyRoutes } from '../../routes/safety.js';

const testSecret = 'super-secret-test-jwt-key-minimum-32-chars!!';

const mockEnv: GatewayEnv = {
  NVIDIA_API_KEY: 'test-key',
  NVIDIA_BASE_URL: 'https://integrate.api.nvidia.com/v1',
  MODEL_PARTNER: 'test-primary',
  MODEL_PARTNER_FALLBACK: 'test-fallback',
  MODEL_COACH: 'test-coach',
  MODEL_COACH_FALLBACK: 'test-coach-fallback',
  MODEL_JUDGE: 'test-judge',
  MODEL_SAFETY: 'test-safety',
  MODEL_VISION: 'test-vision',
  MODEL_LONG: 'test-long',
  MODEL_ALT: 'test-alt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  SUPABASE_JWT_SECRET: testSecret,
  RPM_LIMIT: 35,
  AI_PROVIDER: 'fake',
  PORT: 3000,
  HOST: '0.0.0.0',
  REQUEST_TIMEOUT_MS: 8000,
};

async function createToken(sub = 'user-123'): Promise<string> {
  const secret = new TextEncoder().encode(testSecret);
  return await new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

describe('POST /v1/safety/check route', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const app = Fastify();
    await registerSafetyRoutes(app, { env: mockEnv });

    const res = await app.inject({
      method: 'POST',
      url: '/v1/safety/check',
      payload: {
        text: 'Hello world',
        direction: 'input',
      },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('authenticates with JWT, returns verdict, and logs safety_events metadata only', async () => {
    const app = Fastify();

    let loggedRow: unknown = null;
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockImplementation((payload: unknown) => {
          loggedRow = payload;
          return Promise.resolve({ error: null });
        }),
      }),
    } as unknown as SupabaseClient;

    await registerSafetyRoutes(app, {
      env: mockEnv,
      supabase: mockSupabase,
      checkOptions: { skipModel: true },
    });

    const token = await createToken('user-123');

    // 1. Benign request
    const benignRes = await app.inject({
      method: 'POST',
      url: '/v1/safety/check',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        text: 'I was nervous during small talk at the reception.',
        direction: 'input',
      },
    });

    expect(benignRes.statusCode).toBe(200);
    const benignBody = benignRes.json();
    expect(benignBody.verdict).toBe('allow');
    expect(loggedRow).toEqual({
      kind: 'allow',
      source: 'input',
    });

    // 2. Crisis request
    const crisisRes = await app.inject({
      method: 'POST',
      url: '/v1/safety/check',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        text: 'I want to kill myself',
        direction: 'input',
      },
    });

    expect(crisisRes.statusCode).toBe(200);
    const crisisBody = crisisRes.json();
    expect(crisisBody.verdict).toBe('crisis');
    expect(loggedRow).toEqual({
      kind: 'crisis',
      source: 'input',
    });

    // Verify privacy: NO text was ever logged
    expect(JSON.stringify(loggedRow)).not.toContain('kill myself');

    await app.close();
  });
});
