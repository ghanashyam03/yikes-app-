import { describe, expect, it } from 'vitest';
import { FakeProvider } from '../fake.js';
import { ProviderHttpError, ProviderTimeoutError } from '../nvidia.js';

describe('FakeProvider', () => {
  it('returns deterministic reply for OK query', async () => {
    const provider = new FakeProvider();
    const response = await provider.complete({
      model: 'test-model',
      messages: [{ role: 'user', content: 'Reply with the single word OK' }],
    });

    expect(response.text).toBe('OK');
    expect(response.model).toBe('test-model');
    expect(response.usage?.prompt_tokens).toBeGreaterThan(0);
  });

  it('streams deterministic chunks', async () => {
    const provider = new FakeProvider();
    const chunks: string[] = [];

    for await (const chunk of provider.stream({
      model: 'test-model',
      messages: [{ role: 'user', content: 'Hello there' }],
    })) {
      if (!chunk.done) {
        chunks.push(chunk.text);
      }
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('')).toContain('test-model');
  });

  it('supports custom behavior queue with 429 and 500 errors', async () => {
    const provider = new FakeProvider();
    provider.setBehavior('test-model', [
      { status: 429 },
      { status: 500 },
      { text: 'recovered' },
    ]);

    await expect(
      provider.complete({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      })
    ).rejects.toThrow(ProviderHttpError);

    await expect(
      provider.complete({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      })
    ).rejects.toThrow(ProviderHttpError);

    const success = await provider.complete({
      model: 'test-model',
      messages: [{ role: 'user', content: 'Test' }],
    });
    expect(success.text).toBe('recovered');
  });

  it('supports simulated timeout', async () => {
    const provider = new FakeProvider();
    provider.setBehavior('test-model', [{ timeout: true }]);

    await expect(
      provider.complete({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }],
      })
    ).rejects.toThrow(ProviderTimeoutError);
  });
});
