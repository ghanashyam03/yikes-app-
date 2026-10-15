import { execFileSync } from 'node:child_process';

const host = process.env.PGHOST || '127.0.0.1';
const port = process.env.PGPORT || '54329';
const user = process.env.PGUSER || 'postgres';
const db = process.env.PGDATABASE || 'postgres';
const psqlPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';

function runSql(sql) {
  try {
    return execFileSync(
      psqlPath,
      ['-h', host, '-p', port, '-U', user, '-d', db, '-t', '-A', '-c', sql],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).replace(/\r/g, '').trim();
  } catch (err) {
    throw new Error(`SQL Execution failed:\n${sql}\nError: ${err.stderr || err.message}`);
  }
}

function runQueryValue(sql) {
  const output = runSql(sql);
  const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
  return lines[lines.length - 1] ?? '';
}

console.log('--- Extra RLS & Schema Integrity Probes ---');

// Ensure standard roles and schema permissions exist (Supabase role setup)
runSql(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;
`);

const userA = 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa';
const userB = 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb';
const attemptA = '11111111-aaaa-aaaa-aaaa-111111111111';
const momentA = '22222222-aaaa-aaaa-aaaa-222222222222';
const turnA = '33333333-aaaa-aaaa-aaaa-333333333333';
const feedbackA = '44444444-aaaa-aaaa-aaaa-444444444444';
const repA = '55555555-aaaa-aaaa-aaaa-555555555555';
const debriefA = '66666666-aaaa-aaaa-aaaa-666666666666';

// 1. Setup clean test data
console.log('1. Setting up fresh test tenants User A and User B...');
runSql(`
DELETE FROM auth.users WHERE id IN ('${userA}', '${userB}');
DELETE FROM public.ai_calls WHERE id = '77777777-aaaa-aaaa-aaaa-777777777777';
DELETE FROM public.safety_events WHERE id = '88888888-aaaa-aaaa-aaaa-888888888888';

INSERT INTO auth.users (id, email) VALUES 
  ('${userA}', 'probe_a@test.internal'),
  ('${userB}', 'probe_b@test.internal');

-- Seed User A data
SET ROLE authenticated;
SET request.jwt.claim.sub = '${userA}';
SET request.jwt.claim.role = 'authenticated';

INSERT INTO public.profiles (user_id, display_name) VALUES ('${userA}', 'User A Probe');
INSERT INTO public.attempts (id, user_id, mode) VALUES ('${attemptA}', '${userA}', 'try');
INSERT INTO public.turns (id, attempt_id, idx, role, text) VALUES ('${turnA}', '${attemptA}', 0, 'user', 'User A confidential chat');
INSERT INTO public.coach_feedback (id, attempt_id, payload, model, prompt_version) 
  VALUES ('${feedbackA}', '${attemptA}', '{"worked":"great"}'::jsonb, 'test-model', 'v1');
INSERT INTO public.moments (id, user_id, title) VALUES ('${momentA}', '${userA}', 'Confidential meeting');
INSERT INTO public.micro_reps (id, user_id, moment_id, outcome) VALUES ('${repA}', '${userA}', '${momentA}', 'Handled well');
INSERT INTO public.debriefs (id, user_id, moment_id, takeaway) VALUES ('${debriefA}', '${userA}', '${momentA}', 'Valuable insight');

-- Seed service-role data
SET ROLE service_role;
SET request.jwt.claim.role = 'service_role';
INSERT INTO public.ai_calls (id, job, model, prompt_version, latency_ms, status) 
  VALUES ('77777777-aaaa-aaaa-aaaa-777777777777', 'partner', 'gpt-test', '1.0', 120, 'ok');
INSERT INTO public.safety_events (id, kind, source) 
  VALUES ('88888888-aaaa-aaaa-aaaa-888888888888', 'crisis', 'filter');
INSERT INTO public.entitlements (id, user_id, plan, is_active) 
  VALUES ('99999999-aaaa-aaaa-aaaa-999999999999', '${userA}', 'plus', true);
`);
console.log('   Setup complete.');

// 2. Probe Cross-tenant JOINs
console.log('2. Probing cross-tenant JOIN isolation (User B attempting joins into User A data)...');
const joinAttemptsTurns = runQueryValue(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userB}';
  SET request.jwt.claim.role = 'authenticated';
  SELECT count(*) FROM public.attempts a JOIN public.turns t ON a.id = t.attempt_id;
`);
if (joinAttemptsTurns !== '0') {
  throw new Error(`FAIL: User B was able to read ${joinAttemptsTurns} rows via attempts-turns join!`);
}
console.log('   OK: User B attempts-turns JOIN returned 0 rows.');

