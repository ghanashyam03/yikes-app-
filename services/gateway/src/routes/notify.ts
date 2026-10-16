/**
 * notify.ts — Gateway routes for push token registration, notification preferences, and notification jobs
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { MockPushSender, type PushSender } from '../jobs/notify/types.js';
import { runWelcomeBackJob, type WelcomeBackCandidate } from '../jobs/notify/welcomeBackJob.js';
import { runWeeklyLetterJob, type WeeklyLetterCandidate } from '../jobs/notify/weeklyLetterJob.js';

export const PushTokenRequestSchema = z.object({
  pushToken: z.string().min(1),
});

export const UpdatePrefsRequestSchema = z.object({
  windowStart: z.string().optional(),
  windowEnd: z.string().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  pausedUntil: z.string().nullable().optional(),
  toggles: z.record(z.boolean()).optional(),
});

export const TriggerWelcomeBackJobSchema = z.object({
  candidates: z
    .array(
      z.object({
        userId: z.string(),
        pushToken: z.string(),
        lastActiveAt: z.string(),
        lastWelcomeBackAt: z.string().nullable().optional(),
        quietHoursStart: z.string().nullable().optional(),
        quietHoursEnd: z.string().nullable().optional(),
        pausedUntil: z.string().nullable().optional(),
        toggles: z.record(z.boolean()).nullable().optional(),
      })
    )
    .optional(),
  now: z.string().optional(),
});

export const TriggerWeeklyLetterJobSchema = z.object({
  candidates: z
    .array(
      z.object({
        userId: z.string(),
        pushToken: z.string(),
        letterId: z.string(),
        quietHoursStart: z.string().nullable().optional(),
        quietHoursEnd: z.string().nullable().optional(),
        pausedUntil: z.string().nullable().optional(),
        toggles: z.record(z.boolean()).nullable().optional(),
      })
    )
    .optional(),
  now: z.string().optional(),
});

export interface RegisterNotifyRoutesOptions {
  env?: GatewayEnv | undefined;
  supabase?: SupabaseClient | null | undefined;
  pushSender?: PushSender | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterNotifyRoutesOptions
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
  const pushSender = options?.pushSender ?? new MockPushSender();

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
    } catch {
      supabaseClient = null;
    }
  }

  // In-memory store fallback for testing or degraded mode
  const memoryPrefsStore = new Map<string, Record<string, unknown>>();

  /**
   * POST /v1/notify/token — Save or update push token for authenticated user
   */
  app.post(
    '/v1/notify/token',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = PushTokenRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          issues: parsed.error.issues,
        });
      }

      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { pushToken } = parsed.data;

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('notification_prefs')
            .upsert(
              {
                user_id: userId,
                push_token: pushToken,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          if (error) {
            return reply.status(500).send({ error: 'Failed to save push token' });
          }
        } catch {
          // Fall back to memory store
        }
      }

      const existing = memoryPrefsStore.get(userId) ?? { user_id: userId };
      memoryPrefsStore.set(userId, {
        ...existing,
        push_token: pushToken,
        updated_at: new Date().toISOString(),
      });

      return reply.send({ ok: true, pushToken });
    }
  );

  /**
   * GET /v1/notify/prefs — Retrieve notification preferences
   */
  app.get(
    '/v1/notify/prefs',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('notification_prefs')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!error && data) {
            return reply.send({ ok: true, prefs: data });
          }
        } catch {
          // Continue to fallback
        }
      }

      const memory = memoryPrefsStore.get(userId) ?? {
        user_id: userId,
        push_token: null,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        window_start: '09:00',
        window_end: '21:00',
        paused_until: null,
        toggles: {
          rhythm_nudge: true,
          moment_prompt: true,
          checkin_nudge: true,
          review_due: true,
          weekly_letter: true,
          welcome_back: true,
        },
      };

      return reply.send({ ok: true, prefs: memory });
    }
  );

  /**
   * PATCH /v1/notify/prefs — Update notification preferences
   */
  app.patch(
    '/v1/notify/prefs',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = UpdatePrefsRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          issues: parsed.error.issues,
        });
      }

      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (parsed.data.windowStart !== undefined) updates.window_start = parsed.data.windowStart;
      if (parsed.data.windowEnd !== undefined) updates.window_end = parsed.data.windowEnd;
      if (parsed.data.quietHoursStart !== undefined) updates.quiet_hours_start = parsed.data.quietHoursStart;
      if (parsed.data.quietHoursEnd !== undefined) updates.quiet_hours_end = parsed.data.quietHoursEnd;
      if (parsed.data.pausedUntil !== undefined) updates.paused_until = parsed.data.pausedUntil;
      if (parsed.data.toggles !== undefined) updates.toggles = parsed.data.toggles;

      if (supabaseClient) {
        try {
          await supabaseClient
            .from('notification_prefs')
            .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });
        } catch {
          // Continue
        }
      }

      const current = memoryPrefsStore.get(userId) ?? { user_id: userId };
      const next = { ...current, ...updates };
      memoryPrefsStore.set(userId, next);

      return reply.send({ ok: true, prefs: next });
    }
  );

  /**
   * POST /v1/jobs/notify/welcome-back — Server job for welcome back notifications
   */
  app.post('/v1/jobs/notify/welcome-back', async (request: FastifyRequest, reply: FastifyReply) => {
    // Secret header check or service authorization
    const jobSecret = request.headers['x-job-secret'];
    const expectedSecret = process.env.JOB_SECRET || 'dev-job-secret';

    if (jobSecret !== expectedSecret && request.headers.authorization === undefined) {
      return reply.status(403).send({ error: 'Forbidden: invalid job secret' });
    }

    const parsed = TriggerWelcomeBackJobSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', issues: parsed.error.issues });
    }

    const candidates: WelcomeBackCandidate[] = parsed.data.candidates ?? [];
    const now = parsed.data.now ? new Date(parsed.data.now) : new Date();

    const result = await runWelcomeBackJob(candidates, pushSender, { now });
    return reply.send({ ok: true, ...result });
  });

  /**
   * POST /v1/jobs/notify/weekly-letter — Server job for weekly letter notifications
   */
  app.post('/v1/jobs/notify/weekly-letter', async (request: FastifyRequest, reply: FastifyReply) => {
    const jobSecret = request.headers['x-job-secret'];
    const expectedSecret = process.env.JOB_SECRET || 'dev-job-secret';

    if (jobSecret !== expectedSecret && request.headers.authorization === undefined) {
      return reply.status(403).send({ error: 'Forbidden: invalid job secret' });
    }

    const parsed = TriggerWeeklyLetterJobSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', issues: parsed.error.issues });
    }

    const candidates: WeeklyLetterCandidate[] = parsed.data.candidates ?? [];
    const now = parsed.data.now ? new Date(parsed.data.now) : new Date();

    const result = await runWeeklyLetterJob(candidates, pushSender, { now });
    return reply.send({ ok: true, ...result });
  });
}
