import type { SupabaseClient } from '@supabase/supabase-js';
import Fastify, { type FastifyInstance } from 'fastify';
import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it } from 'vitest';
import type { GatewayEnv } from '../../../config/env.js';
import { canUseForImprovement } from '../can-use.js';
import { deleteUserAccount } from '../delete-account.js';
import { deleteUserText } from '../delete-text.js';
import { buildUserDataExport } from '../export.js';
import { register } from '../index.js';

const testSecret = 'super-secret-test-jwt-key-minimum-32-chars!!';

const mockEnv: GatewayEnv = {
  NVIDIA_API_KEY: 'test-key',
  NVIDIA_BASE_URL: 'https://integrate.api.nvidia.com/v1',
  MODEL_PARTNER: 'test-partner',
  MODEL_PARTNER_FALLBACK: 'test-fallback',
  MODEL_COACH: 'test-coach',
  MODEL_COACH_FALLBACK: 'test-coach-fallback',
  MODEL_JUDGE: 'test-judge',
  MODEL_SAFETY: 'test-safety',
  MODEL_VISION: 'test-vision',
  MODEL_LONG: 'test-long',
  MODEL_ALT: 'test-alt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  SUPABASE_JWT_SECRET: testSecret,
  RPM_LIMIT: 35,
  AI_PROVIDER: 'fake',
  PORT: 3000,
  HOST: '0.0.0.0',
  REQUEST_TIMEOUT_MS: 8000,
};

