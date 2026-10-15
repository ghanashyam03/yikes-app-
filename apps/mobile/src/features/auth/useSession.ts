import { create } from 'zustand';
import { supabase, secureStorageAdapter } from './supabaseClient';
import {
  getGuestSession,
  createGuestSession,
  isGuestExpired as checkGuestExpired,
  clearGuestSession,
  executeGuestMergers
} from './guestStorage';
import { requestOtp, verifyOtp } from './otpManager';
import { confirmAdultStatus } from './ageGate';
import {
  isQuietLockEnabled as checkQuietLockEnabled,
  setQuietLockEnabled as setQuietLockEnabledStorage,
  authenticateBiometrics,
  subscribeQuietLock,
  setQuietLocked,
  initQuietLockListener
} from './quietLock';
import { authCopy } from '../../copy/auth';

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string | null;
  locale?: string | null;
  themePref?: string | null;
  adultConfirmedAt?: string | null;
}

export interface SessionUser {
  id: string;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface SessionData {
  user: SessionUser;
  accessToken?: string | undefined;
}

export interface SessionState {
  isGuest: boolean;
  isGuestExpired: boolean;
  isLocked: boolean;
  isLoading: boolean;
  session: SessionData | null;
  profile: UserProfile | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string | undefined }>;
  signInWithPhone: (phone: string) => Promise<{ ok: boolean; error?: string | undefined }>;
  verifyCode: (
    target: string,
    token: string,
    type: 'email' | 'phone'
  ) => Promise<{ ok: boolean; error?: string | undefined }>;
  signInWithIdToken: (params: {
    provider: 'google' | 'apple';
    idToken: string;
    nonce?: string | undefined;
  }) => Promise<{ ok: boolean; error?: string | undefined }>;
  signOut: (scope?: 'local' | 'global') => Promise<void>;
  confirmAdult: () => Promise<boolean>;
  setGuestMode: (active: boolean) => Promise<void>;
  unlockQuietLock: () => Promise<boolean>;
  setQuietLockEnabled: (enabled: boolean) => Promise<void>;
}

import React from 'react';

function isInsideReactComponent(): boolean {
  try {
    const internals = (React as unknown as {
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: {
        ReactCurrentDispatcher?: {
          current?: {
            useSyncExternalStore?: { name?: string };
          } | null;
        };
      };
    }).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    const currentDispatcher = internals?.ReactCurrentDispatcher?.current;
    if (!currentDispatcher) return false;
    return currentDispatcher.useSyncExternalStore?.name !== 'throwInvalidHookError';
  } catch {
    return false;
  }
}

let authSubscriptionInitialized = false;

