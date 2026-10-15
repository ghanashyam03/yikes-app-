import { secureStorageAdapter } from './supabaseClient';

export interface GuestSession {
  deviceId: string;
  createdAt: number;
  expiresAt: number;
}

export const GUEST_STORAGE_KEY = 'yikes_guest_session';
export const GUEST_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type GuestMergerFn = (userId: string) => Promise<void>;

const guestMergers = new Set<GuestMergerFn>();

/**
 * Register a callback to merge guest data into the authenticated account.
 * T-11 Playbook, T-12 chats, etc. register their merge hooks here.
 * Returns an unregister function.
 */
export function registerGuestMerger(fn: GuestMergerFn): () => void {
  guestMergers.add(fn);
  return () => {
    guestMergers.delete(fn);
  };
}

/**
 * Executes all registered guest mergers in order, then clears the local guest session.
 */
export async function executeGuestMergers(userId: string): Promise<void> {
  for (const merger of Array.from(guestMergers)) {
    try {
      await merger(userId);
    } catch {
      // Intentionally do not log error details that might contain user data
      if (process.env.NODE_ENV !== 'test') {
        // Redacted failure notification
      }
    }
  }
  await clearGuestSession();
}

/**
 * Generates an anonymous device ID without external dependencies.
 */
export function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-4${s4().substring(1)}-${s4()}-${s4()}${s4()}${s4()}`;
}

export async function getGuestSession(): Promise<GuestSession | null> {
  try {
    const raw = await secureStorageAdapter.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as GuestSession;
    if (!session || typeof session.createdAt !== 'number') return null;
    return session;
  } catch {
    return null;
  }
}

export async function createGuestSession(): Promise<GuestSession> {
  const now = Date.now();
  const session: GuestSession = {
    deviceId: generateDeviceId(),
    createdAt: now,
    expiresAt: now + GUEST_LIFETIME_MS
  };
  await secureStorageAdapter.setItem(GUEST_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function isGuestExpired(session: GuestSession | null, now = Date.now()): boolean {
  if (!session) return true;
  return now >= session.expiresAt;
}

export async function clearGuestSession(): Promise<void> {
  await secureStorageAdapter.removeItem(GUEST_STORAGE_KEY);
}

/**
 * For test resets only.
 */
export function clearRegisteredMergers(): void {
  guestMergers.clear();
}
