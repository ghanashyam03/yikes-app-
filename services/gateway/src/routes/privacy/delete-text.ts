import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../telemetry/logger.js';
import type { DeleteTextResponse } from './types.js';

/**
 * Selectively deletes practice text:
 * - Deletes turns associated with the user's attempts
 * - Clears debrief transcripts (resets to empty array)
 * - Clears journal entry body text
 *
 * STRICT GUARANTEE:
 * Explicitly preserves skills_progress, sessions_log, and attempts metadata intact.
 */
export async function deleteUserText(
  supabase: SupabaseClient,
  userId: string
): Promise<DeleteTextResponse> {
  let deletedTurns = 0;
  let clearedDebriefs = 0;
  let clearedJournals = 0;

  try {
    // Try stored procedure first if available
    const { data: rpcData, error: rpcError } = await supabase.rpc('delete_user_text', {
      target_user_id: userId,
    });

    if (!rpcError && rpcData) {
      const parsed = rpcData as {
        deleted_turns?: number;
        cleared_debriefs?: number;
        cleared_journals?: number;
      };
      deletedTurns = parsed.deleted_turns ?? 0;
      clearedDebriefs = parsed.cleared_debriefs ?? 0;
      clearedJournals = parsed.cleared_journals ?? 0;
    } else {
      // Fallback to direct queries
      const { data: attempts } = await supabase
        .from('attempts')
        .select('id')
        .eq('user_id', userId);

      const attemptIds = (attempts || []).map((a) => a.id);

      if (attemptIds.length > 0) {
        const { error: turnsErr, count } = await supabase
          .from('turns')
          .delete({ count: 'exact' })
          .in('attempt_id', attemptIds);

        if (turnsErr) {
          logger.warn({ userId, errorMsg: turnsErr.message }, 'Failed deleting turns');
        } else {
          deletedTurns = count ?? attemptIds.length;
        }
      }

      // Reset debrief transcripts
      const { error: debriefErr, count: debriefCount } = await supabase
        .from('debriefs')
        .update({ transcript: [] }, { count: 'exact' })
        .eq('user_id', userId);

      if (debriefErr) {
        logger.warn({ userId, errorMsg: debriefErr.message }, 'Failed clearing debrief transcripts');
      } else {
        clearedDebriefs = debriefCount ?? 0;
      }

      // Clear journal entry bodies
      const { error: journalErr, count: journalCount } = await supabase
        .from('journal_entries')
        .update({ body: null }, { count: 'exact' })
        .eq('user_id', userId);

      if (journalErr) {
        logger.warn({ userId, errorMsg: journalErr.message }, 'Failed clearing journal bodies');
      } else {
        clearedJournals = journalCount ?? 0;
      }
    }

    // Always ensure playbooks.derived.voiceStyle is purged when practice text is deleted
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
    } catch (pbErr: unknown) {
      logger.warn({ userId, errorMsg: String(pbErr) }, 'Failed clearing voiceStyle from playbook');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ userId, errorMsg: msg }, 'Error during deleteUserText');
    throw new Error(`Failed to delete user practice text: ${msg}`);
  }

  return {
    ok: true,
    deletedTurns,
    clearedDebriefs,
    clearedJournals,
    message: 'Practice text and reflections cleared. Your skills and progress are preserved.',
  };
}
