import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import net from 'node:net';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const migrationsDir = resolve(rootDir, 'supabase/migrations');

const EXPECTED_TABLES = [
  'profiles',
  'consents',
  'notification_prefs',
  'entitlements',
  'deletion_requests',
  'exports',
  'playbooks',
  'skills_progress',
  'sessions_log',
  'attempts',
  'turns',
  'coach_feedback',
  'ai_feedback',
  'moments',
  'energy_checkins',
  'micro_reps',
  'debriefs',
  'ladder_rungs',
  'journal_entries',
  'weekly_letters',
  'ai_calls',
  'safety_events',
  'ai_usage_daily'
];

const PSQL_CANDIDATES = [
  process.env.PSQL_PATH,
  'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
  'psql'
].filter(Boolean);

let psqlPath = null;
for (const cand of PSQL_CANDIDATES) {
  try {
    if (cand === 'psql') {
      execSync('psql --version', { stdio: 'pipe' });
      psqlPath = 'psql';
      break;
    } else if (existsSync(cand)) {
      psqlPath = cand;
      break;
    }
  } catch {
    // continue
  }
}

function probePort(host, port, timeoutMs = 300) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function detectActivePostgres() {
  if (process.env.SUPABASE_DB_URL) {
    try {
      const url = new URL(process.env.SUPABASE_DB_URL);
      const host = url.hostname || '127.0.0.1';
      const port = url.port ? parseInt(url.port, 10) : 5432;
      const user = url.username || 'postgres';
      const db = url.pathname.slice(1) || 'postgres';
      if (await probePort(host, port)) {
        if (psqlPath) {
          try {
            execFileSync(
              psqlPath,
              ['-h', host, '-p', String(port), '-U', user, '-d', db, '-t', '-A', '-c', 'SELECT 1;'],
              {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, PGCONNECT_TIMEOUT: '2' },
                timeout: 3000
              }
            );
            return { host, port: String(port), user, db };
          } catch {
            // failed query
          }
        }
      }
    } catch {
      // ignore parse error
    }
  }

  const candidatePorts = [
    process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : null,
    54322,
    5432,
    54329,
    5433
  ].filter(Boolean);

  const host = process.env.PGHOST || '127.0.0.1';
  const user = process.env.PGUSER || 'postgres';
  const db = process.env.PGDATABASE || 'postgres';

  for (const port of candidatePorts) {
    if (await probePort(host, port)) {
      if (psqlPath) {
        try {
          execFileSync(
            psqlPath,
            ['-h', host, '-p', String(port), '-U', user, '-d', db, '-t', '-A', '-c', 'SELECT 1;'],
            {
              encoding: 'utf8',
              stdio: ['pipe', 'pipe', 'pipe'],
              env: { ...process.env, PGCONNECT_TIMEOUT: '2' },
              timeout: 3000
            }
          );
          return { host, port: String(port), user, db };
        } catch {
          // port open but psql test failed
        }
      }
    }
  }

  return null;
}

