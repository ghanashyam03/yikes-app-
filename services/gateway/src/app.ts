import Fastify, { FastifyInstance } from 'fastify';
import { version } from '@yikes/shared/version';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
  });

  app.get('/health', async () => {
    if (!version) {
      throw new Error('Shared version unavailable');
    }
    return { ok: true };
  });

  return app;
}
