import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import type { AiProvider } from '../providers/types.js';
import { RateLimiterQueue } from '../queue/rate-limiter.js';
import { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { callStructured } from '../structured/call-structured.js';
import { MemoryCallLogger, type CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';

// ============================================================================
// Schemas for Battery Insights
// ============================================================================

export const DayTimeAverageSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  timeSlot: z.enum(['morning', 'afternoon', 'evening']),
  avgEnergy: z.number().min(0).max(100),
  count: z.number().int().nonnegative(),
});

export const TagStatSchema = z.object({
  tag: z.string().min(1).max(50),
  count: z.number().int().positive(),
  avgImpact: z.number(),
});

// STRICT schema ensures ONLY aggregated stats are permitted
export const BatteryInsightsRequestSchema = z
  .object({
    dayTimeAverages: z.array(DayTimeAverageSchema),
    topCostTags: z.array(TagStatSchema),
    topRechargeTags: z.array(TagStatSchema),
  })
  .strict();

export type BatteryInsightsRequest = z.infer<typeof BatteryInsightsRequestSchema>;

export const BatteryInsightCardSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  takeaway: z.string().min(1),
  category: z.enum(['pattern', 'cost', 'recharge']),
});

export type BatteryInsightCard = z.infer<typeof BatteryInsightCardSchema>;

export const PlanMyWeekSuggestionSchema = z.object({
  headline: z.string().min(1),
  recommendation: z.string().min(1),
  heavyDays: z.array(z.string()).optional(),
  recoveryWindows: z.array(z.string()).optional(),
});

export type PlanMyWeekSuggestion = z.infer<typeof PlanMyWeekSuggestionSchema>;

export const BatteryInsightsOutputSchema = z.object({
  insights: z.array(BatteryInsightCardSchema).length(3),
  planMyWeek: PlanMyWeekSuggestionSchema,
});

export type BatteryInsightsOutput = z.infer<typeof BatteryInsightsOutputSchema>;

// ============================================================================
// Schemas for Quiet Ladder Suggestion
// ============================================================================

export const LadderRungSummarySchema = z.object({
  title: z.string().min(1),
  sortOrder: z.number().int(),
  completed: z.boolean(),
});

export const LadderSuggestRequestSchema = z
  .object({
    currentRungs: z.array(LadderRungSummarySchema),
    playbookSummary: z
      .object({
        communicationStyle: z.string().optional(),
        scenarioWorld: z.string().optional(),
        hardestPlaces: z.array(z.string()).optional(),
        coachTone: z.enum(['gentle', 'straight', 'funny']).optional(),
      })
      .optional(),
  })
  .strict();

export type LadderSuggestRequest = z.infer<typeof LadderSuggestRequestSchema>;

export const LadderSuggestOutputSchema = z.object({
  suggestedRung: z.object({
    title: z.string().min(1),
    microRepSuggestion: z.string().min(1),
    rationale: z.string().min(1),
  }),
});

export type LadderSuggestOutput = z.infer<typeof LadderSuggestOutputSchema>;

// Forbidden keywords in keys that represent raw text or transcripts
const FORBIDDEN_TEXT_KEYS = new Set([
  'message',
  'messages',
  'transcript',
  'text',
  'raw',
  'content',
  'body',
  'prompt',
  'notes',
]);

// ============================================================================
// Authored Fallbacks (Deterministic, safe, zero clinical terms)
// ============================================================================

export function buildFallbackBatteryInsights(
  data: BatteryInsightsRequest
): BatteryInsightsOutput {
  const topCost = data.topCostTags[0]?.tag ?? 'Large groups';
  const topRecharge = data.topRechargeTags[0]?.tag ?? 'Solo walks';

  return {
    insights: [
      {
        id: 'insight-pattern-1',
        title: 'Midweek pace',
        takeaway:
          'Midweek afternoons show your steepest energy drop. Guarding 15 quiet minutes between conversations keeps your focus steady.',
        category: 'pattern',
      },
      {
        id: 'insight-cost-1',
        title: `${topCost} cost`,
        takeaway: `${topCost} tend to ask the most from your battery. Giving yourself a clean exit line beforehand makes them much lighter.`,
        category: 'cost',
      },
      {
        id: 'insight-recharge-1',
        title: `${topRecharge} recharge`,
        takeaway: `${topRecharge} reliably restore your balance. Placing one right after a heavier interaction helps you bounce back smoothly.`,
        category: 'recharge',
      },
    ],
    planMyWeek: {
      headline: 'Protect a quiet recovery window',
      recommendation:
        'Thursday looks like your densest day. Keep Friday evening clear of optional obligations so you head into the weekend refreshed.',
      heavyDays: ['Thursday'],
      recoveryWindows: ['Friday evening', 'Sunday morning'],
    },
  };
}

