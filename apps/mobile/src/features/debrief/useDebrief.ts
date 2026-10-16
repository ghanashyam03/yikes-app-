import { create } from 'zustand';
import {
  apiAnswerDebrief,
  apiFinishDebrief,
  apiStartDebrief,
  saveDebriefToJournal,
} from './debriefApi';
import type { DebriefMessage, DebriefTakeawayCard } from './types';

export interface DebriefState {
  debriefId: string | null;
  momentId?: string | undefined;
  questions: string[];
  currentQuestionIndex: number;
  messages: DebriefMessage[];
  takeaway: DebriefTakeawayCard | null;
  isDone: boolean;
  isCrisis: boolean;
  isLoading: boolean;
  error: string | null;
  suggestedChips: string[];

  // Actions
  startDebrief: (momentId?: string, token?: string) => Promise<void>;
  sendAnswer: (answerText: string, token?: string) => Promise<boolean>; // returns false if crisis
  finishDebrief: (token?: string) => Promise<void>;
  updateCoreEssence: (newEssence: string) => void;
  saveToJournal: (userId?: string) => Promise<void>;
  discardDebrief: () => void;
  resetDebrief: () => void;
}

const DEFAULT_SUGGESTION_BANK: Record<number, string[]> = {
  0: [
    'It went more smoothly than I feared',
    'I felt a bit awkward at the start',
    'We talked about something unexpected',
  ],
  1: [
    'My battery dipped after about 15 minutes',
    'I noticed feeling tense during a silence',
    'My energy stayed steady throughout',
  ],
  2: [
    'They asked me questions back',
    'They seemed distracted or in a hurry',
    'They smiled and listened patiently',
  ],
  3: [
    'Carrying the conversation alone',
    'Finding an excuse to wrap up and exit',
    'Staying engaged while tired',
  ],
};

function getSuggestedChipsForIndex(index: number): string[] {
  return DEFAULT_SUGGESTION_BANK[index] || [
    'It felt natural',
    'A bit draining but okay',
    'Glad I did it',
  ];
}

