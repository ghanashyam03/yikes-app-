import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../telemetry/logger.js';

/**
 * Checks whether the user has granted consent to improve AI models.
 * Later AI tasks must call this before storing or using text for training.
 * Explicit privacy guarantee: Returns false if no consent row exists or if granted is false.
 */
export async function canUseForImprovement(
  supabase: SupabaseClient | null,
  userId: string
): Promise<boolean> {
  if (!supabase || !userId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('consents')
      .select('granted')
      .eq('user_id', userId)
      .eq('kind', 'improve_ai')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn({ userId, errorMsg: error.message }, 'Failed to check improve_ai consent');
      return false;
    }

    return Boolean(data?.granted);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ userId, errorMsg: msg }, 'Error querying consents for improve_ai');
    return false;
  }
}