export function buildFallbackLadderSuggest(
  data: LadderSuggestRequest
): LadderSuggestOutput {
  const completedCount = data.currentRungs.filter((r) => r.completed).length;

  if (completedCount <= 2) {
    return {
      suggestedRung: {
        title: 'Ask one genuine follow-up question in a brief chat',
        microRepSuggestion:
          'When someone mentions a weekend plan or project, ask one follow-up on what they enjoyed most.',
        rationale:
          'Builds natural momentum from quick greetings into genuine two-way connection without pressure.',
      },
    };
  }

  if (completedCount <= 5) {
    return {
      suggestedRung: {
        title: 'Offer a low-stakes perspective in a small team discussion',
        microRepSuggestion:
          'Share one sentence agreeing or elaborating on a colleague’s observation in a 3-4 person catch-up.',
        rationale:
          'Practices group presence in a safe environment where your contribution can be brief and clear.',
      },
    };
  }

  return {
    suggestedRung: {
      title: 'Take a graceful exit after 10 minutes at a social or networking event',
      microRepSuggestion:
        'Use an appreciative wrap-up line: "It was great catching up on that — I will let you mingle!"',
      rationale:
        'Solidifies control over your energy by proving you can leave on a warm note whenever you choose.',
    },
  };
}

// ============================================================================
// Route Registration
// ============================================================================

