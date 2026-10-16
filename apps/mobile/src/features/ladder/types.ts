export interface LadderRung {
  id: string;
  userId?: string | undefined;
  title: string;
  sortOrder: number;
  completed: boolean;
  completedAt?: string | null | undefined;
  microRepSuggestion?: string | undefined;
  rationale?: string | undefined;
  isAiSuggested?: boolean | undefined;
  createdAt: string;
}

export interface LadderSuggestPayload {
  currentRungs: Array<{
    title: string;
    sortOrder: number;
    completed: boolean;
  }>;
  playbookSummary?: {
    communicationStyle?: string | undefined;
    scenarioWorld?: string | undefined;
    hardestPlaces?: string[] | undefined;
    coachTone?: 'gentle' | 'straight' | 'funny' | undefined;
  } | undefined;
}
