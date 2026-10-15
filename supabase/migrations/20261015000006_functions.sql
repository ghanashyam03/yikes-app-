-- Database Functions
-- Domain: retention purge functions

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
