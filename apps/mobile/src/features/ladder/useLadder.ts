import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorageAdapter } from '../auth/supabaseClient';
import {
  createLadderRungInSupabase,
  fetchLadderRungsFromSupabase,
  suggestLadderRungFromGateway,
  updateLadderRungInSupabase,
} from './ladderApi';
import type { LadderRung, LadderSuggestPayload } from './types';

export const LADDER_STORAGE_KEY = 'yikes_ladder_store';

export const DEFAULT_SEED_RUNGS: Array<Omit<LadderRung, 'id' | 'createdAt'>> = [
  {
    title: 'Say good morning or thanks to a barista or neighbour',
    sortOrder: 1,
    completed: false,
    microRepSuggestion: 'Offer a brief, warm greeting with natural eye contact.',
    rationale: 'An easy low-pressure warm-up that breaks silence effortlessly.',
  },
  {
    title: 'Ask a colleague one question about their weekend',
    sortOrder: 2,
    completed: false,
    microRepSuggestion: 'Ask what they did or what they are looking forward to.',
    rationale: 'Builds quick personal connection without lingering too long.',
  },
  {
    title: 'Acknowledge what someone said before making your point',
    sortOrder: 3,
    completed: false,
    microRepSuggestion: 'Repeat or validate one keyword they shared.',
    rationale: 'Shows they were heard and smooths transitions.',
  },
  {
    title: 'Offer one short sentence in a 3-4 person catch-up',
    sortOrder: 4,
    completed: false,
    microRepSuggestion: 'Share one reaction or agreement during the conversation.',
    rationale: 'Practices speaking up in small groups with minimal pressure.',
  },
  {
    title: 'Ask a follow-up question when someone shares an interest',
    sortOrder: 5,
    completed: false,
    microRepSuggestion: 'Ask what drew them to that activity or project.',
    rationale: 'Deepens dialogue without turning it into an interrogation.',
  },
  {
    title: 'Take a graceful exit after 10 minutes at an event',
    sortOrder: 6,
    completed: false,
    microRepSuggestion: 'Use: "It was great chatting — I’ll let you mingle!"',
    rationale: 'Gives you full control over when to leave and protect energy.',
  },
  {
    title: 'Bridge from casual small talk into a real topic',
    sortOrder: 7,
    completed: false,
    microRepSuggestion: 'Link a small observation to a shared project or goal.',
    rationale: 'Moves the exchange past the weather into something engaging.',
  },
  {
    title: 'Voice a polite, gentle alternative perspective',
    sortOrder: 8,
    completed: false,
    microRepSuggestion: 'Try: "Another angle to consider might be..."',
    rationale: 'Helps you contribute critical thinking while keeping tone warm.',
  },
];

export function reorderRungs(
  rungs: LadderRung[],
  index: number,
  direction: 'up' | 'down'
): LadderRung[] {
  if (direction === 'up' && index <= 0) return [...rungs];
  if (direction === 'down' && index >= rungs.length - 1) return [...rungs];

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  const copy = [...rungs];
  const temp = copy[index]!;
  copy[index] = copy[targetIndex]!;
  copy[targetIndex] = temp;

  // Re-assign sortOrder based on new positions
  return copy.map((rung, i) => ({
    ...rung,
    sortOrder: i + 1,
  }));
}

