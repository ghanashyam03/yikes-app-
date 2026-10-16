import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { getPlanLimits, type PlanType } from '../config/limits.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { logger } from '../telemetry/logger.js';

export const WebhookEventSchema = z.object({
  type: z.string().min(1),
  app_user_id: z.string().min(1),
  original_app_user_id: z.string().optional(),
  product_id: z.string().optional(),
  entitlement_id: z.string().optional(),
  entitlement_ids: z.array(z.string()).optional(),
  expiration_at_ms: z.number().nullable().optional(),
  purchased_at_ms: z.number().nullable().optional(),
  environment: z.string().optional(),
});

export const RevenueCatWebhookSchema = z.object({
  api_version: z.string().optional(),
  event: WebhookEventSchema,
});

export type RevenueCatWebhookPayload = z.infer<typeof RevenueCatWebhookSchema>;

export interface RegisterBillingRoutesOptions {
  env?: GatewayEnv | undefined;
  supabase?: SupabaseClient | null | undefined;
  webhookSecret?: string | undefined;
}

// In-memory store fallback for test suites and environments without Supabase connection
const memoryEntitlements = new Map<
  string,
  {
    plan: PlanType;
    isActive: boolean;
    expiresAt: string | null;
    updatedAt: string;
  }
>();

export function clearMemoryEntitlements(): void {
  memoryEntitlements.clear();
}

export function setMemoryEntitlement(
  userId: string,
  entitlement: { plan: PlanType; isActive: boolean; expiresAt: string | null; updatedAt?: string }
): void {
  memoryEntitlements.set(userId, {
    ...entitlement,
    updatedAt: entitlement.updatedAt ?? new Date().toISOString(),
  });
}

export function getMemoryEntitlement(userId: string) {
  return memoryEntitlements.get(userId);
}

