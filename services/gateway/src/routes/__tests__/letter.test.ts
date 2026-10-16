import type { SupabaseClient } from '@supabase/supabase-js';
import Fastify, { type FastifyInstance } from 'fastify';
import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it } from 'vitest';
import type { GatewayEnv } from '../../config/env.js';
import { buildDigestFromData, containsThirdPartyName } from '../../letter/digest.js';
import {
  generateWeeklyLetter,
  validateWeeklyLetterText,
} from '../../letter/letterGenerator.js';
import type { AiProvider } from '../../providers/types.js';
import { deleteUserText } from '../privacy/delete-text.js';
import { register } from '../letter.js';

const testSecret = 'super-secret-test-jwt-key-minimum-32-chars!!';
const TEST_JOB_SECRET = 'test-job-secret-token-xyz';

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
  JOB_SECRET: TEST_JOB_SECRET,
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

type RowRecord = Record<string, unknown>;

interface PublicTableMap {
  profiles: RowRecord[];
  consents: RowRecord[];
  notification_prefs: RowRecord[];
  entitlements: RowRecord[];
  playbooks: RowRecord[];
  skills_progress: RowRecord[];
  sessions_log: RowRecord[];
  attempts: RowRecord[];
  turns: RowRecord[];
  moments: RowRecord[];
  micro_reps: RowRecord[];
  debriefs: RowRecord[];
  journal_entries: RowRecord[];
  weekly_letters: RowRecord[];
  [key: string]: RowRecord[];
}

class MockDb {
  tables: PublicTableMap = {
    profiles: [],
    consents: [],
    notification_prefs: [],
    entitlements: [],
    playbooks: [],
    skills_progress: [],
    sessions_log: [],
    attempts: [],
    turns: [],
    moments: [],
    micro_reps: [],
    debriefs: [],
    journal_entries: [],
    weekly_letters: [],
  };

