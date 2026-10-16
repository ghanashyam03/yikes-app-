import { supabase } from '../auth/supabaseClient';
import type { Moment, PrepApiResponse, PrepCard, PrepRequestPayload } from './types';

export function getGatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
}

export class MomentsApiError extends Error {
  readonly status?: number | undefined;
  readonly code?: string | undefined;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'MomentsApiError';
    this.status = status;
    this.code = code;
  }
}

interface DbMomentRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  prep_payload: PrepCard | null;
  status: string | null;
  created_at: string | null;
}

function mapRowToMoment(row: DbMomentRow): Moment {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    eventDate: row.event_date ?? undefined,
    prepPayload: row.prep_payload ?? null,
    status: (row.status as Moment['status']) || 'upcoming',
    createdAt: row.created_at ?? undefined,
  };
}

/**
 * Fetch all moments owned by the authenticated user from Supabase.
 */
export async function fetchMomentsFromSupabase(userId: string): Promise<Moment[]> {
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: true, nullsFirst: false });

  if (error) {
    throw new MomentsApiError(error.message, 400, error.code);
  }

  return (data as DbMomentRow[]).map(mapRowToMoment);
}

/**
 * Insert a new moment into Supabase for the authenticated user.
 */
export async function createMomentInSupabase(
  moment: Omit<Moment, 'id'>,
  userId: string
): Promise<Moment> {
  const insertPayload = {
    user_id: userId,
    title: moment.title,
    description: moment.description ?? null,
    event_date: moment.eventDate ?? null,
    prep_payload: moment.prepPayload ?? null,
    status: moment.status || 'upcoming',
  };

  const { data, error } = await supabase
    .from('moments')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw new MomentsApiError(error.message, 400, error.code);
  }

  return mapRowToMoment(data as DbMomentRow);
}

/**
 * Update an existing moment in Supabase.
 */
export async function updateMomentInSupabase(
  id: string,
  updates: Partial<Moment>,
  userId: string
): Promise<Moment> {
  const updatePayload: Record<string, unknown> = {};
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description;
  if (updates.eventDate !== undefined) updatePayload.event_date = updates.eventDate;
  if (updates.prepPayload !== undefined) updatePayload.prep_payload = updates.prepPayload;
  if (updates.status !== undefined) updatePayload.status = updates.status;

  const { data, error } = await supabase
    .from('moments')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new MomentsApiError(error.message, 400, error.code);
  }

  return mapRowToMoment(data as DbMomentRow);
}

/**
 * Delete a moment in Supabase.
 */
export async function deleteMomentInSupabase(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('moments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new MomentsApiError(error.message, 400, error.code);
  }
}

/**
 * Call the gateway POST /v1/prep endpoint to generate AI prep for a moment.
 */
export async function callGatewayPrep(
  token: string | null | undefined,
  params: PrepRequestPayload
): Promise<PrepApiResponse> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${gatewayUrl}/v1/prep`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
  } catch (netErr: unknown) {
    throw new MomentsApiError(
      netErr instanceof Error ? netErr.message : 'Network connection failed',
      0,
      'NETWORK_ERROR'
    );
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new MomentsApiError(
      errorBody.error || `Prep generation failed with HTTP ${res.status}`,
      res.status,
      errorBody.code
    );
  }

  const json = (await res.json()) as PrepApiResponse;
  return json;
}
