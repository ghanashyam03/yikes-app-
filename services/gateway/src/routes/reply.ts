import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  ReplyHelperSchema,
  buildReplyHelperPrompt,
  type ReplyHelperOutput,
} from '@yikes/ai-prompts/reply-helper';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import type { AiProvider, ChatMessage } from '../providers/types.js';
import { RateLimiterQueue } from '../queue/rate-limiter.js';
import { CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';
import { checkText } from '../safety/checker.js';
import { callStructured } from '../structured/call-structured.js';
import { MemoryCallLogger, SupabaseCallLogger, type CallLogger } from '../telemetry/ai-calls.js';
import { logger } from '../telemetry/logger.js';
import { checkDailyCap, incrementDailyUsage } from '../usage/daily-caps.js';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_IMAGE_DIMENSION = 1280; // 1280 px

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Extracts dimensions from image binary buffer (PNG, JPEG, WebP, GIF).
 * Returns null if format is unrecognized or buffer is corrupted.
 */
export function parseImageDimensions(buf: Buffer): ImageDimensions | null {
  if (!buf || buf.length < 10) return null;

  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    if (buf.length >= 24) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    }
  }

  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    if (buf.length >= 10) {
      const width = buf.readUInt16LE(6);
      const height = buf.readUInt16LE(8);
      return { width, height };
    }
  }

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1];
      if (marker === undefined) break;
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSof) {
        if (offset + 8 < buf.length) {
          const height = buf.readUInt16BE(offset + 5);
          const width = buf.readUInt16BE(offset + 7);
          return { width, height };
        }
        break;
      }
      if (marker === 0xd9 || marker === 0xda) {
        break;
      }
      if (offset + 3 < buf.length) {
        const length = buf.readUInt16BE(offset + 2);
        offset += 2 + length;
      } else {
        break;
      }
    }
  }

  // WebP
  if (
    buf.length >= 16 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const chunkType = buf.toString('ascii', 12, 16);
    if (chunkType === 'VP8 ' && buf.length >= 30) {
      const width = buf.readUInt16LE(26) & 0x3fff;
      const height = buf.readUInt16LE(28) & 0x3fff;
      return { width, height };
    }
    if (chunkType === 'VP8L' && buf.length >= 25) {
      const b1 = buf[21];
      const b2 = buf[22];
      const b3 = buf[23];
      const b4 = buf[24];
      if (b1 !== undefined && b2 !== undefined && b3 !== undefined && b4 !== undefined) {
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        return { width, height };
      }
    }
    if (chunkType === 'VP8X' && buf.length >= 30) {
      const width = 1 + buf.readUIntLE(24, 3);
      const height = 1 + buf.readUIntLE(27, 3);
      return { width, height };
    }
  }

  return null;
}