export const useDebrief = create<DebriefState>((set, get) => ({
  debriefId: null,
  momentId: undefined,
  questions: [],
  currentQuestionIndex: 0,
  messages: [],
  takeaway: null,
  isDone: false,
  isCrisis: false,
  isLoading: false,
  error: null,
  suggestedChips: getSuggestedChipsForIndex(0),

  startDebrief: async (momentId?: string, token?: string) => {
    set({
      isLoading: true,
      error: null,
      momentId,
      messages: [],
      takeaway: null,
      isDone: false,
      isCrisis: false,
      currentQuestionIndex: 0,
    });

    try {
      const res = await apiStartDebrief(momentId, token);
      const firstQuestion =
        res.questions[0] || 'How did the opening few minutes feel?';

      const initialMessage: DebriefMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        text: firstQuestion,
        createdAt: new Date().toISOString(),
      };

      set({
        debriefId: res.debriefId,
        questions: res.questions,
        currentQuestionIndex: 0,
        messages: [initialMessage],
        suggestedChips: getSuggestedChipsForIndex(0),
        isLoading: false,
      });
    } catch {
      // Offline fallback
      const fallbackQuestions = [
        'What went a little better than you expected?',
        'Was there a moment you felt your energy shift or dip?',
        'Did you notice any signal from the other person that surprised you?',
        'Looking back now, what took the most effort from you?',
      ];
      const initialMessage: DebriefMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        text: fallbackQuestions[0] ?? 'How did it feel?',
        createdAt: new Date().toISOString(),
      };

      set({
        debriefId: `local_${Date.now()}`,
        questions: fallbackQuestions,
        currentQuestionIndex: 0,
        messages: [initialMessage],
        suggestedChips: getSuggestedChipsForIndex(0),
        isLoading: false,
      });
    }
  },

  sendAnswer: async (answerText: string, token?: string): Promise<boolean> => {
    const state = get();
    const debriefId = state.debriefId;
    if (!debriefId) return false;

    const userMessage: DebriefMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: answerText,
      createdAt: new Date().toISOString(),
    };

    set((prev) => ({
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const res = await apiAnswerDebrief(
        debriefId,
        answerText,
        state.currentQuestionIndex,
        token
      );

      // CRITICAL CHECK: Crisis detection
      if (res.crisis) {
        set({
          isCrisis: true,
          isLoading: false,
        });
        return false;
      }

      const nextIndex = state.currentQuestionIndex + 1;
      const isDone = Boolean(res.done) || nextIndex >= state.questions.length;

      if (isDone) {
        set({ isDone: true, isLoading: false });
        await get().finishDebrief(token);
        return true;
      }

      const nextQuestion =
        res.nextQuestion ||
        state.questions[nextIndex] ||
        'What else did you notice?';

      const assistantMessage: DebriefMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        text: nextQuestion,
        createdAt: new Date().toISOString(),
      };

      set((prev) => ({
        currentQuestionIndex: nextIndex,
        messages: [...prev.messages, assistantMessage],
        suggestedChips: getSuggestedChipsForIndex(nextIndex),
        isLoading: false,
      }));
      return true;
    } catch {
      // Local progression fallback if network drops
      const nextIndex = state.currentQuestionIndex + 1;
      const isDone = nextIndex >= state.questions.length;

      if (isDone) {
        set({ isDone: true, isLoading: false });
        await get().finishDebrief(token);
        return true;
      }

      const nextQuestion =
        state.questions[nextIndex] || 'What else did you notice?';
      const assistantMessage: DebriefMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        text: nextQuestion,
        createdAt: new Date().toISOString(),
      };

      set((prev) => ({
        currentQuestionIndex: nextIndex,
        messages: [...prev.messages, assistantMessage],
        suggestedChips: getSuggestedChipsForIndex(nextIndex),
        isLoading: false,
      }));
      return true;
    }
  },

  finishDebrief: async (token?: string) => {
    const state = get();
    const debriefId = state.debriefId;
    if (!debriefId) return;

    set({ isLoading: true, error: null });

    // Build QA pairs from messages
    const qaPairs: Array<{ question: string; answer: string }> = [];
    for (let i = 0; i < state.messages.length - 1; i++) {
      const currentMsg = state.messages[i];
      const nextMsg = state.messages[i + 1];
      if (
        currentMsg &&
        nextMsg &&
        currentMsg.role === 'assistant' &&
        nextMsg.role === 'user'
      ) {
        qaPairs.push({
          question: currentMsg.text,
          answer: nextMsg.text,
        });
      }
    }

    try {
      const res = await apiFinishDebrief(debriefId, qaPairs, token);
      const takeaway: DebriefTakeawayCard = {
        headline: res.takeaway.headline,
        coreEssence: res.takeaway.coreEssence,
        quoteContext: res.takeaway.quoteContext,
      };

      set({
        takeaway,
        isDone: true,
        isLoading: false,
      });
    } catch {
      // Grounded fallback takeaway
      const takeaway: DebriefTakeawayCard = {
        headline: 'You stayed grounded and paid attention to the cues in front of you.',
        coreEssence: 'Pauses felt longer to you than they did to the other person.',
        quoteContext: 'Next time, give yourself one calm breath before wrapping up.',
      };

      set({
        takeaway,
        isDone: true,
        isLoading: false,
      });
    }
  },

  updateCoreEssence: (newEssence: string) => {
    set((prev) => {
      if (!prev.takeaway) return prev;
      return {
        takeaway: {
          ...prev.takeaway,
          coreEssence: newEssence,
        },
      };
    });
  },

  saveToJournal: async (userId?: string) => {
    const state = get();
    if (!state.takeaway) return;
    try {
      await saveDebriefToJournal(state.takeaway, state.momentId, userId);
    } catch {
      // Handled silently
    }
  },

  discardDebrief: () => {
    set({
      debriefId: null,
      momentId: undefined,
      questions: [],
      currentQuestionIndex: 0,
      messages: [],
      takeaway: null,
      isDone: false,
      isCrisis: false,
      isLoading: false,
      error: null,
    });
  },

  resetDebrief: () => {
    get().discardDebrief();
  },
}));
