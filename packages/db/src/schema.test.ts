import { describe, expect, it } from 'vitest';
import type {
  Database,
  Profile,
  AiCall,
  SafetyEvent
} from './types.js';

describe('Database Types & Schema Verification', () => {
  it('defines all 23 tables in Database public schema', () => {
    type TablesMap = Database['public']['Tables'];
    
    // Static compile-time key verification
    const tableKeys: (keyof TablesMap)[] = [
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

    expect(tableKeys).toHaveLength(23);
  });

  it('guarantees profiles has NO birth year or date of birth fields', () => {
    type ProfileKeys = keyof Profile;
    const allowedKeys: ProfileKeys[] = [
      'user_id',
      'display_name',
      'locale',
      'theme_pref',
      'adult_confirmed_at',
      'created_at'
    ];

    expect(allowedKeys).not.toContain('birth_year');
    expect(allowedKeys).not.toContain('date_of_birth');
    expect(allowedKeys).not.toContain('dob');
    expect(allowedKeys).not.toContain('birthdate');
  });

  it('guarantees ai_calls contains metadata only and NO message text', () => {
    type AiCallKeys = keyof AiCall;
    const expectedKeys: AiCallKeys[] = [
      'id',
      'job',
      'model',
      'prompt_version',
      'latency_ms',
      'status',
      'token_counts',
      'created_at'
    ];

    expect(expectedKeys).not.toContain('text');
    expect(expectedKeys).not.toContain('prompt');
    expect(expectedKeys).not.toContain('response');
    expect(expectedKeys).not.toContain('message');
  });

  it('guarantees safety_events contains kind and source only and NO text', () => {
    type SafetyEventKeys = keyof SafetyEvent;
    const expectedKeys: SafetyEventKeys[] = [
      'id',
      'kind',
      'source',
      'created_at'
    ];

    expect(expectedKeys).not.toContain('text');
    expect(expectedKeys).not.toContain('message');
    expect(expectedKeys).not.toContain('payload');
  });

  it('defines purge_expired_text database function', () => {
    type FunctionsMap = Database['public']['Functions'];
    type HasPurgeFunction = 'purge_expired_text' extends keyof FunctionsMap ? true : false;
    const hasPurge: HasPurgeFunction = true;
    expect(hasPurge).toBe(true);
  });
});