export async function register(
  app: FastifyInstance,
  options?: RegisterBillingRoutesOptions
): Promise<void> {
  let env: GatewayEnv;
  try {
    env = options?.env ?? loadEnv();
  } catch {
    env = {
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
      AI_PROVIDER: 'fake',
      HOST: '0.0.0.0',
      PORT: 3000,
      REQUEST_TIMEOUT_MS: 8000,
      RPM_LIMIT: 35,
    };
  }

  const authMiddleware = createAuthMiddleware(env);

  let supabaseClient: SupabaseClient | null = null;
  if (options?.supabase !== undefined) {
    supabaseClient = options.supabase;
  } else if (
    env.SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    !env.SUPABASE_URL.includes('example.supabase.co') &&
    env.AI_PROVIDER !== 'fake'
  ) {
    try {
      supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    } catch (err) {
      logger.error({ err }, 'Failed to initialize Supabase client for billing');
    }
  }

  const expectedWebhookToken =
    options?.webhookSecret ??
    process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN ??
    'rc_webhook_secret_key';

  /**
   * POST /v1/billing/webhook
   * RevenueCat signed webhook handler writing entitlements to subscriptions/entitlements table.
   * Validates bearer token signature; rejects invalid requests.
   */
  app.post('/v1/billing/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. Signature / Bearer Token Validation
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Missing or malformed Authorization header. Expected Bearer token signature.',
        code: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.slice(7).trim();
    if (token !== expectedWebhookToken) {
      return reply.status(401).send({
        error: 'Invalid webhook signature bearer token.',
        code: 'INVALID_SIGNATURE',
      });
    }

    // 2. Validate Webhook Body
    const parseResult = RevenueCatWebhookSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid RevenueCat webhook payload structure.',
        details: parseResult.error.flatten(),
        code: 'BAD_REQUEST',
      });
    }

    const { event } = parseResult.data;
    const userId = event.app_user_id;
    const eventType = event.type.toUpperCase();

    logger.info({ eventType, userId }, 'Processing RevenueCat billing webhook event');

    // 3. Determine Plan & Entitlement State based on event type
    let targetPlan: PlanType = 'free';
    let isActive = false;
    let expiresAt: string | null = null;

    if (event.expiration_at_ms) {
      expiresAt = new Date(event.expiration_at_ms).toISOString();
    }

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE': {
        targetPlan = 'plus';
        isActive = true;
        break;
      }

      case 'CANCELLATION': {
        // User cancelled auto-renew, but entitlement remains active until expiration_at_ms
        if (event.expiration_at_ms && event.expiration_at_ms > Date.now()) {
          targetPlan = 'plus';
          isActive = true;
        } else {
          targetPlan = 'free';
          isActive = false;
        }
        break;
      }

      case 'EXPIRATION':
      case 'REVOCATION':
      case 'BILLING_ISSUE': {
        // Subscription expired or revoked (e.g. refunded) -> revert to free
        targetPlan = 'free';
        isActive = false;
        break;
      }

      case 'TEST': {
        return reply.status(200).send({ received: true, test: true });
      }

      default: {
        logger.info({ eventType }, 'Unhandled RevenueCat event type; acknowledging without change');
        return reply.status(200).send({ received: true, unhandled: true });
      }
    }

    // 4. Persist to entitlements table
    const nowIso = new Date().toISOString();
    if (supabaseClient) {
      try {
        const { data: existing, error: selectErr } = await supabaseClient
          .from('entitlements')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (selectErr) {
          logger.error({ selectErr, userId }, 'Error checking existing entitlement');
        }

        if (existing) {
          const { error: updateErr } = await supabaseClient
            .from('entitlements')
            .update({
              plan: targetPlan,
              is_active: isActive,
              expires_at: expiresAt,
              updated_at: nowIso,
            })
            .eq('user_id', userId);

          if (updateErr) {
            logger.error({ updateErr, userId }, 'Error updating entitlement');
          }
        } else {
          const { error: insertErr } = await supabaseClient.from('entitlements').insert({
            user_id: userId,
            plan: targetPlan,
            is_active: isActive,
            expires_at: expiresAt,
            updated_at: nowIso,
          });

          if (insertErr) {
            logger.error({ insertErr, userId }, 'Error inserting entitlement');
          }
        }
      } catch (dbErr) {
        logger.error({ dbErr, userId }, 'Database operation failed for webhook');
      }
    }

    // Always update in-memory store (for test suites and cache)
    setMemoryEntitlement(userId, {
      plan: targetPlan,
      isActive,
      expiresAt,
      updatedAt: nowIso,
    });

    return reply.status(200).send({
      received: true,
      userId,
      plan: targetPlan,
      isActive,
      expiresAt,
    });
  });

  /**
   * GET /v1/billing/entitlements
   * Authenticated route returning user active plan and quota limits.
   */
  app.get(
    '/v1/billing/entitlements',
    { onRequest: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;

      if (!userId) {
        return reply.status(401).send({
          error: 'Authentication required to inspect entitlements',
          code: 'UNAUTHORIZED',
        });
      }

      let activePlan: PlanType = 'free';
      let isActive = true;
      let expiresAt: string | null = null;

      // 1. Check in-memory store or Supabase
      const memRecord = memoryEntitlements.get(userId);
      if (memRecord) {
        activePlan = memRecord.plan;
        isActive = memRecord.isActive;
        expiresAt = memRecord.expiresAt;
      } else if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('entitlements')
            .select('plan, is_active, expires_at')
            .eq('user_id', userId)
            .maybeSingle();

          if (!error && data) {
            activePlan = data.plan === 'plus' ? 'plus' : 'free';
            isActive = data.is_active ?? true;
            expiresAt = data.expires_at ?? null;
          }
        } catch (dbErr) {
          logger.error({ dbErr, userId }, 'Failed to fetch entitlements from database');
        }
      }

      // 2. Validate expiration timestamp
      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        activePlan = 'free';
        isActive = false;
      }

      // 3. Compute Quota Limits from limits.ts
      const limits = getPlanLimits(activePlan);

      return reply.status(200).send({
        userId,
        plan: activePlan,
        isActive,
        expiresAt,
        limits: {
          chatTurnsDaily: limits.chatTurnsDaily,
          replyHelperWeekly: Number.isFinite(limits.replyHelperWeekly)
            ? limits.replyHelperWeekly
            : -1,
          prepWeekly: Number.isFinite(limits.prepWeekly) ? limits.prepWeekly : -1,
        },
        features: {
          unlimitedChat: activePlan === 'plus',
          unlimitedReplyHelper: activePlan === 'plus',
          unlimitedPrep: activePlan === 'plus',
          weeklyLetter: activePlan === 'plus',
          voiceMatch: activePlan === 'plus',
          batteryInsights: activePlan === 'plus',
        },
      });
    }
  );
}
