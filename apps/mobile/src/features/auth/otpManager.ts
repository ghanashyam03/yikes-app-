import { supabase } from './supabaseClient';
import { authCopy } from '../../copy/auth';

export const MAX_OTP_TRIES = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
export const RESEND_COOLDOWN_SECONDS = 30;

interface AttemptState {
  failedAttempts: number;
  lockoutUntil: number | null;
}

const attemptsMap = new Map<string, AttemptState>();

function getIdentifierKey(target: string): string {
  return target.trim().toLowerCase();
}

export function getRemainingTries(target: string): number {
  const key = getIdentifierKey(target);
  const state = attemptsMap.get(key);
  if (!state) return MAX_OTP_TRIES;
  return Math.max(0, MAX_OTP_TRIES - state.failedAttempts);
}

export function isLockedOut(target: string, now = Date.now()): boolean {
  const key = getIdentifierKey(target);
  const state = attemptsMap.get(key);
  if (!state || !state.lockoutUntil) return false;
  if (now >= state.lockoutUntil) {
    // Cooldown expired: reset
    attemptsMap.delete(key);
    return false;
  }
  return true;
}

export function getLockoutRemainingTime(
  target: string,
  now = Date.now()
): { minutes: number; seconds: number; totalSeconds: number } {
  const key = getIdentifierKey(target);
  const state = attemptsMap.get(key);
  if (!state || !state.lockoutUntil || now >= state.lockoutUntil) {
    return { minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  const diffMs = state.lockoutUntil - now;
  const totalSeconds = Math.ceil(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds, totalSeconds };
}

export function recordFailedAttempt(
  target: string,
  now = Date.now()
): { triesLeft: number; isLocked: boolean; lockoutUntil: number | null } {
  const key = getIdentifierKey(target);
  const current = attemptsMap.get(key) ?? { failedAttempts: 0, lockoutUntil: null };
  const failedAttempts = current.failedAttempts + 1;
  let lockoutUntil: number | null = null;

  if (failedAttempts >= MAX_OTP_TRIES) {
    lockoutUntil = now + LOCKOUT_DURATION_MS;
  }

  attemptsMap.set(key, { failedAttempts, lockoutUntil });
  return {
    triesLeft: Math.max(0, MAX_OTP_TRIES - failedAttempts),
    isLocked: lockoutUntil !== null,
    lockoutUntil
  };
}

export function resetAttempts(target: string): void {
  const key = getIdentifierKey(target);
  attemptsMap.delete(key);
}

export function clearAllAttempts(): void {
  attemptsMap.clear();
}

/**
 * Request a 6-digit OTP to be sent via email or phone.
 * Never logs the target or credentials.
 */
export async function requestOtp(
  target: string,
  type: 'email' | 'phone'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const trimmed = target.trim();
    if (!trimmed) {
      return { ok: false, error: type === 'email' ? authCopy.errors.invalidEmail : authCopy.errors.invalidPhone };
    }

    if (type === 'email') {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true
        }
      });
      if (error) {
        return { ok: false, error: error.message || authCopy.errors.generic };
      }
      return { ok: true };
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        phone: trimmed,
        options: {
          shouldCreateUser: true
        }
      });
      if (error) {
        return { ok: false, error: error.message || authCopy.errors.generic };
      }
      return { ok: true };
    }
  } catch {
    return { ok: false, error: authCopy.errors.generic };
  }
}

/**
 * Verify a 6-digit OTP code against Supabase auth.
 * Enforces client-side 5-try lockout with 15-minute cooldown.
 * Never logs the token.
 */
export async function verifyOtp(
  target: string,
  token: string,
  type: 'email' | 'phone'
): Promise<{ ok: boolean; error?: string; session?: unknown }> {
  if (isLockedOut(target)) {
    const { minutes, seconds } = getLockoutRemainingTime(target);
    return {
      ok: false,
      error: authCopy.code.lockedOut(minutes, seconds)
    };
  }

  try {
    const trimmedTarget = target.trim();
    const trimmedToken = token.trim();

    if (type === 'email') {
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedTarget,
        token: trimmedToken,
        type: 'email'
      });

      if (error || !data.session) {
        const { triesLeft, isLocked, lockoutUntil } = recordFailedAttempt(trimmedTarget);
        if (isLocked && lockoutUntil) {
          const { minutes, seconds } = getLockoutRemainingTime(trimmedTarget);
          return {
            ok: false,
            error: authCopy.code.lockedOut(minutes, seconds)
          };
        }
        return {
          ok: false,
          error: authCopy.code.wrongCode(triesLeft)
        };
      }

      resetAttempts(trimmedTarget);
      return { ok: true, session: data.session };
    } else {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: trimmedTarget,
        token: trimmedToken,
        type: 'sms'
      });

      if (error || !data.session) {
        const { triesLeft, isLocked, lockoutUntil } = recordFailedAttempt(trimmedTarget);
        if (isLocked && lockoutUntil) {
          const { minutes, seconds } = getLockoutRemainingTime(trimmedTarget);
          return {
            ok: false,
            error: authCopy.code.lockedOut(minutes, seconds)
          };
        }
        return {
          ok: false,
          error: authCopy.code.wrongCode(triesLeft)
        };
      }

      resetAttempts(trimmedTarget);
      return { ok: true, session: data.session };
    }
  } catch {
    return { ok: false, error: authCopy.errors.generic };
  }
}
