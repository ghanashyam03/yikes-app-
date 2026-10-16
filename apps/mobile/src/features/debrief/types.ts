export interface DebriefMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  createdAt: string;
}

export interface DebriefTakeawayCard {
  headline: string;
  coreEssence: string;
  quoteContext?: string | undefined;
}

export interface DebriefStartResponse {
  ok: boolean;
  debriefId: string;
  questions: string[];
}

export interface DebriefAnswerResponse {
  crisis: boolean;
  done?: boolean | undefined;
  nextQuestionIndex?: number | undefined;
  nextQuestion?: string | undefined;
}

export interface DebriefFinishResponse {
  ok: boolean;
  takeaway: {
    headline: string;
    coreEssence: string;
    quoteContext?: string | undefined;
    takeaway?: string | undefined;
    oneNextFocus?: string | undefined;
  };
}
