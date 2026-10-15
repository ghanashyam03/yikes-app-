-- Development Seed Data & Dev User Helper

-- Ensure dev user exists in auth.users
INSERT INTO auth.users (id, email, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'dev@yikes.test',
  now()
)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- Dev Profile
-- Verified: NO birth year, NO date of birth!
INSERT INTO public.profiles (user_id, display_name, locale, theme_pref, adult_confirmed_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Dev User',
  'en-IN',
  'auto',
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  locale = EXCLUDED.locale,
  theme_pref = EXCLUDED.theme_pref;

-- Consents
INSERT INTO public.consents (user_id, kind, granted)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'required', true),
  ('a0000000-0000-0000-0000-000000000001', 'analytics', true),
  ('a0000000-0000-0000-0000-000000000001', 'improve_ai', false),
  ('a0000000-0000-0000-0000-000000000001', 'marketing', false);

-- Notification Prefs
INSERT INTO public.notification_prefs (user_id, window_start, window_end, quiet_hours_start, quiet_hours_end, toggles)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '09:00',
  '20:00',
  '22:00',
  '08:00',
  '{"rhythm_reminder": true, "moment_prep": true, "weekly_letter": true}'::jsonb
);

-- Entitlements
INSERT INTO public.entitlements (user_id, plan, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'free',
  true
);

-- Playbook
INSERT INTO public.playbooks (user_id, answers, derived, version)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '{"q1": "introvert", "q2": "medium"}'::jsonb,
  '{"pace": "gentle", "weeklyGoal": 3, "startDifficulty": 1}'::jsonb,
  1
);

-- Initial Skills Progress
INSERT INTO public.skills_progress (user_id, skill_key, stage, stage_history)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'starting_chat', 'starting', '[]'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', 'asking_followups', 'practicing', '[]'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', 'acknowledging', 'starting', '[]'::jsonb);

-- Quiet Ladder Rungs
INSERT INTO public.ladder_rungs (user_id, title, sort_order, completed)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Say hi to a neighbour', 1, true),
  ('a0000000-0000-0000-0000-000000000001', 'Ask one follow-up question at lunch', 2, false),
  ('a0000000-0000-0000-0000-000000000001', 'Exit a conversation warmly within 3 minutes', 3, false);