export interface RegisterInsightsOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterInsightsOptions
): Promise<void> {
  let env: GatewayEnv;
  try {
    env = options?.env ?? loadEnv();
  } catch {
    env = {
      NVIDIA_API_KEY: 'test_key',
      NVIDIA_BASE_URL: 'https://integrate.api.nvidia.com/v1',
      MODEL_PARTNER: 'test-partner',
      MODEL_PARTNER_FALLBACK: 'test-fallback',
      MODEL_COACH: 'test-coach',
      MODEL_COACH_FALLBACK: 'test-coach-fallback',
      MODEL_JUDGE: 'test-judge',
      MODEL_SAFETY: 'test-safety',
      MODEL_VISION: 'test-vision',
      MODEL_LONG: 'test-long',
      MODEL_ALT: 'test-alt',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role_key',
      AI_PROVIDER: 'fake',
      HOST: '0.0.0.0',
      PORT: 3000,
      REQUEST_TIMEOUT_MS: 8000,
      RPM_LIMIT: 35,
    };
  }

  const authMiddleware = createAuthMiddleware(env);
  const provider = options?.provider ?? new NvidiaProvider(env);
  const rateLimiter = options?.rateLimiter ?? new RateLimiterQueue(env.RPM_LIMIT);
  const circuitBreaker = options?.circuitBreaker ?? new CircuitBreakerRegistry();
  const callLogger = options?.callLogger ?? new MemoryCallLogger();

  // --------------------------------------------------------------------------
  // POST /v1/insights/battery
  // --------------------------------------------------------------------------
  app.post(
    '/v1/insights/battery',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const rawBody = (request.body as Record<string, unknown>) || {};

      // 1. Explicit check: Reject any raw text, message or transcript keys
      const keys = Object.keys(rawBody);
      for (const k of keys) {
        if (FORBIDDEN_TEXT_KEYS.has(k.toLowerCase())) {
          return reply.status(400).send({
            error:
              'Invalid payload: Insights endpoint accepts only aggregated statistics. Raw text and messages are prohibited.',
            code: 'FORBIDDEN_TEXT_PAYLOAD',
          });
        }
      }

      // 2. Strict Zod parse ensuring no additional properties
      const parseResult = BatteryInsightsRequestSchema.safeParse(rawBody);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: `Schema validation failed: ${parseResult.error.message}`,
          code: 'INVALID_STATISTICS',
        });
      }

      const stats = parseResult.data;

      // 3. Fallback when in fake mode or without provider
      if (env.AI_PROVIDER === 'fake') {
        const fallback = buildFallbackBatteryInsights(stats);
        return reply.status(200).send(fallback);
      }

      // 4. Build prompt and call structured LLM
      try {
        const prompt = `You are the yikes! Coach. You analyze strictly aggregated energy numbers to write 3 short, warm, practical observations and a weekly recovery schedule suggestion.
Never use clinical terms (no "therapy", "treat", "cure", "diagnose", "depression", "anxiety").
Tone: clever, kind friend. Never shaming, no point systems or XP.
Return JSON matching:
{
  "insights": [
    { "id": "insight-1", "title": "Midweek rhythm", "takeaway": "Short observation", "category": "pattern" },
    { "id": "insight-2", "title": "Top drainer", "takeaway": "Short observation", "category": "cost" },
    { "id": "insight-3", "title": "Top recharge", "takeaway": "Short observation", "category": "recharge" }
  ],
  "planMyWeek": {
    "headline": "Protect Friday evening",
    "recommendation": "Gentle recovery suggestion",
    "heavyDays": ["Thursday"],
    "recoveryWindows": ["Friday evening"]
  }
}
Aggregated Data:
${JSON.stringify(stats)}`;

        const output = await callStructured<BatteryInsightsOutput>({
          job: 'coach',
          messages: [{ role: 'user', content: prompt }],
          schema: BatteryInsightsOutputSchema,
          provider,
          env,
          rateLimiter,
          circuitBreaker,
          callLogger,
          promptVersion: '1.0.0',
        });

        return reply.status(200).send(output);
      } catch (err) {
        logger.warn({ err }, 'Failed to generate battery insights via AI, using authored fallback');
        const fallback = buildFallbackBatteryInsights(stats);
        return reply.status(200).send(fallback);
      }
    }
  );

  // --------------------------------------------------------------------------
  // POST /v1/ladder/suggest
  // --------------------------------------------------------------------------
  app.post(
    '/v1/ladder/suggest',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const rawBody = (request.body as Record<string, unknown>) || {};

      const parseResult = LadderSuggestRequestSchema.safeParse(rawBody);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: `Schema validation failed: ${parseResult.error.message}`,
          code: 'INVALID_LADDER_REQUEST',
        });
      }

      const data = parseResult.data;

      if (env.AI_PROVIDER === 'fake') {
        const fallback = buildFallbackLadderSuggest(data);
        return reply.status(200).send(fallback);
      }

      try {
        const prompt = `You are the yikes! Coach. You suggest the next single micro-rep rung on the user's Quiet Ladder of real-world steps.
The step must be a concrete, small, manageable micro-action.
Tone: warm, encouraging, zero clinical terms, no XP/scores.
Return JSON matching:
{
  "suggestedRung": {
    "title": "Short title of the step",
    "microRepSuggestion": "Concrete instruction of what to do",
    "rationale": "Why this builds smoothly from their current level"
  }
}
Current Rungs:
${JSON.stringify(data.currentRungs)}
Playbook Context:
${JSON.stringify(data.playbookSummary ?? {})}`;

        const output = await callStructured<LadderSuggestOutput>({
          job: 'coach',
          messages: [{ role: 'user', content: prompt }],
          schema: LadderSuggestOutputSchema,
          provider,
          env,
          rateLimiter,
          circuitBreaker,
          callLogger,
          promptVersion: '1.0.0',
        });

        return reply.status(200).send(output);
      } catch (err) {
        logger.warn({ err }, 'Failed to suggest ladder rung via AI, using authored fallback');
        const fallback = buildFallbackLadderSuggest(data);
        return reply.status(200).send(fallback);
      }
    }
  );
}
