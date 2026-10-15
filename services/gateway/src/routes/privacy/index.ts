import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import { loadEnv, type GatewayEnv } from '../../config/env.js';
import { createAuthMiddleware } from '../../middleware/auth.js';
import { canUseForImprovement } from './can-use.js';
import { deleteUserAccount } from './delete-account.js';
import { deleteUserText } from './delete-text.js';
import { createExportRecord, getExportPayload } from './export.js';
import { purgeExpiredText } from './purge.js';
import {
  DeleteAccountRequestSchema,
  UpdateConsentRequestSchema,
} from './types.js';

export interface RegisterPrivacyRoutesOptions {
  env?: GatewayEnv | undefined;
  supabase?: SupabaseClient | null | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterPrivacyRoutesOptions
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
  } else if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    } catch {
      supabaseClient = null;
    }
  }

  const requireClient = (): SupabaseClient => {
    if (!supabaseClient) {
      throw new Error('Supabase client not configured in gateway');
    }
    return supabaseClient;
  };

  // 1. POST /v1/privacy/export
  app.post(
    '/v1/privacy/export',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        const client = requireClient();
        const hostHeader = request.headers.host;
        const protocol = request.protocol || 'http';
        const baseUrl = hostHeader ? `${protocol}://${hostHeader}` : '';

        const result = await createExportRecord(client, userId, baseUrl);
        return reply.status(200).send(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: msg });
      }
    }
  );

  // 2. GET /v1/privacy/export/:id
  app.get(
    '/v1/privacy/export/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };
      try {
        const client = requireClient();
        const exportResult = await getExportPayload(client, id, userId);

        if (exportResult.status === 'not_found') {
          return reply.status(404).send({ error: 'Export record not found' });
        }
        if (exportResult.status === 'forbidden') {
          return reply.status(403).send({ error: 'Forbidden: Access to this export is not permitted' });
        }
        if (exportResult.status === 'expired') {
          return reply.status(410).send({ error: 'Export link has expired (24-hour validity exceeded)' });
        }

        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="yikes-export-${userId}.json"`);
        return reply.status(200).send(exportResult.payload);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: msg });
      }
    }
  );

  // 3. POST /v1/privacy/delete-text
  app.post(
    '/v1/privacy/delete-text',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        const client = requireClient();
        const result = await deleteUserText(client, userId);
        return reply.status(200).send(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: msg });
      }
    }
  );

  // 4. POST /v1/privacy/delete-account
  app.post(
    '/v1/privacy/delete-account',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = DeleteAccountRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Fresh OTP verification code is required',
          details: parseResult.error.flatten(),
        });
      }

      try {
        const client = requireClient();
        const result = await deleteUserAccount(client, userId, parseResult.data);
        return reply.status(200).send(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(400).send({ error: msg });
      }
    }
  );

  // 5. POST /v1/privacy/purge
  app.post(
    '/v1/privacy/purge',
    { preHandler: [authMiddleware] },
    async (_request, reply) => {
      try {
        const client = requireClient();
        const result = await purgeExpiredText(client);
        return reply.status(200).send(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: msg });
      }
    }
  );

  // 6. GET /v1/privacy/can-use-improvement
  app.get(
    '/v1/privacy/can-use-improvement',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        const client = requireClient();
        const canUse = await canUseForImprovement(client, userId);
        return reply.status(200).send({ userId, canUse });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: msg });
      }
    }
  );

  // 7. GET /v1/privacy/consents
  app.get(
    '/v1/privacy/consents',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      try {
        const client = requireClient();
        const { data, error } = await client
          .from('consents')
          .select('kind, granted, updated_at')
          .eq('user_id', userId);

        if (error) {
          return reply.status(500).send({ error: error.message });
        }

        return reply.status(200).send({ consents: data || [] });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: msg });
      }
    }
  );

  // 8. POST /v1/privacy/consents
  app.post(
    '/v1/privacy/consents',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = UpdateConsentRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid consent update payload',
          details: parseResult.error.flatten(),
        });
      }

      const { kind, granted } = parseResult.data;
      const actualGranted = kind === 'required' ? true : granted;

      try {
        const client = requireClient();
        const now = new Date().toISOString();

        const { data: existing } = await client
          .from('consents')
          .select('id')
          .eq('user_id', userId)
          .eq('kind', kind)
          .maybeSingle();

        if (existing?.id) {
          await client
            .from('consents')
            .update({ granted: actualGranted, updated_at: now })
            .eq('id', existing.id);
        } else {
          await client
            .from('consents')
            .insert({ user_id: userId, kind, granted: actualGranted, updated_at: now });
        }

        return reply.status(200).send({ ok: true, kind, granted: actualGranted });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: msg });
      }
    }
  );
}

export { canUseForImprovement };