export const ReplyHelperRequestSchema = z
  .object({
    text: z.string().optional(),
    image: z.string().optional(), // base64 string or data URL
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    context: z.string().optional(),
    playbook: z
      .object({
        communicationStyle: z.string().optional(),
        scenarioWorld: z.string().optional(),
        pace: z.string().optional(),
        coachTone: z.enum(['gentle', 'straight', 'funny']).optional(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      (Boolean(data.text) && data.text!.trim().length > 0) ||
      (Boolean(data.image) && data.image!.trim().length > 0),
    {
      message: 'Either text or image must be provided',
    }
  );

export type ReplyHelperRequest = z.infer<typeof ReplyHelperRequestSchema>;

export interface RegisterReplyRoutesOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
  supabase?: SupabaseClient | null | undefined;
  rateLimiter?: RateLimiterQueue | undefined;
  circuitBreaker?: CircuitBreakerRegistry | undefined;
  callLogger?: CallLogger | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterReplyRoutesOptions
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
  const optionalAuth = async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.headers.authorization) {
      await authMiddleware(req, reply);
    }
  };

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
  const rawCallLogger: CallLogger =
    options?.callLogger ??
    (supabaseClient ? new SupabaseCallLogger(supabaseClient) : new MemoryCallLogger());

  // Wrap logger to enforce job: 'reply'
  const replyCallLogger: CallLogger = {
    async logCall(entry) {
      await rawCallLogger.logCall({
        ...entry,
        job: 'reply',
      });
    },
  };

  app.post(
    '/v1/reply/helper',
    {
      bodyLimit: 10 * 1024 * 1024, // 10 MB payload limit to handle base64 encoding
      preHandler: [optionalAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = ReplyHelperRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          code: 'INVALID_REQUEST',
          details: parseResult.error.flatten(),
        });
      }

      const body = parseResult.data;
      const userId = request.userId;

      // 1. Check Usage Caps
      if (userId) {
        const capCheck = await checkDailyCap(supabaseClient, userId, 'reply_helper');
        if (!capCheck.allowed) {
          return reply.status(429).send({
            error: 'Limit reached for Reply Helper',
            code: 'CAP_REACHED',
            plan: capCheck.plan,
            current: capCheck.current,
            limit: capCheck.limit,
          });
        }
      }

      let targetText = body.text?.trim() ?? '';

      // 2. Image Processing & Vision Extraction if image provided
      if (body.image) {
        let base64Data = body.image;
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1] ?? '';
        }

        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Size check: max 4 MB
        if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
          return reply.status(400).send({
            error: `Image exceeds maximum allowed size of 4MB (${imageBuffer.byteLength} bytes)`,
            code: 'IMAGE_TOO_LARGE',
          });
        }

        // Dimension check: max 1280 px
        const parsedDim = parseImageDimensions(imageBuffer);
        const effectiveWidth = parsedDim?.width ?? body.width;
        const effectiveHeight = parsedDim?.height ?? body.height;

        if (
          (effectiveWidth !== undefined && effectiveWidth > MAX_IMAGE_DIMENSION) ||
          (effectiveHeight !== undefined && effectiveHeight > MAX_IMAGE_DIMENSION)
        ) {
          return reply.status(400).send({
            error: `Image dimension (${effectiveWidth ?? '?'}x${effectiveHeight ?? '?'}) exceeds maximum allowed dimension of ${MAX_IMAGE_DIMENSION}px`,
            code: 'IMAGE_DIMENSION_EXCEEDED',
          });
        }

        // Call vision model for extraction
        try {
          const visionMessages: ChatMessage[] = [
            {
              role: 'system',
              content:
                'You are an OCR and conversation extraction assistant for yikes!. Extract the conversation text from this screenshot accurately and neutrally. Include sender names if visible, and message lines. Return ONLY the conversation text.',
            },
            {
              role: 'user',
              content: `Extract the message or conversation text from this screenshot:\n<img src="data:image/jpeg;base64,${base64Data}" />`,
            },
          ];

          const visionResponse = await provider.complete({
            model: env.MODEL_VISION,
            messages: visionMessages,
            temperature: 0.1,
            timeoutMs: env.REQUEST_TIMEOUT_MS,
          });

          targetText = visionResponse.text.trim();
          if (!targetText) {
            throw new Error('Empty text extracted from image');
          }
        } catch (visionErr: unknown) {
          logger.warn(
            { error: visionErr instanceof Error ? visionErr.message : String(visionErr) },
            'Vision model failed or unavailable'
          );
          return reply.status(503).send({
            error:
              'Vision extraction is unavailable right now. Please paste the message text directly.',
            code: 'VISION_UNAVAILABLE',
            suggestFallback: 'paste',
          });
        }
      }

      // 3. Safety Check on targetText (zero text logged)
      const safetyResult = await checkText(targetText, 'input', {
        env,
        provider,
        rateLimiter,
        circuitBreaker,
        callLogger: replyCallLogger,
      });

      if (safetyResult.verdict === 'crisis') {
        return reply.status(400).send({
          error: 'Message contains crisis or distress signals',
          code: 'CRISIS_DETECTED',
          verdict: 'crisis',
        });
      }

      if (safetyResult.verdict === 'block') {
        return reply.status(400).send({
          error: 'Message content violates safety guidelines',
          code: 'CONTENT_BLOCKED',
          verdict: 'block',
        });
      }

      // 4. Build Reply Helper Prompt & Call Structured Model
      const promptMessages = buildReplyHelperPrompt({
        receivedMessage: targetText,
        context: body.context,
        playbook: body.playbook ?? {},
      });

      let structuredOutput: ReplyHelperOutput;
      try {
        structuredOutput = await callStructured({
          job: 'coach',
          messages: promptMessages,
          schema: ReplyHelperSchema,
          provider,
          env,
          rateLimiter,
          circuitBreaker,
          callLogger: replyCallLogger,
          promptVersion: 'reply-helper-v1',
          timeoutMs: env.REQUEST_TIMEOUT_MS,
        });
      } catch (genErr: unknown) {
        logger.error(
          { error: genErr instanceof Error ? genErr.message : String(genErr) },
          'Failed to generate reply suggestions'
        );
        return reply.status(502).send({
          error: 'Failed to generate reply suggestions. Please try again.',
          code: 'BAD_OUTPUT',
        });
      }

      // Enforce the mandatory honest disclaimer verbatim
      if (structuredOutput.disclaimer !== "I can't know what they meant") {
        structuredOutput.disclaimer = "I can't know what they meant";
      }

      // 5. Increment Usage Daily Count
      if (userId) {
        await incrementDailyUsage(supabaseClient, userId, 'reply_helper').catch(() => {});
      }

      // PRIVACY: Zero image bytes and zero message text stored in database or logs!
      return reply.status(200).send({
        readings: structuredOutput.readings,
        disclaimer: structuredOutput.disclaimer,
        replies: structuredOutput.replies,
        extractedText: body.image ? targetText : undefined,
      });
    }
  );
}
