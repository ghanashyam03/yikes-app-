import type { GatewayEnv } from '../config/env.js';
import type {
  AiProvider,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
} from './types.js';

export class ProviderHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly bodyText?: string | undefined;

  constructor(status: number, statusText: string, bodyText?: string) {
    super(`Provider returned HTTP ${status}: ${statusText}`);
    this.name = 'ProviderHttpError';
    this.status = status;
    this.statusText = statusText;
    this.bodyText = bodyText;
  }
}

export class ProviderTimeoutError extends Error {
  constructor(message = 'Provider request timed out') {
    super(message);
    this.name = 'ProviderTimeoutError';
  }
}

export class NvidiaProvider implements AiProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultTimeoutMs: number;

  constructor(env: GatewayEnv) {
    this.baseUrl = env.NVIDIA_BASE_URL.replace(/\/+$/, '');
    this.apiKey = env.NVIDIA_API_KEY;
    this.defaultTimeoutMs = env.REQUEST_TIMEOUT_MS;
  }

  private buildUrl(path: string): string {
    if (this.baseUrl.endsWith('/chat/completions')) {
      return this.baseUrl;
    }
    return `${this.baseUrl}${path}`;
  }

  private createTimeoutController(
    timeoutMs: number,
    externalSignal?: AbortSignal
  ): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      controller.abort(new ProviderTimeoutError(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const onExternalAbort = () => {
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort(externalSignal?.reason);
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        onExternalAbort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    };

    return { signal: controller.signal, cleanup };
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    const { signal, cleanup } = this.createTimeoutController(timeoutMs, request.signal);

    const payload = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.max_tokens ?? 1024,
      stream: false,
    };

    try {
      const url = this.buildUrl('/chat/completions');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => undefined);
        throw new ProviderHttpError(response.status, response.statusText, bodyText);
      }

      const json = (await response.json()) as {
        id?: string;
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const choice = json.choices?.[0];
      const text = choice?.message?.content ?? '';

      return {
        id: json.id || `res_${Date.now()}`,
        model: json.model || request.model,
        text,
        usage: json.usage,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderTimeoutError(`Request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      cleanup();
    }
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    const { signal, cleanup } = this.createTimeoutController(timeoutMs, request.signal);

    const payload = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.max_tokens ?? 1024,
      stream: true,
    };

    try {
      const url = this.buildUrl('/chat/completions');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => undefined);
        throw new ProviderHttpError(response.status, response.statusText, bodyText);
      }

      if (!response.body) {
        throw new Error('Response body is empty in streaming request');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') {
            yield { text: '', done: true };
            return;
          }
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield { text: content, done: false };
              }
            } catch {
              // Ignore partial JSON parse errors on malformed chunks
            }
          }
        }
      }

      yield { text: '', done: true };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderTimeoutError(`Stream timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      cleanup();
    }
  }
}
