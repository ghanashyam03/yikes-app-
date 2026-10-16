import { supabase } from './supabaseClient';
import { authCopy } from '../../copy/auth';

export type ConsentKind = 'required' | 'analytics' | 'improve_ai' | 'marketing' | 'voice_match';

export interface ConsentsState {
  required: boolean;
  analytics: boolean;
  improve_ai: boolean;
  marketing: boolean;
  voice_match?: boolean;
}

export const DEFAULT_CONSENTS: ConsentsState = {
  required: true,
  analytics: false,
  improve_ai: false,
  marketing: false,
  voice_match: false,
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
    if (consents.voice_match !== undefined) {
      kinds.push('voice_match');
    }
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

      // If voice_match consent is withdrawn, purge voiceStyle from playbooks
      if (kind === 'voice_match' && !granted) {
        try {
          const { data: pb } = await supabase
            .from('playbooks')
            .select('derived')
            .eq('user_id', userId)
            .maybeSingle();

          if (pb?.derived && typeof pb.derived === 'object' && 'voiceStyle' in pb.derived) {
            const updatedDerived = { ...pb.derived };
            delete (updatedDerived as Record<string, unknown>).voiceStyle;
            await supabase
              .from('playbooks')
              .update({ derived: updatedDerived })
              .eq('user_id', userId);
          }
        } catch {
          // DB trigger also handles this
        }
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: authCopy.errors.generic };
  }
}