export const useSessionStore = create<SessionState>((set, get) => ({
  isGuest: true,
  isGuestExpired: false,
  isLocked: false,
  isLoading: false,
  session: null,
  profile: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      initQuietLockListener();
      subscribeQuietLock((isLocked) => {
        set({ isLocked });
      });

      // Check existing Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      if (currentSession?.user) {
        const user = currentSession.user;
        const sessionPayload: SessionData = {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone
          },
          accessToken: currentSession.access_token
        };

        // Fetch user profile from DB
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('user_id, display_name, locale, theme_pref, adult_confirmed_at')
          .eq('user_id', user.id)
          .maybeSingle();

        const profile: UserProfile = profileRow
          ? {
              id: profileRow.user_id,
              userId: profileRow.user_id,
              displayName: profileRow.display_name,
              locale: profileRow.locale,
              themePref: profileRow.theme_pref,
              adultConfirmedAt: profileRow.adult_confirmed_at
            }
          : {
              id: user.id,
              userId: user.id,
              displayName: null,
              locale: null,
              themePref: null,
              adultConfirmedAt: null
            };

        set({
          isGuest: false,
          isGuestExpired: false,
          session: sessionPayload,
          profile,
          isLoading: false
        });
      } else {
        // Evaluate guest mode
        let guestSession = await getGuestSession();
        if (!guestSession) {
          guestSession = await createGuestSession();
        }
        const expired = checkGuestExpired(guestSession);

        set({
          isGuest: true,
          isGuestExpired: expired,
          session: null,
          profile: null,
          isLoading: false
        });
      }

      // Check quiet lock configuration
      const quietLockOn = await checkQuietLockEnabled();
      if (quietLockOn) {
        setQuietLocked(true);
      }

      // Listen to Supabase Auth State changes once
      if (!authSubscriptionInitialized) {
        authSubscriptionInitialized = true;
        supabase.auth.onAuthStateChange(async (event, nextSession) => {
          if (event === 'SIGNED_IN' && nextSession?.user) {
            const user = nextSession.user;
            await executeGuestMergers(user.id);

            const { data: profileRow } = await supabase
              .from('profiles')
              .select('user_id, display_name, locale, theme_pref, adult_confirmed_at')
              .eq('user_id', user.id)
              .maybeSingle();

            const profile: UserProfile = profileRow
              ? {
                  id: profileRow.user_id,
                  userId: profileRow.user_id,
                  displayName: profileRow.display_name,
                  locale: profileRow.locale,
                  themePref: profileRow.theme_pref,
                  adultConfirmedAt: profileRow.adult_confirmed_at
                }
              : {
                  id: user.id,
                  userId: user.id,
                  displayName: null,
                  locale: null,
                  themePref: null,
                  adultConfirmedAt: null
                };

            set({
              isGuest: false,
              isGuestExpired: false,
              session: {
                user: {
                  id: user.id,
                  email: user.email,
                  phone: user.phone
                },
                accessToken: nextSession.access_token
              },
              profile
            });
          } else if (event === 'SIGNED_OUT') {
            await clearGuestSession();
            await secureStorageAdapter.removeItem('supabase.auth.token');
            set({
              isGuest: true,
              isGuestExpired: false,
              session: null,
              profile: null,
              isLocked: false
            });
          }
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email: string) => {
    return await requestOtp(email, 'email');
  },

  signInWithPhone: async (phone: string) => {
    return await requestOtp(phone, 'phone');
  },

  verifyCode: async (target: string, token: string, type: 'email' | 'phone') => {
    set({ isLoading: true });
    const result = await verifyOtp(target, token, type);
    if (!result.ok) {
      set({ isLoading: false });
      return { ok: false, error: result.error };
    }

    const { data } = await supabase.auth.getSession();
    const activeSession = data?.session;
    if (activeSession?.user) {
      const user = activeSession.user;
      await executeGuestMergers(user.id);

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('user_id, display_name, locale, theme_pref, adult_confirmed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      const profile: UserProfile = profileRow
        ? {
            id: profileRow.user_id,
            userId: profileRow.user_id,
            displayName: profileRow.display_name,
            locale: profileRow.locale,
            themePref: profileRow.theme_pref,
            adultConfirmedAt: profileRow.adult_confirmed_at
          }
        : {
            id: user.id,
            userId: user.id,
            displayName: null,
            locale: null,
            themePref: null,
            adultConfirmedAt: null
          };

      set({
        isGuest: false,
        session: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone
          },
          accessToken: activeSession.access_token
        },
        profile,
        isLoading: false
      });
      return { ok: true };
    }

    set({ isLoading: false });
    return { ok: true };
  },

  signInWithIdToken: async ({ provider, idToken, nonce }) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithIdToken(
        nonce !== undefined
          ? { provider, token: idToken, nonce }
          : { provider, token: idToken }
      );

      if (error || !data.session) {
        set({ isLoading: false });
        return { ok: false, error: error?.message || authCopy.errors.generic };
      }

      const user = data.session.user;
      await executeGuestMergers(user.id);

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('user_id, display_name, locale, theme_pref, adult_confirmed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      const profile: UserProfile = profileRow
        ? {
            id: profileRow.user_id,
            userId: profileRow.user_id,
            displayName: profileRow.display_name,
            locale: profileRow.locale,
            themePref: profileRow.theme_pref,
            adultConfirmedAt: profileRow.adult_confirmed_at
          }
        : {
            id: user.id,
            userId: user.id,
            displayName: null,
            locale: null,
            themePref: null,
            adultConfirmedAt: null
          };

      set({
        isGuest: false,
        session: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone
          },
          accessToken: data.session.access_token
        },
        profile,
        isLoading: false
      });
      return { ok: true };
    } catch {
      set({ isLoading: false });
      return { ok: false, error: authCopy.errors.generic };
    }
  },

  signOut: async (scope: 'local' | 'global' = 'local') => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut({ scope });
    } catch {
      // Continue cleanup
    }
    await clearGuestSession();
    await secureStorageAdapter.removeItem('supabase.auth.token');
    setQuietLocked(false);
    set({
      isGuest: true,
      isGuestExpired: false,
      session: null,
      profile: null,
      isLocked: false,
      isLoading: false
    });
  },

  confirmAdult: async () => {
    const current = get();
    const userId = current.session?.user?.id;
    if (!userId) return false;

    const ok = await confirmAdultStatus(userId);
    if (ok) {
      const now = new Date().toISOString();
      set((prev) => ({
        profile: prev.profile ? { ...prev.profile, adultConfirmedAt: now } : null
      }));
      return true;
    }
    return false;
  },

  setGuestMode: async (active: boolean) => {
    if (active) {
      let guest = await getGuestSession();
      if (!guest) {
        guest = await createGuestSession();
      }
      set({
        isGuest: true,
        isGuestExpired: checkGuestExpired(guest),
        session: null,
        profile: null
      });
    } else {
      set({ isGuest: false });
    }
  },

  unlockQuietLock: async () => {
    const success = await authenticateBiometrics();
    if (success) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  setQuietLockEnabled: async (enabled: boolean) => {
    await setQuietLockEnabledStorage(enabled);
  }
}));

export function useSession(): SessionState;
export function useSession<T>(selector: (state: SessionState) => T): T;
export function useSession<T = SessionState>(
  selector?: (state: SessionState) => T
): T {
  if (isInsideReactComponent()) {
    // Inside a React component render, use the reactive Zustand hook
    return useSessionStore(selector ?? ((s) => s as unknown as T));
  }
  // Outside React component (e.g. standard tests / pure functions), read current snapshot
  const state = useSessionStore.getState();
  return selector ? selector(state) : (state as unknown as T);
}