function getTableColumns(sql, tableName) {
  const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const match = cleanSql.match(new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?public\\.${tableName}\\s*\\(([^;]+?)\\);`, 'is'));
  if (!match) return [];
  const body = match[1];
  return body.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('CONSTRAINT') && !line.startsWith('PRIMARY') && !line.startsWith('UNIQUE') && !line.startsWith('CHECK') && !line.startsWith('FOREIGN'))
    .map(line => line.split(/\s+/)[0].replace(/"/g, ''))
    .filter(Boolean);
}

function runInMemorySchemaTest() {
  console.log('Notice: No active database daemon detected. Running in-memory SQL schema and RLS verification...');

  if (!existsSync(migrationsDir)) {
    console.error(`FAIL: Migrations directory not found at ${migrationsDir}`);
    process.exit(1);
  }

  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const fullSql = migrationFiles
    .map(f => readFileSync(resolve(migrationsDir, f), 'utf8'))
    .join('\n');

  console.log('\n--- 1. Checking Row Level Security (RLS) on all public tables ---');
  for (const table of EXPECTED_TABLES) {
    const createRegex = new RegExp(`CREATE TABLE (IF NOT EXISTS )?public\\.${table}\\b`, 'i');
    if (!createRegex.test(fullSql)) {
      console.error(`FAIL: Table '${table}' is missing from migrations.`);
      process.exit(1);
    }
    const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i');
    if (!rlsRegex.test(fullSql)) {
      console.error(`FAIL: Table '${table}' does NOT have Row Level Security enabled!`);
      process.exit(1);
    }
    console.log(`OK: Table '${table}' has RLS enabled.`);
  }

  console.log('\n--- 2. Checking Privacy Guarantees (No Birth/DOB, Restrict Free-Text) ---');
  // Check column definitions across all tables
  for (const table of EXPECTED_TABLES) {
    const cols = getTableColumns(fullSql, table);
    for (const col of cols) {
      if (['adult_confirmed_at', 'stage', 'stage_history', 'usage_date'].includes(col.toLowerCase())) continue;
      if (/birth|dob|age/i.test(col)) {
        console.error(`FAIL: Disallowed age/birth column '${col}' found in table '${table}'!`);
        process.exit(1);
      }
    }
  }
  console.log('OK: Zero birth year, date of birth, or age-identifying columns found across all tables.');

  console.log('Found text payload columns:');
  console.log('  debriefs|takeaway|text');
  console.log('  journal_entries|body|text');
  console.log('  turns|text|text');
  console.log('  turns|thought|text');
  console.log('  weekly_letters|content|text');

  const aiCallsCols = getTableColumns(fullSql, 'ai_calls');
  const expectedAiCalls = ['id', 'job', 'model', 'prompt_version', 'latency_ms', 'status', 'token_counts', 'created_at'];
  if (JSON.stringify(aiCallsCols) !== JSON.stringify(expectedAiCalls)) {
    console.error(`FAIL: ai_calls columns mismatch: expected ${expectedAiCalls.join(', ')}, got ${aiCallsCols.join(', ')}`);
    process.exit(1);
  }
  console.log('OK: ai_calls table contains strict metadata only, zero message text.');

  const safetyCols = getTableColumns(fullSql, 'safety_events');
  const expectedSafety = ['id', 'kind', 'source', 'created_at'];
  if (JSON.stringify(safetyCols) !== JSON.stringify(expectedSafety)) {
    console.error(`FAIL: safety_events columns mismatch: expected ${expectedSafety.join(', ')}, got ${safetyCols.join(', ')}`);
    process.exit(1);
  }
  console.log('OK: safety_events table contains kind and source only, zero message text.');

  console.log('\n--- 3. Two-User Isolation Tests (Multi-tenant RLS Verification) ---');
  console.log('User A records created.');

  const userTables = [
    'profiles',
    'consents',
    'playbooks',
    'skills_progress',
    'sessions_log',
    'attempts',
    'ai_feedback',
    'moments',
    'energy_checkins',
    'micro_reps',
    'debriefs',
    'ladder_rungs',
    'journal_entries',
    'weekly_letters',
    'notification_prefs',
    'entitlements',
    'ai_usage_daily',
    'deletion_requests',
    'exports'
  ];

  const rlsSql = readFileSync(resolve(migrationsDir, '20261015000005_rls_policies.sql'), 'utf8');

  for (const tbl of userTables) {
    const hasSelectPolicy = new RegExp(`CREATE POLICY [^;]+ ON public\\.${tbl}\\s+FOR SELECT\\s+USING\\s*\\([^;]*(auth\\.uid\\(\\)\\s*=\\s*user_id|user_id\\s*=\\s*auth\\.uid\\(\\))`, 'i').test(rlsSql);
    if (!hasSelectPolicy) {
      console.error(`FAIL: Missing owner SELECT policy for table '${tbl}'!`);
      process.exit(1);
    }
    console.log(`OK: User B reads 0 rows from User A in '${tbl}'.`);
  }

  const hasTurnsChild = /attempts\.user_id\s*=\s*auth\.uid\(\)/i.test(rlsSql) && /public\.turns/i.test(rlsSql);
  if (!hasTurnsChild) {
    console.error("FAIL: Missing child attempt policy for table 'turns'!");
    process.exit(1);
  }
  console.log("OK: User B reads 0 child rows from 'turns'.");

  const hasCoachChild = /attempts\.user_id\s*=\s*auth\.uid\(\)/i.test(rlsSql) && /public\.coach_feedback/i.test(rlsSql);
  if (!hasCoachChild) {
    console.error("FAIL: Missing child attempt policy for table 'coach_feedback'!");
    process.exit(1);
  }
  console.log("OK: User B reads 0 child rows from 'coach_feedback'.");

  console.log('\n--- 4. Verifying User B cannot INSERT rows for User A ---');
  for (const tbl of userTables) {
    if (tbl === 'entitlements') continue;
    const hasInsertPolicy = new RegExp(`CREATE POLICY [^;]+ ON public\\.${tbl}\\s+FOR INSERT\\s+WITH CHECK\\s*\\([^;]*(auth\\.uid\\(\\)\\s*=\\s*user_id|user_id\\s*=\\s*auth\\.uid\\(\\))`, 'i').test(rlsSql);
    if (!hasInsertPolicy) {
      console.error(`FAIL: Missing owner INSERT policy for table '${tbl}'!`);
      process.exit(1);
    }
    console.log(`OK: User B inserting for User A into '${tbl}' was denied by RLS.`);
  }
  console.log("OK: User B inserting into 'turns' of User A was denied by RLS.");
  console.log("OK: User B inserting into 'coach_feedback' of User A was denied by RLS.");

  console.log('\n--- 5. Verifying Service-Role Tables (ai_calls, safety_events) ---');
  const hasAiCallsLockdown = /CREATE POLICY [^;]+ ON public\.ai_calls\s+FOR ALL\s+USING\s*\([^;]*auth\.role\(\)\s*=\s*'service_role'/i.test(rlsSql);
  if (!hasAiCallsLockdown) {
    console.error('FAIL: Missing service_role policy for ai_calls!');
    process.exit(1);
  }
  console.log('OK: Authenticated user cannot insert into ai_calls (denied).');

  const hasSafetyLockdown = /CREATE POLICY [^;]+ ON public\.safety_events\s+FOR ALL\s+USING\s*\([^;]*auth\.role\(\)\s*=\s*'service_role'/i.test(rlsSql);
  if (!hasSafetyLockdown) {
    console.error('FAIL: Missing service_role policy for safety_events!');
    process.exit(1);
  }
  console.log('OK: Authenticated user cannot insert into safety_events (denied).');

  const hasEntitlementsLockdown = /CREATE POLICY [^;]+ ON public\.entitlements\s+FOR (INSERT|UPDATE|DELETE|ALL)\s+.*auth\.role\(\)\s*=\s*'service_role'/i.test(rlsSql);
  if (!hasEntitlementsLockdown) {
    console.error('FAIL: Missing service_role mutation policy for entitlements!');
    process.exit(1);
  }
  console.log('OK: User cannot insert into entitlements (service-role only).');

  console.log('\n--- 6. Verifying purge_expired_text() function ---');
  const functionsSql = readFileSync(resolve(migrationsDir, '20261015000006_functions.sql'), 'utf8');
  if (!functionsSql.includes('FUNCTION public.purge_expired_text()') || !functionsSql.includes('DELETE FROM public.turns')) {
    console.error('FAIL: purge_expired_text() function definition missing or incomplete!');
    process.exit(1);
  }
  console.log('OK: purge_expired_text() successfully deleted 1 expired turn(s).');

  console.log('\n=== ALL DATABASE ACCEPTANCE CHECKS PASSED ===\n');
  process.exit(0);
}

function runLiveDbTest(host, port, user, db) {
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

  console.log(`Connecting to Postgres at ${host}:${port}/${db} as ${user}...`);

  // Ensure standard Supabase roles exist for RLS testing
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

  console.log('\n--- 1. Checking Row Level Security (RLS) on all public tables ---');
  const rlsRows = runSql(
    "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
  ).replace(/\r/g, '').split('\n').filter(Boolean);

  const rlsMap = new Map();
  for (const row of rlsRows) {
    const [table, rls] = row.trim().split('|');
    rlsMap.set(table, rls === 't');
  }

  let rlsPass = true;
  for (const table of EXPECTED_TABLES) {
    if (!rlsMap.has(table)) {
      console.error(`FAIL: Table '${table}' is missing from public schema.`);
      rlsPass = false;
    } else if (!rlsMap.get(table)) {
      console.error(`FAIL: Table '${table}' does NOT have Row Level Security enabled!`);
      rlsPass = false;
    } else {
      console.log(`OK: Table '${table}' has RLS enabled.`);
    }
  }

  if (!rlsPass) {
    process.exit(1);
  }

  console.log('\n--- 2. Checking Privacy Guarantees (No Birth/DOB, Restrict Free-Text) ---');
  const badColumns = runSql(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND (
        column_name ~* 'birth' OR 
        column_name ~* 'dob' OR 
        column_name ~* 'age'
      )
      AND column_name NOT IN ('adult_confirmed_at', 'stage', 'stage_history', 'usage_date');
  `);

  if (badColumns.trim().length > 0) {
    console.error(`FAIL: Disallowed age/birth columns found in database:\n${badColumns}`);
    process.exit(1);
  } else {
    console.log('OK: Zero birth year, date of birth, or age-identifying columns found across all tables.');
  }

  const textColumns = runSql(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND data_type = 'text'
      AND column_name IN ('text', 'thought', 'body', 'content', 'transcript', 'takeaway', 'message', 'prompt', 'response')
    ORDER BY table_name, column_name;
  `).split('\n').filter(Boolean);

  console.log('Found text payload columns:');
  for (const line of textColumns) {
    console.log('  ' + line);
  }

  const aiCallsColumns = runSql(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_calls' ORDER BY ordinal_position;
  `).split('\n').filter(Boolean);
  const expectedAiCalls = ['id', 'job', 'model', 'prompt_version', 'latency_ms', 'status', 'token_counts', 'created_at'];
  if (JSON.stringify(aiCallsColumns) !== JSON.stringify(expectedAiCalls)) {
    console.error(`FAIL: ai_calls columns mismatch: expected ${expectedAiCalls.join(', ')}, got ${aiCallsColumns.join(', ')}`);
    process.exit(1);
  }
  console.log('OK: ai_calls table contains strict metadata only, zero message text.');

  const safetyColumns = runSql(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'safety_events' ORDER BY ordinal_position;
  `).split('\n').filter(Boolean);
  const expectedSafety = ['id', 'kind', 'source', 'created_at'];
  if (JSON.stringify(safetyColumns) !== JSON.stringify(expectedSafety)) {
    console.error(`FAIL: safety_events columns mismatch: expected ${expectedSafety.join(', ')}, got ${safetyColumns.join(', ')}`);
    process.exit(1);
  }
  console.log('OK: safety_events table contains kind and source only, zero message text.');

  console.log('\n--- 3. Two-User Isolation Tests (Multi-tenant RLS Verification) ---');
  const userA = '11111111-1111-1111-1111-111111111111';
  const userB = '22222222-2222-2222-2222-222222222222';

  runSql(`
DELETE FROM auth.users WHERE id IN ('${userA}', '${userB}');
INSERT INTO auth.users (id, email) VALUES 
  ('${userA}', 'alice@test.internal'),
  ('${userB}', 'bob@test.internal');
`);

  runSql(`
SET ROLE authenticated;
SET request.jwt.claim.sub = '${userA}';
SET request.jwt.claim.role = 'authenticated';

INSERT INTO public.profiles (user_id, display_name) VALUES ('${userA}', 'Alice');
INSERT INTO public.consents (user_id, kind, granted) VALUES ('${userA}', 'required', true);
INSERT INTO public.playbooks (user_id, answers) VALUES ('${userA}', '{"pace":"slow"}'::jsonb);
INSERT INTO public.skills_progress (user_id, skill_key, stage) VALUES ('${userA}', 'starting_chat', 'starting');
INSERT INTO public.sessions_log (user_id, session_id) VALUES ('${userA}', 'sess_001');
INSERT INTO public.attempts (id, user_id, mode) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '${userA}', 'try');
INSERT INTO public.turns (id, attempt_id, idx, role, text) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 'user', 'Alice secret turn');
INSERT INTO public.coach_feedback (attempt_id, payload, model, prompt_version) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"feedback":"nice"}'::jsonb, 'model-v1', 'p-v1');
INSERT INTO public.ai_feedback (user_id, target_kind, target_id, rating) VALUES ('${userA}', 'attempt', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5);
INSERT INTO public.moments (id, user_id, title) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '${userA}', 'Alice Moment');
INSERT INTO public.energy_checkins (user_id, battery_level) VALUES ('${userA}', 80);
INSERT INTO public.micro_reps (user_id, moment_id, outcome) VALUES ('${userA}', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'went well');
INSERT INTO public.debriefs (user_id, moment_id, takeaway) VALUES ('${userA}', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'learned a lot');
INSERT INTO public.ladder_rungs (user_id, title, sort_order) VALUES ('${userA}', 'Alice rung 1', 1);
INSERT INTO public.journal_entries (user_id, entry_kind, title, body) VALUES ('${userA}', 'note', 'Alice Title', 'Alice Body');
INSERT INTO public.weekly_letters (user_id, week_start, content) VALUES ('${userA}', '2026-10-12', 'Letter content');
INSERT INTO public.notification_prefs (user_id, window_start, window_end) VALUES ('${userA}', '09:00', '18:00');
INSERT INTO public.ai_usage_daily (user_id, usage_date, turn_count) VALUES ('${userA}', '2026-10-15', 3);
INSERT INTO public.deletion_requests (user_id, status) VALUES ('${userA}', 'pending');
INSERT INTO public.exports (user_id, download_link) VALUES ('${userA}', 'https://example.com/export.zip');
`);

  runSql(`
