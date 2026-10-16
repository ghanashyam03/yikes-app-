import { supabase } from '../auth/supabaseClient';
import type { JournalEntry, JournalEntryKind } from './types';

export class JournalApiError extends Error {
  readonly status?: number | undefined;
  readonly code?: string | undefined;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'JournalApiError';
    this.status = status;
    this.code = code;
  }
}

interface DbJournalRow {
  id: string;
  user_id: string;
  entry_kind: string;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  favorite: boolean;
  created_at: string | null;
}

function mapRowToEntry(row: DbJournalRow): JournalEntry {
  return {
    id: row.id,
    userId: row.user_id,
    entryKind: (row.entry_kind as JournalEntryKind) || 'quote',
    title: row.title ?? undefined,
    body: row.body ?? '',
    metadata: row.metadata ?? {},
    favorite: Boolean(row.favorite),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function fetchJournalEntriesFromSupabase(
  userId: string
): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new JournalApiError(error.message, 400, error.code);
  }

  return (data as DbJournalRow[]).map(mapRowToEntry);
}

export async function createJournalEntryInSupabase(
  entry: Omit<JournalEntry, 'id' | 'createdAt'>,
  userId: string
): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      entry_kind: entry.entryKind,
      title: entry.title ?? null,
      body: entry.body,
      metadata: entry.metadata ?? {},
      favorite: entry.favorite ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new JournalApiError(error.message, 400, error.code);
  }

  return mapRowToEntry(data as DbJournalRow);
}

export async function updateJournalFavoriteInSupabase(
  id: string,
  favorite: boolean
): Promise<void> {
  const { error } = await supabase
    .from('journal_entries')
    .update({ favorite })
    .eq('id', id);

  if (error) {
    throw new JournalApiError(error.message, 400, error.code);
  }
}

export async function deleteJournalEntryInSupabase(id: string): Promise<void> {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);

  if (error) {
    throw new JournalApiError(error.message, 400, error.code);
  }
}
