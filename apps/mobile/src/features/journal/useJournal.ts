import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorageAdapter } from '../auth/supabaseClient';
import {
  createJournalEntryInSupabase,
  deleteJournalEntryInSupabase,
  fetchJournalEntriesFromSupabase,
  updateJournalFavoriteInSupabase,
} from './journalApi';
import type { JournalEntry, JournalFilter } from './types';

export interface JournalState {
  entries: JournalEntry[];
  activeFilter: JournalFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  setFilter: (filter: JournalFilter) => void;
  getFilteredEntries: () => JournalEntry[];
  addEntry: (
    entry: Omit<JournalEntry, 'id' | 'createdAt'>,
    userId?: string
  ) => Promise<JournalEntry>;
  toggleFavorite: (id: string, userId?: string) => Promise<void>;
  deleteEntry: (id: string, userId?: string) => Promise<void>;
  fetchEntries: (userId?: string) => Promise<void>;
  resetStore: () => void;
}

export const JOURNAL_STORAGE_KEY = 'yikes_journal_store';

function generateLocalId(): string {
  return `journal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function filterJournalEntries(
  entries: JournalEntry[],
  filter: JournalFilter
): JournalEntry[] {
  switch (filter) {
    case 'wins':
      return entries.filter(
        (e) =>
          e.entryKind === 'win' ||
          e.entryKind === 'quote' ||
          e.entryKind === 'milestone'
      );
    case 'letters':
      return entries.filter((e) => e.entryKind === 'letter');
    case 'debriefs':
      return entries.filter((e) => e.entryKind === 'debrief');
    case 'all':
    default:
      return entries;
  }
}

export const useJournal = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      activeFilter: 'all',
      isLoading: false,
      error: null,

      setFilter: (filter: JournalFilter) => {
        set({ activeFilter: filter });
      },

      getFilteredEntries: () => {
        const { entries, activeFilter } = get();
        return filterJournalEntries(entries, activeFilter);
      },

      addEntry: async (entryData, userId) => {
        const localId = generateLocalId();
        const now = new Date().toISOString();
        const newEntry: JournalEntry = {
          id: localId,
          userId,
          entryKind: entryData.entryKind,
          title: entryData.title,
          body: entryData.body,
          metadata: entryData.metadata,
          favorite: entryData.favorite ?? false,
          createdAt: now,
        };

        set((state) => ({
          entries: [newEntry, ...state.entries],
        }));

        if (userId) {
          try {
            const remoteEntry = await createJournalEntryInSupabase(
              entryData,
              userId
            );
            // Replace local placeholder with remote entry
            set((state) => ({
              entries: state.entries.map((e) =>
                e.id === localId ? remoteEntry : e
              ),
            }));
            return remoteEntry;
          } catch {
            // Keep local entry if offline or error
            return newEntry;
          }
        }

        return newEntry;
      },

      toggleFavorite: async (id: string, userId?: string) => {
        const currentEntries = get().entries;
        const target = currentEntries.find((e) => e.id === id);
        if (!target) return;

        const nextFav = !target.favorite;
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, favorite: nextFav } : e
          ),
        }));

        if (userId && !id.startsWith('journal_')) {
          try {
            await updateJournalFavoriteInSupabase(id, nextFav);
          } catch {
            // Revert on failure
            set((state) => ({
              entries: state.entries.map((e) =>
                e.id === id ? { ...e, favorite: target.favorite } : e
              ),
            }));
          }
        }
      },

      deleteEntry: async (id: string, userId?: string) => {
        const prevEntries = get().entries;
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));

        if (userId && !id.startsWith('journal_')) {
          try {
            await deleteJournalEntryInSupabase(id);
          } catch {
            // Revert on failure
            set({ entries: prevEntries });
          }
        }
      },

      fetchEntries: async (userId?: string) => {
        if (!userId) return;
        set({ isLoading: true, error: null });
        try {
          const remoteEntries = await fetchJournalEntriesFromSupabase(userId);
          // Merge remote and any unsynced local entries
          set((state) => {
            const localOnly = state.entries.filter((e) =>
              e.id.startsWith('journal_')
            );
            const remoteIds = new Set(remoteEntries.map((r) => r.id));
            const merged = [
              ...localOnly.filter((l) => !remoteIds.has(l.id)),
              ...remoteEntries,
            ].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            return { entries: merged, isLoading: false };
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          set({ isLoading: false, error: msg });
        }
      },

      resetStore: () => {
        set({
          entries: [],
          activeFilter: 'all',
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: JOURNAL_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: (state) => ({
        entries: state.entries,
        activeFilter: state.activeFilter,
      }),
    }
  )
);
