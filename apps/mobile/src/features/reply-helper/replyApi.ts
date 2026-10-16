import type { ReplyHelperResult } from './types';

export class ReplyApiError extends Error {
  readonly status: number;
  readonly code?: string | undefined;
  readonly suggestFallback?: string | undefined;
  readonly verdict?: string | undefined;

  constructor(
    message: string,
    status: number,
    code?: string,
    suggestFallback?: string,
    verdict?: string
  ) {
    super(message);
    this.name = 'ReplyApiError';
    this.status = status;
    this.code = code;
    this.suggestFallback = suggestFallback;
    this.verdict = verdict;
  }
}

export function getGatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
}

export interface RequestReplyHelperParams {
  text?: string | undefined;
  image?: string | undefined; // base64
  width?: number | undefined;
  height?: number | undefined;
  context?: string | undefined;
  playbook?:
    | {
        communicationStyle?: string | undefined;
        scenarioWorld?: string | undefined;
        pace?: string | undefined;
        coachTone?: string | undefined;
      }
    | undefined;
}

export async function requestReplyHelper(
  token: string | null | undefined,
  params: RequestReplyHelperParams
): Promise<ReplyHelperResult> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/reply/helper`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new ReplyApiError(
      errorBody.error || `Request failed with HTTP ${res.status}`,
      res.status,
      errorBody.code,
      errorBody.suggestFallback,
      errorBody.verdict
    );
  }

  return (await res.json()) as ReplyHelperResult;
}
