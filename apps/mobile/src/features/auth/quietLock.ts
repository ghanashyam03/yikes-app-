import { AppState, type AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorageAdapter } from './supabaseClient';
import { authCopy } from '../../copy/auth';

export const QUIET_LOCK_STORAGE_KEY = 'yikes_quiet_lock_enabled';

type LockChangeListener = (isLocked: boolean) => void;

let isLockedInternal = false;
let quietLockEnabledInternal = false;
let appStateSubscriptionInitialized = false;
let previousAppState: AppStateStatus = 'active';

const lockListeners = new Set<LockChangeListener>();

function notifyListeners(): void {
  for (const listener of Array.from(lockListeners)) {
    listener(isLockedInternal);
  }
}

export function subscribeQuietLock(listener: LockChangeListener): () => void {
  lockListeners.add(listener);
  listener(isLockedInternal);
  return () => {
    lockListeners.delete(listener);
  };
}

export function isQuietLocked(): boolean {
  return isLockedInternal;
}

export function setQuietLocked(locked: boolean): void {
  isLockedInternal = locked;
  notifyListeners();
}

export async function isQuietLockEnabled(): Promise<boolean> {
  try {
    const val = await secureStorageAdapter.getItem(QUIET_LOCK_STORAGE_KEY);
    quietLockEnabledInternal = val === 'true';
    return quietLockEnabledInternal;
  } catch {
    return false;
  }
}

export async function setQuietLockEnabled(enabled: boolean): Promise<void> {
  quietLockEnabledInternal = enabled;
  await secureStorageAdapter.setItem(QUIET_LOCK_STORAGE_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    setQuietLocked(false);
  }
}

/**
 * Invokes Face ID / Biometrics via expo-local-authentication.
 */
export async function authenticateBiometrics(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: authCopy.quietLock.promptReason,
      fallbackLabel: 'Use Device Passcode'
    });

    if (result.success) {
      setQuietLocked(false);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Handler for app state transitions.
 * Exposed for unit testing as well as runtime listener.
 */
export async function handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
  if (
    (previousAppState === 'background' || previousAppState === 'inactive') &&
    nextAppState === 'active'
  ) {
    const enabled = await isQuietLockEnabled();
    if (enabled) {
      setQuietLocked(true);
    }
  }
  previousAppState = nextAppState;
}

/**
 * Initializes AppState listening for foreground lock trigger.
 */
export function initQuietLockListener(): () => void {
  if (appStateSubscriptionInitialized) {
    return () => {};
  }
  appStateSubscriptionInitialized = true;
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => {
    subscription.remove();
    appStateSubscriptionInitialized = false;
  };
}

/** For test resets */
export function resetQuietLockState(): void {
  isLockedInternal = false;
  quietLockEnabledInternal = false;
  previousAppState = 'active';
  lockListeners.clear();
}
