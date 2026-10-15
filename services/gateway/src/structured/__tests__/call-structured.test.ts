import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { GatewayEnv } from '../../config/env.js';
import { BadOutputError } from '../../errors/ai-errors.js';
import { FakeProvider } from '../../providers/fake.js';
import { callStructured, stripCodeFences } from '../call-structured.js';

const mockEnv: GatewayEnv = {
  NVIDIA_API_KEY: 'test-key',
  NVIDIA_BASE_URL: 'https://integrate.api.nvidia.com/v1',
  MODEL_PARTNER: 'test-primary',
  MODEL_PARTNER_FALLBACK: 'test-fallback',
  MODEL_COACH: 'test-coach',
  MODEL_COACH_FALLBACK: 'test-coach-fallback',
  MODEL_JUDGE: 'test-judge',
  MODEL_SAFETY: 'test-safety',
  MODEL_VISION: 'test-vision',
  MODEL_LONG: 'test-long',
  MODEL_ALT: 'test-alt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  RPM_LIMIT: 35,
  AI_PROVIDER: 'fake',
  PORT: 3000,
  HOST: '0.0.0.0',
  REQUEST_TIMEOUT_MS: 8000,
};

const TestSchema = z.object({
  greeting: z.string(),
  count: z.number(),
});

describe('callStructured', () => {
  it('strips markdown code fences cleanly', () => {
    const raw = '```json\n{"greeting": "hi", "count": 1}\n```';
    expect(stripCodeFences(raw)).toBe('{"greeting": "hi", "count": 1}');

    const surrounding = 'Here is the response:\n```\n{"a": true}\n```\nHope that helps!';
    expect(stripCodeFences(surrounding)).toBe('{"a": true}');
  });

  it('successfully parses valid JSON matching zod schema on first try', async () => {
    const provider = new FakeProvider();
    provider.setBehavior(mockEnv.MODEL_PARTNER, [
      { text: '```json\n{"greeting": "hello", "count": 3}\n```' },
    ]);

    const result = await callStructured({
      job: 'partner',
      messages: [{ role: 'user', content: 'Give JSON' }],
      schema: TestSchema,
      provider,
      env: mockEnv,
    });

    expect(result).toEqual({ greeting: 'hello', count: 3 });
    expect(provider.calls.length).toBe(1);
  });

  it('retries once with error hint when first output is malformed JSON, then succeeds', async () => {
    const provider = new FakeProvider();
    // 1st attempt: malformed JSON; 2nd attempt: corrected valid JSON
    provider.setBehavior(mockEnv.MODEL_PARTNER, [
      { text: 'this is not valid json at all' },
      { text: '{"greeting": "fixed", "count": 5}' },
    ]);

    const result = await callStructured({
      job: 'partner',
      messages: [{ role: 'user', content: 'Give JSON' }],
      schema: TestSchema,
      provider,
      env: mockEnv,
    });

    expect(result).toEqual({ greeting: 'fixed', count: 5 });
    expect(provider.calls.length).toBe(2);

    // Verify error hint was appended to retry prompt
    const secondCallMessages = provider.calls[1]!.messages;
    const lastUserMessage = secondCallMessages[secondCallMessages.length - 1]!.content;
    expect(lastUserMessage).toContain('could not be parsed');
  });

  it('throws typed BAD_OUTPUT error when retry also fails validation', async () => {
    const provider = new FakeProvider();
    // Both attempts return non-conforming schema
    provider.setBehavior(mockEnv.MODEL_PARTNER, [
      { text: '{"wrong_field": 123}' },
      { text: '{"still_wrong": "bad"}' },
    ]);

    const promise = callStructured({
      job: 'partner',
      messages: [{ role: 'user', content: 'Give JSON' }],
      schema: TestSchema,
      provider,
      env: mockEnv,
    });

    await expect(promise).rejects.toThrow(BadOutputError);
    await expect(promise).rejects.toMatchObject({
      code: 'BAD_OUTPUT',
      statusCode: 502,
    });
  });
});
