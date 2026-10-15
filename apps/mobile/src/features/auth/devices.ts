import { Platform } from 'react-native';
import { supabase, secureStorageAdapter } from './supabaseClient';
import { clearGuestSession } from './guestStorage';
import { setQuietLocked } from './quietLock';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  isCurrent: boolean;
  lastActive: string;
}

/**
 * Get device sessions.
 * Returns the current device info plus mock/active sessions.
 */
export async function getDeviceSessions(): Promise<DeviceInfo[]> {
  const osName = Platform.OS === 'ios' ? 'Apple iPhone' : Platform.OS === 'android' ? 'Android Device' : 'Web Browser';
  const currentDevice: DeviceInfo = {
    id: 'current-device',
    name: osName,
    platform: Platform.OS,
    isCurrent: true,
    lastActive: 'Now'
  };
  return [currentDevice];
}

/**
 * Sign out of this device locally.
 * Clears local tokens, storage, and guest data.
 */
export async function signOutLocal(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Continue cleanup even if server is offline
  }
  await clearGuestSession();
  await secureStorageAdapter.removeItem('supabase.auth.token');
  setQuietLocked(false);
}

/**
 * Sign out everywhere: revokes all refresh tokens globally across all devices.
 */
export async function signOutEverywhere(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch {
    // Continue local cleanup
  }
  await clearGuestSession();
  await secureStorageAdapter.removeItem('supabase.auth.token');
  setQuietLocked(false);
}
