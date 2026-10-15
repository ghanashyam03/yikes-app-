import Fastify, { type FastifyInstance } from 'fastify';
import type { GatewayEnv } from './config/env.js';
import { GatewayError } from './errors/ai-errors.js';
import { loadRoutes } from './routes/loader.js';
import { REDACTED_PATHS, logger } from './telemetry/logger.js';

export interface BuildAppOptions {
  env?: GatewayEnv | undefined;
  routesDir?: string | undefined;
  enableLogger?: boolean | undefined;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = options.enableLogger
    ? Fastify({
        logger: {
          level: process.env.LOG_LEVEL || 'info',
          redact: {
            paths: REDACTED_PATHS,
            censor: '[REDACTED]',
          },
        },
      })
    : Fastify({ logger: false });

  // Error handler mapping typed gateway errors
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof GatewayError) {
      reply.status(error.statusCode).send({
        error: error.message,
        code: error.code,
      });
      return;
    }

    if (error.statusCode) {
      reply.status(error.statusCode).send({
        error: error.message,
      });
      return;
    }

    logger.error({ err: error.message }, 'Unhandled server error');
    reply.status(500).send({
      error: 'Internal Server Error',
    });
  });

  return app;
}

export async function createAndInitApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = buildApp(options);
  await loadRoutes(app, options.routesDir);
  return app;
}
