import { supabase } from './supabaseClient';
import { authCopy } from '../../copy/auth';

export type ConsentKind = 'required' | 'analytics' | 'improve_ai' | 'marketing';

export interface ConsentsState {
  required: boolean;
  analytics: boolean;
  improve_ai: boolean;
  marketing: boolean;
}

export const DEFAULT_CONSENTS: ConsentsState = {
  required: true,
  analytics: false,
  improve_ai: false,
  marketing: false
};

/**
 * Fetch existing consents for a user from Supabase.
 */
export async function getConsents(userId: string): Promise<ConsentsState> {
  try {
    const { data, error } = await supabase
      .from('consents')
      .select('kind, granted')
      .eq('user_id', userId);

    if (error || !data) {
      return { ...DEFAULT_CONSENTS };
    }

    const result: ConsentsState = { ...DEFAULT_CONSENTS };
    for (const row of data) {
      if (row.kind in result) {
        const key = row.kind as ConsentKind;
        result[key] = key === 'required' ? true : Boolean(row.granted);
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_CONSENTS };
  }
}

/**
 * Persist consent choices to Supabase consents table.
 * 'required' is strictly enforced to be true.
 */
export async function saveConsents(
  userId: string,
  consents: Partial<ConsentsState>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const kinds: ConsentKind[] = ['required', 'analytics', 'improve_ai', 'marketing'];
    const now = new Date().toISOString();

    for (const kind of kinds) {
      const granted = kind === 'required' ? true : Boolean(consents[kind]);

      const { data: existing } = await supabase
        .from('consents')
        .select('id')
        .eq('user_id', userId)
        .eq('kind', kind)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('consents')
          .update({ granted, updated_at: now })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('consents')
          .insert({
            user_id: userId,
            kind,
            granted,
            updated_at: now
          });
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: authCopy.errors.generic };
  }
}
