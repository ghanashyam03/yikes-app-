import { getSessionData } from './sessionCatalog';
import type { SessionReadStep, SessionWatchStep } from './types';

export function getGatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
}

export async function fetchWatchExchange(
  sessionId: string,
  options?: { scenarioWorld?: string; tone?: string; token?: string }
): Promise<SessionWatchStep> {
  const fallback = getSessionData(sessionId).watch;

  try {
    const url = `${getGatewayUrl()}/v1/content/watch`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId,
        scenarioWorld: options?.scenarioWorld,
        tone: options?.tone,
      }),
    });

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    return {
      title: data.title ?? fallback.title,
      dialogue: Array.isArray(data.dialogue) ? data.dialogue : fallback.dialogue,
      targetLineIndex: typeof data.targetLineIndex === 'number' ? data.targetLineIndex : fallback.targetLineIndex,
      explanation: data.explanation ?? fallback.explanation,
    };
  } catch {
    return fallback;
  }
}

export async function fetchReadScene(
  sessionId: string,
  options?: { scenarioWorld?: string; tone?: string; token?: string }
): Promise<SessionReadStep> {
  const fallback = getSessionData(sessionId).read;

  try {
    const url = `${getGatewayUrl()}/v1/content/read`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId,
        scenarioWorld: options?.scenarioWorld,
        tone: options?.tone,
      }),
    });

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    return {
      scene: data.scene ?? fallback.scene,
      dialogue: Array.isArray(data.dialogue) ? data.dialogue : fallback.dialogue,
      candidateThoughts: Array.isArray(data.candidateThoughts) && data.candidateThoughts.length === 3
        ? (data.candidateThoughts as [string, string, string])
        : fallback.candidateThoughts,
      trueIndex: typeof data.trueIndex === 'number' && [0, 1, 2].includes(data.trueIndex)
        ? (data.trueIndex as 0 | 1 | 2)
        : fallback.trueIndex,
      cueNote: data.cueNote ?? fallback.cueNote,
    };
  } catch {
    return fallback;
  }
}
