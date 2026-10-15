import type { FastifyReply, FastifyRequest } from 'fastify';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { GatewayEnv } from '../config/env.js';
import { AuthError } from '../errors/ai-errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export function createAuthMiddleware(env: GatewayEnv) {
  let jwks: JWTVerifyGetKey | null = null;
  const hmacSecret = env.SUPABASE_JWT_SECRET
    ? new TextEncoder().encode(env.SUPABASE_JWT_SECRET)
    : null;

  if (!hmacSecret && env.SUPABASE_URL) {
    try {
      const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', env.SUPABASE_URL);
      jwks = createRemoteJWKSet(jwksUrl);
    } catch {
      // Fallback if URL is malformed in tests
    }
  }

  return async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      reply.status(401).send({ error: 'Missing bearer token' });
      return;
    }

    try {
      let payload: { sub?: string };

      if (hmacSecret) {
        try {
          const verified = await jwtVerify(token, hmacSecret);
          payload = verified.payload;
        } catch (hmacErr) {
          if (jwks) {
            const verified = await jwtVerify(token, jwks);
            payload = verified.payload;
          } else {
            throw hmacErr;
          }
        }
      } else if (jwks) {
        const verified = await jwtVerify(token, jwks);
        payload = verified.payload;
      } else {
        throw new AuthError('No JWT verification secret or JWKS configured');
      }

      const userId = payload.sub;
      if (!userId || typeof userId !== 'string') {
        reply.status(401).send({ error: 'JWT missing valid subject (sub)' });
        return;
      }

      // Security check: ensure userId is strictly from JWT and never from body
      request.userId = userId;
    } catch (err: unknown) {
      reply.status(401).send({
        error: 'Invalid or expired token',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  };
}
