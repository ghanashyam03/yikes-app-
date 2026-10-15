-- Practice & Sessions Domain
-- Domain: playbooks, skills_progress, sessions_log, attempts, turns, coach_feedback, ai_feedback

-- 1. playbooks
CREATE TABLE IF NOT EXISTS public.playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  derived jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. skills_progress
CREATE TABLE IF NOT EXISTS public.skills_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_key text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('starting', 'practicing', 'growing', 'natural')),
  stage_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- 3. sessions_log
CREATE TABLE IF NOT EXISTS public.sessions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  mode text NOT NULL DEFAULT 'full'
);

-- 4. attempts
CREATE TABLE IF NOT EXISTS public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  persona_id text,
  mode text NOT NULL CHECK (mode IN ('try', 'warmup', 'rehearsal', 'free')),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  parent_attempt_id uuid REFERENCES public.attempts(id) ON DELETE SET NULL,
  turns_count integer NOT NULL DEFAULT 0,
  ended_at timestamptz,
  ended_reason text,
  created_at timestamptz DEFAULT now()
);

-- 5. turns
CREATE TABLE IF NOT EXISTS public.turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  idx integer NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'partner', 'coach', 'system')),
  text text NOT NULL,
  thought text,
  mood jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '90 days')
);

-- 6. coach_feedback
CREATE TABLE IF NOT EXISTS public.coach_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  judge jsonb,
  created_at timestamptz DEFAULT now()
);

-- 7. ai_feedback
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_kind text NOT NULL,
  target_id text NOT NULL,
  rating integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