  reset() {
    for (const key of Object.keys(this.tables)) {
      this.tables[key] = [];
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
          gte(col: string, val: unknown) {
            rows = rows.filter((r) => (r[col] as string) >= (val as string));
            return builder;
          },
          lte(col: string, val: unknown) {
            rows = rows.filter((r) => (r[col] as string) <= (val as string));
            return builder;
          },
          in(col: string, vals: unknown[]) {
            rows = rows.filter((r) => vals.includes(r[col]));
            return builder;
          },
          or(condition: string) {
            if (condition.includes('speaker.eq.user') || condition.includes('role.eq.user')) {
              rows = rows.filter((r) => r.speaker === 'user' || r.role === 'user');
            }
            return builder;
          },
          order(_col: string, _opts?: { ascending?: boolean }) {
            return builder;
          },
          limit(count: number) {
            rows = rows.slice(0, count);
            return builder;
          },
          insert(payload: RowRecord | RowRecord[]) {
            pendingInsert = payload;
            return builder;
          },
          update(payload: RowRecord, _opts?: { count?: string }) {
            pendingUpdate = payload;
            return builder;
          },
          delete(_opts?: { count?: string }) {
            isDelete = true;
            return builder;
          },
          maybeSingle() {
            if (pendingUpdate) {
              for (const r of rows) {
                Object.assign(r, pendingUpdate);
              }
            }
            return Promise.resolve({ data: rows[0] || null, error: null });
          },
          single() {
            if (pendingInsert) {
              const item = Array.isArray(pendingInsert) ? pendingInsert[0] : pendingInsert;
              const newItem: RowRecord = {
                id: item?.id || `id-${Math.random().toString(36).slice(2, 9)}`,
                created_at: new Date().toISOString(),
                ...(item ?? {}),
              };
              dbTables[tableName]!.push(newItem);
              return Promise.resolve({ data: newItem, error: null });
            }
            if (pendingUpdate) {
              for (const r of rows) {
                Object.assign(r, pendingUpdate);
              }
            }
            return Promise.resolve({ data: rows[0] || null, error: rows[0] ? null : { message: 'Not found' } });
          },
          then(resolve: (res: { data: unknown; error: null; count?: number }) => void) {
            if (pendingInsert) {
              const items = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
              const created = items.map((i) => ({
                id: i?.id || `id-${Math.random().toString(36).slice(2, 9)}`,
                created_at: new Date().toISOString(),
                ...(i ?? {}),
              }));
              dbTables[tableName]!.push(...created);
              return Promise.resolve({ data: created, count: created.length, error: null }).then(resolve);
            }
            if (isDelete) {
              const count = rows.length;
              const targetTable = dbTables[tableName]!;
              dbTables[tableName] = targetTable.filter((r) => !rows.includes(r));
              return Promise.resolve({ data: rows, count, error: null }).then(resolve);
            }
            if (pendingUpdate) {
              let count = 0;
              for (const r of rows) {
                Object.assign(r, pendingUpdate);
                count++;
              }
              return Promise.resolve({ data: rows, count, error: null }).then(resolve);
            }
            return Promise.resolve({ data: rows, count: rows.length, error: null }).then(resolve);
          },
        };

        return builder;
      },
      rpc(fn: string, params: Record<string, unknown>) {
        if (fn === 'delete_user_text') {
          const targetUserId = params.target_user_id as string;
          // Clear turns
          const userAttempts = (dbTables.attempts || []).filter((a) => a.user_id === targetUserId);
          const attemptIds = new Set(userAttempts.map((a) => a.id));
          dbTables.turns = (dbTables.turns || []).filter((t) => !attemptIds.has(t.attempt_id));

          // Clear debrief transcripts
          for (const d of dbTables.debriefs || []) {
            if (d.user_id === targetUserId) {
              d.transcript = [];
            }
          }

          // Clear journal bodies
          for (const j of dbTables.journal_entries || []) {
            if (j.user_id === targetUserId) {
              j.body = null;
            }
          }

          // Clear voiceStyle from playbooks
          for (const p of dbTables.playbooks || []) {
            if (p.user_id === targetUserId && p.derived && typeof p.derived === 'object') {
              const derived = { ...(p.derived as Record<string, unknown>) };
              delete derived.voiceStyle;
              p.derived = derived;
            }
          }

          return Promise.resolve({
            data: { deleted_turns: 5, cleared_debriefs: 1, cleared_journals: 2 },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
    };

    return mockClient as unknown as SupabaseClient;
  }
}

describe('T-19: Weekly Letter and Voice Match', () => {
  let db: MockDb;
  let supabase: SupabaseClient;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = new MockDb();
    supabase = db.createClient();

    app = Fastify({ logger: false });
    await register(app, {
      env: mockEnv,
      supabase,
      jobSecret: TEST_JOB_SECRET,
    });
  });

  // =========================================================================
  // Acceptance Check 1: Letter Length & Guardrail Validation
  // =========================================================================
  describe('Acceptance Check 1: Letter length and honesty rules', () => {
    it('accepts letters with 150 words or fewer and no banned words', () => {
      const validText =
        'You completed three practices this week. The biggest shift was taking your time before answering questions. Next week, keep that same calm pacing in your meetings.';
      const res = validateWeeklyLetterText(validText);
      expect(res.valid).toBe(true);
      expect(res.wordCount).toBeLessThanOrEqual(150);
    });

    it('rejects letters with more than 150 words', () => {
      const longText = Array(151).fill('conversation').join(' ');
      const res = validateWeeklyLetterText(longText);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('exceeds 150 limit');
    });

    it('rejects clinical terms (treat, cure, therapy, diagnose)', () => {
      const clinicalSamples = [
        'This session will treat your conversational habits.',
        'We hope this will cure your awkward pauses.',
        'Think of this practice as a form of therapy.',
        'Let us diagnose your style.',
      ];

      for (const sample of clinicalSamples) {
        const res = validateWeeklyLetterText(sample);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('clinical term');
      }
    });

    it('rejects personality labels (shy, anxious, introvert, extrovert)', () => {
      const labelSamples = [
        'When you feel shy during conversations, take a pause.',
        'You were anxious before speaking up in the group.',
        'As an introvert, you prefer quiet spaces.',
        'Try being more extroverted tomorrow.',
      ];

      for (const sample of labelSamples) {
        const res = validateWeeklyLetterText(sample);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain('personality label');
      }
    });

    it('generates a short version for free plan and standard version for plus plan', async () => {
      const digest = {
        sessionsCompleted: 2,
        momentsLogged: 1,
        stageChanges: [],
        moments: [],
        gaps: [],
        quotes: ['Sounds good, let us look at it tomorrow.'],
      };

      const fakeProvider = {
        name: 'fake',
        call: async () => ({
          text: JSON.stringify({
            letter: 'You had two great practice sessions. Next week keep taking calm pauses.',
            wordCount: 12,
            patternNoticed: 'You pause calmly before answering.',
            nextFocus: 'Carry that pause into your next group chat.',
          }),
        }),
      };

      const freeLetter = await generateWeeklyLetter(digest, {
        env: mockEnv,
        provider: fakeProvider as unknown as AiProvider,
        plan: 'free',
      });
      expect(freeLetter.plan).toBe('free');
      expect(freeLetter.wordCount).toBeLessThanOrEqual(75);

      const plusLetter = await generateWeeklyLetter(digest, {
        env: mockEnv,
        provider: fakeProvider as unknown as AiProvider,
        plan: 'plus',
      });
      expect(plusLetter.plan).toBe('plus');
      expect(plusLetter.wordCount).toBeLessThanOrEqual(150);
    });
  });

  // =========================================================================
  // Acceptance Check 2: Digest Builder Guarantee
  // =========================================================================
  describe('Acceptance Check 2: Digest test (max 3 verbatim quotes and zero third-party names)', () => {
    it('detects third-party and persona names accurately', () => {
      expect(containsThirdPartyName('Hey Maya, how are you?')).toBe(true);
      expect(containsThirdPartyName('I spoke with Alex earlier.')).toBe(true);
      expect(containsThirdPartyName('Thanks Sam, that helps.')).toBe(true);
      expect(containsThirdPartyName('John mentioned the report.')).toBe(true);
      expect(containsThirdPartyName('Priya shared the document.')).toBe(true);

      // Clean lines without third-party names
      expect(containsThirdPartyName('Sounds good, let us review tomorrow morning.')).toBe(false);
      expect(containsThirdPartyName('I think we should check the timeline first.')).toBe(false);
      expect(containsThirdPartyName('Fair point, what do you think the next step is?')).toBe(false);
    });

    it('extracts at most 3 verbatim user quotes and strictly filters out any quote with third-party names', () => {
      const sourceData = {
        sessions: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
        moments: [{ id: 'm1', title: 'Team Sync' }, { id: 'm2', title: 'Coffee catch-up' }],
        skillsProgress: [
          {
            skill_key: 'warmth',
            stage: 'practicing',
            stage_history: [{ from: 'starting', to: 'practicing' }],
          },
        ],
        microReps: [
          { forecast_drain: 4, actual_drain: 2, forecast_warmth: 3, actual_warmth: 4, landed: true },
        ],
        userTurns: [
          { text: 'Hey Maya, what do you think about the schedule?' }, // Contains persona name -> MUST BE DROPPED
          { text: 'I think we should check the timeline first.' }, // Valid Quote 1
          { text: 'Thanks Priya, that makes complete sense.' }, // Contains persona name -> MUST BE DROPPED
          { text: 'Fair point, let us look at the next priority.' }, // Valid Quote 2
          { text: 'Talked with Alex about the handoff.' }, // Contains persona name -> MUST BE DROPPED
          { text: 'I will prepare the summary before five.' }, // Valid Quote 3
          { text: 'Another clean quote that should not exceed the limit of 3.' }, // Beyond cap -> MUST BE DROPPED
        ],
      };

      const digest = buildDigestFromData(sourceData);

      expect(digest.sessionsCompleted).toBe(3);
      expect(digest.momentsLogged).toBe(2);
      expect(digest.stageChanges).toHaveLength(1);
      expect(digest.stageChanges[0]?.skillKey).toBe('warmth');
      expect(digest.stageChanges[0]?.toStage).toBe('practicing');

      // Check quotes guarantee:
      expect(digest.quotes.length).toBeLessThanOrEqual(3);
      expect(digest.quotes).toHaveLength(3);
      expect(digest.quotes).toEqual([
        'I think we should check the timeline first.',
        'Fair point, let us look at the next priority.',
        'I will prepare the summary before five.',
      ]);

      // Verify ZERO third-party names in all extracted quotes
      for (const quote of digest.quotes) {
        expect(containsThirdPartyName(quote)).toBe(false);
      }
    });
  });

  // =========================================================================
  // Acceptance Check 3: Job Secret Test
  // =========================================================================
  describe('Acceptance Check 3: Job secret verification', () => {
    it('rejects POST /v1/jobs/weekly-letters when X-Job-Secret is missing with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/jobs/weekly-letters',
        payload: {},
      });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error).toContain('Invalid or missing job secret');
    });

    it('rejects POST /v1/jobs/weekly-letters when X-Job-Secret is incorrect with 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/jobs/weekly-letters',
        headers: {
          'x-job-secret': 'wrong-secret-token',
        },
        payload: {},
      });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error).toContain('Invalid or missing job secret');
    });

    it('accepts POST /v1/jobs/weekly-letters when X-Job-Secret is valid and creates letter & journal entry', async () => {
      const testUserId = 'user-letter-job-001';
      db.tables.profiles.push({ user_id: testUserId, display_name: 'Jordan' });
      db.tables.entitlements.push({ user_id: testUserId, plan: 'plus', is_active: true });
      db.tables.sessions_log.push({ user_id: testUserId, session_id: 'sess-1', completed_at: new Date().toISOString() });
      db.tables.attempts.push({ id: 'att-1', user_id: testUserId, created_at: new Date().toISOString() });
      db.tables.turns.push({ attempt_id: 'att-1', speaker: 'user', text: 'I paused before jumping in.' });

      const res = await app.inject({
        method: 'POST',
        url: '/v1/jobs/weekly-letters',
        headers: {
          'x-job-secret': TEST_JOB_SECRET,
        },
        payload: {
          userId: testUserId,
          weekStart: '2026-10-18',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.ok).toBe(true);
      expect(body.generatedCount).toBe(1);

      // Verify row created in weekly_letters
      const letters = db.tables.weekly_letters.filter((l) => l.user_id === testUserId);
      expect(letters).toHaveLength(1);
      expect(letters[0]?.week_start).toBe('2026-10-18');
      expect(letters[0]?.content).toBeTruthy();

      // Verify journal entry row created (entry_kind: 'letter')
      const journals = db.tables.journal_entries.filter((j) => j.user_id === testUserId);
      expect(journals).toHaveLength(1);
      expect(journals[0]?.entry_kind).toBe('letter');
      expect(journals[0]?.body).toBe(letters[0]?.content);
    });

    it('skips generating weekly letter if user has opted out in notification_prefs', async () => {
      const testUserId = 'user-opted-out-002';
      db.tables.profiles.push({ user_id: testUserId, display_name: 'Quiet User' });
      db.tables.notification_prefs.push({
        user_id: testUserId,
        toggles: { weekly_letters: false },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/v1/jobs/weekly-letters',
        headers: {
          'x-job-secret': TEST_JOB_SECRET,
        },
        payload: {
          userId: testUserId,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.generatedCount).toBe(0);
      expect(body.results[0]?.status).toBe('skipped');
      expect(body.results[0]?.reason).toContain('opted out');

      const letters = db.tables.weekly_letters.filter((l) => l.user_id === testUserId);
      expect(letters).toHaveLength(0);
    });
  });

  // =========================================================================
  // Acceptance Check 4: Voice Match Consent Guard
  // =========================================================================
  describe('Acceptance Check 4: Voice Match consent guard', () => {
    it('returns 403 Forbidden and never stores voice style if voice_match consent is absent', async () => {
      const testUserId = 'user-no-consent-123';
      db.tables.profiles.push({ user_id: testUserId });
      db.tables.playbooks.push({ user_id: testUserId, derived: {} });

      const token = await createToken(testUserId);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/voice-match/summarise',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body).error).toContain('Voice Match consent is required');

      // Verify playbooks.derived.voiceStyle was NOT created
      const playbook = db.tables.playbooks.find((p) => p.user_id === testUserId);
      expect((playbook?.derived as Record<string, unknown>).voiceStyle).toBeUndefined();
    });

    it('returns 403 Forbidden if voice_match consent granted is false', async () => {
      const testUserId = 'user-revoked-consent-456';
      db.tables.profiles.push({ user_id: testUserId });
      db.tables.consents.push({
        user_id: testUserId,
        kind: 'voice_match',
        granted: false,
        updated_at: new Date().toISOString(),
      });
      db.tables.playbooks.push({ user_id: testUserId, derived: {} });

      const token = await createToken(testUserId);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/voice-match/summarise',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(res.statusCode).toBe(403);
      const playbook = db.tables.playbooks.find((p) => p.user_id === testUserId);
      expect((playbook?.derived as Record<string, unknown>).voiceStyle).toBeUndefined();
    });

    it('allows synthesis and saves into playbooks.derived.voiceStyle when voice_match consent is granted', async () => {
      const testUserId = 'user-granted-consent-789';
      db.tables.profiles.push({ user_id: testUserId });
      db.tables.consents.push({
        user_id: testUserId,
        kind: 'voice_match',
        granted: true,
        updated_at: new Date().toISOString(),
      });
      db.tables.playbooks.push({ user_id: testUserId, derived: {} });
      db.tables.attempts.push({ id: 'att-789', user_id: testUserId });
      db.tables.turns.push({
        attempt_id: 'att-789',
        speaker: 'user',
        text: 'Sounds good to me, let us talk tomorrow.',
      });

      const token = await createToken(testUserId);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/voice-match/summarise',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.ok).toBe(true);
      expect(body.voiceStyle).toBeDefined();
      expect(body.voiceStyle.summary).toBeTruthy();

      // Verify summary was saved into playbooks.derived.voiceStyle
      const playbook = db.tables.playbooks.find((p) => p.user_id === testUserId);
      const derived = playbook?.derived as Record<string, unknown>;
      expect(derived.voiceStyle).toBeDefined();
    });
  });

  // =========================================================================
  // Acceptance Check 5: Purge Test (deleting text removes voiceStyle)
  // =========================================================================
  describe('Acceptance Check 5: Purge test (deleting text purges voiceStyle)', () => {
    it('proves deleteUserText removes playbooks.derived.voiceStyle while preserving skills and sessions metadata', async () => {
      const testUserId = 'user-purge-999';

      // Seed user data: playbook with voiceStyle, skills progress, sessions log, turns
      db.tables.playbooks.push({
        user_id: testUserId,
        derived: {
          scenarioWorld: 'tech',
          voiceStyle: {
            summary: 'Concise and courteous',
            toneMarkers: ['calm', 'low-key'],
          },
        },
      });
      db.tables.skills_progress.push({
        user_id: testUserId,
        skill_key: 'warmth',
        stage: 'growing',
      });
      db.tables.sessions_log.push({
        user_id: testUserId,
        session_id: 'session-intro-1',
        completed_at: new Date().toISOString(),
      });
      db.tables.attempts.push({ id: 'att-purge', user_id: testUserId });
      db.tables.turns.push({ attempt_id: 'att-purge', speaker: 'user', text: 'Sensitive message' });
      db.tables.journal_entries.push({ user_id: testUserId, body: 'Reflective thoughts' });

      // Execute deleteUserText
      const result = await deleteUserText(supabase, testUserId);
      expect(result.ok).toBe(true);

      // Verify voiceStyle was completely removed from playbooks.derived
      const playbook = db.tables.playbooks.find((p) => p.user_id === testUserId);
      const derived = playbook?.derived as Record<string, unknown>;
      expect(derived.voiceStyle).toBeUndefined();
      // Other non-text derived properties remain preserved
      expect(derived.scenarioWorld).toBe('tech');

      // Verify skills progress and sessions log remain intact
      const skills = db.tables.skills_progress.filter((s) => s.user_id === testUserId);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.stage).toBe('growing');

      const sessions = db.tables.sessions_log.filter((s) => s.user_id === testUserId);
      expect(sessions).toHaveLength(1);
    });
  });

  // =========================================================================
  // Additional Route Tests: GET latest, GET by id, POST opt-out
  // =========================================================================
  describe('Letter query and opt-out endpoints', () => {
    it('GET /v1/letters/latest returns latest letter for authenticated user', async () => {
      const userId = 'user-get-latest';
      db.tables.weekly_letters.push({
        id: 'letter-123',
        user_id: userId,
        week_start: '2026-10-18',
        content: 'You made quiet progress this week.',
        metadata: {
          wordCount: 6,
          patternNoticed: 'You gave yourself room to think.',
          nextFocus: 'Carry that pause into your next group chat.',
          plan: 'plus',
        },
        created_at: new Date().toISOString(),
      });

      const token = await createToken(userId);
      const res = await app.inject({
        method: 'GET',
        url: '/v1/letters/latest',
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.ok).toBe(true);
      expect(body.letter.id).toBe('letter-123');
      expect(body.letter.content).toBe('You made quiet progress this week.');
    });

    it('POST /v1/letters/opt-out toggles user opt-out preference', async () => {
      const userId = 'user-toggle-opt';
      db.tables.notification_prefs.push({
        user_id: userId,
        toggles: { weekly_letters: true },
      });

      const token = await createToken(userId);
      const res = await app.inject({
        method: 'POST',
        url: '/v1/letters/opt-out',
        headers: { Authorization: `Bearer ${token}` },
        payload: { optedOut: true },
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).optedOut).toBe(true);

      const prefs = db.tables.notification_prefs.find((n) => n.user_id === userId);
      expect((prefs?.toggles as Record<string, unknown>).weekly_letters).toBe(false);
    });
  });
});
