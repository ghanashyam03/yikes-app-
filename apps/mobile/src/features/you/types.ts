export type SkillStage = 'starting' | 'practicing' | 'growing' | 'natural';

export interface SkillEvidenceQuote {
  quote: string;
  sessionId: string;
  sessionTitle?: string;
  date: string;
}

export interface SkillProgressSummary {
  skillKey: string;
  name: string;
  description: string;
  stage: SkillStage;
  lastPracticedAt: string | null;
  isReviewDue: boolean;
  evidenceQuotes: SkillEvidenceQuote[];
}

export interface YouOverviewData {
  displayName: string;
  evidenceLine: {
    quote: string;
    contextNote: string;
  };
  skills: SkillProgressSummary[];
  journalCount: number;
  gapSummary: {
    totalCheckins: number;
    trend: 'closing' | 'widening' | 'stable';
    latestGap?: number | undefined;
  };
  batterySummary: {
    currentLevel: number;
    hasLogs: boolean;
  };
  ladderSummary: {
    completedCount: number;
    totalCount: number;
    currentRungTitle: string | null;
  };
}
