import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { PartnerEngine } from '../partner/engine.js';
import {
  CapReachedError,
  PartnerEndRequestSchema,
  PartnerHintRequestSchema,
  PartnerStartRequestSchema,
  PartnerSuggestRequestSchema,
  PartnerTurnRequestSchema,
} from '../partner/types.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import type { AiProvider } from '../providers/types.js';
import { RateLimiterQueue } from '../queue/rate-limiter.js';
import { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { MemoryCallLogger, SupabaseCallLogger, type CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';

export interface RegisterPartnerRoutesOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
  supabase?: SupabaseClient | null | undefined;
  engine?: PartnerEngine | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterPartnerRoutesOptions
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

  const engine = options?.engine ?? new PartnerEngine({
    env,
    provider,
    supabase: supabaseClient,
    rateLimiter,
    circuitBreaker,
    callLogger,
  });

  // POST /v1/partner/start
  app.post(
    '/v1/partner/start',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = PartnerStartRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      try {
        const response = await engine.startAttempt(userId, parseResult.data);
        return reply.status(200).send(response);
      } catch (err: unknown) {
        if (err instanceof CapReachedError) {
          return reply.status(429).send({
            error: err.message,
            code: 'CAP_REACHED',
          });
        }
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ errorMsg: message }, 'Partner start failed');
        return reply.status(500).send({ error: 'Failed to start practice partner session' });
      }
    }
  );

  // POST /v1/partner/turn
  app.post(
    '/v1/partner/turn',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = PartnerTurnRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      const { attemptId, userText, stream } = parseResult.data;

      // SSE Streaming Mode
      if (stream) {
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        reply.raw.setHeader('X-Accel-Buffering', 'no');

        // Typing event
        reply.raw.write('event: typing\ndata: {}\n\n');

        let isDisconnected = false;
        request.raw.on('close', () => {
          isDisconnected = true;
        });

        try {
          const turnResult = await engine.executeTurn(userId, attemptId, userText);
          if (isDisconnected) return;

          if (turnResult.crisis) {
            reply.raw.write('event: crisis\ndata: {"crisis":true}\n\n');
            reply.raw.end();
            return;
          }

          // Stream reply in words/chunks
          const replyText = turnResult.reply ?? '';
          const words = replyText.split(' ');
          for (let i = 0; i < words.length; i++) {
            if (isDisconnected) break;
            const chunk = (i === 0 ? '' : ' ') + words[i];
            reply.raw.write(`event: reply\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
          }

          // Done event with final payload (Strictly NO thought!)
          const donePayload = {
            reply: replyText,
            mood: turnResult.mood,
            wantsToEnd: turnResult.wantsToEnd,
            cue: turnResult.cue,
            degraded: turnResult.degraded,
            turnIdx: turnResult.turnIdx,
            turnsCount: turnResult.turnsCount,
          };
          reply.raw.write(`event: done\ndata: ${JSON.stringify(donePayload)}\n\n`);
          reply.raw.end();
          return;
        } catch (err: unknown) {
          if (isDisconnected) return;
          if (err instanceof CapReachedError) {
            reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: err.message, code: 'CAP_REACHED' })}\n\n`);
            reply.raw.end();
            return;
          }
          const message = err instanceof Error ? err.message : String(err);
          logger.error({ errorMsg: message }, 'Partner streaming turn failed');
          reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: 'Turn execution failed' })}\n\n`);
          reply.raw.end();
          return;
        }
      }

      // Standard JSON Mode
      try {
        const turnResult = await engine.executeTurn(userId, attemptId, userText);
        return reply.status(200).send(turnResult);
      } catch (err: unknown) {
        if (err instanceof CapReachedError) {
          return reply.status(429).send({
            error: err.message,
            code: 'CAP_REACHED',
          });
        }
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ errorMsg: message }, 'Partner turn failed');
        return reply.status(500).send({ error: 'Failed to execute partner turn' });
      }
    }
  );

  // POST /v1/partner/suggest
  app.post(
    '/v1/partner/suggest',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = PartnerSuggestRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      try {
        const result = await engine.suggestReplies(userId, parseResult.data.attemptId);
        return reply.status(200).send(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn({ errorMsg: message }, 'Suggest replies failed; returning fallback suggestions');
        return reply.status(200).send({ suggestions: ['That makes sense.', 'Could you tell me more about that?', 'I see what you mean.'] });
      }
    }
  );

  // POST /v1/partner/hint
  app.post(
    '/v1/partner/hint',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = PartnerHintRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      try {
        const result = await engine.getHint(userId, parseResult.data.attemptId);
        return reply.status(200).send(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn({ errorMsg: message }, 'Hint generation failed; returning fallback');
        return reply.status(200).send({ hint: 'Try acknowledging their core concern before offering your perspective.' });
      }
    }
  );

  // POST /v1/partner/end
  app.post(
    '/v1/partner/end',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = PartnerEndRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      try {
        const result = await engine.endAttempt(
          userId,
          parseResult.data.attemptId,
          parseResult.data.endedReason
        );
        return reply.status(200).send(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error({ errorMsg: message }, 'Partner end failed');
        return reply.status(500).send({ error: 'Failed to end practice attempt' });
      }
    }
  );
}
