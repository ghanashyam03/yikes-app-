import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { version } from '@yikes/shared/version';

describe('gateway', () => {
  it('resolves @yikes/shared/version deep import', () => {
    expect(version).toBe('0.0.1');
  });

  it('GET /health returns { ok: true } via fastify.inject', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });
});
