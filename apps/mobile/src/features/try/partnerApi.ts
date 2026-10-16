export type PartnerMode = 'try' | 'warmup' | 'free' | 'rehearsal';

export interface MoodState {
  engagement: number;
  rapport: number;
  patience: number;
  exitPressure: number;
}

export interface PartnerStartResponse {
  attemptId: string;
  openingTurn: {
    role: 'partner';
    text: string;
  };
  initialMood: MoodState;
  mode: PartnerMode;
  turnCap: number;
}

export interface PartnerTurnResponse {
  crisis?: boolean | undefined;
  reply?: string | undefined;
  mood?: MoodState | undefined;
  wantsToEnd?: boolean | undefined;
  cue?: number | undefined;
  degraded?: boolean | undefined;
  turnIdx?: number | undefined;
  turnsCount?: number | undefined;
}

export interface PartnerSuggestResponse {
  suggestions: string[];
}

export interface PartnerHintResponse {
  hint: string;
}

export interface RevealedThought {
  turnIdx: number;
  role: string;
  thought: string;
}

export interface PartnerEndResponse {
  attemptId: string;
  endedAt: string;
  turnsCount: number;
  endedReason: string;
  thoughts: RevealedThought[];
}

export function getGatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
}

export interface StartAttemptParams {
  scenario: {
    title: string;
    setting: string;
    userGoal: string;
    partnerGoal?: string | undefined;
    background?: string | undefined;
  };
  personaId?: string | undefined;
  persona?: Record<string, unknown> | undefined;
  mode?: PartnerMode | undefined;
  sessionId?: string | undefined;
  playbookSummary?: Record<string, unknown> | undefined;
  openingText?: string | undefined;
}

export class PartnerApiError extends Error {
  readonly code?: string | undefined;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'PartnerApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Start a new partner practice attempt.
 */
export async function startPartnerAttempt(
  token: string | null | undefined,
  params: StartAttemptParams
): Promise<PartnerStartResponse> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/partner/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new PartnerApiError(
      errorBody.error || `Start attempt failed with HTTP ${res.status}`,
      res.status,
      errorBody.code
    );
  }

  return (await res.json()) as PartnerStartResponse;
}

export interface SendTurnCallbacks {
  onTyping?: () => void;
  onChunk?: (text: string) => void;
  onDone?: (response: PartnerTurnResponse) => void;
  onCrisis?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Send a turn to partner.
 * Supports standard JSON and SSE streaming mode with word-by-word callbacks.
 */
export async function sendPartnerTurn(
  token: string | null | undefined,
  attemptId: string,
  userText: string,
  stream = false,
  callbacks?: SendTurnCallbacks
): Promise<PartnerTurnResponse> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Non-streaming JSON mode or fallback
  if (!stream) {
    const res = await fetch(`${gatewayUrl}/v1/partner/turn`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ attemptId, userText, stream: false }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new PartnerApiError(
        errorBody.error || `Partner turn failed with HTTP ${res.status}`,
        res.status,
        errorBody.code
      );
    }

    const data = (await res.json()) as PartnerTurnResponse;
    if (data.crisis && callbacks?.onCrisis) {
      callbacks.onCrisis();
    }
    return data;
  }

  // Streaming SSE mode
  callbacks?.onTyping?.();

  const res = await fetch(`${gatewayUrl}/v1/partner/turn`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attemptId, userText, stream: true }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const err = new PartnerApiError(
      errorBody.error || `Partner streaming failed with HTTP ${res.status}`,
      res.status,
      errorBody.code
    );
    callbacks?.onError?.(err);
    throw err;
  }

  const responseText = await res.text();
  const lines = responseText.split('\n');

  let currentEvent = 'message';
  let finalDoneResponse: PartnerTurnResponse | null = null;
  let fullAccumulatedReply = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('event:')) {
      currentEvent = line.replace('event:', '').trim();
      continue;
    }

    if (line.startsWith('data:')) {
      const dataStr = line.replace('data:', '').trim();
      try {
        const payload = JSON.parse(dataStr);
        if (currentEvent === 'typing') {
          callbacks?.onTyping?.();
        } else if (currentEvent === 'reply') {
          if (payload.text) {
            fullAccumulatedReply += payload.text;
            callbacks?.onChunk?.(payload.text);
          }
        } else if (currentEvent === 'done') {
          finalDoneResponse = payload as PartnerTurnResponse;
        } else if (currentEvent === 'crisis') {
          callbacks?.onCrisis?.();
          return { crisis: true };
        } else if (currentEvent === 'error') {
          throw new PartnerApiError(payload.error || 'Streaming error', 500, payload.code);
        }
      } catch (err: unknown) {
        if (err instanceof PartnerApiError) throw err;
      }
    }
  }

  const result: PartnerTurnResponse = finalDoneResponse ?? {
    reply: fullAccumulatedReply || 'I hear you.',
    wantsToEnd: false,
    cue: 0.5,
  };

  callbacks?.onDone?.(result);
  return result;
}

/**
 * Fetch 3 reply suggestions for current turn.
 */
export async function fetchSuggestedReplies(
  token: string | null | undefined,
  attemptId: string
): Promise<string[]> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/partner/suggest`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attemptId }),
  });

  if (!res.ok) {
    return [
      'That makes sense. Can we walk through the first step together?',
      'I see your point. What would be the safest way to test this?',
      'Thanks for clarifying. Let me think about that and get back to you.',
    ];
  }

  const data = (await res.json()) as PartnerSuggestResponse;
  return data.suggestions;
}

/**
 * Fetch 1 coaching perspective hint.
 */
export async function fetchPartnerHint(
  token: string | null | undefined,
  attemptId: string
): Promise<string> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/partner/hint`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attemptId }),
  });

  if (!res.ok) {
    return 'Try acknowledging their core concern before offering your perspective.';
  }

  const data = (await res.json()) as PartnerHintResponse;
  return data.hint;
}

/**
 * End partner practice attempt and receive revealed thoughts.
 */
export async function endPartnerAttempt(
  token: string | null | undefined,
  attemptId: string,
  endedReason = 'user_finished'
): Promise<PartnerEndResponse> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/partner/end`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attemptId, endedReason }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new PartnerApiError(
      errorBody.error || `End attempt failed with HTTP ${res.status}`,
      res.status
    );
  }

  return (await res.json()) as PartnerEndResponse;
}
