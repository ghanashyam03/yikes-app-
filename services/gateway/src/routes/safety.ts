import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { checkText, type CheckTextOptions } from '../safety/checker.js';
import { logger } from '../telemetry/logger.js';

export const SafetyCheckRequestSchema = z.object({
  text: z.string(),
  direction: z.enum(['input', 'output']).default('input'),
});

export type SafetyCheckRequest = z.infer<typeof SafetyCheckRequestSchema>;

export interface SafetyEventPayload {
  kind: string;
  source: string;
}

/**
 * Logs a safety event directly to the database.
 * EXPLICIT PRIVACY GUARANTEE: Logs KIND and SOURCE only.
 * NEVER logs or stores user message text.
 */
export async function logSafetyEvent(
  supabase: SupabaseClient | null,
  kind: string,
  source: string
): Promise<void> {
  if (!supabase) return;

  const payload: SafetyEventPayload = {
    kind,
    source,
  };

  try {
    const { error } = await supabase.from('safety_events').insert(payload);
    if (error) {
      logger.warn({ errorMsg: error.message }, 'Failed to insert safety_events row');
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ errorMsg: message }, 'Error logging safety event');
  }
}

export interface RegisterSafetyRoutesOptions {
  env?: GatewayEnv | undefined;
  supabase?: SupabaseClient | null | undefined;
  checkOptions?: CheckTextOptions | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterSafetyRoutesOptions
): Promise<void> {
  let env: GatewayEnv;
  try {
    env = options?.env ?? loadEnv();
  } catch {
    // In testing without full env
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
  } else if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    } catch {
      supabaseClient = null;
    }
  }

  app.post(
    '/v1/safety/check',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parseResult = SafetyCheckRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      const { text, direction } = parseResult.data;

      // Run safety check
      const result = await checkText(text, direction, options?.checkOptions);

      // Explicit privacy guarantee: Log kind and source only. NEVER message text.
      await logSafetyEvent(supabaseClient, result.verdict, direction);

      return reply.status(200).send({
        verdict: result.verdict,
        categories: result.categories,
        ...(result.degraded !== undefined ? { degraded: result.degraded } : {}),
      });
    }
  );
}
