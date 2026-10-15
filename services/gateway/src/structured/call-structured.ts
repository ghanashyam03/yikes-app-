import { z } from 'zod';
import type { GatewayEnv } from '../config/env.js';
import { BadOutputError } from '../errors/ai-errors.js';
import type { AiJob } from '../models/registry.js';
import type { AiProvider, ChatMessage } from '../providers/types.js';
import type { QueuePriority, RateLimiterQueue } from '../queue/rate-limiter.js';
import type { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { executeWithReliability } from '../reliability/engine.js';
import type { CallLogger } from '../telemetry/ai-calls.js';

export function stripCodeFences(raw: string): string {
  let cleaned = raw.trim();

  // Remove markdown code fences like ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
    cleaned = cleaned.replace(/\n?```\s*$/, '');
    cleaned = cleaned.trim();
  }

  // If there is still leading/trailing text outside the first { ... } or [ ... ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const startIdx =
    firstBrace !== -1 && firstBracket !== -1
      ? Math.min(firstBrace, firstBracket)
      : firstBrace !== -1
      ? firstBrace
      : firstBracket;

  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const endIdx = Math.max(lastBrace, lastBracket);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  return cleaned.trim();
}

export function parseAndValidate<T>(
  rawText: string,
  schema: z.ZodSchema<T>
): { ok: true; data: T } | { ok: false; error: string; cleanedText: string } {
  const cleaned = stripCodeFences(rawText);
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(cleaned);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Invalid JSON: ${msg}`, cleanedText: cleaned };
  }

  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    return { ok: false, error: `Schema validation failed: ${errorDetails}`, cleanedText: cleaned };
  }

  return { ok: true, data: result.data };
}

export interface CallStructuredOptions<T> {
  job: AiJob;
  messages: ChatMessage[];
  schema: z.ZodSchema<T>;
  provider: AiProvider;
  env: GatewayEnv;
  priority?: QueuePriority | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
  promptVersion?: string | undefined;
  timeoutMs?: number | undefined;
}

export async function callStructured<T>(
  options: CallStructuredOptions<T>
): Promise<T> {
  const {
    job,
    messages,
    schema,
    provider,
    env,
    priority = 'chat',
    rateLimiter,
    circuitBreaker,
    callLogger,
    promptVersion = 'v1',
    timeoutMs,
  } = options;

  // 1. First attempt
  const firstResponse = await executeWithReliability({
    job,
    messages,
    priority,
    provider,
    env,
    circuitBreaker,
    rateLimiter,
    callLogger,
    promptVersion,
    timeoutMs,
  });

  const firstValidation = parseAndValidate(firstResponse.text, schema);
  if (firstValidation.ok) {
    return firstValidation.data;
  }

  // 2. Retry once with error hint appended
  const retryMessages: ChatMessage[] = [
    ...messages,
    { role: 'assistant', content: firstResponse.text },
    {
      role: 'user',
      content: `Your previous response could not be parsed: ${firstValidation.error}. Please fix the issue and return ONLY the valid JSON object without commentary or markdown code fences.`,
    },
  ];

  const secondResponse = await executeWithReliability({
    job,
    messages: retryMessages,
    priority,
    provider,
    env,
    circuitBreaker,
    rateLimiter,
    callLogger,
    promptVersion,
    timeoutMs,
  });

  const secondValidation = parseAndValidate(secondResponse.text, schema);
  if (secondValidation.ok) {
    return secondValidation.data;
  }

  throw new BadOutputError(
    `Failed structured validation after retry: ${secondValidation.error}`,
    secondResponse.text
  );
}
