-- Privacy Helpers and Purge Operations
-- Migration: 20261016000008_privacy_helpers.sql
-- Domain: privacy helpers, deletion indexing, purge functions, export storage

-- 1. Indexing for high-frequency privacy operations and cascade lookups
CREATE INDEX IF NOT EXISTS idx_turns_expires_at ON public.turns (expires_at);
CREATE INDEX IF NOT EXISTS idx_turns_attempt_id ON public.turns (attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_consents_user_kind ON public.consents (user_id, kind);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON public.exports (user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON public.deletion_requests (user_id);

-- 2. Add payload column to exports for storing generated self-contained export JSON
ALTER TABLE public.exports ADD COLUMN IF NOT EXISTS payload jsonb;

-- 3. Stored function: purge_expired_text
-- Deletes turns older than their 90-day retention expiration timestamp
CREATE OR REPLACE FUNCTION public.purge_expired_text()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.turns
  WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Stored function: delete_user_text
-- Selectively deletes practice text (turns text, debriefs transcript, journal body)
-- STRICT GUARANTEE: Preserves skills_progress, sessions_log, and attempts metadata!
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

  RETURN jsonb_build_object(
    'deleted_turns', turns_deleted,
    'cleared_debriefs', debriefs_cleared,
    'cleared_journals', journals_cleared
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Stored function: can_use_for_improvement
-- Checks if user has actively granted 'improve_ai' consent
CREATE OR REPLACE FUNCTION public.can_use_for_improvement(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_granted boolean;
BEGIN
  SELECT granted INTO is_granted
  FROM public.consents
  WHERE user_id = target_user_id AND kind = 'improve_ai'
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN coalesce(is_granted, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
