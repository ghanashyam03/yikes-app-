-- Row Level Security (RLS) Policies
-- Enforce strict tenant isolation on all tables

-- =====================================================================
-- 1. Enable RLS on EVERY public table (23 tables)
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ladder_rungs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_letters ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. User-owned tables: owner-only SELECT, INSERT, UPDATE, DELETE
-- =====================================================================

-- profiles
CREATE POLICY profiles_select_owner ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY profiles_insert_owner ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_update_owner ON public.profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_delete_owner ON public.profiles FOR DELETE USING (user_id = auth.uid());

-- consents
CREATE POLICY consents_select_owner ON public.consents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY consents_insert_owner ON public.consents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY consents_update_owner ON public.consents FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY consents_delete_owner ON public.consents FOR DELETE USING (user_id = auth.uid());

-- notification_prefs
CREATE POLICY notification_prefs_select_owner ON public.notification_prefs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notification_prefs_insert_owner ON public.notification_prefs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY notification_prefs_update_owner ON public.notification_prefs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notification_prefs_delete_owner ON public.notification_prefs FOR DELETE USING (user_id = auth.uid());

-- deletion_requests
CREATE POLICY deletion_requests_select_owner ON public.deletion_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY deletion_requests_insert_owner ON public.deletion_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY deletion_requests_update_owner ON public.deletion_requests FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY deletion_requests_delete_owner ON public.deletion_requests FOR DELETE USING (user_id = auth.uid());

-- exports
CREATE POLICY exports_select_owner ON public.exports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY exports_insert_owner ON public.exports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY exports_update_owner ON public.exports FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY exports_delete_owner ON public.exports FOR DELETE USING (user_id = auth.uid());

-- playbooks
CREATE POLICY playbooks_select_owner ON public.playbooks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY playbooks_insert_owner ON public.playbooks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY playbooks_update_owner ON public.playbooks FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY playbooks_delete_owner ON public.playbooks FOR DELETE USING (user_id = auth.uid());

-- skills_progress
CREATE POLICY skills_progress_select_owner ON public.skills_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY skills_progress_insert_owner ON public.skills_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY skills_progress_update_owner ON public.skills_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY skills_progress_delete_owner ON public.skills_progress FOR DELETE USING (user_id = auth.uid());

-- sessions_log
CREATE POLICY sessions_log_select_owner ON public.sessions_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY sessions_log_insert_owner ON public.sessions_log FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY sessions_log_update_owner ON public.sessions_log FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY sessions_log_delete_owner ON public.sessions_log FOR DELETE USING (user_id = auth.uid());

-- attempts
CREATE POLICY attempts_select_owner ON public.attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY attempts_insert_owner ON public.attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY attempts_update_owner ON public.attempts FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY attempts_delete_owner ON public.attempts FOR DELETE USING (user_id = auth.uid());

-- ai_feedback
CREATE POLICY ai_feedback_select_owner ON public.ai_feedback FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ai_feedback_insert_owner ON public.ai_feedback FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_feedback_update_owner ON public.ai_feedback FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_feedback_delete_owner ON public.ai_feedback FOR DELETE USING (user_id = auth.uid());

-- moments
CREATE POLICY moments_select_owner ON public.moments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY moments_insert_owner ON public.moments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY moments_update_owner ON public.moments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY moments_delete_owner ON public.moments FOR DELETE USING (user_id = auth.uid());

-- energy_checkins
CREATE POLICY energy_checkins_select_owner ON public.energy_checkins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY energy_checkins_insert_owner ON public.energy_checkins FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY energy_checkins_update_owner ON public.energy_checkins FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY energy_checkins_delete_owner ON public.energy_checkins FOR DELETE USING (user_id = auth.uid());

-- micro_reps
CREATE POLICY micro_reps_select_owner ON public.micro_reps FOR SELECT USING (user_id = auth.uid());
CREATE POLICY micro_reps_insert_owner ON public.micro_reps FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY micro_reps_update_owner ON public.micro_reps FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY micro_reps_delete_owner ON public.micro_reps FOR DELETE USING (user_id = auth.uid());

