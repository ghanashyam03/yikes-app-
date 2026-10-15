-- Moments, Reflection and Journal Domain
-- Domain: moments, energy_checkins, micro_reps, debriefs, ladder_rungs, journal_entries, weekly_letters

-- 1. moments
CREATE TABLE IF NOT EXISTS public.moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz,
  prep_payload jsonb,
  status text DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

-- 2. energy_checkins
CREATE TABLE IF NOT EXISTS public.energy_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  battery_level integer NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. micro_reps
CREATE TABLE IF NOT EXISTS public.micro_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moment_id uuid REFERENCES public.moments(id) ON DELETE SET NULL,
  forecast_drain integer,
  forecast_warmth integer,
  actual_drain integer,
  actual_warmth integer,
  outcome text,
  landed boolean,
  created_at timestamptz DEFAULT now()
);

-- 4. debriefs
CREATE TABLE IF NOT EXISTS public.debriefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moment_id uuid REFERENCES public.moments(id) ON DELETE SET NULL,
  transcript jsonb DEFAULT '[]'::jsonb,
  takeaway text,
  created_at timestamptz DEFAULT now()
);

-- 5. ladder_rungs
CREATE TABLE IF NOT EXISTS public.ladder_rungs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 6. journal_entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_kind text NOT NULL,
  title text,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 7. weekly_letters
CREATE TABLE IF NOT EXISTS public.weekly_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
