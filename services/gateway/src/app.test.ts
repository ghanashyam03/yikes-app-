import { describe, expect, it } from 'vitest';
import { createAndInitApp } from './app.js';
import { loadRoutes } from './routes/loader.js';
import Fastify from 'fastify';

describe('gateway app & route loader', () => {
  it('GET /health returns { ok: true } via auto-loaded route', async () => {
    const app = await createAndInitApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    await app.close();
  });

  it('route auto-loader discovers and registers route files', async () => {
    const testApp = Fastify();
    const loaded = await loadRoutes(testApp);

    expect(loaded).toContain('health.ts');
    expect(loaded).toContain('smoke.ts');

    const res = await testApp.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await testApp.close();
  });
});
