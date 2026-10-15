import { loadEnv, type GatewayEnv } from '../config/env.js';
import { getAllConfiguredModels } from '../models/registry.js';
import { FakeProvider } from '../providers/fake.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import type { AiProvider } from '../providers/types.js';

export interface SmokeResult {
  model: string;
  status: 'PASS' | 'FAIL';
  latencyMs: number;
  output?: string;
  error?: string;
}

export async function runSmokeTest(
  env?: GatewayEnv,
  customProvider?: AiProvider
): Promise<SmokeResult[]> {
  const loadedEnv = env ?? loadEnv();
  const provider =
    customProvider ??
    (loadedEnv.AI_PROVIDER === 'fake'
      ? new FakeProvider()
      : new NvidiaProvider(loadedEnv));

  const models = getAllConfiguredModels(loadedEnv);
  const results: SmokeResult[] = [];

  for (const model of models) {
    const startTime = Date.now();
    try {
      const response = await provider.complete({
        model,
        messages: [{ role: 'user', content: 'Reply with the single word OK' }],
        temperature: 0.1,
        max_tokens: 16,
        timeoutMs: 12000,
      });
      const latencyMs = Date.now() - startTime;
      const text = response.text.trim();
      const isPass = text.toUpperCase().includes('OK') || text.toLowerCase().includes('safe');

      results.push({
        model,
        status: isPass ? 'PASS' : 'FAIL',
        latencyMs,
        output: text,
      });
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);
      results.push({
        model,
        status: 'FAIL',
        latencyMs,
        error: errorMessage,
      });
    }
  }

  return results;
}
