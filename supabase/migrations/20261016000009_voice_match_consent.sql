-- Voice Match Consent and Privacy Safeguards
-- Migration: 20261016000009_voice_match_consent.sql
-- Domain: consents, playbooks, privacy safeguards

-- 1. Update check constraint on public.consents table to allow 'voice_match'
ALTER TABLE public.consents DROP CONSTRAINT IF EXISTS consents_kind_check;
ALTER TABLE public.consents ADD CONSTRAINT consents_kind_check
  CHECK (kind IN ('required', 'analytics', 'improve_ai', 'marketing', 'voice_match'));

-- 2. Update delete_user_text stored procedure to ensure deleting practice text
-- purges playbooks.derived.voiceStyle while preserving skills, sessions_log, and attempts metadata
CREATE OR REPLACE FUNCTION public.delete_user_text(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  turns_deleted integer;
  debriefs_cleared integer;
  journals_cleared integer;
BEGIN
  -- Delete turns belonging to the user's attempts
  DELETE FROM public.turns
  WHERE attempt_id IN (
    SELECT id FROM public.attempts WHERE user_id = target_user_id
  );
  GET DIAGNOSTICS turns_deleted = ROW_COUNT;

  -- Clear debrief transcripts (reset to empty JSON array)
  UPDATE public.debriefs
  SET transcript = '[]'::jsonb
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS debriefs_cleared = ROW_COUNT;

  -- Clear journal entry body text
  UPDATE public.journal_entries
  SET body = NULL
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS journals_cleared = ROW_COUNT;

  -- Purge voiceStyle from playbooks derived jsonb
  UPDATE public.playbooks
  SET derived = derived - 'voiceStyle'
  WHERE user_id = target_user_id;

  RETURN jsonb_build_object(
    'deleted_turns', turns_deleted,
    'cleared_debriefs', debriefs_cleared,
    'cleared_journals', journals_cleared
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger: Automatically purge voiceStyle when voice_match consent is withdrawn (granted = false)
CREATE OR REPLACE FUNCTION public.handle_voice_match_consent_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.kind = 'voice_match' AND NEW.granted = false THEN
    UPDATE public.playbooks
    SET derived = derived - 'voiceStyle'
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_voice_match_consent ON public.consents;
CREATE TRIGGER trigger_voice_match_consent
AFTER INSERT OR UPDATE ON public.consents
FOR EACH ROW
EXECUTE FUNCTION public.handle_voice_match_consent_change();
