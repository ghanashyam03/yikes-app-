import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  PrepCardSchema,
  buildPrepCardPrompt,
  type PrepCard,
} from '@yikes/ai-prompts/prep-card';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import type { AiProvider } from '../providers/types.js';
import { RateLimiterQueue } from '../queue/rate-limiter.js';
import { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { validateScenario } from '../safety/scenarios.js';
import { callStructured } from '../structured/call-structured.js';
import { MemoryCallLogger, SupabaseCallLogger, type CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';

export const prepCardOutputSchema = z.object({
  openerOptions: z.array(z.string().min(1)).min(2),
  questions: z.tuple([z.string().min(1), z.string().min(1)]),
  exitLine: z.string().min(1),
  quietBreak: z.string().min(1),
  recoveryPlan: z.string().min(1),
});

export type PrepCardOutput = z.infer<typeof prepCardOutputSchema>;

export const PrepRequestSchema = z.object({
  momentId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  formality: z.union([z.string(), z.number()]).optional(),
  eventDate: z.string().optional(),
  context: z.string().optional(),
  playbook: z
    .object({
      communicationStyle: z.string().optional(),
      scenarioWorld: z.string().optional(),
      pace: z.string().optional(),
      coachTone: z.enum(['gentle', 'straight', 'funny']).optional(),
    })
    .optional(),
});

export type PrepRequest = z.infer<typeof PrepRequestSchema>;

export interface RegisterPrepRoutesOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
  supabase?: SupabaseClient | null | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterPrepRoutesOptions
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
  const rateLimiter = options?.rateLimiter ?? new RateLimiterQueue(env.RPM_LIMIT);
  const circuitBreaker = options?.circuitBreaker ?? new CircuitBreakerRegistry();
  const callLogger: CallLogger =
    options?.callLogger ??
    (supabaseClient ? new SupabaseCallLogger(supabaseClient) : new MemoryCallLogger());

  app.post(
    '/v1/prep',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = PrepRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.format(),
        });
      }

      const body = parseResult.data;

      // 1. Scenario Exclusion Check (T-09 safety rules)
      const textToValidate = [body.title, body.description, body.context]
        .filter(Boolean)
        .join(' ');
      const exclusionResult = validateScenario(textToValidate);

      if (!exclusionResult.ok) {
        logger.info(
          { category: exclusionResult.category },
          'Prep request blocked kindly by scenario exclusion validator'
        );
        return reply.status(200).send({
          ok: false,
          reason:
            exclusionResult.reason ||
            'This situation falls outside the scope of conversational practice.',
          category: exclusionResult.category,
        });
      }

      // 2. Playbook Context
      let playbook = body.playbook ?? {};
      if (supabaseClient && userId && (!playbook.communicationStyle || !playbook.scenarioWorld)) {
        try {
          const { data: pb } = await supabaseClient
            .from('playbooks')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (pb) {
            playbook = {
              communicationStyle: playbook.communicationStyle ?? pb.primary_trait ?? undefined,
              scenarioWorld: playbook.scenarioWorld ?? pb.target_realm ?? undefined,
              pace: playbook.pace ?? pb.pace ?? undefined,
              coachTone: playbook.coachTone ?? pb.coach_tone ?? undefined,
            };
          }
        } catch (dbErr: unknown) {
          logger.warn({ error: String(dbErr) }, 'Could not fetch user playbook for prep');
        }
      }

      // 3. Build Prompt
      const formalityStr =
        body.formality !== undefined ? String(body.formality) : undefined;
      const promptMessages = buildPrepCardPrompt({
        moment: {
          title: body.title,
          context: body.description || body.context || body.title,
          formality: formalityStr,
        },
        playbook: {
          communicationStyle: playbook.communicationStyle,
          scenarioWorld: playbook.scenarioWorld,
        },
      });

      // 4. Generate structured prep response
      let rawCard: PrepCard;
      try {
        rawCard = await callStructured({
          job: 'coach',
          messages: promptMessages,
          schema: PrepCardSchema,
          provider,
          env,
          rateLimiter,
          circuitBreaker,
          callLogger,
          promptVersion: 'prep-card-v1',
          timeoutMs: env.REQUEST_TIMEOUT_MS,
        });
      } catch (genErr: unknown) {
        logger.error(
          { error: genErr instanceof Error ? genErr.message : String(genErr) },
          'Failed to generate prep card'
        );
        return reply.status(502).send({
          error: 'Failed to generate prep card. Please try again.',
          code: 'BAD_OUTPUT',
        });
      }

      // 5. Format output to contract
      const output: PrepCardOutput = {
        openerOptions: rawCard.openers,
        questions: rawCard.questions,
        exitLine: rawCard.exitLine,
        quietBreak: rawCard.quietBreakIdea,
        recoveryPlan: rawCard.recoverySuggestion,
      };

      // Strict validation against prepCardOutputSchema
      const validatedOutput = prepCardOutputSchema.parse(output);

      // If momentId is provided, persist prep_payload to moments table
      if (body.momentId && supabaseClient) {
        try {
          await supabaseClient
            .from('moments')
            .update({ prep_payload: validatedOutput })
            .eq('id', body.momentId)
            .eq('user_id', userId);
        } catch (dbErr: unknown) {
          logger.warn({ error: String(dbErr) }, 'Failed to persist prep_payload to moment');
        }
      }

      return reply.status(200).send({
        ok: true,
        ...validatedOutput,
      });
    }
  );
}