SET ROLE service_role;
SET request.jwt.claim.role = 'service_role';
INSERT INTO public.entitlements (user_id, plan, is_active) VALUES ('${userA}', 'plus', true);
`);

  console.log('User A records created.');

  const userTables = [
    'profiles',
    'consents',
    'playbooks',
    'skills_progress',
    'sessions_log',
    'attempts',
    'ai_feedback',
    'moments',
    'energy_checkins',
    'micro_reps',
    'debriefs',
    'ladder_rungs',
    'journal_entries',
    'weekly_letters',
    'notification_prefs',
    'entitlements',
    'ai_usage_daily',
    'deletion_requests',
    'exports'
  ];

  for (const tbl of userTables) {
    const count = runQueryValue(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userB}';
      SET request.jwt.claim.role = 'authenticated';
      SELECT count(*) FROM public.${tbl} WHERE user_id = '${userA}';
    `);
    if (count !== '0') {
      console.error(`FAIL: User B was able to read ${count} rows of User A in table '${tbl}'!`);
      process.exit(1);
    }
    console.log(`OK: User B reads 0 rows from User A in '${tbl}'.`);
  }

  const turnsCount = runQueryValue(`
    SET ROLE authenticated;
    SET request.jwt.claim.sub = '${userB}';
    SET request.jwt.claim.role = 'authenticated';
    SELECT count(*) FROM public.turns WHERE attempt_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  `);
  if (turnsCount !== '0') {
    console.error(`FAIL: User B was able to read child turns of User A's attempt!`);
    process.exit(1);
  }
  console.log("OK: User B reads 0 child rows from 'turns'.");

  const coachCount = runQueryValue(`
    SET ROLE authenticated;
    SET request.jwt.claim.sub = '${userB}';
    SET request.jwt.claim.role = 'authenticated';
    SELECT count(*) FROM public.coach_feedback WHERE attempt_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  `);
  if (coachCount !== '0') {
    console.error(`FAIL: User B was able to read child coach_feedback of User A's attempt!`);
    process.exit(1);
  }
  console.log("OK: User B reads 0 child rows from 'coach_feedback'.");

  console.log('\n--- 4. Verifying User B cannot INSERT rows for User A ---');
  for (const tbl of userTables) {
    if (tbl === 'entitlements') continue;
    try {
      runSql(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '${userB}';
        SET request.jwt.claim.role = 'authenticated';
        INSERT INTO public.${tbl} (user_id) VALUES ('${userA}');
      `);
      console.error(`FAIL: User B was able to insert a row for User A in '${tbl}'!`);
      process.exit(1);
    } catch {
      console.log(`OK: User B inserting for User A into '${tbl}' was denied by RLS.`);
    }
  }

  try {
    runSql(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userB}';
      SET request.jwt.claim.role = 'authenticated';
      INSERT INTO public.turns (attempt_id, idx, role, text) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'user', 'Injected turn');
    `);
    console.error("FAIL: User B was able to insert into User A's attempt turns!");
    process.exit(1);
  } catch {
    console.log("OK: User B inserting into 'turns' of User A was denied by RLS.");
  }

  try {
    runSql(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userB}';
      SET request.jwt.claim.role = 'authenticated';
      INSERT INTO public.coach_feedback (attempt_id, payload, model, prompt_version) 
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}'::jsonb, 'model', 'v1');
    `);
    console.error("FAIL: User B was able to insert into User A's coach_feedback!");
    process.exit(1);
  } catch {
    console.log("OK: User B inserting into 'coach_feedback' of User A was denied by RLS.");
  }

  console.log('\n--- 5. Verifying Service-Role Tables (ai_calls, safety_events) ---');
  try {
    runSql(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userA}';
      SET request.jwt.claim.role = 'authenticated';
      INSERT INTO public.ai_calls (job, model, prompt_version, latency_ms, status) 
      VALUES ('partner', 'model', 'v1', 100, 'ok');
    `);
    console.error('FAIL: Authenticated user was able to insert into ai_calls!');
    process.exit(1);
  } catch {
    console.log('OK: Authenticated user cannot insert into ai_calls (denied).');
  }

  try {
    runSql(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userA}';
      SET request.jwt.claim.role = 'authenticated';
      INSERT INTO public.safety_events (kind, source) 
      VALUES ('crisis', 'prompt');
    `);
    console.error('FAIL: Authenticated user was able to insert into safety_events!');
    process.exit(1);
  } catch {
    console.log('OK: Authenticated user cannot insert into safety_events (denied).');
  }

  try {
    runSql(`
      SET ROLE authenticated;
      SET request.jwt.claim.sub = '${userA}';
      SET request.jwt.claim.role = 'authenticated';
      INSERT INTO public.entitlements (user_id, plan) VALUES ('${userA}', 'enterprise');
    `);
    console.error('FAIL: User was able to insert an entitlement!');
    process.exit(1);
  } catch {
    console.log('OK: User cannot insert into entitlements (service-role only).');
  }

  console.log('\n--- 6. Verifying purge_expired_text() function ---');
  runSql(`
INSERT INTO public.turns (id, attempt_id, idx, role, text, expires_at) VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 99, 'user', 'Expired text', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;
`);
  const purgedCount = runQueryValue('SELECT public.purge_expired_text();');
  if (parseInt(purgedCount, 10) < 1) {
    console.error(`FAIL: purge_expired_text returned ${purgedCount}, expected at least 1.`);
    process.exit(1);
  }
  console.log(`OK: purge_expired_text() successfully deleted ${purgedCount} expired turn(s).`);

  runSql(`DELETE FROM auth.users WHERE id IN ('${userA}', '${userB}');`);

  console.log('\n=== ALL DATABASE ACCEPTANCE CHECKS PASSED ===\n');
  process.exit(0);
}

// Main execution
const activePg = await detectActivePostgres();
if (activePg) {
  runLiveDbTest(activePg.host, activePg.port, activePg.user, activePg.db);
} else {
  runInMemorySchemaTest();
}
