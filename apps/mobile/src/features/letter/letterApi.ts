import type { VoiceStyleSummary, WeeklyLetter } from './types';

export function getGatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
}

/**
 * Fetches the latest weekly letter for the authenticated user.
 */
export async function fetchLatestLetter(token?: string | null): Promise<WeeklyLetter | null> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/letters/latest`, {
    method: 'GET',
    headers,
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch letter: ${res.status}`);
  }

  const data = (await res.json()) as { ok: boolean; letter: WeeklyLetter | null };
  return data.letter;
}

/**
 * Fetches a weekly letter by its ID.
 */
export async function fetchLetterById(
  id: string,
  token?: string | null
): Promise<WeeklyLetter | null> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/letters/${id}`, {
    method: 'GET',
    headers,
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to fetch letter: ${res.status}`);
  }

  const data = (await res.json()) as { ok: boolean; letter: WeeklyLetter | null };
  return data.letter;
}

/**
 * Updates the user's weekly letter opt-out preference.
 */
export async function updateLetterOptOut(
  optedOut: boolean,
  token?: string | null
): Promise<boolean> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/letters/opt-out`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ optedOut }),
  });

  if (!res.ok) {
    return false;
  }

  const data = (await res.json()) as { ok: boolean; optedOut: boolean };
  return Boolean(data.ok);
}

/**
 * Synthesizes voice style profile via voice match API.
 */
export async function requestVoiceMatchSynthesis(
  token: string
): Promise<VoiceStyleSummary> {
  const gatewayUrl = getGatewayUrl();
  const res = await fetch(`${gatewayUrl}/v1/voice-match/summarise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Voice match failed: ${res.status}`);
  }

  const data = (await res.json()) as { ok: boolean; voiceStyle: VoiceStyleSummary };
  return data.voiceStyle;
}
