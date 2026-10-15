import { ProviderHttpError, ProviderTimeoutError } from './nvidia.js';
import type {
  AiProvider,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
} from './types.js';

export interface FakeBehavior {
  status?: number;
  timeout?: boolean;
  text?: string;
  delayMs?: number;
}

export class FakeProvider implements AiProvider {
  private customHandlers: Map<string, FakeBehavior[]> = new Map();
  private callCount: Map<string, number> = new Map();
  public calls: CompletionRequest[] = [];

  setBehavior(modelOrJob: string, behaviors: FakeBehavior[]): void {
    this.customHandlers.set(modelOrJob, [...behaviors]);
  }

  getCallCount(model: string): number {
    return this.callCount.get(model) ?? 0;
  }

  reset(): void {
    this.customHandlers.clear();
    this.callCount.clear();
    this.calls = [];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.calls.push(request);
    const count = this.callCount.get(request.model) ?? 0;
    this.callCount.set(request.model, count + 1);

    const queue = this.customHandlers.get(request.model);
    const behavior = queue && queue.length > 0 ? queue.shift() : undefined;

    if (behavior?.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, behavior.delayMs));
    }

    if (behavior?.timeout) {
      throw new ProviderTimeoutError('Simulated timeout in FakeProvider');
    }

    if (behavior?.status && behavior.status >= 400) {
      throw new ProviderHttpError(
        behavior.status,
        behavior.status === 429 ? 'Too Many Requests' : 'Internal Server Error',
        `Simulated HTTP error ${behavior.status}`
      );
    }

    if (behavior?.text !== undefined) {
      return {
        id: `fake_${Date.now()}`,
        model: request.model,
        text: behavior.text,
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
    }

    const lastMessage = request.messages[request.messages.length - 1]?.content ?? '';
    let responseText = 'OK';

    if (lastMessage.includes('Reply with the single word OK')) {
      responseText = 'OK';
    } else if (lastMessage.includes('JSON') || lastMessage.includes('schema')) {
      responseText = JSON.stringify({ ok: true, message: 'fake_structured_response' });
    } else {
      responseText = `Simulated reply from ${request.model}`;
    }

    return {
      id: `fake_${Date.now()}`,
      model: request.model,
      text: responseText,
      usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
    };
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const response = await this.complete(request);
    const words = response.text.split(' ');

    for (const word of words) {
      yield { text: word + ' ', done: false };
    }
    yield { text: '', done: true };
  }
}
