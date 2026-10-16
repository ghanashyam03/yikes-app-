import type { VoiceStyleSummary } from '@yikes/ai-prompts/voice-style-summary';

export interface StageChange {
  skillKey: string;
  fromStage?: string | undefined;
  toStage: string;
}

export interface DigestMoment {
  id: string;
  title: string;
  status?: string | undefined;
}

export interface DigestGap {
  drainGap?: number | undefined;
  warmthGap?: number | undefined;
  landed?: boolean | undefined;
  outcome?: string | undefined;
}

export interface WeeklyDigest {
  sessionsCompleted: number;
  momentsLogged: number;
  stageChanges: StageChange[];
  moments: DigestMoment[];
  gaps: DigestGap[];
  quotes: string[]; // Strictly <= 3 verbatim user quotes with zero third-party names
}

export interface WeeklyLetterMetadata {
  wordCount: number;
  patternNoticed: string;
  nextFocus: string;
  plan: 'free' | 'plus';
  optedOut?: boolean | undefined;
}

export interface WeeklyLetterRecord {
  id: string;
  userId: string;
  weekStart: string;
  content: string;
  metadata: WeeklyLetterMetadata;
  createdAt: string;
}

export type { VoiceStyleSummary };
