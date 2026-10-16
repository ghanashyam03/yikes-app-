import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorageAdapter } from '../auth/supabaseClient';
import {
  createMomentInSupabase,
  deleteMomentInSupabase,
  fetchMomentsFromSupabase,
  updateMomentInSupabase,
} from './momentsApi';
import type { Moment, PrepCard } from './types';

export interface MomentsState {
  moments: Moment[];
  isLoading: boolean;
  error: string | null;
  selectedFilter: 'upcoming' | 'past';

  // Actions
  fetchMoments: (userId?: string | undefined) => Promise<void>;
  addMoment: (data: Omit<Moment, 'id'>, userId?: string | undefined) => Promise<Moment>;
  updateMoment: (
    id: string,
    updates: Partial<Moment>,
    userId?: string | undefined
  ) => Promise<Moment>;
  deleteMoment: (id: string, userId?: string | undefined) => Promise<void>;
  getMoment: (id: string) => Moment | undefined;
  savePrepCard: (
    momentId: string,
    prep: PrepCard,
    userId?: string | undefined
  ) => Promise<void>;
  updatePrepItem: (
    momentId: string,
    itemKey: keyof PrepCard,
    value: string | string[],
    userId?: string | undefined
  ) => Promise<void>;
  setFilter: (filter: 'upcoming' | 'past') => void;
  resetStore: () => void;
}

export const MOMENTS_STORAGE_KEY = 'yikes_moments_store';

function generateLocalId(): string {
  return `moment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export const useMoments = create<MomentsState>()(
  persist(
    (set, get) => ({
      moments: [],
      isLoading: false,
      error: null,
      selectedFilter: 'upcoming',

      fetchMoments: async (userId?: string) => {
        if (!userId) {
          // Guest mode: relies on locally persisted moments
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const remote = await fetchMomentsFromSupabase(userId);
          // Merge remote moments with local store
          const localOnly = get().moments.filter(
            (lm) => !remote.some((rm) => rm.id === lm.id) && lm.id.startsWith('moment_')
          );
          set({ moments: [...remote, ...localOnly], isLoading: false });
        } catch (err: unknown) {
          // Keep existing local moments on offline/network errors
          const msg = err instanceof Error ? err.message : String(err);
          set({ error: msg, isLoading: false });
        }
      },

      addMoment: async (data: Omit<Moment, 'id'>, userId?: string) => {
        const localId = generateLocalId();
        const localMoment: Moment = {
          ...data,
          id: localId,
          userId,
          createdAt: new Date().toISOString(),
          status: data.status || 'upcoming',
        };

        // Optimistically update local store immediately
        set((state) => ({
          moments: [localMoment, ...state.moments],
        }));

        if (userId) {
          try {
            const remoteMoment = await createMomentInSupabase(data, userId);
            // Replace temporary local ID with remote ID
            set((state) => ({
              moments: state.moments.map((m) =>
                m.id === localId ? { ...remoteMoment, ...localMoment, id: remoteMoment.id } : m
              ),
            }));
            return remoteMoment;
          } catch {
            // Keep local draft in store even if remote insert failed (offline resilience)
            return localMoment;
          }
        }

        return localMoment;
      },

      updateMoment: async (id: string, updates: Partial<Moment>, userId?: string) => {
        let updatedMoment: Moment | undefined;

        set((state) => {
          const nextMoments = state.moments.map((m) => {
            if (m.id === id) {
              updatedMoment = { ...m, ...updates };
              return updatedMoment;
            }
            return m;
          });
          return { moments: nextMoments };
        });

        if (userId && !id.startsWith('moment_')) {
          try {
            await updateMomentInSupabase(id, updates, userId);
          } catch {
            // Optimistic local update remains in place
          }
        }

        if (!updatedMoment) {
          throw new Error(`Moment ${id} not found in store`);
        }

        return updatedMoment;
      },

      deleteMoment: async (id: string, userId?: string) => {
        set((state) => ({
          moments: state.moments.filter((m) => m.id !== id),
        }));

        if (userId && !id.startsWith('moment_')) {
          try {
            await deleteMomentInSupabase(id, userId);
          } catch {
            // Deleted locally
          }
        }
      },

      getMoment: (id: string) => {
        return get().moments.find((m) => m.id === id);
      },

      savePrepCard: async (momentId: string, prep: PrepCard, userId?: string) => {
        await get().updateMoment(momentId, { prepPayload: prep }, userId);
      },

      updatePrepItem: async (
        momentId: string,
        itemKey: keyof PrepCard,
        value: string | string[],
        userId?: string
      ) => {
        const moment = get().getMoment(momentId);
        if (!moment || !moment.prepPayload) return;

        const nextPrep: PrepCard = {
          ...moment.prepPayload,
          [itemKey]: value,
        };

        await get().savePrepCard(momentId, nextPrep, userId);
      },

      setFilter: (filter: 'upcoming' | 'past') => {
        set({ selectedFilter: filter });
      },

      resetStore: () => {
        set({
          moments: [],
          isLoading: false,
          error: null,
          selectedFilter: 'upcoming',
        });
      },
    }),
    {
      name: MOMENTS_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: (state) => ({
        moments: state.moments,
      }),
    }
  )
);
