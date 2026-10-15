import { describe, expect, it } from 'vitest';
import type { GatewayEnv } from '../../config/env.js';
import { AiUnavailableError } from '../../errors/ai-errors.js';
import { FakeProvider } from '../../providers/fake.js';
import { CircuitBreakerRegistry } from '../circuit-breaker.js';
import { executeWithReliability } from '../engine.js';

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

describe('Circuit Breaker', () => {
  it('opens after 5 failures within 60s, transitions to HALF_OPEN after 30s', () => {
    const cb = new CircuitBreakerRegistry(5, 60_000, 30_000);
    const model = 'test-model';

    expect(cb.getState(model)).toBe('CLOSED');
    expect(cb.canAttempt(model)).toBe(true);

    const now = 1_000_000;
    // 4 failures: still CLOSED
    for (let i = 0; i < 4; i++) {
      cb.recordFailure(model, now + i * 100);
      expect(cb.getState(model, now + i * 100)).toBe('CLOSED');
    }

    // 5th failure: transitions to OPEN
    cb.recordFailure(model, now + 500);
    expect(cb.getState(model, now + 500)).toBe('OPEN');
    expect(cb.canAttempt(model, now + 500)).toBe(false);

    // After 29s: still OPEN
    expect(cb.getState(model, now + 29_500)).toBe('OPEN');
    expect(cb.canAttempt(model, now + 29_500)).toBe(false);

    // After 30s: transitions to HALF_OPEN
    expect(cb.getState(model, now + 30_500)).toBe('HALF_OPEN');
    expect(cb.canAttempt(model, now + 30_500)).toBe(true);

    // If probe in HALF_OPEN fails -> returns to OPEN
    cb.recordFailure(model, now + 30_600);
    expect(cb.getState(model, now + 30_600)).toBe('OPEN');

    // Wait another 30s -> HALF_OPEN again
    expect(cb.getState(model, now + 60_700)).toBe('HALF_OPEN');

    // If probe in HALF_OPEN succeeds -> resets to CLOSED
    cb.recordSuccess(model);
    expect(cb.getState(model, now + 60_800)).toBe('CLOSED');
    expect(cb.canAttempt(model, now + 60_800)).toBe(true);
  });
});

describe('Reliability Engine: Retry & Fallback', () => {
  it('uses primary model on success without calling fallback', async () => {
    const provider = new FakeProvider();
    const cb = new CircuitBreakerRegistry();

    const result = await executeWithReliability({
      job: 'partner',
      messages: [{ role: 'user', content: 'Hello' }],
      provider,
      env: mockEnv,
      circuitBreaker: cb,
    });

    expect(result.model).toBe(mockEnv.MODEL_PARTNER);
    expect(result.usedFallback).toBe(false);
    expect(provider.getCallCount(mockEnv.MODEL_PARTNER)).toBe(1);
    expect(provider.getCallCount(mockEnv.MODEL_PARTNER_FALLBACK)).toBe(0);
  });

  it('retries primary model on 429 then succeeds', async () => {
    const provider = new FakeProvider();
    provider.setBehavior(mockEnv.MODEL_PARTNER, [
      { status: 429 },
      { text: 'recovered after 429' },
    ]);

    const result = await executeWithReliability({
      job: 'partner',
      messages: [{ role: 'user', content: 'Hello' }],
      provider,
      env: mockEnv,
    });

    expect(result.text).toBe('recovered after 429');
    expect(result.usedFallback).toBe(false);
    expect(provider.getCallCount(mockEnv.MODEL_PARTNER)).toBe(2);
  });

  it('switches to fallback model when primary model fails after retry', async () => {
    const provider = new FakeProvider();
    // Primary fails both first attempt and retry
    provider.setBehavior(mockEnv.MODEL_PARTNER, [{ status: 500 }, { status: 500 }]);
    provider.setBehavior(mockEnv.MODEL_PARTNER_FALLBACK, [{ text: 'fallback answer' }]);

    const cb = new CircuitBreakerRegistry();

    const result = await executeWithReliability({
      job: 'partner',
      messages: [{ role: 'user', content: 'Hello' }],
      provider,
      env: mockEnv,
      circuitBreaker: cb,
    });

    expect(result.model).toBe(mockEnv.MODEL_PARTNER_FALLBACK);
    expect(result.usedFallback).toBe(true);
    expect(result.text).toBe('fallback answer');
    expect(provider.getCallCount(mockEnv.MODEL_PARTNER)).toBe(2);
    expect(provider.getCallCount(mockEnv.MODEL_PARTNER_FALLBACK)).toBe(1);
  });

  it('throws typed AI_UNAVAILABLE error when both primary and fallback fail', async () => {
    const provider = new FakeProvider();
    provider.setBehavior(mockEnv.MODEL_PARTNER, [{ status: 500 }, { status: 500 }]);
    provider.setBehavior(mockEnv.MODEL_PARTNER_FALLBACK, [{ status: 503 }, { status: 503 }]);

    await expect(
      executeWithReliability({
        job: 'partner',
        messages: [{ role: 'user', content: 'Hello' }],
        provider,
        env: mockEnv,
      })
    ).rejects.toThrow(AiUnavailableError);
  });

  it('skips primary model when circuit breaker is OPEN and goes straight to fallback', async () => {
    const provider = new FakeProvider();
    provider.setBehavior(mockEnv.MODEL_PARTNER_FALLBACK, [{ text: 'fallback response' }]);

    const cb = new CircuitBreakerRegistry(1, 60_000, 30_000);
    // Force open circuit breaker on primary
    cb.recordFailure(mockEnv.MODEL_PARTNER);

    const result = await executeWithReliability({
      job: 'partner',
      messages: [{ role: 'user', content: 'Hello' }],
      provider,
      env: mockEnv,
      circuitBreaker: cb,
    });

    expect(result.usedFallback).toBe(true);
    expect(provider.getCallCount(mockEnv.MODEL_PARTNER)).toBe(0);
    expect(provider.getCallCount(mockEnv.MODEL_PARTNER_FALLBACK)).toBe(1);
  });
});
