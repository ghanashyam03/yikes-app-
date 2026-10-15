-- AI Telemetry, Safety and Daily Usage
-- Domain: ai_calls, safety_events, ai_usage_daily

-- 1. ai_calls
-- Explicit privacy guarantee: METADATA ONLY, NO user message text!
CREATE TABLE IF NOT EXISTS public.ai_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL,
  latency_ms integer NOT NULL,
  status text NOT NULL,
  token_counts jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. safety_events
-- Explicit privacy guarantee: KIND & SOURCE ONLY, NO text!
CREATE TABLE IF NOT EXISTS public.safety_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. ai_usage_daily
CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  turn_count integer DEFAULT 0,
  reply_helper_count integer DEFAULT 0,
  prep_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, usage_date)
);
