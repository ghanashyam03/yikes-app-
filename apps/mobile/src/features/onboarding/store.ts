import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QuizAnswers } from '@yikes/shared/playbook/questions';
import { DeeperAnswers } from '@yikes/shared/playbook/deeper';
import {
  DerivedPlaybook,
  derivePlaybook
} from '@yikes/shared/playbook/derivePlaybook';
import { secureStorageAdapter } from '../auth/supabaseClient';

export interface OnboardingState {
  currentStep: number;
  answers: QuizAnswers;
  deeperAnswers: DeeperAnswers;
  derivedPlaybook: DerivedPlaybook | null;
  isCompleted: boolean;
  hasSeenDeeper: boolean;

  // Actions
  setAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  setDeeperAnswer: (statementId: string, value: number | null) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  updateDerivedPlaybook: () => DerivedPlaybook;
  updatePlaybookField: <K extends keyof DerivedPlaybook>(field: K, value: DerivedPlaybook[K]) => void;
  markCompleted: () => void;
  reset: () => void;
}

const INITIAL_ANSWERS: QuizAnswers = {
  q3: null,
  q5: null,
  q9: null
};

export const ONBOARDING_STORAGE_KEY = 'yikes_onboarding_store';

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      answers: { ...INITIAL_ANSWERS },
      deeperAnswers: {},
      derivedPlaybook: null,
      isCompleted: false,
      hasSeenDeeper: false,

      setAnswer: (key, value) => {
        set((state) => {
          const nextAnswers = { ...state.answers, [key]: value };
          const nextDerived = derivePlaybook(nextAnswers, state.deeperAnswers);
          return {
            answers: nextAnswers,
            derivedPlaybook: nextDerived
          };
        });
      },

      setDeeperAnswer: (statementId, value) => {
        set((state) => {
          const nextDeeper = { ...state.deeperAnswers, [statementId]: value };
          const nextDerived = derivePlaybook(state.answers, nextDeeper);
          return {
            deeperAnswers: nextDeeper,
            derivedPlaybook: nextDerived
          };
        });
      },

      setCurrentStep: (step) => {
        const clamped = Math.max(1, Math.min(14, step));
        set({ currentStep: clamped });
      },

      nextStep: () => {
        const current = get().currentStep;
        if (current < 14) {
          set({ currentStep: current + 1 });
        }
      },

      prevStep: () => {
        const current = get().currentStep;
        if (current > 1) {
          set({ currentStep: current - 1 });
        }
      },

      skipStep: () => {
        const current = get().currentStep;
        if (current < 14) {
          set({ currentStep: current + 1 });
        }
      },

      updateDerivedPlaybook: () => {
        const { answers, deeperAnswers } = get();
        const derived = derivePlaybook(answers, deeperAnswers);
        set({ derivedPlaybook: derived });
        return derived;
      },

      updatePlaybookField: (field, value) => {
        set((state) => {
          const currentDerived = state.derivedPlaybook ?? derivePlaybook(state.answers, state.deeperAnswers);
          return {
            derivedPlaybook: {
              ...currentDerived,
              [field]: value
            }
          };
        });
      },

      markCompleted: () => {
        set({ isCompleted: true });
      },

      reset: () => {
        set({
          currentStep: 1,
          answers: { ...INITIAL_ANSWERS },
          deeperAnswers: {},
          derivedPlaybook: null,
          isCompleted: false,
          hasSeenDeeper: false
        });
      }
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name: string) => secureStorageAdapter.getItem(name),
        setItem: (name: string, value: string) => secureStorageAdapter.setItem(name, value),
        removeItem: (name: string) => secureStorageAdapter.removeItem(name)
      }))
    }
  )
);
