import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outputPath = resolve(rootDir, 'packages/db/src/types.ts');

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

async function getCandidateDbUrl() {
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }
  const host = process.env.PGHOST || '127.0.0.1';
  const candidatePorts = [
    process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : null,
    54322,
    5432,
    54329,
    5433
  ].filter(Boolean);

  for (const port of candidatePorts) {
    if (await probePort(host, port)) {
      return `postgresql://postgres@${host}:${port}/postgres?sslmode=disable`;
    }
  }
  return null;
}

// Add convenient domain model type helpers
const domainHelpers = `
// Domain model type aliases
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export type Consent = Tables<'consents'>;
export type ConsentInsert = TablesInsert<'consents'>;
export type ConsentUpdate = TablesUpdate<'consents'>;

export type Playbook = Tables<'playbooks'>;
export type PlaybookInsert = TablesInsert<'playbooks'>;
export type PlaybookUpdate = TablesUpdate<'playbooks'>;

export type SkillsProgress = Tables<'skills_progress'>;
export type SkillsProgressInsert = TablesInsert<'skills_progress'>;
export type SkillsProgressUpdate = TablesUpdate<'skills_progress'>;

export type SessionLog = Tables<'sessions_log'>;
export type SessionLogInsert = TablesInsert<'sessions_log'>;
export type SessionLogUpdate = TablesUpdate<'sessions_log'>;

export type Attempt = Tables<'attempts'>;
export type AttemptInsert = TablesInsert<'attempts'>;
export type AttemptUpdate = TablesUpdate<'attempts'>;

export type Turn = Tables<'turns'>;
export type TurnInsert = TablesInsert<'turns'>;
export type TurnUpdate = TablesUpdate<'turns'>;

export type CoachFeedback = Tables<'coach_feedback'>;
export type CoachFeedbackInsert = TablesInsert<'coach_feedback'>;
export type CoachFeedbackUpdate = TablesUpdate<'coach_feedback'>;

export type AiFeedback = Tables<'ai_feedback'>;
export type AiFeedbackInsert = TablesInsert<'ai_feedback'>;
export type AiFeedbackUpdate = TablesUpdate<'ai_feedback'>;

export type Moment = Tables<'moments'>;
export type MomentInsert = TablesInsert<'moments'>;
export type MomentUpdate = TablesUpdate<'moments'>;

export type EnergyCheckin = Tables<'energy_checkins'>;
export type EnergyCheckinInsert = TablesInsert<'energy_checkins'>;
export type EnergyCheckinUpdate = TablesUpdate<'energy_checkins'>;

export type MicroRep = Tables<'micro_reps'>;
export type MicroRepInsert = TablesInsert<'micro_reps'>;
export type MicroRepUpdate = TablesUpdate<'micro_reps'>;

export type Debrief = Tables<'debriefs'>;
export type DebriefInsert = TablesInsert<'debriefs'>;
export type DebriefUpdate = TablesUpdate<'debriefs'>;

export type LadderRung = Tables<'ladder_rungs'>;
export type LadderRungInsert = TablesInsert<'ladder_rungs'>;
export type LadderRungUpdate = TablesUpdate<'ladder_rungs'>;

export type JournalEntry = Tables<'journal_entries'>;
export type JournalEntryInsert = TablesInsert<'journal_entries'>;
export type JournalEntryUpdate = TablesUpdate<'journal_entries'>;

export type WeeklyLetter = Tables<'weekly_letters'>;
export type WeeklyLetterInsert = TablesInsert<'weekly_letters'>;
export type WeeklyLetterUpdate = TablesUpdate<'weekly_letters'>;

export type NotificationPrefs = Tables<'notification_prefs'>;
export type NotificationPrefsInsert = TablesInsert<'notification_prefs'>;
export type NotificationPrefsUpdate = TablesUpdate<'notification_prefs'>;

export type Entitlement = Tables<'entitlements'>;
export type EntitlementInsert = TablesInsert<'entitlements'>;
export type EntitlementUpdate = TablesUpdate<'entitlements'>;

export type AiCall = Tables<'ai_calls'>;
export type AiCallInsert = TablesInsert<'ai_calls'>;
export type AiCallUpdate = TablesUpdate<'ai_calls'>;

export type SafetyEvent = Tables<'safety_events'>;
export type SafetyEventInsert = TablesInsert<'safety_events'>;
export type SafetyEventUpdate = TablesUpdate<'safety_events'>;

export type AiUsageDaily = Tables<'ai_usage_daily'>;
export type AiUsageDailyInsert = TablesInsert<'ai_usage_daily'>;
export type AiUsageDailyUpdate = TablesUpdate<'ai_usage_daily'>;

export type DeletionRequest = Tables<'deletion_requests'>;
export type DeletionRequestInsert = TablesInsert<'deletion_requests'>;
export type DeletionRequestUpdate = TablesUpdate<'deletion_requests'>;

export type ExportRecord = Tables<'exports'>;
export type ExportRecordInsert = TablesInsert<'exports'>;
export type ExportRecordUpdate = TablesUpdate<'exports'>;
`;

console.log('Generating database types...');

const dbUrl = await getCandidateDbUrl();
let generatedCode = '';

if (dbUrl) {
  try {
    const cmd = `npx --yes supabase gen types typescript --db-url "${dbUrl}"`;
    generatedCode = execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    try {
      const localCmd = 'npx --yes supabase gen types typescript --local';
      generatedCode = execSync(localCmd, { cwd: rootDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch {
      // both failed
    }
  }
} else {
  try {
    const localCmd = 'npx --yes supabase gen types typescript --local';
    generatedCode = execSync(localCmd, { cwd: rootDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    // local failed
  }
}

if (generatedCode && generatedCode.includes('export type Database')) {
  writeFileSync(outputPath, generatedCode + '\n' + domainHelpers, 'utf8');
  console.log(`Successfully generated database types to: ${outputPath}`);
} else if (existsSync(outputPath)) {
  const existing = readFileSync(outputPath, 'utf8');
  if (existing.includes('export type Database') && existing.includes('export type Profile')) {
    console.log(`Notice: No active database daemon available. Verified existing types at: ${outputPath}`);
  } else {
    console.error('Failed to generate types and existing types file is invalid.');
    process.exit(1);
  }
} else {
  console.error('Failed to generate database types: no active database connection or fallback types.');
  process.exit(1);
}
