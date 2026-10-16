import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorageAdapter, supabase } from '../auth/supabaseClient';
import type { EnergyLog } from './types';

export interface EnergyState {
  currentLevel: number;
  selectedTags: string[];
  logs: EnergyLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setLevel: (level: number) => void;
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  logEnergy: (
    level?: number,
    tags?: string[],
    userId?: string
  ) => Promise<EnergyLog>;
  fetchLogs: (userId?: string) => Promise<void>;
  resetStore: () => void;
}

export const ENERGY_STORAGE_KEY = 'yikes_energy_store';

function generateLocalId(): string {
  return `energy_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export const useEnergy = create<EnergyState>()(
  persist(
    (set, get) => ({
      currentLevel: 70,
      selectedTags: [],
      logs: [],
      isLoading: false,
      error: null,

      setLevel: (level: number) => {
        const clamped = Math.max(0, Math.min(100, Math.round(level)));
        set({ currentLevel: clamped });
      },

      toggleTag: (tag: string) => {
        set((state) => {
          const exists = state.selectedTags.includes(tag);
          const next = exists
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag];
          return { selectedTags: next };
        });
      },

      clearTags: () => {
        set({ selectedTags: [] });
      },

      logEnergy: async (
        levelOverride?: number,
        tagsOverride?: string[],
        userId?: string
      ): Promise<EnergyLog> => {
        const state = get();
        const level =
          levelOverride !== undefined ? levelOverride : state.currentLevel;
        const tags = tagsOverride !== undefined ? tagsOverride : state.selectedTags;
        const localId = generateLocalId();
        const nowIso = new Date().toISOString();

        const newLog: EnergyLog = {
          id: localId,
          userId,
          batteryLevel: level,
          tags,
          createdAt: nowIso,
        };

        // Optimistically record to local store
        set((prev) => ({
          logs: [newLog, ...prev.logs],
          selectedTags: [],
        }));

        // If authenticated, sync to Supabase energy_checkins table
        if (userId) {
          try {
            const { data, error } = await supabase
              .from('energy_checkins')
              .insert({
                user_id: userId,
                battery_level: level,
                tags,
              })
              .select()
              .single();

            if (!error && data) {
              const remoteLog: EnergyLog = {
                id: data.id,
                userId: data.user_id,
                batteryLevel: data.battery_level,
                tags: Array.isArray(data.tags) ? (data.tags as string[]) : tags,
                createdAt: data.created_at ?? nowIso,
              };

              set((prev) => ({
                logs: prev.logs.map((l) => (l.id === localId ? remoteLog : l)),
              }));
              return remoteLog;
            }
          } catch {
            // Keep local entry on offline / failure
          }
        }

        return newLog;
      },

      fetchLogs: async (userId?: string) => {
        if (!userId) return;

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('energy_checkins')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const remoteLogs: EnergyLog[] = (data || []).map((row) => ({
            id: row.id,
            userId: row.user_id,
            batteryLevel: row.battery_level,
            tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
            createdAt: row.created_at ?? new Date().toISOString(),
          }));

          const localOnly = get().logs.filter(
            (l) => !remoteLogs.some((r) => r.id === l.id) && l.id.startsWith('energy_')
          );

          set({ logs: [...remoteLogs, ...localOnly], isLoading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          set({ error: msg, isLoading: false });
        }
      },

      resetStore: () => {
        set({
          currentLevel: 70,
          selectedTags: [],
          logs: [],
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: ENERGY_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: (state) => ({
        currentLevel: state.currentLevel,
        logs: state.logs,
      }),
    }
  )
);
