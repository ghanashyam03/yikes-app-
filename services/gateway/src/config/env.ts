import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

let envLoaded = false;

export function initEnvFiles(rootDir = process.cwd()): void {
  if (envLoaded) return;
  const candidates = [
    resolve(rootDir, '.env.local'),
    resolve(rootDir, '.env'),
    resolve(rootDir, '../../.env.local'),
    resolve(rootDir, '../../.env'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      loadDotenv({ path });
    }
  }
  envLoaded = true;
}

const envSchema = z.object({
  NVIDIA_API_KEY: z.string().default('fake_key_for_tests'),
  NVIDIA_BASE_URL: z.string().url().default('https://integrate.api.nvidia.com/v1'),
  MODEL_PARTNER: z.string().min(1, 'MODEL_PARTNER is required'),
  MODEL_PARTNER_FALLBACK: z.string().min(1, 'MODEL_PARTNER_FALLBACK is required'),
  MODEL_COACH: z.string().min(1, 'MODEL_COACH is required'),
  MODEL_COACH_FALLBACK: z.string().min(1, 'MODEL_COACH_FALLBACK is required'),
  MODEL_JUDGE: z.string().min(1, 'MODEL_JUDGE is required'),
  MODEL_SAFETY: z.string().min(1, 'MODEL_SAFETY is required'),
  MODEL_VISION: z.string().min(1, 'MODEL_VISION is required'),
  MODEL_LONG: z.string().min(1, 'MODEL_LONG is required'),
  MODEL_ALT: z.string().min(1, 'MODEL_ALT is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().optional(),
  RPM_LIMIT: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 35))
    .pipe(z.number().positive().default(35)),
  AI_PROVIDER: z.enum(['nvidia', 'fake']).default('nvidia'),
  PORT: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 3000))
    .pipe(z.number().positive().default(3000)),
  HOST: z.string().default('0.0.0.0'),
  REQUEST_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 8000))
    .pipe(z.number().positive().default(8000)),
  JOB_SECRET: z.string().optional(),
});

export type GatewayEnv = z.infer<typeof envSchema>;

let cachedEnv: GatewayEnv | null = null;

export function loadEnv(overrides?: Record<string, string | undefined>): GatewayEnv {
  if (!overrides && cachedEnv) {
    return cachedEnv;
  }

  initEnvFiles();

  const source = overrides ? { ...process.env, ...overrides } : process.env;
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw new Error(`Gateway environment validation failed: ${errorMessages}`);
  }

  if (result.data.AI_PROVIDER === 'nvidia' && result.data.NVIDIA_API_KEY === 'fake_key_for_tests') {
    throw new Error('Gateway environment validation failed: NVIDIA_API_KEY is required when AI_PROVIDER is nvidia');
  }

  if (!overrides) {
    cachedEnv = result.data;
  }
  return result.data;
}

export function resetCachedEnv(): void {
  cachedEnv = null;
}
