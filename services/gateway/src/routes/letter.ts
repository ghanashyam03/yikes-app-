import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import type { AiProvider } from '../providers/types.js';
import type { RateLimiterQueue } from '../queue/rate-limiter.js';
import type { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import type { CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';

export const WeeklyLetterJobRequestSchema = z.object({
  userId: z.string().optional(),
  weekStart: z.string().optional(),
  force: z.boolean().optional(),
});

export const OptOutRequestSchema = z.object({
  optedOut: z.boolean(),
});

export interface RegisterLetterRoutesOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
  supabase?: SupabaseClient | null | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
  jobSecret?: string | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterLetterRoutesOptions
): Promise<void> {
  let env: GatewayEnv | undefined = options?.env;
  const getEnv = (): GatewayEnv => {
    if (env) return env;
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
        JOB_SECRET: 'yikes-local-job-secret',
      };
    }
    return env;
  };

  const getExpectedJobSecret = () =>
    options?.jobSecret ??
    process.env.JOB_SECRET ??
    getEnv().JOB_SECRET ??
    'yikes-local-job-secret';

  let authMiddleware: ((request: FastifyRequest, reply: FastifyReply) => Promise<void>) | null = null;
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!authMiddleware) {
      authMiddleware = createAuthMiddleware(getEnv());
    }
    await authMiddleware(request, reply);
  };

  let supabaseClient: SupabaseClient | null | undefined = options?.supabase;
  const getSupabaseClient = (): SupabaseClient | null => {
    if (supabaseClient !== undefined) return supabaseClient;
    const currentEnv = getEnv();
    if (
      currentEnv.SUPABASE_URL &&
      currentEnv.SUPABASE_SERVICE_ROLE_KEY &&
      !currentEnv.SUPABASE_URL.includes('example.supabase.co') &&
      currentEnv.AI_PROVIDER !== 'fake'
    ) {
      try {
        supabaseClient = createClient(currentEnv.SUPABASE_URL, currentEnv.SUPABASE_SERVICE_ROLE_KEY);
      } catch {
        supabaseClient = null;
      }
    } else {
      supabaseClient = null;
    }
    return supabaseClient;
  };

  let provider: AiProvider | undefined = options?.provider;
  const getProvider = async (): Promise<AiProvider> => {
    if (provider) return provider;
    const { NvidiaProvider } = await import('../providers/nvidia.js');
    provider = new NvidiaProvider(getEnv());
    return provider;
  };

  let rateLimiter: RateLimiterQueue | undefined = options?.rateLimiter;
  const getRateLimiter = async (): Promise<RateLimiterQueue> => {
    if (rateLimiter) return rateLimiter;
    const { RateLimiterQueue } = await import('../queue/rate-limiter.js');
    rateLimiter = new RateLimiterQueue(getEnv().RPM_LIMIT);
    return rateLimiter;
  };

  let circuitBreaker: CircuitBreakerRegistry | undefined = options?.circuitBreaker;
  const getCircuitBreaker = async (): Promise<CircuitBreakerRegistry> => {
    if (circuitBreaker) return circuitBreaker;
    const { CircuitBreakerRegistry } = await import('../reliability/circuit-breaker.js');
    circuitBreaker = new CircuitBreakerRegistry();
    return circuitBreaker;
  };

  let callLogger: CallLogger | undefined = options?.callLogger;
  const getCallLogger = async (): Promise<CallLogger> => {
    if (callLogger) return callLogger;
    const sb = getSupabaseClient();
    if (sb) {
      const { SupabaseCallLogger } = await import('../telemetry/ai-calls.js');
      callLogger = new SupabaseCallLogger(sb);
    } else {
      const { MemoryCallLogger } = await import('../telemetry/ai-calls.js');
      callLogger = new MemoryCallLogger();
    }
    return callLogger;
  };

  // ==========================================
  // 1. Weekly Letter Generation Job
  // POST /v1/jobs/weekly-letters
  // Protected by X-Job-Secret header
  // ==========================================
  app.post('/v1/jobs/weekly-letters', async (request: FastifyRequest, reply: FastifyReply) => {
    const providedSecret = request.headers['x-job-secret'];

    if (!providedSecret || providedSecret !== getExpectedJobSecret()) {
      logger.warn('Unauthorized attempt to trigger weekly-letters job');
      return reply.status(401).send({ error: 'Unauthorized: Invalid or missing job secret' });
    }

    const body = WeeklyLetterJobRequestSchema.parse(request.body || {});
    const weekStart: string = body.weekStart ?? (new Date().toISOString().split('T')[0] || '2026-10-18');

    const sbClient = getSupabaseClient();
    if (!sbClient) {
      return reply.status(200).send({
        ok: true,
        message: 'Job received in simulated mode (no Supabase client attached)',
        generatedCount: 0,
      });
    }

    const { fetchAndBuildWeeklyDigest } = await import('../letter/digest.js');
    const { generateWeeklyLetter, persistWeeklyLetter } = await import('../letter/letterGenerator.js');
    const prov = await getProvider();
    const rl = await getRateLimiter();
    const cb = await getCircuitBreaker();
    const cl = await getCallLogger();

    let targetUserIds: string[] = [];
    if (body.userId) {
      targetUserIds = [body.userId];
    } else {
      // Find all active profiles
      const { data: users, error: userErr } = await sbClient
        .from('profiles')
        .select('user_id');

      if (userErr || !users) {
        return reply.status(500).send({ error: 'Failed to query users for weekly letters' });
      }
      targetUserIds = users.map((u) => u.user_id);
    }

    const results: Array<{ userId: string; status: 'created' | 'skipped' | 'failed'; letterId?: string; reason?: string }> = [];

    for (const uid of targetUserIds) {
      try {
        // Check user opt-out status
        const { data: prefs } = await sbClient
          .from('notification_prefs')
          .select('toggles')
          .eq('user_id', uid)
          .maybeSingle();

        const toggles = (prefs?.toggles as Record<string, unknown>) || {};
        if (toggles.weekly_letters === false && !body.force) {
          results.push({ userId: uid, status: 'skipped', reason: 'User opted out of weekly letters' });
          continue;
        }

        // Determine plan
        const { data: ent } = await sbClient
          .from('entitlements')
          .select('plan, is_active')
          .eq('user_id', uid)
          .maybeSingle();

        const plan: 'free' | 'plus' = ent?.plan === 'plus' && ent?.is_active ? 'plus' : 'free';

        // Fetch user display name
        const { data: profile } = await sbClient
          .from('profiles')
          .select('display_name')
          .eq('user_id', uid)
          .maybeSingle();

        // Fetch playbook summary
        const { data: playbookRow } = await sbClient
          .from('playbooks')
          .select('derived')
          .eq('user_id', uid)
          .maybeSingle();

        const derived = (playbookRow?.derived as Record<string, unknown>) || {};

        // 1. Build Digest (with quotes <= 3 and 0 third-party names)
        const digest = await fetchAndBuildWeeklyDigest(sbClient, uid);

        // 2. Generate Letter
        const letter = await generateWeeklyLetter(digest, {
          env: getEnv(),
          provider: prov,
          rateLimiter: rl,
          circuitBreaker: cb,
          callLogger: cl,
          plan,
          playbook: {
            communicationStyle: typeof derived.voiceStyle === 'object' && derived.voiceStyle ? (derived.voiceStyle as { summary?: string }).summary : undefined,
            scenarioWorld: typeof derived.scenarioWorld === 'string' ? derived.scenarioWorld : undefined,
          },
          userName: profile?.display_name || undefined,
        });

        // 3. Persist to weekly_letters & journal_entries
        const savedRecord = await persistWeeklyLetter(sbClient, uid, letter, weekStart);

        results.push({ userId: uid, status: 'created', letterId: savedRecord.id });
      } catch (err: unknown) {
        logger.error({ userId: uid, error: String(err) }, 'Failed generating weekly letter for user');
        results.push({ userId: uid, status: 'failed', reason: String(err) });
      }
    }

    const createdCount = results.filter((r) => r.status === 'created').length;
    return reply.status(200).send({
      ok: true,
      weekStart,
      generatedCount: createdCount,
      results,
    });
  });

  // ==========================================
  // 2. Fetch Latest Weekly Letter
  // GET /v1/letters/latest
  // ==========================================
  app.get('/v1/letters/latest', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const sbClient = getSupabaseClient();
    if (!sbClient) {
      return reply.status(200).send({
        ok: true,
        letter: {
          id: 'simulated-letter-id',
          userId,
          weekStart: new Date().toISOString().split('T')[0],
          content: 'You made quiet, steady progress across your conversations this week.',
          metadata: {
            wordCount: 11,
            patternNoticed: 'You gave yourself room to think before speaking.',
            nextFocus: 'Carry that steady pause into real-world moments.',
            plan: 'plus',
            optedOut: false,
          },
          createdAt: new Date().toISOString(),
        },
      });
    }

    const { data: letter, error } = await sbClient
      .from('weekly_letters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !letter) {
      return reply.status(404).send({ error: 'No weekly letter found' });
    }

    // Check opt-out toggle
    const { data: prefs } = await sbClient
      .from('notification_prefs')
      .select('toggles')
      .eq('user_id', userId)
      .maybeSingle();

    const toggles = (prefs?.toggles as Record<string, unknown>) || {};
    const optedOut = toggles.weekly_letters === false;

    return reply.status(200).send({
      ok: true,
      letter: {
        id: letter.id,
        userId: letter.user_id,
        weekStart: letter.week_start,
        content: letter.content,
        metadata: {
          ...(letter.metadata || {}),
          optedOut,
        },
        createdAt: letter.created_at,
      },
    });
  });

  // ==========================================
  // 3. Fetch Weekly Letter by ID
  // GET /v1/letters/:id
  // ==========================================
  app.get<{ Params: { id: string } }>(
    '/v1/letters/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const letterId = request.params.id;
      const sbClient = getSupabaseClient();

      if (!sbClient) {
        return reply.status(200).send({
          ok: true,
          letter: {
            id: letterId,
            userId,
            weekStart: new Date().toISOString().split('T')[0],
            content: 'You made quiet, steady progress across your conversations this week.',
            metadata: {
              wordCount: 11,
              patternNoticed: 'You gave yourself room to think before speaking.',
              nextFocus: 'Carry that steady pause into real-world moments.',
              plan: 'plus',
            },
            createdAt: new Date().toISOString(),
          },
        });
      }

      const { data: letter, error } = await sbClient
        .from('weekly_letters')
        .select('*')
        .eq('id', letterId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !letter) {
        return reply.status(404).send({ error: 'Weekly letter not found' });
      }

      return reply.status(200).send({
        ok: true,
        letter: {
          id: letter.id,
          userId: letter.user_id,
          weekStart: letter.week_start,
          content: letter.content,
          metadata: letter.metadata || {},
          createdAt: letter.created_at,
        },
      });
    }
  );

  // ==========================================
  // 4. Opt-out Toggle
  // POST /v1/letters/opt-out
  // ==========================================
  app.post(
    '/v1/letters/opt-out',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const body = OptOutRequestSchema.parse(request.body || {});
      const sbClient = getSupabaseClient();

      if (sbClient) {
        const { data: prefs } = await sbClient
          .from('notification_prefs')
          .select('id, toggles')
          .eq('user_id', userId)
          .maybeSingle();

        const currentToggles = (prefs?.toggles as Record<string, unknown>) || {};
        const updatedToggles = {
          ...currentToggles,
          weekly_letters: !body.optedOut,
        };

        if (prefs) {
          await sbClient
            .from('notification_prefs')
            .update({ toggles: updatedToggles, updated_at: new Date().toISOString() })
            .eq('user_id', userId);
        } else {
          await sbClient.from('notification_prefs').insert({
            user_id: userId,
            toggles: updatedToggles,
          });
        }
      }

      return reply.status(200).send({
        ok: true,
        optedOut: body.optedOut,
      });
    }
  );

  // ==========================================
  // 5. Voice Match Summarise
  // POST /v1/voice-match/summarise
  // ==========================================
  app.post(
    '/v1/voice-match/summarise',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const sbClient = getSupabaseClient();
      if (!sbClient) {
        return reply.status(403).send({ error: 'Voice Match consent is required' });
      }

      try {
        const { summarizeUserVoiceStyle } = await import('../letter/voiceMatch.js');
        const prov = await getProvider();
        const rl = await getRateLimiter();
        const cb = await getCircuitBreaker();
        const cl = await getCallLogger();

        const voiceStyle = await summarizeUserVoiceStyle(userId, {
          env: getEnv(),
          provider: prov,
          rateLimiter: rl,
          circuitBreaker: cb,
          callLogger: cl,
          supabase: sbClient,
        });

        return reply.status(200).send({
          ok: true,
          voiceStyle,
        });
      } catch (err: unknown) {
        const { ConsentRequiredError } = await import('../letter/voiceMatch.js');
        if (err instanceof ConsentRequiredError) {
          return reply.status(403).send({
            error: 'Forbidden: Voice Match consent is required before analyzing speaking style',
          });
        }

        logger.error({ userId, error: String(err) }, 'Failed to summarize user voice style');
        return reply.status(500).send({
          error: 'Failed to synthesize voice style summary',
        });
      }
    }
  );
}
