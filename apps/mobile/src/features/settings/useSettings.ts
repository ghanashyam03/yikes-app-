import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  DEFAULT_SETTINGS,
  type SettingsState,
  type AppearancePreference,
  type CoachTone,
} from './types';

export const memorySettingsFallback = new Map<string, string>();

interface WebStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function getWebStorage(): WebStorageLike | null {
  const g = globalThis as unknown as { localStorage?: WebStorageLike };
  return g.localStorage ?? null;
}

export const settingsStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (memorySettingsFallback.has(name)) {
        return memorySettingsFallback.get(name) ?? null;
      }
      if (Platform.OS === 'web') {
        const storage = getWebStorage();
        if (storage) {
          return storage.getItem(name);
        }
        return null;
      }
      const val = await SecureStore.getItemAsync(name);
      if (val !== null && val !== undefined) {
        memorySettingsFallback.set(name, val);
        return val;
      }
      return null;
    } catch {
      return memorySettingsFallback.get(name) ?? null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    memorySettingsFallback.set(name, value);
    try {
      if (Platform.OS === 'web') {
        const storage = getWebStorage();
        if (storage) {
          storage.setItem(name, value);
        }
      } else {
        await SecureStore.setItemAsync(name, value);
      }
    } catch {
      // Memory fallback handles it
    }
  },
  removeItem: async (name: string): Promise<void> => {
    memorySettingsFallback.delete(name);
    try {
      if (Platform.OS === 'web') {
        const storage = getWebStorage();
        if (storage) {
          storage.removeItem(name);
        }
      } else {
        await SecureStore.deleteItemAsync(name);
      }
    } catch {
      // Memory fallback handles it
    }
  },
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setStreakEnabled: (streakEnabled: boolean) => set({ streakEnabled }),
      setWeeklyGoal: (weeklyGoal: number) => set({ weeklyGoal }),
      setIsPaused: (isPaused: boolean) => set({ isPaused }),
      setAppearance: (appearance: AppearancePreference) => set({ appearance }),
      setReducedMotionOverride: (reducedMotionOverride: boolean) =>
        set({ reducedMotionOverride }),
      setTextScale: (textScale: number) => set({ textScale }),
      setHapticsEnabled: (hapticsEnabled: boolean) => set({ hapticsEnabled }),
      setSoundEnabled: (soundEnabled: boolean) => set({ soundEnabled }),
      setCoachTone: (coachTone: CoachTone) => set({ coachTone }),

      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'yikes-settings-storage',
      storage: createJSONStorage(() => settingsStorage),
    }
  )
);
