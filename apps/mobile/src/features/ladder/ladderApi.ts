import { supabase } from '../auth/supabaseClient';
import type { LadderRung, LadderSuggestPayload } from './types';

export class LadderApiError extends Error {
  readonly status?: number | undefined;
  readonly code?: string | undefined;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'LadderApiError';
    this.status = status;
    this.code = code;
  }
}

interface DbLadderRow {
  id: string;
  user_id: string;
  title: string;
  sort_order: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string | null;
}

function mapRowToRung(row: DbLadderRow): LadderRung {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    sortOrder: row.sort_order,
    completed: Boolean(row.completed),
    completedAt: row.completed_at,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function fetchLadderRungsFromSupabase(
  userId: string
): Promise<LadderRung[]> {
  const { data, error } = await supabase
    .from('ladder_rungs')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new LadderApiError(error.message, 400, error.code);
  }

  return (data as DbLadderRow[]).map(mapRowToRung);
}

export async function createLadderRungInSupabase(
  rung: Omit<LadderRung, 'id' | 'createdAt'>,
  userId: string
): Promise<LadderRung> {
  const { data, error } = await supabase
    .from('ladder_rungs')
    .insert({
      user_id: userId,
      title: rung.title,
      sort_order: rung.sortOrder,
      completed: rung.completed,
      completed_at: rung.completedAt ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new LadderApiError(error.message, 400, error.code);
  }

  return mapRowToRung(data as DbLadderRow);
}

export async function updateLadderRungInSupabase(
  rung: Partial<LadderRung> & { id: string }
): Promise<void> {
  const updatePayload: Record<string, unknown> = {};
  if (rung.title !== undefined) updatePayload.title = rung.title;
  if (rung.sortOrder !== undefined) updatePayload.sort_order = rung.sortOrder;
  if (rung.completed !== undefined) {
    updatePayload.completed = rung.completed;
    updatePayload.completed_at = rung.completed ? new Date().toISOString() : null;
  }

  const { error } = await supabase
    .from('ladder_rungs')
    .update(updatePayload)
    .eq('id', rung.id);

  if (error) {
    throw new LadderApiError(error.message, 400, error.code);
  }
}

export async function deleteLadderRungInSupabase(id: string): Promise<void> {
  const { error } = await supabase
    .from('ladder_rungs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new LadderApiError(error.message, 400, error.code);
  }
}

export async function suggestLadderRungFromGateway(
  payload: LadderSuggestPayload,
  gatewayUrl = process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3000',
  token?: string
): Promise<{ title: string; microRepSuggestion: string; rationale: string }> {
  try {
    const res = await fetch(`${gatewayUrl}/v1/ladder/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Ladder suggest failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.suggestedRung;
  } catch {
    // Authored fallback
    return {
      title: 'Ask one genuine follow-up question in your next conversation',
      microRepSuggestion:
        'When the other person brings up something they care about, ask one follow-up on that specific detail.',
      rationale:
        'Builds conversational rhythm by keeping curiosity on the other person without needing to invent a new topic.',
    };
  }
}
