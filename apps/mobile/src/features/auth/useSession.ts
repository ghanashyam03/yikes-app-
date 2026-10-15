export interface UserProfile {
  id: string;
  displayName?: string | null;
  locale?: string;
  themePref?: string;
  adultConfirmedAt?: string | null;
}

export interface SessionUser {
  id: string;
  email?: string;
}

export interface SessionState {
  isGuest: boolean;
  session: { user: SessionUser } | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

/**
 * Auth session stub for navigation routing.
 * In guest state without a completed onboarding profile, `profile` is null.
 * When no profile exists, root redirects to `(onboarding)/intro`.
 */
export function useSession(): SessionState {
  return {
    isGuest: true,
    session: null,
    profile: null,
    isLoading: false
  };
}
