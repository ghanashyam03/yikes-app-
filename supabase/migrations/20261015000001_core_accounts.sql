-- Core Accounts & Identity
-- Domain: profiles, consents, notification_prefs, entitlements, deletion_requests, exports

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$ LANGUAGE sql STABLE;

-- 1. profiles
-- Explicit privacy guarantee: NO birth year, NO date of birth columns!
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  locale text DEFAULT 'en-IN',
  theme_pref text DEFAULT 'auto',
  adult_confirmed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 2. consents
CREATE TABLE IF NOT EXISTS public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('required', 'analytics', 'improve_ai', 'marketing')),
  granted boolean NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 3. notification_prefs
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token text,
  window_start text,
  window_end text,
  quiet_hours_start text,
  quiet_hours_end text,
  paused_until timestamptz,
  toggles jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- 4. entitlements
CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- 5. deletion_requests
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 6. exports
CREATE TABLE IF NOT EXISTS public.exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  download_link text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