-- debriefs
CREATE POLICY debriefs_select_owner ON public.debriefs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY debriefs_insert_owner ON public.debriefs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY debriefs_update_owner ON public.debriefs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY debriefs_delete_owner ON public.debriefs FOR DELETE USING (user_id = auth.uid());

-- ladder_rungs
CREATE POLICY ladder_rungs_select_owner ON public.ladder_rungs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ladder_rungs_insert_owner ON public.ladder_rungs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY ladder_rungs_update_owner ON public.ladder_rungs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ladder_rungs_delete_owner ON public.ladder_rungs FOR DELETE USING (user_id = auth.uid());

-- journal_entries
CREATE POLICY journal_entries_select_owner ON public.journal_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY journal_entries_insert_owner ON public.journal_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY journal_entries_update_owner ON public.journal_entries FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY journal_entries_delete_owner ON public.journal_entries FOR DELETE USING (user_id = auth.uid());

-- weekly_letters
CREATE POLICY weekly_letters_select_owner ON public.weekly_letters FOR SELECT USING (user_id = auth.uid());
CREATE POLICY weekly_letters_insert_owner ON public.weekly_letters FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY weekly_letters_update_owner ON public.weekly_letters FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY weekly_letters_delete_owner ON public.weekly_letters FOR DELETE USING (user_id = auth.uid());

-- ai_usage_daily
CREATE POLICY ai_usage_daily_select_owner ON public.ai_usage_daily FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ai_usage_daily_insert_owner ON public.ai_usage_daily FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_usage_daily_update_owner ON public.ai_usage_daily FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_usage_daily_delete_owner ON public.ai_usage_daily FOR DELETE USING (user_id = auth.uid());

-- =====================================================================
-- 3. Child tables: turns and coach_feedback
-- Accessible only via attempts owned by auth.uid()
-- =====================================================================

-- turns
CREATE POLICY turns_select_owner ON public.turns FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = turns.attempt_id AND attempts.user_id = auth.uid()));

CREATE POLICY turns_insert_owner ON public.turns FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = turns.attempt_id AND attempts.user_id = auth.uid()));

CREATE POLICY turns_update_owner ON public.turns FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = turns.attempt_id AND attempts.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = turns.attempt_id AND attempts.user_id = auth.uid()));

CREATE POLICY turns_delete_owner ON public.turns FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = turns.attempt_id AND attempts.user_id = auth.uid()));

-- coach_feedback
CREATE POLICY coach_feedback_select_owner ON public.coach_feedback FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = coach_feedback.attempt_id AND attempts.user_id = auth.uid()));

CREATE POLICY coach_feedback_insert_owner ON public.coach_feedback FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = coach_feedback.attempt_id AND attempts.user_id = auth.uid()));

CREATE POLICY coach_feedback_update_owner ON public.coach_feedback FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = coach_feedback.attempt_id AND attempts.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = coach_feedback.attempt_id AND attempts.user_id = auth.uid()));

CREATE POLICY coach_feedback_delete_owner ON public.coach_feedback FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = coach_feedback.attempt_id AND attempts.user_id = auth.uid()));

-- =====================================================================
-- 4. Entitlements
-- Owner can SELECT their own entitlements; mutations are service-role only
-- =====================================================================
CREATE POLICY entitlements_select_owner ON public.entitlements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY entitlements_insert_service_role ON public.entitlements FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY entitlements_update_service_role ON public.entitlements FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY entitlements_delete_service_role ON public.entitlements FOR DELETE
  USING (auth.role() = 'service_role');

-- =====================================================================
-- 5. Service-role only tables: ai_calls, safety_events
-- No public/user policies. Accessible only by service_role
-- =====================================================================
CREATE POLICY ai_calls_service_role_all ON public.ai_calls FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY safety_events_service_role_all ON public.safety_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
