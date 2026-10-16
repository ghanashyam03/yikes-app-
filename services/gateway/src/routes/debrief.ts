import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  DebriefQuestionsSchema,
  buildDebriefQuestionsPrompt,
  type DebriefQuestions,
} from '@yikes/ai-prompts/debrief-questions';
import {
  DebriefTakeawaySchema,
  buildDebriefTakeawayPrompt,
  type DebriefTakeaway,
} from '@yikes/ai-prompts/debrief-takeaway';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import type { AiProvider } from '../providers/types.js';
import { RateLimiterQueue } from '../queue/rate-limiter.js';
import { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { checkText } from '../safety/checker.js';
import { callStructured } from '../structured/call-structured.js';
import { MemoryCallLogger, SupabaseCallLogger, type CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';

// Schemas
export const DebriefStartRequestSchema = z.object({
  momentId: z.string().optional(),
});

export const DebriefAnswerRequestSchema = z.object({
  debriefId: z.string().min(1),
  answerText: z.string().min(1),
  questionIndex: z.number().optional(),
});

export const DebriefFinishRequestSchema = z.object({
  debriefId: z.string().min(1),
  answers: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      })
    )
    .optional(),
});

export const CheckinReflectRequestSchema = z.object({
  forecast: z.object({
    draining: z.number().min(0).max(10),
    warmth: z.number().min(0).max(10),
  }),
  actual: z.object({
    draining: z.number().min(0).max(10),
    warmth: z.number().min(0).max(10),
  }),
  landed: z.boolean().optional(),
  outcome: z.string().optional(),
});

const CoachReflectionSchema = z.object({
  reflection: z.string().min(1),
});

export interface RegisterDebriefRoutesOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
  supabase?: SupabaseClient | null | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
}

// In-memory transcript store for sessions without DB or in tests
const inMemoryDebriefSessions = new Map<
  string,
  {
    momentId?: string | undefined;
    questions: string[];
    qaPairs: Array<{ question: string; answer: string }>;
  }
>();

