import { supabase } from './supabaseClient';
import { clearGuestSession } from './guestStorage';

export const MIN_ADULT_AGE = 18;

export interface AgeValidationResult {
  isAdult: boolean;
  age: number;
}

/**
 * Pure age calculation.
 * Returns whether user is 18 or older based on birth year.
 */
export function validateAge(
  birthYear: number,
  referenceYear = new Date().getFullYear()
): AgeValidationResult {
  const age = referenceYear - birthYear;
  return {
    isAdult: age >= MIN_ADULT_AGE,
    age
  };
}

/**
 * Rejection workflow for under-18 users.
 * STRICT PRIVACY REQUIREMENT:
 * 1. Zero data stored (no birth date, no birth year, no rejection flag in DB or storage).
 * 2. Purges any active Supabase session.
 * 3. Clears any guest session or cached identifiers.
 */
export async function handleUnder18Rejection(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Continue local cleanup even if network request fails
  }
  await clearGuestSession();
}

/**
 * Confirms adult status for users >= 18.
 * Writes `adult_confirmed_at: timestamp` to the user's profiles row.
 * STRICT PRIVACY REQUIREMENT:
 * NO birth year or birth date is EVER stored.
 */
export async function confirmAdultStatus(userId: string): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({ adult_confirmed_at: timestamp })
    .eq('user_id', userId);

  return !error;
}