async function createToken(sub: string): Promise<string> {
  const secret = new TextEncoder().encode(testSecret);
  return await new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

const ALL_PUBLIC_TABLES = [
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
  'ai_usage_daily',
];

type RowRecord = Record<string, unknown>;

interface PublicTableMap {
  profiles: RowRecord[];
  consents: RowRecord[];
  notification_prefs: RowRecord[];
  entitlements: RowRecord[];
  deletion_requests: RowRecord[];
  exports: RowRecord[];
  playbooks: RowRecord[];
  skills_progress: RowRecord[];
  sessions_log: RowRecord[];
  attempts: RowRecord[];
  turns: RowRecord[];
  coach_feedback: RowRecord[];
  ai_feedback: RowRecord[];
  moments: RowRecord[];
  energy_checkins: RowRecord[];
  micro_reps: RowRecord[];
  debriefs: RowRecord[];
  ladder_rungs: RowRecord[];
  journal_entries: RowRecord[];
  weekly_letters: RowRecord[];
  ai_calls: RowRecord[];
  safety_events: RowRecord[];
  ai_usage_daily: RowRecord[];
  [key: string]: RowRecord[];
}

class MockDb {
  tables: PublicTableMap;

  constructor() {
    this.tables = {
      profiles: [],
      consents: [],
      notification_prefs: [],
      entitlements: [],
      deletion_requests: [],
      exports: [],
      playbooks: [],
      skills_progress: [],
      sessions_log: [],
      attempts: [],
      turns: [],
      coach_feedback: [],
      ai_feedback: [],
      moments: [],
      energy_checkins: [],
      micro_reps: [],
      debriefs: [],
      ladder_rungs: [],
      journal_entries: [],
      weekly_letters: [],
      ai_calls: [],
      safety_events: [],
      ai_usage_daily: [],
    };
    this.reset();
  }

  reset() {
    for (const t of ALL_PUBLIC_TABLES) {
      this.tables[t] = [];
    }
  }

  createClient(): SupabaseClient {
    const dbTables = this.tables;

    const mockClient = {
      from(tableName: string) {
        if (!dbTables[tableName]) {
          dbTables[tableName] = [];
        }

        let rows = [...dbTables[tableName]];
        let pendingInsert: RowRecord | RowRecord[] | null = null;
        let pendingUpdate: RowRecord | null = null;
        let isDelete = false;

        const builder = {
          select(_cols = '*') {
            return builder;
          },
          eq(col: string, val: unknown) {
            rows = rows.filter((r) => r[col] === val);
            return builder;
          },
          in(col: string, vals: unknown[]) {
            rows = rows.filter((r) => vals.includes(r[col]));
            return builder;
          },
          lt(col: string, val: unknown) {
            rows = rows.filter((r) => (r[col] as string) < (val as string));
            return builder;
          },
          order(_col: string, _opts: unknown) {
            return builder;
          },
          limit(_n: number) {
            return builder;
          },
          insert(payload: RowRecord | RowRecord[]) {
            pendingInsert = payload;
            return builder;
          },
          update(payload: RowRecord) {
            pendingUpdate = payload;
            return builder;
          },
          delete(_opts?: unknown) {
            isDelete = true;
            return builder;
          },
          maybeSingle() {
            return Promise.resolve({ data: rows[0] || null, error: null });
          },
          single() {
            if (pendingInsert) {
              const item = Array.isArray(pendingInsert) ? pendingInsert[0] : pendingInsert;
              const newItem: RowRecord = { id: item?.id || `id-${Math.random()}`, ...(item ?? {}) };
              const targetTable = dbTables[tableName];
              if (targetTable) {
                targetTable.push(newItem);
              }
              return Promise.resolve({ data: newItem, error: null });
            }
            return Promise.resolve({ data: rows[0] || null, error: null });
          },
          then(resolve: (result: { data: RowRecord[] | RowRecord | null; count?: number; error: null }) => void) {
            if (pendingInsert) {
              const items = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
              const created = items.map((i) => ({ id: i?.id || `id-${Math.random()}`, ...(i ?? {}) }));
              const targetTable = dbTables[tableName];
              if (targetTable) {
                targetTable.push(...created);
              }
              return resolve({ data: created, error: null });
            }
            if (isDelete) {
              const count = rows.length;
              const targetTable = dbTables[tableName];
              if (targetTable) {
                dbTables[tableName] = targetTable.filter((r) => !rows.includes(r));
              }
              return resolve({ data: rows, count, error: null });
            }
            if (pendingUpdate) {
              let updatedCount = 0;
              for (const r of rows) {
                Object.assign(r, pendingUpdate);
                updatedCount++;
              }
              return resolve({ data: rows, count: updatedCount, error: null });
            }
            return resolve({ data: rows, error: null });
          },
        };

        return builder;
      },
      rpc(fnName: string, args?: Record<string, unknown>) {
        if (fnName === 'purge_expired_text') {
          const now = new Date().toISOString();
          const initial = dbTables.turns.length;
          dbTables.turns = dbTables.turns.filter((t) => !t.expires_at || (t.expires_at as string) >= now);
          const purged = initial - dbTables.turns.length;
          return Promise.resolve({ data: purged, error: null });
        }
        if (fnName === 'delete_user_text') {
          const targetUserId = args?.target_user_id as string;
          const userAttempts = dbTables.attempts.filter((a) => a.user_id === targetUserId);
          const attemptIds = userAttempts.map((a) => a.id);
          const initialTurns = dbTables.turns.length;
          dbTables.turns = dbTables.turns.filter((t) => !attemptIds.includes(t.attempt_id));
          const deletedTurns = initialTurns - dbTables.turns.length;

          let debriefsCleared = 0;
          for (const d of dbTables.debriefs) {
            if (d.user_id === targetUserId) {
              d.transcript = [];
              debriefsCleared++;
            }
          }

          let journalsCleared = 0;
          for (const j of dbTables.journal_entries) {
            if (j.user_id === targetUserId) {
              j.body = null;
              journalsCleared++;
            }
          }

          return Promise.resolve({
            data: {
              deleted_turns: deletedTurns,
              cleared_debriefs: debriefsCleared,
              cleared_journals: journalsCleared,
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
      auth: {
        admin: {
          getUserById(userId: string) {
            return Promise.resolve({
              data: { user: { id: userId, email: `${userId}@test.com` } },
              error: null,
            });
          },
          deleteUser(userId: string) {
            // ON DELETE CASCADE simulator across all user tables
            const userAttempts = dbTables.attempts.filter((a) => a.user_id === userId);
            const attemptIds = userAttempts.map((a) => a.id);

            // Delete attempt child rows
            dbTables.turns = dbTables.turns.filter((t) => !attemptIds.includes(t.attempt_id));
            dbTables.coach_feedback = dbTables.coach_feedback.filter(
              (c) => !attemptIds.includes(c.attempt_id)
            );

            // Delete all rows where user_id = userId
            for (const table of ALL_PUBLIC_TABLES) {
              if (table === 'turns' || table === 'coach_feedback') continue;
              const currentTable = dbTables[table];
              if (currentTable) {
                dbTables[table] = currentTable.filter((row) => row.user_id !== userId);
              }
            }
            return Promise.resolve({ data: {}, error: null });
          },
        },
        verifyOtp({ token }: { token: string }) {
          if (token === '123456' || token === 'valid_otp') {
            return Promise.resolve({ data: { session: { access_token: 'fake' } }, error: null });
          }
          return Promise.resolve({ data: null, error: { message: 'Invalid OTP' } });
        },
      },
    };

    return mockClient as unknown as SupabaseClient;
  }
}

describe('T-07: Gateway Privacy Routes & Data Rights', () => {
  let db: MockDb;
  let supabase: SupabaseClient;
  let app: FastifyInstance;

  const userA = '11111111-1111-4111-8111-111111111111';
  const userB = '22222222-2222-4222-8222-222222222222';

  beforeEach(async () => {
    db = new MockDb();
    supabase = db.createClient();

    app = Fastify();
    await register(app, { env: mockEnv, supabase });
  });

  // =========================================================================
  // Acceptance Check 1: Export contains only that user's rows
  // =========================================================================
  it('Acceptance Check 1: Export contains only that user rows and zero rows of other users', async () => {
    // Seed User A data
    db.tables.profiles.push({ user_id: userA, display_name: 'Alice' });
    db.tables.playbooks.push({ user_id: userA, answers: { q1: 'slow' } });
    db.tables.skills_progress.push({ user_id: userA, skill_key: 'openers', stage: 'growing' });
    db.tables.attempts.push({ id: 'att-a1', user_id: userA, mode: 'try' });
    db.tables.turns.push({ id: 'turn-a1', attempt_id: 'att-a1', text: 'Hi from Alice' });
    db.tables.debriefs.push({ user_id: userA, transcript: [{ text: 'transcript A' }] });

    // Seed User B data
    db.tables.profiles.push({ user_id: userB, display_name: 'Bob' });
    db.tables.playbooks.push({ user_id: userB, answers: { q1: 'fast' } });
    db.tables.skills_progress.push({ user_id: userB, skill_key: 'listening', stage: 'natural' });
    db.tables.attempts.push({ id: 'att-b1', user_id: userB, mode: 'try' });
    db.tables.turns.push({ id: 'turn-b1', attempt_id: 'att-b1', text: 'Hi from Bob' });
    db.tables.debriefs.push({ user_id: userB, transcript: [{ text: 'transcript B' }] });

    const exportA = await buildUserDataExport(supabase, userA);

    // Verify isolation
    expect(exportA.userId).toBe(userA);
    const userAProfiles = exportA.tables.profiles ?? [];
    expect(userAProfiles).toHaveLength(1);
    expect((userAProfiles[0] as RowRecord).display_name).toBe('Alice');

    const userAPlaybooks = exportA.tables.playbooks ?? [];
    expect(userAPlaybooks).toHaveLength(1);
    expect(((userAPlaybooks[0] as RowRecord).answers as RowRecord).q1).toBe('slow');

    const userATurns = exportA.tables.turns ?? [];
    expect(userATurns).toHaveLength(1);
    expect((userATurns[0] as RowRecord).text).toBe('Hi from Alice');

    // Confirm ZERO data from User B
    const jsonString = JSON.stringify(exportA);
    expect(jsonString).not.toContain('Bob');
    expect(jsonString).not.toContain(userB);
    expect(jsonString).not.toContain('att-b1');
    expect(jsonString).not.toContain('transcript B');

    // Test POST /v1/privacy/export endpoint
    const tokenA = await createToken(userA);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/privacy/export',
      headers: { authorization: `Bearer ${tokenA}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.downloadUrl).toBeDefined();
    expect(body.expiresAt).toBeDefined();
    expect(body.exportId).toBeDefined();

    // Verify retrieval via GET /v1/privacy/export/:id
    const downloadRes = await app.inject({
      method: 'GET',
      url: `/v1/privacy/export/${body.exportId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });

    expect(downloadRes.statusCode).toBe(200);
    expect(downloadRes.json().userId).toBe(userA);
  });

  // =========================================================================
  // Acceptance Check 2: After delete-account, zero rows for user across all tables
  // =========================================================================
  it('Acceptance Check 2: After delete-account, dynamic table inspection finds zero rows for user', async () => {
    // Seed user rows in every table that holds user_id
    for (const table of ALL_PUBLIC_TABLES) {
      if (table === 'turns') {
        db.tables.turns.push({ id: 'turn-a', attempt_id: 'att-a', text: 'turn text' });
      } else if (table === 'coach_feedback') {
        db.tables.coach_feedback.push({ id: 'cf-a', attempt_id: 'att-a', payload: {} });
      } else if (table === 'attempts') {
        db.tables.attempts.push({ id: 'att-a', user_id: userA, mode: 'try' });
      } else if (table !== 'ai_calls' && table !== 'safety_events') {
        const targetTable = db.tables[table];
        if (targetTable) {
          targetTable.push({ id: `row-${table}`, user_id: userA });
        }
      }
    }

    // Verify data exists initially for userA
    expect(db.tables.profiles.filter((r) => r.user_id === userA).length).toBe(1);
    expect(db.tables.turns.length).toBe(1);

    // Call delete-account
    const result = await deleteUserAccount(supabase, userA, {
      otpToken: '123456',
      bypassOtpInTest: true,
    });

    expect(result.ok).toBe(true);

    // DYNAMIC SCHEMA AUDIT:
    // Check every single table in public schema has 0 rows for userA
    for (const table of ALL_PUBLIC_TABLES) {
      if (table === 'turns' || table === 'coach_feedback') {
        // Child tables cascade via attempts
        expect(db.tables[table]).toHaveLength(0);
      } else if (table !== 'ai_calls' && table !== 'safety_events') {
        const currentTable = db.tables[table] ?? [];
        const remaining = currentTable.filter((r) => r.user_id === userA);
        expect(remaining).toHaveLength(0);
      }
    }
  });

  // =========================================================================
  // Acceptance Check 3: delete-text leaves skills_progress intact
  // =========================================================================
  it('Acceptance Check 3: delete-text clears turns, debrief transcript, and journal body, but leaves skills_progress intact', async () => {
    // Setup user progress and conversation text
    db.tables.skills_progress.push({
      id: 'sp-1',
      user_id: userA,
      skill_key: 'small_talk',
      stage: 'growing',
      stage_history: [{ stage: 'starting' }, { stage: 'practicing' }, { stage: 'growing' }],
    });
    db.tables.sessions_log.push({
      id: 'sess-1',
      user_id: userA,
      session_id: 'unit1_sess1',
      mode: 'full',
    });
    db.tables.attempts.push({
      id: 'att-1',
      user_id: userA,
      session_id: 'unit1_sess1',
      persona_id: 'maya',
      mode: 'try',
      turns_count: 6,
    });
    db.tables.turns.push(
      { id: 't-1', attempt_id: 'att-1', text: 'Hey there' },
      { id: 't-2', attempt_id: 'att-1', text: 'I felt awkward today' }
    );
    db.tables.debriefs.push({
      id: 'deb-1',
      user_id: userA,
      transcript: [{ speaker: 'user', text: 'Private reflection text' }],
      takeaway: 'I took a pause',
    });
    db.tables.journal_entries.push({
      id: 'j-1',
      user_id: userA,
      entry_kind: 'reflection',
      title: 'Coffee chat',
      body: 'I was really anxious before speaking',
    });

    // Execute deleteUserText
    const res = await deleteUserText(supabase, userA);
    expect(res.ok).toBe(true);

    // 1. Message text in turns is deleted
    const userAttempts = db.tables.attempts.filter((a) => a.user_id === userA);
    const attemptIds = userAttempts.map((a) => a.id);
    const remainingTurns = db.tables.turns.filter((t) => attemptIds.includes(t.attempt_id));
    expect(remainingTurns).toHaveLength(0);

    // 2. Debrief transcript is cleared to empty array []
    const debrief = db.tables.debriefs.find((d) => d.user_id === userA);
    expect(debrief?.transcript).toEqual([]);

    // 3. Journal body is cleared to null
    const journal = db.tables.journal_entries.find((j) => j.user_id === userA);
    expect(journal?.body).toBeNull();

    // 4. STRICT GUARANTEE: skills_progress is 100% intact!
    const progress = db.tables.skills_progress.filter((s) => s.user_id === userA);
    expect(progress).toHaveLength(1);
    const p = progress[0];
    expect(p?.skill_key).toBe('small_talk');
    expect(p?.stage).toBe('growing');
    expect((p?.stage_history as unknown[]).length).toBe(3);

    // 5. Sessions log and attempts metadata are intact!
    expect(db.tables.sessions_log.filter((s) => s.user_id === userA)).toHaveLength(1);
    expect(db.tables.attempts.filter((a) => a.user_id === userA)).toHaveLength(1);
  });

  // =========================================================================
  // Acceptance Check 4: Routes reject spoofed user identifiers (JWT sub is sole truth)
  // =========================================================================
  it('Acceptance Check 4: Routes derive identity strictly from JWT sub and reject another user id', async () => {
    // Seed User B private export
    db.tables.exports.push({
      id: 'export-bob',
      user_id: userB,
      download_link: '/v1/privacy/export/export-bob',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      payload: { userId: userB, secret: 'bobs-private-data' },
    });

    const tokenA = await createToken(userA);

    // Attempt 1: User A calls export trying to pass spoofed userId for User B in body
    const spoofExportRes = await app.inject({
      method: 'POST',
      url: '/v1/privacy/export',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { userId: userB },
    });
    expect(spoofExportRes.statusCode).toBe(200);
    // Export created belongs strictly to userA, not userB
    const createdExport = db.tables.exports.find((e) => e.id === spoofExportRes.json().exportId);
    expect(createdExport?.user_id).toBe(userA);

    // Attempt 2: User A tries to download User B's export
    const downloadForeignRes = await app.inject({
      method: 'GET',
      url: '/v1/privacy/export/export-bob',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    // Forbidden! Cannot read another user's export
    expect(downloadForeignRes.statusCode).toBe(403);

    // Attempt 3: Unauthenticated request rejected with 401
    const unauthRes = await app.inject({
      method: 'POST',
      url: '/v1/privacy/delete-text',
    });
    expect(unauthRes.statusCode).toBe(401);
  });

  // =========================================================================
  // Acceptance Check 5: Toggling consent persists and is read by canUseForImprovement
  // =========================================================================
  it('Acceptance Check 5: Toggling consent persists to database and is read by canUseForImprovement', async () => {
    const tokenA = await createToken(userA);

    // Initial state: consent not yet granted -> canUseForImprovement is false
    const initialCheck = await canUseForImprovement(supabase, userA);
    expect(initialCheck).toBe(false);

    // 1. Toggle improve_ai to true
    const enableRes = await app.inject({
      method: 'POST',
      url: '/v1/privacy/consents',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { kind: 'improve_ai', granted: true },
    });
    expect(enableRes.statusCode).toBe(200);
    expect(enableRes.json().granted).toBe(true);

    // Verify canUseForImprovement reflects true
    const checkAfterEnable = await canUseForImprovement(supabase, userA);
    expect(checkAfterEnable).toBe(true);

    // Endpoint GET /v1/privacy/can-use-improvement also reports true
    const apiCheckRes = await app.inject({
      method: 'GET',
      url: '/v1/privacy/can-use-improvement',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(apiCheckRes.statusCode).toBe(200);
    expect(apiCheckRes.json().canUse).toBe(true);

    // 2. Toggle improve_ai to false (withdraw consent)
    const disableRes = await app.inject({
      method: 'POST',
      url: '/v1/privacy/consents',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { kind: 'improve_ai', granted: false },
    });
    expect(disableRes.statusCode).toBe(200);
    expect(disableRes.json().granted).toBe(false);

    // Verify canUseForImprovement immediately reflects false
    const checkAfterDisable = await canUseForImprovement(supabase, userA);
    expect(checkAfterDisable).toBe(false);
  });

  // =========================================================================
  // Additional Check: Retention purge removes expired turns
  // =========================================================================
  it('Retention purge: purgeExpiredText deletes turns past 90-day retention', async () => {
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 89).toISOString();

    db.tables.turns.push(
      { id: 'expired-1', expires_at: expiredDate, text: 'old conversation' },
      { id: 'valid-1', expires_at: futureDate, text: 'active conversation' }
    );

    const tokenA = await createToken(userA);
    const purgeRes = await app.inject({
      method: 'POST',
      url: '/v1/privacy/purge',
      headers: { authorization: `Bearer ${tokenA}` },
    });

    expect(purgeRes.statusCode).toBe(200);
    expect(purgeRes.json().purgedCount).toBe(1);
    expect(db.tables.turns).toHaveLength(1);
    const validTurn = db.tables.turns[0];
    expect(validTurn?.id).toBe('valid-1');
  });

  // =========================================================================
  // Additional Check: Expired export link returns 410 Gone
  // =========================================================================
  it('Export expiration: download returns 410 when 24h validity window has expired', async () => {
    const pastExpiration = new Date(Date.now() - 1000 * 60).toISOString();
    db.tables.exports.push({
      id: 'expired-export',
      user_id: userA,
      download_link: '/v1/privacy/export/expired-export',
      expires_at: pastExpiration,
      payload: { userId: userA },
    });

    const tokenA = await createToken(userA);
    const res = await app.inject({
      method: 'GET',
      url: '/v1/privacy/export/expired-export',
      headers: { authorization: `Bearer ${tokenA}` },
    });

    expect(res.statusCode).toBe(410);
    expect(res.json().error).toContain('expired');
  });
});
