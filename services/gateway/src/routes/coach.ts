import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import { CoachEngine, AttemptNotEndedError, AttemptNotFoundError } from '../coach/engine.js';
import { compareAttempts } from '../coach/compareEngine.js';
import { branchAttemptAtTurn } from '../coach/rewindManager.js';
import {
  AiFeedbackRequestSchema,
  CoachFeedbackRequestSchema,
  CompareRequestSchema,
  RewindRequestSchema,
} from '../coach/types.js';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import type { AiProvider } from '../providers/types.js';
import { RateLimiterQueue } from '../queue/rate-limiter.js';
import { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { MemoryCallLogger, SupabaseCallLogger, type CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';

export interface RegisterCoachRoutesOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
  supabase?: SupabaseClient | null | undefined;
  engine?: CoachEngine | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterCoachRoutesOptions
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
    } catch {
      supabaseClient = null;
    }
  }

  const provider: AiProvider = options?.provider ?? new NvidiaProvider(env);
  const rateLimiter = new RateLimiterQueue(env.RPM_LIMIT);
  const circuitBreaker = new CircuitBreakerRegistry();
  const callLogger: CallLogger = supabaseClient
    ? new SupabaseCallLogger(supabaseClient)
    : new MemoryCallLogger();

  const engine =
    options?.engine ??
    new CoachEngine({
      env,
      provider,
      supabase: supabaseClient,
      rateLimiter,
      circuitBreaker,
      callLogger,
    });

  // POST /v1/coach/feedback
  app.post(
    '/v1/coach/feedback',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = CoachFeedbackRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      try {
        const response = await engine.generateFeedback(userId, parseResult.data);
        return reply.status(200).send(response);
      } catch (err: unknown) {
        if (err instanceof AttemptNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ errorMsg: message }, 'Coach feedback generation failed');
        return reply.status(500).send({ error: 'Failed to generate coach feedback' });
      }
    }
  );

  // GET /v1/attempts/:id/thoughts (Guards thoughts with 403 Forbidden until attempt.ended_at)
  app.get<{ Params: { id: string } }>(
    '/v1/attempts/:id/thoughts',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const attemptId = request.params.id;
      if (!attemptId) {
        return reply.status(400).send({ error: 'Missing attempt ID' });
      }

      try {
        const response = await engine.getAttemptThoughts(userId, attemptId);
        return reply.status(200).send(response);
      } catch (err: unknown) {
        if (err instanceof AttemptNotEndedError) {
          return reply.status(403).send({
            error: err.message,
            code: 'ATTEMPT_NOT_ENDED',
          });
        }
        if (err instanceof AttemptNotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ errorMsg: message }, 'Thoughts retrieval failed');
        return reply.status(500).send({ error: 'Failed to retrieve attempt thoughts' });
      }
    }
  );

  // POST /v1/partner/rewind (Creates a branch attempt keeping turns < fromTurn)
  app.post(
    '/v1/partner/rewind',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = RewindRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      const { attemptId, fromTurn } = parseResult.data;

      try {
        const response = await branchAttemptAtTurn(supabaseClient, userId, attemptId, fromTurn);
        return reply.status(200).send(response);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ errorMsg: message }, 'Rewind branch creation failed');
        return reply.status(500).send({ error: 'Failed to rewind attempt' });
      }
    }
  );

  // POST /v1/coach/compare (Generates comparative summary of two paths)
  app.post(
    '/v1/coach/compare',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = CompareRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      const { attemptId1, attemptId2 } = parseResult.data;

      try {
        const response = await compareAttempts(
          supabaseClient,
          userId,
          attemptId1,
          attemptId2,
          env,
          provider
        );
        return reply.status(200).send(response);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ errorMsg: message }, 'Coach comparison failed');
        return reply.status(500).send({ error: 'Failed to compare attempt paths' });
      }
    }
  );

  // POST /v1/ai/feedback (Saves fairness thumbs rating to ai_feedback table)
  app.post(
    '/v1/ai/feedback',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = AiFeedbackRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      const { targetKind, targetId, rating } = parseResult.data;

      if (supabaseClient) {
        try {
          await supabaseClient.from('ai_feedback').insert({
            user_id: userId,
            target_kind: targetKind,
            target_id: targetId,
            rating,
          });
        } catch (err: unknown) {
          logger.warn({ errorMsg: String(err) }, 'Failed to record ai_feedback in database');
        }
      }

      return reply.status(200).send({
        success: true,
      });
    }
  );
}