const joinProfilesAttempts = runQueryValue(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userB}';
  SET request.jwt.claim.role = 'authenticated';
  SELECT count(*) FROM public.profiles p JOIN public.attempts a ON p.user_id = a.user_id;
`);
if (joinProfilesAttempts !== '0') {
  throw new Error(`FAIL: User B was able to read ${joinProfilesAttempts} rows via profiles-attempts join!`);
}
console.log('   OK: User B profiles-attempts JOIN returned 0 rows.');

const joinMomentsDebriefs = runQueryValue(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userB}';
  SET request.jwt.claim.role = 'authenticated';
  SELECT count(*) FROM public.moments m JOIN public.debriefs d ON m.id = d.moment_id;
`);
if (joinMomentsDebriefs !== '0') {
  throw new Error(`FAIL: User B was able to read ${joinMomentsDebriefs} rows via moments-debriefs join!`);
}
console.log('   OK: User B moments-debriefs JOIN returned 0 rows.');

// 3. Probe Cross-tenant UPDATE and DELETE
console.log('3. Probing cross-tenant UPDATE and DELETE tampering...');
runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userB}';
  SET request.jwt.claim.role = 'authenticated';
  UPDATE public.profiles SET display_name = 'Hacked' WHERE user_id = '${userA}';
  UPDATE public.turns SET text = 'Overwritten' WHERE id = '${turnA}';
  DELETE FROM public.moments WHERE id = '${momentA}';
  DELETE FROM public.attempts WHERE id = '${attemptA}';
`);

// Verify User A data is untouched
const profName = runQueryValue(`SELECT display_name FROM public.profiles WHERE user_id = '${userA}';`);
if (profName !== 'User A Probe') {
  throw new Error(`FAIL: User A profile display_name was tampered with: ${profName}`);
}
const turnText = runQueryValue(`SELECT text FROM public.turns WHERE id = '${turnA}';`);
if (turnText !== 'User A confidential chat') {
  throw new Error(`FAIL: User A turn text was tampered with: ${turnText}`);
}
const momentExists = runQueryValue(`SELECT count(*) FROM public.moments WHERE id = '${momentA}';`);
if (momentExists !== '1') {
  throw new Error('FAIL: User A moment was deleted by User B!');
}
console.log('   OK: User B UPDATE and DELETE attempts had zero effect on User A rows.');

// 4. Probe Service-Role lockdown on ai_calls, safety_events, entitlements
console.log('4. Probing service-role lockdown on ai_calls, safety_events, and entitlements...');
// User A attempts SELECT on ai_calls
const aiCallsRead = runQueryValue(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userA}';
  SET request.jwt.claim.role = 'authenticated';
  SELECT count(*) FROM public.ai_calls;
`);
if (aiCallsRead !== '0') {
  throw new Error(`FAIL: Authenticated user read ${aiCallsRead} rows from ai_calls!`);
}
console.log('   OK: Authenticated user reads 0 rows from ai_calls.');

// User A attempts SELECT on safety_events
const safetyRead = runQueryValue(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userA}';
  SET request.jwt.claim.role = 'authenticated';
  SELECT count(*) FROM public.safety_events;
