import type { GatewayEnv } from '../config/env.js';

export type AiJob =
  | 'partner'
  | 'coach'
  | 'judge'
  | 'safety'
  | 'vision'
  | 'long'
  | 'alt';

export interface ModelPair {
  primary: string;
  fallback: string;
}

export function getModelPair(job: AiJob, env: GatewayEnv): ModelPair {
  switch (job) {
    case 'partner':
      return {
        primary: env.MODEL_PARTNER,
        fallback: env.MODEL_PARTNER_FALLBACK,
      };
    case 'coach':
      return {
        primary: env.MODEL_COACH,
        fallback: env.MODEL_COACH_FALLBACK,
      };
    case 'judge':
      return {
        primary: env.MODEL_JUDGE,
        fallback: env.MODEL_ALT,
      };
    case 'safety':
      return {
        primary: env.MODEL_SAFETY,
        fallback: env.MODEL_ALT,
      };
    case 'vision':
      return {
        primary: env.MODEL_VISION,
        fallback: env.MODEL_ALT,
      };
    case 'long':
      return {
        primary: env.MODEL_LONG,
        fallback: env.MODEL_ALT,
      };
    case 'alt':
      return {
        primary: env.MODEL_ALT,
        fallback: env.MODEL_PARTNER_FALLBACK,
      };
    default: {
      const exhaustiveCheck: never = job;
      throw new Error(`Unsupported AI job: ${String(exhaustiveCheck)}`);
    }
  }
}

export function getAllConfiguredModels(env: GatewayEnv): string[] {
  const models = [
    env.MODEL_PARTNER,
    env.MODEL_PARTNER_FALLBACK,
    env.MODEL_COACH,
    env.MODEL_COACH_FALLBACK,
    env.MODEL_JUDGE,
    env.MODEL_SAFETY,
    env.MODEL_VISION,
    env.MODEL_LONG,
    env.MODEL_ALT,
  ];

  return Array.from(new Set(models.filter(Boolean)));
}
