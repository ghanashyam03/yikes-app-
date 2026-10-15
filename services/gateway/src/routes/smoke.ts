import type { FastifyInstance } from 'fastify';
import { runSmokeTest } from '../scripts/smoke-runner.js';

export async function register(app: FastifyInstance): Promise<void> {
  app.post('/v1/ai/smoke', async (_request, reply) => {
    try {
      const results = await runSmokeTest();
      const allPassed = results.every((r) => r.status === 'PASS');
      return reply.status(allPassed ? 200 : 207).send({
        ok: allPassed,
        results,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({
        ok: false,
        error: message,
      });
    }
  });
}