function generateLocalId(): string {
  return `rung_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export interface LadderState {
  rungs: LadderRung[];
  isLoading: boolean;
  isSuggesting: boolean;
  error: string | null;

  // Actions
  seedLadder: (customTitles?: string[]) => void;
  moveUp: (index: number, userId?: string) => Promise<void>;
  moveDown: (index: number, userId?: string) => Promise<void>;
  addRung: (
    title: string,
    microRep?: string,
    rationale?: string,
    isAiSuggested?: boolean,
    userId?: string
  ) => Promise<LadderRung>;
  editRung: (id: string, title: string, userId?: string) => Promise<void>;
  toggleDone: (id: string, userId?: string) => Promise<void>;
  suggestNextRung: (
    playbookSummary?: LadderSuggestPayload['playbookSummary'],
    token?: string
  ) => Promise<LadderRung | null>;
  fetchRungs: (userId?: string) => Promise<void>;
  resetStore: () => void;
}

export const useLadder = create<LadderState>()(
  persist(
    (set, get) => ({
      rungs: [],
      isLoading: false,
      isSuggesting: false,
      error: null,

      seedLadder: (customTitles) => {
        const now = new Date().toISOString();
        if (customTitles && customTitles.length > 0) {
          const seeded: LadderRung[] = customTitles.map((title, i) => ({
            id: generateLocalId(),
            title,
            sortOrder: i + 1,
            completed: false,
            createdAt: now,
          }));
          set({ rungs: seeded });
          return;
        }

        const seeded: LadderRung[] = DEFAULT_SEED_RUNGS.map((rung) => ({
          ...rung,
          id: generateLocalId(),
          createdAt: now,
        }));
        set({ rungs: seeded });
      },

      moveUp: async (index: number, userId?: string) => {
        const current = get().rungs;
        const reordered = reorderRungs(current, index, 'up');
        set({ rungs: reordered });

        if (userId) {
          try {
            // Update orders for affected rungs
            const rungA = reordered[index - 1];
            const rungB = reordered[index];
            if (rungA && !rungA.id.startsWith('rung_')) {
              await updateLadderRungInSupabase(rungA);
            }
            if (rungB && !rungB.id.startsWith('rung_')) {
              await updateLadderRungInSupabase(rungB);
            }
          } catch {
            // silent fallback
          }
        }
      },

      moveDown: async (index: number, userId?: string) => {
        const current = get().rungs;
        const reordered = reorderRungs(current, index, 'down');
        set({ rungs: reordered });

        if (userId) {
          try {
            const rungA = reordered[index];
            const rungB = reordered[index + 1];
            if (rungA && !rungA.id.startsWith('rung_')) {
              await updateLadderRungInSupabase(rungA);
            }
            if (rungB && !rungB.id.startsWith('rung_')) {
              await updateLadderRungInSupabase(rungB);
            }
          } catch {
            // silent fallback
          }
        }
      },

      addRung: async (title, microRep, rationale, isAiSuggested = false, userId) => {
        const current = get().rungs;
        const nextOrder = current.length + 1;
        const localId = generateLocalId();
        const now = new Date().toISOString();

        const newRung: LadderRung = {
          id: localId,
          userId,
          title,
          sortOrder: nextOrder,
          completed: false,
          microRepSuggestion: microRep,
          rationale,
          isAiSuggested,
          createdAt: now,
        };

        set({ rungs: [...current, newRung] });

        if (userId) {
          try {
            const remoteRung = await createLadderRungInSupabase(newRung, userId);
            set((state) => ({
              rungs: state.rungs.map((r) =>
                r.id === localId ? remoteRung : r
              ),
            }));
            return remoteRung;
          } catch {
            return newRung;
          }
        }

        return newRung;
      },

      editRung: async (id: string, title: string, userId?: string) => {
        set((state) => ({
          rungs: state.rungs.map((r) =>
            r.id === id ? { ...r, title } : r
          ),
        }));

        if (userId && !id.startsWith('rung_')) {
          try {
            await updateLadderRungInSupabase({ id, title });
          } catch {
            // silent fallback
          }
        }
      },

      toggleDone: async (id: string, userId?: string) => {
        const state = get();
        const target = state.rungs.find((r) => r.id === id);
        if (!target) return;

        const nextCompleted = !target.completed;
        const completedAt = nextCompleted ? new Date().toISOString() : null;

        set({
          rungs: state.rungs.map((r) =>
            r.id === id
              ? { ...r, completed: nextCompleted, completedAt }
              : r
          ),
        });

        if (userId && !id.startsWith('rung_')) {
          try {
            await updateLadderRungInSupabase({
              id,
              completed: nextCompleted,
            });
          } catch {
            // silent fallback
          }
        }
      },

      suggestNextRung: async (playbookSummary, token) => {
        const { rungs } = get();
        set({ isSuggesting: true, error: null });

        try {
          const payload: LadderSuggestPayload = {
            currentRungs: rungs.map((r) => ({
              title: r.title,
              sortOrder: r.sortOrder,
              completed: r.completed,
            })),
            playbookSummary,
          };

          const suggestion = await suggestLadderRungFromGateway(payload, undefined, token);
          const added = await get().addRung(
            suggestion.title,
            suggestion.microRepSuggestion,
            suggestion.rationale,
            true
          );
          set({ isSuggesting: false });
          return added;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          set({ isSuggesting: false, error: msg });
          return null;
        }
      },

      fetchRungs: async (userId?: string) => {
        if (!userId) return;

        set({ isLoading: true, error: null });
        try {
          const remoteRungs = await fetchLadderRungsFromSupabase(userId);
          set({ rungs: remoteRungs, isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          set({ isLoading: false, error: msg });
        }
      },

      resetStore: () => {
        set({
          rungs: [],
          isLoading: false,
          isSuggesting: false,
          error: null,
        });
      },
    }),
    {
      name: LADDER_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: (state) => ({
        rungs: state.rungs,
      }),
    }
  )
);
