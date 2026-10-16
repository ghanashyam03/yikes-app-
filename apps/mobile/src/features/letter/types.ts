export interface WeeklyLetterMetadata {
  wordCount: number;
  patternNoticed: string;
  nextFocus: string;
  plan: 'free' | 'plus';
  optedOut?: boolean;
}

export interface WeeklyLetter {
  id: string;
  userId: string;
  weekStart: string;
  content: string;
  metadata: WeeklyLetterMetadata;
  createdAt: string;
}

export interface VoiceStyleSummary {
  summary: string;
  toneMarkers: string[];
  vocabularyTraits: string[];
  sentenceRhythm: string;
  samplePhrases: string[];
}

export interface LetterState {
  letter: WeeklyLetter | null;
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  optedOut: boolean;
}
