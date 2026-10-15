import Fastify from 'fastify';
import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import type { GatewayEnv } from '../../config/env.js';
import { createAuthMiddleware } from '../auth.js';

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

async function createToken(sub: string, secretStr = testSecret): Promise<string> {
  const secret = new TextEncoder().encode(secretStr);
  return await new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

describe('Auth Middleware', () => {
  it('rejects request with 401 when Authorization header is missing', async () => {
    const app = Fastify();
    app.addHook('onRequest', createAuthMiddleware(mockEnv));
    app.get('/protected', async (req) => ({ userId: req.userId }));

    const res = await app.inject({ method: 'GET', url: '/protected' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toContain('Authorization');
    await app.close();
  });

  it('rejects request with 401 when token signature is invalid', async () => {
    const app = Fastify();
    app.addHook('onRequest', createAuthMiddleware(mockEnv));
    app.get('/protected', async (req) => ({ userId: req.userId }));

    const forgedToken = await createToken('hacker', 'different-secret-different-secret-32!');
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${forgedToken}` },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('verifies valid JWT and attaches userId to request, ignoring body userId', async () => {
    const app = Fastify();
    app.addHook('onRequest', createAuthMiddleware(mockEnv));
    app.post('/protected', async (req) => ({ userId: req.userId }));

    const validToken = await createToken('user-uuid-1234');
    const res = await app.inject({
      method: 'POST',
      url: '/protected',
      headers: { authorization: `Bearer ${validToken}` },
      payload: { userId: 'spoofed-body-user' }, // attempt to spoof via body
    });

    expect(res.statusCode).toBe(200);
    // User id NEVER comes from request body!
    expect(res.json().userId).toBe('user-uuid-1234');
    await app.close();
  });
});
