import { create } from 'zustand';
import { supabase } from '../auth/supabaseClient';
import { useSessionStore } from '../auth/useSession';
import { fetchLatestLetter, fetchLetterById, updateLetterOptOut } from './letterApi';
import type { LetterState, WeeklyLetter } from './types';

export interface WeeklyLetterStore extends LetterState {
  loadLetter: (id?: string) => Promise<void>;
  toggleOptOut: (optOut: boolean) => Promise<boolean>;
  setLetter: (letter: WeeklyLetter | null) => void;
  resetStore: () => void;
}

const DEFAULT_STATE: LetterState = {
  letter: null,
  isLoading: false,
  isOffline: false,
  error: null,
  optedOut: false,
};

// In-memory offline cache fallback
let cachedLetter: WeeklyLetter | null = null;

async function getAuthToken(): Promise<string | null> {
  try {
    const sessionState = useSessionStore.getState();
    if (sessionState.session?.accessToken) {
      return sessionState.session.accessToken;
    }
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export const useWeeklyLetter = create<WeeklyLetterStore>((set, get) => ({
  ...DEFAULT_STATE,

  loadLetter: async (id?: string) => {
    const current = get().letter;
    if (current && (id === undefined || id === 'latest' || current.id === id)) {
      return;
    }
    set({ isLoading: true, error: null, isOffline: false });
    try {
      const token = await getAuthToken();
      let fetched: WeeklyLetter | null = null;

      if (id && id !== 'latest') {
        fetched = await fetchLetterById(id, token);
      } else {
        fetched = await fetchLatestLetter(token);
      }

      if (fetched) {
        cachedLetter = fetched;
        set({
          letter: fetched,
          optedOut: Boolean(fetched.metadata?.optedOut),
          isLoading: false,
          isOffline: false,
          error: null,
        });
      } else {
        set({
          letter: null,
          isLoading: false,
          isOffline: false,
          error: null,
        });
      }
    } catch (err: unknown) {
      // If network fails, use cached letter if available and mark offline
      if (cachedLetter) {
        set({
          letter: cachedLetter,
          isOffline: true,
          isLoading: false,
          error: null,
        });
      } else {
        const msg = err instanceof Error ? err.message : 'Could not load letter';
        set({
          letter: null,
          isLoading: false,
          isOffline: true,
          error: msg,
        });
      }
    }
  },

  toggleOptOut: async (optOut: boolean) => {
    const prevOpted = get().optedOut;
    set({ optedOut: optOut });

    try {
      const token = await getAuthToken();
      const success = await updateLetterOptOut(optOut, token);
      if (!success) {
        // Rollback
        set({ optedOut: prevOpted });
        return false;
      }
      return true;
    } catch {
      set({ optedOut: prevOpted });
      return false;
    }
  },

  setLetter: (letter: WeeklyLetter | null) => {
    if (letter) {
      cachedLetter = letter;
    }
    set({
      letter,
      optedOut: Boolean(letter?.metadata?.optedOut),
      isLoading: false,
      error: null,
    });
  },

  resetStore: () => {
    set({ ...DEFAULT_STATE });
  },
}));
