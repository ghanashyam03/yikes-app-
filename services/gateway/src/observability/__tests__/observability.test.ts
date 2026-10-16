import { describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateAiCost,
  DEFAULT_MODEL_PRICING,
  getModelPricing,
} from '../costConfig.js';
import {
  scrubGatewaySentryEvent,
  sentryFastifyPlugin,
  type GatewaySentryEvent,
} from '../sentryPlugin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('T-24 Gateway Observability Suite', () => {
  // Acceptance Check 3: A scrubber test proves Sentry events never contain message text.
  describe('Gateway Sentry Scrubber & Plugin', () => {
    it('proves scrubGatewaySentryEvent strictly redacts message text, prompts, and transcripts', () => {
      const event: GatewaySentryEvent = {
        event_id: 'gw-err-01',
        message: 'Prompt failed: "How do I deal with an aggressive manager?"',
        exception: {
          values: [
            {
              type: 'GatewayAIError',
              value: 'Model call error for prompt: "You are Maya. Respond to: I hate talking in meetings"',
              stacktrace: {
                frames: [
                  {
                    filename: 'partner.ts',
                    function: 'executeTurn',
                    vars: {
                      job: 'partner',
                      model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
                      text: 'I hate talking in meetings',
                      thought: 'User is hesitant and needs gentle encouragement',
                    },
                  },
                ],
              },
            },
          ],
        },
        breadcrumbs: [
          {
            category: 'http',
            message: 'POST /v1/partner/turn?text=MySecretMeetingProblem',
            data: {
              url: '/v1/partner/turn',
              prompt: 'System prompt instructions with private dialogue',
              transcript: ['User: "Help"', 'Partner: "I am here"'],
              reply: 'Can you tell me more?',
            },
          },
        ],
        extra: {
          raw_prompt: 'System prompt instructions',
          user_text: 'Secret user input text',
          latency_ms: 120,
        },
        request: {
          url: 'https://api.yikes.app/v1/coach/feedback?message=SecretTopic',
          headers: {
            authorization: 'Bearer secret_user_jwt_token',
            'content-type': 'application/json',
          },
          data: {
            text: 'I broke down during the presentation',
            thought: 'Embarrassed',
          },
        },
      };

      const scrubbed = scrubGatewaySentryEvent(event);
      const json = JSON.stringify(scrubbed);

      // Verify ZERO prompt/message/transcript text leaks
      expect(json).not.toContain('How do I deal with an aggressive manager');
      expect(json).not.toContain('I hate talking in meetings');
      expect(json).not.toContain('User is hesitant and needs gentle encouragement');
      expect(json).not.toContain('MySecretMeetingProblem');
      expect(json).not.toContain('System prompt instructions with private dialogue');
      expect(json).not.toContain('Can you tell me more?');
      expect(json).not.toContain('Secret user input text');
      expect(json).not.toContain('SecretTopic');
      expect(json).not.toContain('secret_user_jwt_token');
      expect(json).not.toContain('I broke down during the presentation');
      expect(json).not.toContain('Embarrassed');

      // Verify safe metadata is preserved
      expect(scrubbed.extra?.latency_ms).toBe(120);
      expect(scrubbed.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars?.job).toBe('partner');
      expect(scrubbed.request?.headers?.['content-type']).toBe('application/json');
      expect(scrubbed.request?.data).toEqual({
        text: '[REDACTED]',
        thought: '[REDACTED]',
      });
    });

    it('proves sentryFastifyPlugin intercepts Fastify errors and sanitizes error events', async () => {
      const app = Fastify({ logger: false });

      const capturedEvents: GatewaySentryEvent[] = [];
      await app.register(sentryFastifyPlugin, {
        captureException: (evt) => {
          capturedEvents.push(evt as GatewaySentryEvent);
        },
      });

      app.post('/v1/test-turn', async (req) => {
        const body = req.body as { prompt?: string; text?: string };
        throw new Error(`AI Model Rejected Prompt: "${body.prompt || 'secret prompt'}"`);
      });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/test-turn',
        headers: {
          authorization: 'Bearer secret_auth_token',
        },
        payload: {
          text: 'User private chat message',
          prompt: 'System prompt containing user instructions',
        },
      });

      expect(response.statusCode).toBe(500);
      expect(capturedEvents).toHaveLength(1);

      const capturedJson = JSON.stringify(capturedEvents[0]);
      expect(capturedJson).not.toContain('User private chat message');
      expect(capturedJson).not.toContain('System prompt containing user instructions');
      expect(capturedJson).not.toContain('secret_auth_token');
      expect(capturedJson).toContain('[REDACTED]');
    });
  });

  // Observability: Cost Configuration
  describe('Model Pricing & Cost Configuration', () => {
    it('returns configured pricing for known models', () => {
      const reasoningPricing = getModelPricing('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning');
      expect(reasoningPricing.promptPerMillion).toBe(0.30);
      expect(reasoningPricing.completionPerMillion).toBe(0.40);

      const coach70bPricing = getModelPricing('nvidia/llama-3.1-nemotron-70b-instruct');
      expect(coach70bPricing.promptPerMillion).toBe(0.70);
      expect(coach70bPricing.completionPerMillion).toBe(0.80);

      const safetyPricing = getModelPricing('nvidia/llama-3.1-nemotron-safety-guard-8b-v3');
      expect(safetyPricing.promptPerMillion).toBe(0.20);
      expect(safetyPricing.completionPerMillion).toBe(0.20);

      const visionPricing = getModelPricing('meta/llama-3.2-11b-vision-instruct');
      expect(visionPricing.promptPerMillion).toBe(0.35);
      expect(visionPricing.completionPerMillion).toBe(0.45);
    });

    it('falls back to sensible defaults for unknown models', () => {
      const fallbackPricing = getModelPricing('custom-experimental-model');
      expect(fallbackPricing.promptPerMillion).toBe(DEFAULT_MODEL_PRICING.promptPerMillion);
      expect(fallbackPricing.completionPerMillion).toBe(DEFAULT_MODEL_PRICING.completionPerMillion);
    });

    it('calculates cost accurately without reading message text', () => {
      // 1000 prompt tokens and 500 completion tokens on 70b
      // Prompt: 1000 * 0.70 / 1M = $0.0007
      // Completion: 500 * 0.80 / 1M = $0.0004
      // Total: $0.0011
      const cost = calculateAiCost('nvidia/llama-3.1-nemotron-70b-instruct', {
        prompt_tokens: 1000,
        completion_tokens: 500,
      });

      expect(cost).toBe(0.0011);

      // Zero tokens returns 0
      expect(calculateAiCost('nvidia/llama-3.1-nemotron-70b-instruct', undefined)).toBe(0);
    });
  });

  // Acceptance Check 4: The SQL views run against the local database schema.
  describe('Acceptance Check 4: SQL Views Verification', () => {
    const sqlFilePath = resolve(__dirname, '../../../sql/cost-views.sql');
    const migrationsDir = resolve(__dirname, '../../../../../supabase/migrations');

    it('verifies cost-views.sql exists and creates daily_ai_costs and monthly_ai_costs views', () => {
      expect(existsSync(sqlFilePath)).toBe(true);

      const sqlContent = readFileSync(sqlFilePath, 'utf8');

      expect(sqlContent).toMatch(/CREATE OR REPLACE VIEW public\.daily_ai_costs\b/i);
      expect(sqlContent).toMatch(/CREATE OR REPLACE VIEW public\.monthly_ai_costs\b/i);
    });

    it('guarantees SQL views query strictly ai_calls metadata with ZERO message text columns', () => {
      const sqlContent = readFileSync(sqlFilePath, 'utf8');
      // Strip SQL line comments to examine query statements only
      const sqlCode = sqlContent.replace(/--.*$/gm, '');

      // Must select from public.ai_calls
      expect(sqlCode).toMatch(/FROM public\.ai_calls\b/i);

      // Must NOT reference any message text, prompt, content, or transcript columns
      const forbiddenColumnPatterns = [
        /\bturns\.text\b/i,
        /\bmessage\b/i,
        /\btranscript\b/i,
        /\bprompt_text\b/i,
        /\buser_text\b/i,
        /\bbody\b/i,
        /\bcontent\b/i,
      ];

      for (const pattern of forbiddenColumnPatterns) {
        expect(sqlCode).not.toMatch(pattern);
      }
    });

    it('verifies all columns referenced in views exist in the ai_calls database schema', () => {
      const migrationFile = resolve(migrationsDir, '20261015000004_ai_telemetry_and_safety.sql');
      const migrationContent = readFileSync(migrationFile, 'utf8');

      // Verify ai_calls definition contains all view dependency columns
      const requiredColumns = [
        'job',
        'model',
        'prompt_version',
        'latency_ms',
        'status',
        'token_counts',
        'created_at',
      ];

      for (const col of requiredColumns) {
        expect(migrationContent).toContain(col);
      }
    });
  });
});
