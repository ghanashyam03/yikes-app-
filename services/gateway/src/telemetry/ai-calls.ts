import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

export interface CallLogEntry {
  job: string;
  model: string;
  prompt_version?: string | undefined;
  latency_ms: number;
  status: 'success' | 'fallback' | 'error';
  token_counts?:
    | {
        prompt_tokens?: number | undefined;
        completion_tokens?: number | undefined;
        total_tokens?: number | undefined;
      }
    | undefined;
}

export interface CallLogger {
  logCall(entry: CallLogEntry): Promise<void>;
}

export class MemoryCallLogger implements CallLogger {
  public entries: CallLogEntry[] = [];

  async logCall(entry: CallLogEntry): Promise<void> {
    this.entries.push(entry);
  }

  clear(): void {
    this.entries = [];
  }
}

export class SupabaseCallLogger implements CallLogger {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async logCall(entry: CallLogEntry): Promise<void> {
    const payload = {
      job: entry.job,
      model: entry.model,
      prompt_version: entry.prompt_version ?? 'v1',
      latency_ms: Math.round(entry.latency_ms),
      status: entry.status,
      token_counts: entry.token_counts ?? null,
    };

    try {
      const { error } = await this.supabase.from('ai_calls').insert(payload);
      if (error) {
        logger.warn({ err: error.message }, 'Failed to write ai_calls row');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err: message }, 'Failed to persist ai_calls telemetry');
    }
  }
}
