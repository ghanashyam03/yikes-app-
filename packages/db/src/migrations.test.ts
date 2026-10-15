import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, '../../../supabase/migrations');

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

describe('SQL Migrations Verification', () => {
  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  const fullSql = migrationFiles
    .map(f => readFileSync(resolve(migrationsDir, f), 'utf8'))
    .join('\n');

  it('contains all 6 required migration files', () => {
    expect(migrationFiles).toHaveLength(6);
  });

  it('creates all 23 expected tables', () => {
    for (const table of EXPECTED_TABLES) {
      const createRegex = new RegExp(`CREATE TABLE (IF NOT EXISTS )?public\\.${table}\\b`, 'i');
      expect(fullSql).toMatch(createRegex);
    }
  });

  it('enables Row Level Security on EVERY table', () => {
    for (const table of EXPECTED_TABLES) {
      const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i');
      expect(fullSql).toMatch(rlsRegex);
    }
  });

  it('guarantees no birth year or date of birth columns exist in SQL', () => {
    expect(fullSql).not.toMatch(/\bbirth_year\b/i);
    expect(fullSql).not.toMatch(/\bdate_of_birth\b/i);
    expect(fullSql).not.toMatch(/\bdob\b/i);
    expect(fullSql).not.toMatch(/\bbirthdate\b/i);
  });

  it('guarantees child tables turns and coach_feedback enforce parent attempt ownership', () => {
    expect(fullSql).toMatch(/EXISTS \(SELECT 1 FROM public\.attempts WHERE attempts\.id = turns\.attempt_id AND attempts\.user_id = auth\.uid\(\)\)/);
    expect(fullSql).toMatch(/EXISTS \(SELECT 1 FROM public\.attempts WHERE attempts\.id = coach_feedback\.attempt_id AND attempts\.user_id = auth\.uid\(\)\)/);
  });

  it('defines purge_expired_text function in plpgsql', () => {
    expect(fullSql).toMatch(/CREATE OR REPLACE FUNCTION public\.purge_expired_text\(\)/);
    expect(fullSql).toMatch(/DELETE FROM public\.turns\s+WHERE expires_at < now\(\)/);
  });
});
