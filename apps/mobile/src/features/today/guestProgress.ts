import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorageAdapter } from '../auth/supabaseClient';
import type { SkillsProgressMap } from './chooseNextSession';

export interface LocalSessionLog {
  id: string;
  sessionId: string;
  completedAt: string;
  mode: 'full' | 'take_it_easy';
}

export interface LocalEvidenceItem {
  quote: string;
  contextNote: string;
  createdAt: string;
}

export interface LocalMicroRep {
  id: string;
  prompt: string;
  forecastDrain?: number | null | undefined;
  forecastWarmth?: number | null | undefined;
  anchor?: string | undefined;
  outcome?: string | undefined;
  landed?: boolean | undefined;
  createdAt: string;
}

export interface LocalMoment {
  id: string;
  title: string;
  description?: string | undefined;
  eventDate?: string | undefined;
  status: 'upcoming' | 'completed';
}

export interface GuestProgressState {
  completedSessionIds: string[];
  sessionsLog: LocalSessionLog[];
  skillsProgress: SkillsProgressMap;
  evidenceQuotes: LocalEvidenceItem[];
  microReps: LocalMicroRep[];
  moments: LocalMoment[];
  energyLevel: number; // 1-5

  // Actions
  recordSessionComplete: (sessionId: string, mode?: 'full' | 'take_it_easy') => void;
  updateSkillStage: (
    skillKey: string,
    stage: 'starting' | 'practicing' | 'growing' | 'natural'
  ) => void;
  addEvidenceQuote: (quote: string, contextNote: string) => void;
  addMicroRep: (rep: Omit<LocalMicroRep, 'id' | 'createdAt'>) => string;
  resolveCheckin: (id: string, outcome: string, landed: boolean) => void;
  setEnergyLevel: (level: number) => void;
  addMoment: (moment: Omit<LocalMoment, 'id'>) => string;
  resetProgress: () => void;
}

export const GUEST_PROGRESS_STORAGE_KEY = 'yikes_guest_progress_store';

export const useGuestProgressStore = create<GuestProgressState>()(
  persist(
    (set, get) => ({
      completedSessionIds: [],
      sessionsLog: [],
      skillsProgress: {},
      evidenceQuotes: [],
      microReps: [],
      moments: [],
      energyLevel: 3,

      recordSessionComplete: (sessionId, mode = 'full') => {
        const now = new Date().toISOString();
        const entry: LocalSessionLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          sessionId,
          completedAt: now,
          mode,
        };
        const nextIds = Array.from(new Set([...get().completedSessionIds, sessionId]));
        set((state) => ({
          completedSessionIds: nextIds,
          sessionsLog: [entry, ...state.sessionsLog],
        }));
      },

      updateSkillStage: (skillKey, stage) => {
        const now = new Date().toISOString();
        set((state) => ({
          skillsProgress: {
            ...state.skillsProgress,
            [skillKey]: {
              stage,
              updatedAt: now,
              lastPracticedAt: now,
            },
          },
        }));
      },

      addEvidenceQuote: (quote, contextNote) => {
        const entry: LocalEvidenceItem = {
          quote,
          contextNote,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          evidenceQuotes: [entry, ...state.evidenceQuotes],
        }));
      },

      addMicroRep: (rep) => {
        const id = `rep_${Date.now()}`;
        const entry: LocalMicroRep = {
          ...rep,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          microReps: [entry, ...state.microReps],
        }));
        return id;
      },

      resolveCheckin: (id, outcome, landed) => {
        set((state) => ({
          microReps: state.microReps.map((r) =>
            r.id === id ? { ...r, outcome, landed } : r
          ),
        }));
      },

      setEnergyLevel: (level) => {
        set({ energyLevel: Math.max(1, Math.min(5, level)) });
      },

      addMoment: (moment) => {
        const id = `moment_${Date.now()}`;
        const entry: LocalMoment = {
          ...moment,
          id,
        };
        set((state) => ({
          moments: [entry, ...state.moments],
        }));
        return id;
      },

      resetProgress: () => {
        set({
          completedSessionIds: [],
          sessionsLog: [],
          skillsProgress: {},
          evidenceQuotes: [],
          microReps: [],
          moments: [],
          energyLevel: 3,
        });
      },
    }),
    {
      name: GUEST_PROGRESS_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name: string) => secureStorageAdapter.getItem(name),
        setItem: (name: string, value: string) => secureStorageAdapter.setItem(name, value),
        removeItem: (name: string) => secureStorageAdapter.removeItem(name),
      })),
    }
  )
);
