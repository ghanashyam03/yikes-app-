import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../telemetry/logger.js';
import type { ExportResponse } from './types.js';

export const EXPORTABLE_USER_TABLES = [
  'profiles',
  'consents',
  'notification_prefs',
  'entitlements',
  'playbooks',
  'skills_progress',
  'sessions_log',
  'attempts',
  'ai_feedback',
  'moments',
  'energy_checkins',
  'micro_reps',
  'debriefs',
  'ladder_rungs',
  'journal_entries',
  'weekly_letters',
  'ai_usage_daily',
] as const;

export interface FullUserDataExport {
  exportVersion: string;
  exportedAt: string;
  userId: string;
  tables: Record<string, unknown[]>;
}

/**
 * Extracts all user rows across all database tables into a clean JSON export.
 * Strictly isolates data: only includes rows belonging to the given userId.
 * Records the export in the `exports` table with an expiration timestamp (24h).
 */
export async function buildUserDataExport(
  supabase: SupabaseClient,
  userId: string
): Promise<FullUserDataExport> {
  const tableResults: Record<string, unknown[]> = {};

  // 1. Fetch tables with direct user_id column
  for (const table of EXPORTABLE_USER_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId);

      if (error) {
        logger.warn({ table, userId, errorMsg: error.message }, 'Failed to fetch table rows for export');
        tableResults[table] = [];
      } else {
        tableResults[table] = data || [];
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ table, userId, errorMsg: msg }, 'Exception querying table for export');
      tableResults[table] = [];
    }
  }

  // 2. Fetch attempt child tables (turns, coach_feedback) through attempt_id
  const userAttempts = tableResults.attempts as Array<{ id: string }> | undefined;
  const attemptIds = userAttempts?.map((a) => a.id) ?? [];

  if (attemptIds.length > 0) {
    try {
      const { data: turnsData } = await supabase
        .from('turns')
        .select('*')
        .in('attempt_id', attemptIds);
      tableResults.turns = turnsData || [];
    } catch {
      tableResults.turns = [];
    }

    try {
      const { data: feedbackData } = await supabase
        .from('coach_feedback')
        .select('*')
        .in('attempt_id', attemptIds);
      tableResults.coach_feedback = feedbackData || [];
    } catch {
      tableResults.coach_feedback = [];
    }
  } else {
    tableResults.turns = [];
    tableResults.coach_feedback = [];
  }

  return {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    userId,
    tables: tableResults,
  };
}

/**
 * Generates an export and saves it to the `exports` table with 24h validity.
 */
export async function createExportRecord(
  supabase: SupabaseClient,
  userId: string,
  baseUrl = ''
): Promise<ExportResponse> {
  const payload = await buildUserDataExport(supabase, userId);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Insert into exports table
  const { data, error } = await supabase
    .from('exports')
    .insert({
      user_id: userId,
      download_link: '',
      expires_at: expiresAt,
      payload,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to record export: ${error?.message || 'unknown error'}`);
  }

  const exportId = data.id;
  const downloadPath = `/v1/privacy/export/${exportId}`;
  const downloadUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${downloadPath}` : downloadPath;

  // Update with download URL
  await supabase
    .from('exports')
    .update({ download_link: downloadUrl })
    .eq('id', exportId);

  return {
    downloadUrl,
    expiresAt,
    exportId,
  };
}

/**
 * Retrieves a recorded export by ID, enforcing user isolation and 24h expiration.
 */
export async function getExportPayload(
  supabase: SupabaseClient,
  exportId: string,
  userId: string
): Promise<{ status: 'ok' | 'not_found' | 'forbidden' | 'expired'; payload?: FullUserDataExport }> {
  const { data, error } = await supabase
    .from('exports')
    .select('*')
    .eq('id', exportId)
    .maybeSingle();

  if (error || !data) {
    return { status: 'not_found' };
  }

  if (data.user_id !== userId) {
    return { status: 'forbidden' };
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return { status: 'expired' };
  }

  return {
    status: 'ok',
    payload: (data.payload as FullUserDataExport) || undefined,
  };
}
