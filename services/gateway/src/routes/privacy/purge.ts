import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../telemetry/logger.js';
import type { PurgeResponse } from './types.js';

/**
 * Triggers retention policy purge for practice text that has passed its 90-day retention period.
 * Calls the `purge_expired_text()` stored SQL procedure with query fallback.
 */
export async function purgeExpiredText(supabase: SupabaseClient): Promise<PurgeResponse> {
  let purgedCount = 0;

  try {
    const { data, error } = await supabase.rpc('purge_expired_text');
    if (!error && typeof data === 'number') {
      purgedCount = data;
    } else {
      // Fallback direct delete
      const now = new Date().toISOString();
      const { error: delErr, count } = await supabase
        .from('turns')
        .delete({ count: 'exact' })
        .lt('expires_at', now);

      if (delErr) {
        logger.error({ errorMsg: delErr.message }, 'Failed direct purge of expired turns');
        throw new Error(`Failed to purge expired turns: ${delErr.message}`);
      }

      purgedCount = count ?? 0;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ errorMsg: msg }, 'Error purging expired turns');
    throw new Error(`Retention purge failed: ${msg}`);
  }

  return {
    ok: true,
    purgedCount,
  };
}
