import { supabase } from '../auth/supabaseClient';
import type {
  DebriefAnswerResponse,
  DebriefFinishResponse,
  DebriefStartResponse,
  DebriefTakeawayCard,
} from './types';

function getGatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3000';
}

export async function apiStartDebrief(
  momentId?: string,
  token?: string
): Promise<DebriefStartResponse> {
  const url = `${getGatewayUrl()}/v1/debrief/start`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ momentId }),
  });

  if (!res.ok) {
    throw new Error(`Failed to start debrief: ${res.statusText}`);
  }

  return (await res.json()) as DebriefStartResponse;
}

export async function apiAnswerDebrief(
  debriefId: string,
  answerText: string,
  questionIndex?: number,
  token?: string
): Promise<DebriefAnswerResponse> {
  const url = `${getGatewayUrl()}/v1/debrief/answer`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      debriefId,
      answerText,
      questionIndex,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit answer: ${res.statusText}`);
  }

  return (await res.json()) as DebriefAnswerResponse;
}

export async function apiFinishDebrief(
  debriefId: string,
  answers?: Array<{ question: string; answer: string }>,
  token?: string
): Promise<DebriefFinishResponse> {
  const url = `${getGatewayUrl()}/v1/debrief/finish`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      debriefId,
      answers,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to finish debrief: ${res.statusText}`);
  }

  return (await res.json()) as DebriefFinishResponse;
}

export async function saveDebriefToJournal(
  takeaway: DebriefTakeawayCard,
  momentId?: string,
  userId?: string
): Promise<void> {
  if (!userId) return;

  await supabase.from('journal_entries').insert({
    user_id: userId,
    entry_kind: 'debrief',
    title: takeaway.coreEssence || 'Debrief Takeaway',
    body: takeaway.headline,
    metadata: {
      momentId: momentId ?? null,
      quoteContext: takeaway.quoteContext ?? null,
    },
  });
}
