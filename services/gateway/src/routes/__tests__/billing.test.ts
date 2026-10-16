import { describe, expect, it, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import type { GatewayEnv } from '../../config/env.js';
import {
  clearMemoryEntitlements,
  getMemoryEntitlement,
  register,
  setMemoryEntitlement,
} from '../billing.js';

describe('T-23: Gateway Billing & Entitlements API', () => {
  const secretKey = 'test_secret_for_billing_tests_32_bytes!';
  const webhookSecret = 'test_rc_webhook_secret_key_123';
  const testUserId = 'usr_billing_test_user_1';

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

  beforeEach(async () => {
    clearMemoryEntitlements();
    token = await new SignJWT({ sub: testUserId, role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2h')
      .sign(new TextEncoder().encode(secretKey));

    app = buildApp({ env: mockEnv, enableLogger: false });
    await register(app, {
      env: mockEnv,
      supabase: null,
      webhookSecret,
    });
  });

  describe('Acceptance Check 1: Webhook Signature Authentication', () => {
    it('rejects requests missing the Authorization header with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/webhook',
        payload: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: testUserId,
          },
        },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().code).toBe('UNAUTHORIZED');
    });

    it('rejects requests with invalid bearer token signature with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/webhook',
        headers: {
          authorization: 'Bearer wrong_token_value',
        },
        payload: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: testUserId,
          },
        },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().code).toBe('INVALID_SIGNATURE');
    });

    it('accepts requests with valid bearer token signature with 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/webhook',
        headers: {
          authorization: `Bearer ${webhookSecret}`,
        },
        payload: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: testUserId,
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().received).toBe(true);
    });

    it('rejects malformed payload structure with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/webhook',
        headers: {
          authorization: `Bearer ${webhookSecret}`,
        },
        payload: {
          invalid: 'body',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe('BAD_REQUEST');
    });
  });

  describe('Acceptance Check 2: Entitlement Transitions (free to Plus, expiry, refund)', () => {
    it('transitions free user to Plus on INITIAL_PURCHASE', async () => {
      const futureExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/webhook',
        headers: {
          authorization: `Bearer ${webhookSecret}`,
        },
        payload: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: testUserId,
            product_id: 'plus_monthly',
            expiration_at_ms: futureExpiry,
          },
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.plan).toBe('plus');
      expect(data.isActive).toBe(true);
      expect(data.expiresAt).toBe(new Date(futureExpiry).toISOString());

      const stored = getMemoryEntitlement(testUserId);
      expect(stored?.plan).toBe('plus');
      expect(stored?.isActive).toBe(true);
    });

    it('transitions user back to free on EXPIRATION', async () => {
      // First make user plus
      setMemoryEntitlement(testUserId, {
        plan: 'plus',
        isActive: true,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });

      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/webhook',
        headers: {
          authorization: `Bearer ${webhookSecret}`,
        },
        payload: {
          event: {
            type: 'EXPIRATION',
            app_user_id: testUserId,
            expiration_at_ms: Date.now() - 1000,
          },
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.plan).toBe('free');
      expect(data.isActive).toBe(false);

      const stored = getMemoryEntitlement(testUserId);
      expect(stored?.plan).toBe('free');
      expect(stored?.isActive).toBe(false);
    });

    it('transitions user back to free immediately on REVOCATION (refund)', async () => {
      setMemoryEntitlement(testUserId, {
        plan: 'plus',
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/webhook',
        headers: {
          authorization: `Bearer ${webhookSecret}`,
        },
        payload: {
          event: {
            type: 'REVOCATION',
            app_user_id: testUserId,
          },
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.plan).toBe('free');
      expect(data.isActive).toBe(false);

      const stored = getMemoryEntitlement(testUserId);
      expect(stored?.plan).toBe('free');
      expect(stored?.isActive).toBe(false);
    });

    it('handles CANCELLATION keeping plus active until expiration', async () => {
      const futureExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/webhook',
        headers: {
          authorization: `Bearer ${webhookSecret}`,
        },
        payload: {
          event: {
            type: 'CANCELLATION',
            app_user_id: testUserId,
            expiration_at_ms: futureExpiry,
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().plan).toBe('plus');
      expect(res.json().isActive).toBe(true);
    });
  });

  describe('Acceptance Check 4: Caps Change with the Plan & GET /v1/billing/entitlements', () => {
    it('returns free tier caps (40 chat, 3 reply helper, 1 prep) for default/unsubscribed user', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/billing/entitlements',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.plan).toBe('free');
      expect(body.limits.chatTurnsDaily).toBe(40);
      expect(body.limits.replyHelperWeekly).toBe(3);
      expect(body.limits.prepWeekly).toBe(1);
      expect(body.features.unlimitedChat).toBe(false);
      expect(body.features.unlimitedReplyHelper).toBe(false);
      expect(body.features.unlimitedPrep).toBe(false);
    });

    it('returns plus tier caps (120 chat, unlimited reply helper and prep) for subscribed user', async () => {
      setMemoryEntitlement(testUserId, {
        plan: 'plus',
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const res = await app.inject({
        method: 'GET',
        url: '/v1/billing/entitlements',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.plan).toBe('plus');
      expect(body.isActive).toBe(true);
      expect(body.limits.chatTurnsDaily).toBe(120);
      expect(body.limits.replyHelperWeekly).toBe(-1); // Unlimited
      expect(body.limits.prepWeekly).toBe(-1); // Unlimited
      expect(body.features.unlimitedChat).toBe(true);
      expect(body.features.unlimitedReplyHelper).toBe(true);
      expect(body.features.unlimitedPrep).toBe(true);
      expect(body.features.weeklyLetter).toBe(true);
      expect(body.features.voiceMatch).toBe(true);
    });

    it('reverts to free caps when plus entitlement expires', async () => {
      setMemoryEntitlement(testUserId, {
        plan: 'plus',
        isActive: true,
        expiresAt: new Date(Date.now() - 5000).toISOString(), // expired 5s ago
      });

      const res = await app.inject({
        method: 'GET',
        url: '/v1/billing/entitlements',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.plan).toBe('free');
      expect(body.isActive).toBe(false);
      expect(body.limits.chatTurnsDaily).toBe(40);
      expect(body.limits.replyHelperWeekly).toBe(3);
      expect(body.limits.prepWeekly).toBe(1);
    });

    it('rejects GET /v1/billing/entitlements without authorization header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/billing/entitlements',
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
