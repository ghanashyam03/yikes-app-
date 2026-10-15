import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryFallback = new Map<string, string>();

interface GlobalStorage {
  localStorage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
}

function getWebStorage(): GlobalStorage['localStorage'] | null {
  const g = globalThis as unknown as GlobalStorage;
  if (typeof g !== 'undefined' && g.localStorage) {
    return g.localStorage;
  }
  return null;
}

export const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (memoryFallback.has(key)) {
        return memoryFallback.get(key) ?? null;
      }
      if (Platform.OS === 'web') {
        const storage = getWebStorage();
        if (storage) {
          return storage.getItem(key);
        }
        return null;
      }
      const val = await SecureStore.getItemAsync(key);
      if (val !== null && val !== undefined) {
        memoryFallback.set(key, val);
        return val;
      }
      return null;
    } catch {
      return memoryFallback.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryFallback.set(key, value);
    try {
      if (Platform.OS === 'web') {
        const storage = getWebStorage();
        if (storage) {
          storage.setItem(key, value);
        }
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {
      // Memory fallback handles retrieval
    }
  },
  removeItem: async (key: string): Promise<void> => {
    memoryFallback.delete(key);
    try {
      if (Platform.OS === 'web') {
        const storage = getWebStorage();
        if (storage) {
          storage.removeItem(key);
        }
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // Memory fallback handles removal
    }
  },
  /** For testing/purging: clears in-memory fallback state */
  clearMemory: (): void => {
    memoryFallback.clear();
  }
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_anon_key_for_client';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: process.env.NODE_ENV !== 'test',
    persistSession: true,
    detectSessionInUrl: false
  }
});
