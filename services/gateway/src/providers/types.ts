export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean | undefined;
  timeoutMs?: number | undefined;
  signal?: AbortSignal | undefined;
  temperature?: number | undefined;
  max_tokens?: number | undefined;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface CompletionResponse {
  id: string;
  model: string;
  text: string;
  usage?: TokenUsage | undefined;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface AiProvider {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncIterable<StreamChunk>;
}
