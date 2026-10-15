import type { FastifyInstance } from 'fastify';

export async function register(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    return { ok: true };
  });
}
