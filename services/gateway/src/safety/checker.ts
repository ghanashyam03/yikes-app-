import { z } from 'zod';
import { checkCrisisRules } from '@yikes/shared/safety/crisis-terms';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import type { AiProvider } from '../providers/types.js';
import type { RateLimiterQueue } from '../queue/rate-limiter.js';
import type { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { callStructured } from '../structured/call-structured.js';
import type { CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';
import { wrapUserText } from './injection.js';
import { guardOutput } from './output-guard.js';

export type SafetyVerdict = 'allow' | 'block' | 'crisis';

export interface SafetyCheckResult {
  verdict: SafetyVerdict;
  categories: string[];
  degraded?: boolean | undefined;
}

export interface CheckTextOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
  skipModel?: boolean | undefined;
}

const SafetyModelResponseSchema = z.object({
  verdict: z.enum(['allow', 'block', 'crisis']),
  categories: z.array(z.string()).default([]),
  reason: z.string().optional(),
});

const SAFETY_SYSTEM_PROMPT = `You are the content safety classification guardrail for yikes!, an app where introverts practice difficult or awkward conversations.
Evaluate the given text strictly and neutrally.
Classify the text into exactly one of three verdicts:
1. "crisis": Statements of suicide, self-harm, wishing to die, hopelessness, or life-threatening distress.
2. "block": Explicit abuse, severe hate speech, threats of physical violence against others, or sexually explicit material.
3. "allow": Benign awkward social situations, everyday social anxiety, self-deprecating humor, colloquial expressions (e.g., "I died of embarrassment", "that joke killed me", "work is killing me"), and normal conversational practice.

Return ONLY a JSON object in this exact schema without any markdown formatting or extra text:
{
  "verdict": "allow" | "block" | "crisis",
  "categories": ["string"],
  "reason": "short explanation"
}`;

/**
 * Checks text for crisis, unsafe, or policy-violating content.
 * Combines fast rule-based pre-filter with MODEL_SAFETY inspection.
 * If safety model is unavailable or throws, gracefully degrades to rule-based check with degraded: true.
 * NEVER logs the evaluated text content.
 */
export async function checkText(
  text: string,
  direction: 'input' | 'output' = 'input',
  options: CheckTextOptions = {}
): Promise<SafetyCheckResult> {
  // Step 1: Fast rule-based crisis pre-filter
  const ruleResult = checkCrisisRules(text);
  if (ruleResult.isCrisis) {
    return {
      verdict: 'crisis',
      categories: [ruleResult.category ?? 'crisis'],
      degraded: false,
    };
  }

  // Step 2: Direction-specific fast output guard
  if (direction === 'output') {
    const outputGuardResult = guardOutput(text);
    if (!outputGuardResult.ok) {
      return {
        verdict: 'block',
        categories: outputGuardResult.violations ?? ['output_guard_violation'],
        degraded: false,
      };
    }
  }

  // If testing or explicitly configured to skip model
  if (options.skipModel || !options.provider) {
    return {
      verdict: 'allow',
      categories: [],
      degraded: true,
    };
  }

  // Step 3: Safety Model evaluation
  let env: GatewayEnv;
  try {
    env = options.env ?? loadEnv();
  } catch {
    // If env is missing or unparseable, fall back to degraded mode
    return {
      verdict: 'allow',
      categories: [],
      degraded: true,
    };
  }

  try {
    const modelResult = await callStructured({
      job: 'safety',
      messages: [
        { role: 'system', content: SAFETY_SYSTEM_PROMPT },
        { role: 'user', content: wrapUserText(text) },
      ],
      schema: SafetyModelResponseSchema,
      provider: options.provider,
      env,
      rateLimiter: options.rateLimiter,
      circuitBreaker: options.circuitBreaker,
      callLogger: options.callLogger,
      promptVersion: 'safety-v1',
      timeoutMs: 4000,
    });

    return {
      verdict: modelResult.verdict,
      categories: modelResult.categories ?? [],
      degraded: false,
    };
  } catch (err: unknown) {
    // Degraded mode: Safety model failed or timed out.
    // Rely strictly on rule pre-filter (which did not flag crisis) and mark degraded: true.
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ errorMsg: message }, 'Safety model evaluation failed; falling back to degraded rules mode');

    return {
      verdict: 'allow',
      categories: [],
      degraded: true,
    };
  }
}
