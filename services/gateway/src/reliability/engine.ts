import type { GatewayEnv } from '../config/env.js';
import { AiUnavailableError } from '../errors/ai-errors.js';
import { getModelPair, type AiJob } from '../models/registry.js';
import { ProviderHttpError, ProviderTimeoutError } from '../providers/nvidia.js';
import type {
  AiProvider,
  ChatMessage,
  CompletionRequest,
  CompletionResponse,
} from '../providers/types.js';
import type { QueuePriority, RateLimiterQueue } from '../queue/rate-limiter.js';
import type { CallLogger } from '../telemetry/ai-calls.js';
import { defaultCircuitBreaker, type CircuitBreakerRegistry } from './circuit-breaker.js';

export interface ExecuteOptions {
  job: AiJob;
  messages: ChatMessage[];
  priority?: QueuePriority | undefined;
  provider: AiProvider;
  env: GatewayEnv;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  callLogger?: CallLogger | undefined;
  promptVersion?: string | undefined;
  timeoutMs?: number | undefined;
  temperature?: number | undefined;
  maxTokens?: number | undefined;
  signal?: AbortSignal | undefined;
}

export function isRetryableError(err: unknown): boolean {
  if (err instanceof ProviderTimeoutError) return true;
  if (err instanceof ProviderHttpError) {
    return err.status === 429 || (err.status >= 500 && err.status < 600);
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('429') || msg.includes('500') || msg.includes('503')) {
      return true;
    }
  }
  return false;
}

function sleepWithJitter(baseMs = 50, maxJitterMs = 50): Promise<void> {
  const jitter = Math.floor(Math.random() * maxJitterMs);
  return new Promise((resolve) => setTimeout(resolve, baseMs + jitter));
}

async function tryModelWithRetry(
  model: string,
  messages: ChatMessage[],
  provider: AiProvider,
  timeoutMs?: number | undefined,
  temperature?: number | undefined,
  maxTokens?: number | undefined,
  signal?: AbortSignal | undefined
): Promise<CompletionResponse> {
  const req: CompletionRequest = {
    model,
    messages,
    timeoutMs,
    temperature,
    max_tokens: maxTokens,
    signal,
  };

  try {
    return await provider.complete(req);
  } catch (err: unknown) {
    if (isRetryableError(err)) {
      await sleepWithJitter(40, 40);
      return await provider.complete(req);
    }
    throw err;
  }
}

export async function executeWithReliability(
  options: ExecuteOptions
): Promise<CompletionResponse & { usedFallback: boolean }> {
  const {
    job,
    messages,
    priority = 'chat',
    provider,
    env,
    circuitBreaker = defaultCircuitBreaker,
    rateLimiter,
    callLogger,
    promptVersion = 'v1',
    timeoutMs,
    temperature,
    maxTokens,
    signal,
  } = options;

  if (rateLimiter) {
    await rateLimiter.acquire(priority, 6000);
  }

  const { primary, fallback } = getModelPair(job, env);
  const startTime = Date.now();

  // 1. Try Primary Model if circuit breaker allows
  if (circuitBreaker.canAttempt(primary)) {
    try {
      const response = await tryModelWithRetry(
        primary,
        messages,
        provider,
        timeoutMs,
        temperature,
        maxTokens,
        signal
      );

      circuitBreaker.recordSuccess(primary);
      const latencyMs = Date.now() - startTime;

      if (callLogger) {
        await callLogger.logCall({
          job,
          model: primary,
          prompt_version: promptVersion,
          latency_ms: latencyMs,
          status: 'success',
          token_counts: response.usage,
        });
      }

      return { ...response, usedFallback: false };
    } catch {
      circuitBreaker.recordFailure(primary);
    }
  }

  // 2. Try Fallback Model if primary failed or circuit breaker was open
  if (fallback && circuitBreaker.canAttempt(fallback)) {
    try {
      const response = await tryModelWithRetry(
        fallback,
        messages,
        provider,
        timeoutMs,
        temperature,
        maxTokens,
        signal
      );

      circuitBreaker.recordSuccess(fallback);
      const latencyMs = Date.now() - startTime;

      if (callLogger) {
        await callLogger.logCall({
          job,
          model: fallback,
          prompt_version: promptVersion,
          latency_ms: latencyMs,
          status: 'fallback',
          token_counts: response.usage,
        });
      }

      return { ...response, usedFallback: true };
    } catch {
      circuitBreaker.recordFailure(fallback);
    }
  }

  // 3. Both models failed or unavailable
  const totalLatencyMs = Date.now() - startTime;
  if (callLogger) {
    await callLogger.logCall({
      job,
      model: primary,
      prompt_version: promptVersion,
      latency_ms: totalLatencyMs,
      status: 'error',
    });
  }

  throw new AiUnavailableError(
    `AI provider unavailable for job '${job}' (tried primary: ${primary}, fallback: ${fallback})`
  );
}