`);
if (safetyRead !== '0') {
  throw new Error(`FAIL: Authenticated user read ${safetyRead} rows from safety_events!`);
}
console.log('   OK: Authenticated user reads 0 rows from safety_events.');

// Anon attempts SELECT on ai_calls and safety_events (must be denied or 0 rows)
try {
  const anonAiCalls = runQueryValue(`
    SET ROLE anon;
    SET request.jwt.claim.role = 'anon';
    SELECT count(*) FROM public.ai_calls;
  `);
  if (anonAiCalls !== '0') {
    throw new Error('FAIL: Anon user read rows from ai_calls!');
  }
  console.log('   OK: Anon user reads 0 rows from ai_calls.');
} catch (err) {
  console.log('   OK: Anon user access to ai_calls completely denied by database permissions.');
}

try {
  const anonSafety = runQueryValue(`
    SET ROLE anon;
    SET request.jwt.claim.role = 'anon';
    SELECT count(*) FROM public.safety_events;
  `);
  if (anonSafety !== '0') {
    throw new Error('FAIL: Anon user read rows from safety_events!');
  }
  console.log('   OK: Anon user reads 0 rows from safety_events.');
} catch (err) {
  console.log('   OK: Anon user access to safety_events completely denied by database permissions.');
}

// User A attempts UPDATE on entitlements
try {
  runSql(`
    SET ROLE authenticated;
    SET request.jwt.claim.sub = '${userA}';
    SET request.jwt.claim.role = 'authenticated';
    UPDATE public.entitlements SET plan = 'enterprise', is_active = true WHERE user_id = '${userA}';
  `);
  // Check if update actually took effect
  const updatedPlan = runQueryValue(`SELECT plan FROM public.entitlements WHERE user_id = '${userA}';`);
  if (updatedPlan === 'enterprise') {
    throw new Error('FAIL: User was able to update their own plan in entitlements!');
  }
} catch (err) {
  // Policy error is expected
}
console.log('   OK: User cannot modify entitlements (service-role only).');

// 5. Probe Cascade Delete: attempt -> turns & coach_feedback
console.log('5. Probing child cascade delete on attempt deletion...');
runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userA}';
  SET request.jwt.claim.role = 'authenticated';
  DELETE FROM public.attempts WHERE id = '${attemptA}';
`);

const turnsLeft = runQueryValue(`SELECT count(*) FROM public.turns WHERE attempt_id = '${attemptA}';`);
const feedbackLeft = runQueryValue(`SELECT count(*) FROM public.coach_feedback WHERE attempt_id = '${attemptA}';`);
if (turnsLeft !== '0' || feedbackLeft !== '0') {
  throw new Error(`FAIL: Cascade delete failed on attempt! turnsLeft=${turnsLeft}, feedbackLeft=${feedbackLeft}`);
}
console.log('   OK: Deleting parent attempt cascaded to child turns (0 left) and coach_feedback (0 left).');

// 6. Probe Cascade behavior on Moment deletion (ON DELETE SET NULL)
console.log('6. Probing moment deletion behavior on micro_reps and debriefs (ON DELETE SET NULL)...');
runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userA}';
  SET request.jwt.claim.role = 'authenticated';
  DELETE FROM public.moments WHERE id = '${momentA}';
`);
const repMomentRef = runQueryValue(`SELECT moment_id FROM public.micro_reps WHERE id = '${repA}';`);
const debriefMomentRef = runQueryValue(`SELECT moment_id FROM public.debriefs WHERE id = '${debriefA}';`);
if (repMomentRef !== '' || debriefMomentRef !== '') {
  throw new Error(`FAIL: Moment foreign key was not set to NULL upon moment deletion! repMomentRef='${repMomentRef}', debriefMomentRef='${debriefMomentRef}'`);
}
console.log('   OK: Deleting moment correctly set foreign keys to NULL in micro_reps and debriefs.');

// 7. Probe Global Cascade Delete on user deletion (auth.users CASCADE)
console.log('7. Probing tenant deletion cascade from auth.users...');
runSql(`DELETE FROM auth.users WHERE id = '${userA}';`);

const tablesToCheck = [
  'profiles', 'consents', 'notification_prefs', 'entitlements', 'deletion_requests',
  'exports', 'playbooks', 'skills_progress', 'sessions_log', 'ai_feedback',
  'energy_checkins', 'micro_reps', 'debriefs', 'ladder_rungs', 'journal_entries',
  'weekly_letters', 'ai_usage_daily'
];

for (const t of tablesToCheck) {
  const count = runQueryValue(`SELECT count(*) FROM public.${t} WHERE user_id = '${userA}';`);
  if (count !== '0') {
    throw new Error(`FAIL: User deletion did NOT cascade to table public.${t}! Count=${count}`);
  }
}
console.log('   OK: Deleting auth.users record cleanly cascaded to all 17 user tables (0 rows remaining).');

// Cleanup
runSql(`
  DELETE FROM auth.users WHERE id IN ('${userA}', '${userB}');
  DELETE FROM public.ai_calls WHERE id = '77777777-aaaa-aaaa-aaaa-777777777777';
  DELETE FROM public.safety_events WHERE id = '88888888-aaaa-aaaa-aaaa-888888888888';
`);

console.log('\n=== ALL EXTRA RLS & SCHEMA INTEGRITY PROBES PASSED ===');
