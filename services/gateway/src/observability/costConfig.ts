/**
 * Per-model pricing configuration for yikes! gateway observability.
 *
 * Rates represent estimated USD cost per 1M tokens (and per 1K tokens).
 * Model names align with NVIDIA API endpoints and local mock configurations.
 */

export interface ModelPricing {
  model: string;
  promptPerMillion: number;
  completionPerMillion: number;
  promptPerThousand: number;
  completionPerThousand: number;
}

export const DEFAULT_MODEL_PRICING: ModelPricing = {
  model: 'default',
  promptPerMillion: 0.30,
  completionPerMillion: 0.40,
  promptPerThousand: 0.0003,
  completionPerThousand: 0.0004,
};

export const MODEL_PRICING_CATALOG: Record<string, ModelPricing> = {
  // Reasoning and dialogue models
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning': {
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    promptPerMillion: 0.30,
    completionPerMillion: 0.40,
    promptPerThousand: 0.0003,
    completionPerThousand: 0.0004,
  },
  'nvidia/llama-3.1-nemotron-70b-instruct': {
    model: 'nvidia/llama-3.1-nemotron-70b-instruct',
    promptPerMillion: 0.70,
    completionPerMillion: 0.80,
    promptPerThousand: 0.0007,
    completionPerThousand: 0.0008,
  },

  // Safety guard models
  'nvidia/llama-3.1-nemotron-safety-guard-8b-v3': {
    model: 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
    promptPerMillion: 0.20,
    completionPerMillion: 0.20,
    promptPerThousand: 0.0002,
    completionPerThousand: 0.0002,
  },
  'nvidia/nemotron-3.5-content-safety': {
    model: 'nvidia/nemotron-3.5-content-safety',
    promptPerMillion: 0.20,
    completionPerMillion: 0.20,
    promptPerThousand: 0.0002,
    completionPerThousand: 0.0002,
  },

  // Vision and multimodality models
  'meta/llama-3.2-11b-vision-instruct': {
    model: 'meta/llama-3.2-11b-vision-instruct',
    promptPerMillion: 0.35,
    completionPerMillion: 0.45,
    promptPerThousand: 0.00035,
    completionPerThousand: 0.00045,
  },

  // Test aliases
  'test-partner': {
    model: 'test-partner',
    promptPerMillion: 0.30,
    completionPerMillion: 0.40,
    promptPerThousand: 0.0003,
    completionPerThousand: 0.0004,
  },
  'test-coach': {
    model: 'test-coach',
    promptPerMillion: 0.70,
    completionPerMillion: 0.80,
    promptPerThousand: 0.0007,
    completionPerThousand: 0.0008,
  },
};

/**
 * Retrieve model pricing by model name or fallback to default pricing.
 */
export function getModelPricing(modelName?: string): ModelPricing {
  if (!modelName) {
    return DEFAULT_MODEL_PRICING;
  }

  const exact = MODEL_PRICING_CATALOG[modelName];
  if (exact) {
    return exact;
  }

  // Check sub-matches (e.g. 70b, safety, vision)
  if (modelName.includes('70b')) {
    const p70b = MODEL_PRICING_CATALOG['nvidia/llama-3.1-nemotron-70b-instruct'];
    if (p70b) return p70b;
  }
  if (modelName.includes('safety') || modelName.includes('guard')) {
    const pSafety = MODEL_PRICING_CATALOG['nvidia/llama-3.1-nemotron-safety-guard-8b-v3'];
    if (pSafety) return pSafety;
  }
  if (modelName.includes('vision')) {
    const pVision = MODEL_PRICING_CATALOG['meta/llama-3.2-11b-vision-instruct'];
    if (pVision) return pVision;
  }

  return {
    ...DEFAULT_MODEL_PRICING,
    model: modelName,
  };
}

/**
 * Calculate estimated cost in USD for a given model and token counts.
 */
export function calculateAiCost(
  modelName: string,
  tokenCounts?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
): number {
  if (!tokenCounts) {
    return 0;
  }

  const pricing = getModelPricing(modelName);
  const promptTokens = tokenCounts.prompt_tokens ?? 0;
  const completionTokens = tokenCounts.completion_tokens ?? 0;

  const promptCost = (promptTokens * pricing.promptPerMillion) / 1_000_000;
  const completionCost = (completionTokens * pricing.completionPerMillion) / 1_000_000;

  return Number((promptCost + completionCost).toFixed(8));
}