export async function register(
  app: FastifyInstance,
  options?: RegisterDebriefRoutesOptions
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

  let supabaseClient: SupabaseClient | null = null;
  if (options?.supabase !== undefined) {
    supabaseClient = options.supabase;
  } else if (
    env.SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    !env.SUPABASE_URL.includes('example.supabase.co') &&
    env.AI_PROVIDER !== 'fake'
  ) {
    try {
      supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    } catch {
      supabaseClient = null;
    }
  }

  const provider: AiProvider = options?.provider ?? new NvidiaProvider(env);
  const rateLimiter = options?.rateLimiter ?? new RateLimiterQueue(env.RPM_LIMIT);
  const circuitBreaker = options?.circuitBreaker ?? new CircuitBreakerRegistry();
  const callLogger: CallLogger =
    options?.callLogger ??
    (supabaseClient ? new SupabaseCallLogger(supabaseClient) : new MemoryCallLogger());

  // 1. POST /v1/debrief/start
  app.post(
    '/v1/debrief/start',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = DebriefStartRequestSchema.safeParse(request.body ?? {});
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.format(),
        });
      }

      const { momentId } = parseResult.data;

      let momentData = {
        title: 'Recent conversation',
        description: 'A recent conversation or interaction',
      };
      let playbookData: { communicationStyle?: string; hardestPlaces?: string[] } = {};

      if (supabaseClient && userId) {
        if (momentId) {
          try {
            const { data: momentRow } = await supabaseClient
              .from('moments')
              .select('title, description')
              .eq('id', momentId)
              .eq('user_id', userId)
              .maybeSingle();

            if (momentRow?.title) {
              momentData = {
                title: momentRow.title,
                description: momentRow.description || 'Conversation moment',
              };
            }
          } catch (err: unknown) {
            logger.warn({ error: String(err) }, 'Failed to fetch moment for debrief');
          }
        }

        try {
          const { data: pb } = await supabaseClient
            .from('playbooks')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (pb) {
            playbookData = {
              communicationStyle: pb.primary_trait ?? undefined,
              hardestPlaces: pb.answers?.hardestPlaces ?? undefined,
            };
          }
        } catch (err: unknown) {
          logger.warn({ error: String(err) }, 'Failed to fetch playbook for debrief');
        }
      }

      const promptMessages = buildDebriefQuestionsPrompt({
        moment: momentData,
        playbook: playbookData,
      });

      let questions: string[];
      try {
        const result: DebriefQuestions = await callStructured({
          job: 'coach',
          messages: promptMessages,
          schema: DebriefQuestionsSchema,
          provider,
          env,
          rateLimiter,
          circuitBreaker,
          callLogger,
          promptVersion: 'debrief-questions-v1',
          timeoutMs: env.REQUEST_TIMEOUT_MS,
        });
        questions = result.questions;
      } catch (genErr: unknown) {
        logger.warn(
          { error: genErr instanceof Error ? genErr.message : String(genErr) },
          'Failed to generate debrief questions; using gentle fallbacks'
        );
        questions = [
          'What went a little better than you expected?',
          'Was there a moment you felt your energy shift or dip?',
          'Did you notice any signal from the other person that surprised you?',
          'Looking back now, what took the most effort from you?',
        ];
      }

      const debriefId = crypto.randomUUID();

      inMemoryDebriefSessions.set(debriefId, {
        momentId,
        questions,
        qaPairs: [],
      });

      if (supabaseClient && userId) {
        try {
          await supabaseClient.from('debriefs').insert({
            id: debriefId,
            user_id: userId,
            moment_id: momentId ?? null,
            transcript: questions.map((q) => ({ question: q, answer: null })),
          });
        } catch (dbErr: unknown) {
          logger.warn({ error: String(dbErr) }, 'Failed to insert debrief record in Supabase');
        }
      }

      return reply.status(200).send({
        ok: true,
        debriefId,
        questions,
      });
    }
  );

  // 2. POST /v1/debrief/answer
  app.post(
    '/v1/debrief/answer',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = DebriefAnswerRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.format(),
        });
      }

      const { debriefId, answerText, questionIndex } = parseResult.data;

      // Safety check (T-09): run checkText
      const safetyResult = await checkText(answerText, 'input', {
        env,
        provider,
        rateLimiter,
        circuitBreaker,
        callLogger,
      });

      // Strict Rule: If crisis -> returns { crisis: true } with NO AI text!
      if (safetyResult.verdict === 'crisis') {
        logger.info({ debriefId }, 'Debrief answer flagged crisis; halting debrief with no AI text');
        return reply.status(200).send({
          crisis: true,
        });
      }

      // Safe answer: append to session transcript
      const session = inMemoryDebriefSessions.get(debriefId);
      const currentIdx =
        questionIndex !== undefined
          ? questionIndex
          : session?.qaPairs.length ?? 0;
      const currentQ =
        session?.questions[currentIdx] ??
        `Reflection question ${currentIdx + 1}`;

      if (session) {
        session.qaPairs.push({
          question: currentQ,
          answer: answerText,
        });
      }

      if (supabaseClient && userId) {
        try {
          const { data: debriefRow } = await supabaseClient
            .from('debriefs')
            .select('transcript')
            .eq('id', debriefId)
            .eq('user_id', userId)
            .maybeSingle();

          const existingTranscript = Array.isArray(debriefRow?.transcript)
            ? debriefRow.transcript
            : [];
          const updatedTranscript = [
            ...existingTranscript,
            { question: currentQ, answer: answerText },
          ];

          await supabaseClient
            .from('debriefs')
            .update({ transcript: updatedTranscript })
            .eq('id', debriefId)
            .eq('user_id', userId);
        } catch (dbErr: unknown) {
          logger.warn({ error: String(dbErr) }, 'Failed to append debrief answer to database');
        }
      }

      const totalQuestions = session?.questions.length ?? 4;
      const nextIdx = currentIdx + 1;
      const isDone = nextIdx >= totalQuestions;
      const nextQuestion = session?.questions[nextIdx];

      return reply.status(200).send({
        crisis: false,
        done: isDone,
        nextQuestionIndex: isDone ? undefined : nextIdx,
        nextQuestion: isDone ? undefined : nextQuestion,
      });
    }
  );

  // 3. POST /v1/debrief/finish
  app.post(
    '/v1/debrief/finish',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = DebriefFinishRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.format(),
        });
      }

      const { debriefId, answers } = parseResult.data;
      const session = inMemoryDebriefSessions.get(debriefId);

      const qaPairs =
        answers && answers.length > 0
          ? answers
          : session?.qaPairs && session.qaPairs.length > 0
          ? session.qaPairs
          : [
              {
                question: 'What went better than expected?',
                answer: 'It flowed smoothly once we settled in.',
              },
            ];

      let momentData = {
        title: 'Conversation',
        description: 'Recent interaction debrief',
      };

      if (supabaseClient && userId && session?.momentId) {
        try {
          const { data: m } = await supabaseClient
            .from('moments')
            .select('title, description')
            .eq('id', session.momentId)
            .eq('user_id', userId)
            .maybeSingle();

          if (m?.title) {
            momentData = {
              title: m.title,
              description: m.description || 'Conversation moment',
            };
          }
        } catch (err: unknown) {
          logger.warn({ error: String(err) }, 'Failed to fetch moment for debrief takeaway');
        }
      }

      const promptMessages = buildDebriefTakeawayPrompt({
        moment: momentData,
        qaPairs,
        playbook: {},
      });

      let takeawayResult: DebriefTakeaway;
      try {
        takeawayResult = await callStructured({
          job: 'coach',
          messages: promptMessages,
          schema: DebriefTakeawaySchema,
          provider,
          env,
          rateLimiter,
          circuitBreaker,
          callLogger,
          promptVersion: 'debrief-takeaway-v1',
          timeoutMs: env.REQUEST_TIMEOUT_MS,
        });
      } catch (genErr: unknown) {
        logger.warn(
          { error: genErr instanceof Error ? genErr.message : String(genErr) },
          'Failed to generate debrief takeaway; using grounded fallback'
        );
        takeawayResult = {
          takeaway: 'You stayed grounded and paid attention to the cues in front of you.',
          coreEssence: 'Pauses felt longer to you than they did to the other person.',
          oneNextFocus: 'Next time, allow one quiet breath before answering.',
        };
      }

      // Persist to debriefs table in Supabase
      if (supabaseClient && userId) {
        try {
          await supabaseClient
            .from('debriefs')
            .update({ takeaway: takeawayResult.takeaway })
            .eq('id', debriefId)
            .eq('user_id', userId);
        } catch (dbErr: unknown) {
          logger.warn({ error: String(dbErr) }, 'Failed to save debrief takeaway to Supabase');
        }
      }

      return reply.status(200).send({
        ok: true,
        takeaway: {
          headline: takeawayResult.takeaway,
          coreEssence: takeawayResult.coreEssence,
          quoteContext: takeawayResult.oneNextFocus,
          takeaway: takeawayResult.takeaway,
          oneNextFocus: takeawayResult.oneNextFocus,
        },
      });
    }
  );

  // 4. POST /v1/checkin/reflect
  app.post(
    '/v1/checkin/reflect',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const parseResult = CheckinReflectRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.format(),
        });
      }

      const { forecast, actual } = parseResult.data;

      const REFLECT_SYSTEM_PROMPT = `### ROLE
You are the Coach in yikes!, offering exactly one calm observational sentence comparing what the learner anticipated with what actually occurred.

### STRICT RULES:
1. Exactly ONE sentence.
2. STRICTLY NO score, grade, points, rank, or judgement words (no 'great job', 'failed', 'score', 'success', 'failure', 'better', 'worse', 'win', 'loss').
3. Frame the contrast neutrally as informative feedback (e.g., "You expected 7 out of 10 draining; it was 4, with warmth landing close to what you forecasted.").
4. Zero clinical terms (no diagnose, treat, therapy, cure).
5. Output ONLY valid JSON matching this schema:
{
  "reflection": string
}`;

      const userPrompt = `Forecast: ${forecast.draining}/10 draining, ${forecast.warmth}/10 warmth.
Actual: ${actual.draining}/10 draining, ${actual.warmth}/10 warmth.
Write 1 neutral line of Coach reflection. Return JSON only.`;

      let reflection: string;
      try {
        const structuredRes = await callStructured({
          job: 'coach',
          messages: [
            { role: 'system', content: REFLECT_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          schema: CoachReflectionSchema,
          provider,
          env,
          rateLimiter,
          circuitBreaker,
          callLogger,
          promptVersion: 'coach-reflect-v1',
          timeoutMs: env.REQUEST_TIMEOUT_MS,
        });
        reflection = structuredRes.reflection;
      } catch (err: unknown) {
        logger.warn(
          { error: err instanceof Error ? err.message : String(err) },
          'Failed structured call for checkin reflection; using neutral formula'
        );
        reflection = `You expected ${forecast.draining} out of 10 draining; it was ${actual.draining}.`;
      }

      return reply.status(200).send({
        ok: true,
        reflection,
      });
    }
  );
}
