# T-06 Report

## Summary (3 sentences)
Implemented the complete authentication lifecycle, guest session management with 7-day expiration, and biometric Quiet Lock for the mobile application. Delivered full passwordless OTP flows with a 5-try 15-minute lockout state machine, privacy-first birth-year age verification with zero data storage for under-18 users, and granular consent management. All 5 contract acceptance checks pass with comprehensive unit, screen, and integration test coverage across light and dark modes.

## What I built (one line per file)
- `apps/mobile/package.json`: Pinned `@supabase/supabase-js: "2.117.3"` matching the gateway service.
- `supabase/config.toml`: Configured 10-minute OTP expiration, brute-force rate limits, and external auth providers.
- `apps/mobile/src/copy/auth.ts`: Centralized compassionate user-facing strings for auth, OTP, consents, age verification, Quiet Lock, devices, and errors (using Honey, never red).
- `apps/mobile/src/features/auth/supabaseClient.ts`: Supabase client with SecureStore native adapter, web local-storage fallback, and quiet token refresh.
- `apps/mobile/src/features/auth/guestStorage.ts`: Anonymous 7-day expiring guest session management, device ID generation, and pluggable `registerGuestMerger(fn)` for T-11.
- `apps/mobile/src/features/auth/otpManager.ts`: 6-digit OTP request/verify handlers, 5-try lockout with 15-minute cooldown, and countdown timer logic.
- `apps/mobile/src/features/auth/ageGate.ts`: Pure age validation logic, zero-storage under-18 rejection, and adult confirmation writing only `adult_confirmed_at`.
- `apps/mobile/src/features/auth/consentManager.ts`: 4 consent kinds manager (`required`, `analytics`, `improve_ai`, `marketing`) with persistence to the Supabase `consents` table.
- `apps/mobile/src/features/auth/quietLock.ts`: AppState background/foreground listener invoking `expo-local-authentication` for Face ID / biometric lock.
- `apps/mobile/src/features/auth/devices.ts`: Session inspection and global sign-out (`supabase.auth.signOut({ scope: 'global' })`).
- `apps/mobile/src/features/auth/useSession.ts`: Reactive Zustand auth store managing user, profile, guest mode, biometric Quiet Lock, and OTP lifecycle.
- `apps/mobile/app/(auth)/welcome.tsx`: Welcome screen (A2) featuring story cards, page dots, Start quiz trigger, and returning sign-in navigation.
- `apps/mobile/app/(auth)/sign-in.tsx`: Save your Playbook / Sign-in screen (A9, A16) with Apple, Google, Email, Phone, Passkey preview, and 7-day guest continuation.
- `apps/mobile/app/(auth)/code.tsx`: 6-box auto-advancing code entry (A10, A11) with resend countdown, mismatch shake animation, and lockout timer.
- `apps/mobile/app/(auth)/consent.tsx`: 4 glass cards (A12) with accessible toggles, Learn More sheets, and consent persistence.
- `apps/mobile/app/(auth)/age.tsx`: Birth-year picker screen (A13) with gentle rejection modal for under-18 and adult confirmation.
- `apps/mobile/src/features/auth/__tests__/otpManager.test.ts`: Unit tests for lockout timing, attempt decrements, 15-minute cooldown, and reset.
- `apps/mobile/src/features/auth/__tests__/ageGate.test.ts`: Privacy tests verifying under-18 zero-storage guarantee and adult confirmation timestamp only.
- `apps/mobile/src/features/auth/__tests__/guestStorage.test.ts`: Tests for 7-day expiration arithmetic and guest merger registration order.
- `apps/mobile/src/features/auth/__tests__/consents.test.ts`: Tests for default consent values and Supabase persistence with `required: true` enforcement.
- `apps/mobile/src/features/auth/__tests__/quietLock.test.ts`: Tests for biometric challenge triggers on app resume from background.
- `apps/mobile/src/features/auth/__tests__/screens.test.tsx`: Rendering and accessibility tests for all auth route screens.
- `apps/mobile/src/features/auth/__tests__/acceptance.test.ts`: End-to-end verification of contract acceptance checks 1 through 5.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| :--- | :--- | :--- | :--- |
| (1) Unit tests: lockout timing, age gate stores nothing, guest merge ordering | `pnpm --filter mobile test src/features/auth/__tests__/` | PASS (33/33 tests) | `docs/tasks/T-06/evidence/01-unit-tests.txt` |
| (2) Local email OTP login works against Supabase auth mock / client | `pnpm --filter mobile test src/features/auth/__tests__/acceptance.test.ts` | PASS | `docs/tasks/T-06/evidence/02-auth-acceptance-tests.txt` |
| (3) After login the user can read only their own profiles row | `pnpm --filter mobile test src/features/auth/__tests__/acceptance.test.ts` | PASS | `docs/tasks/T-06/evidence/02-auth-acceptance-tests.txt` |
| (4) Sign out clears secure storage | `pnpm --filter mobile test src/features/auth/__tests__/acceptance.test.ts` | PASS | `docs/tasks/T-06/evidence/02-auth-acceptance-tests.txt` |
| (5) No token or code appears in logs | `pnpm --filter mobile test src/features/auth/__tests__/acceptance.test.ts` | PASS | `docs/tasks/T-06/evidence/02-auth-acceptance-tests.txt` |
| (6) pnpm check is green across all workspaces | `pnpm check` | PASS (0 errors across 6 workspaces) | `docs/tasks/T-06/evidence/04-pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- **Guest mode (7-day local expiration, merged on sign-up via registerGuestMerger)**: DONE — `guestStorage.ts:13-75`, `useSession.ts:135-155`.
- **Continue with Apple and Google via signInWithIdToken**: DONE — `useSession.ts:310-366`, `sign-in.tsx:22-30`.
- **Email one-time code (6 digits, 10-minute expiry) with signInWithOtp & verifyOtp**: DONE — `otpManager.ts:80-184`, `supabase/config.toml:22-26`.
- **Phone code via Supabase phone provider**: DONE — `otpManager.ts:80-184`, `supabase/config.toml:28-31` (noted UNVERIFIED without live carrier gateway credentials).
- **Passkey offer with feature flag & UNVERIFIED notation**: DONE — `sign-in.tsx:41-44`, `auth.ts:24`.
- **Birth-year wheel where under 18 shows kind message, signs out and stores nothing**: DONE — `ageGate.ts:17-48`, `age.tsx:28-68`.
- **Consent cards writing consents**: DONE — `consentManager.ts:20-80`, `consent.tsx:32-137`.
- **Secure session storage with expo-secure-store and silent refresh**: DONE — `supabaseClient.ts:7-75`, `useSession.ts:80-140`.
- **Six-box code entry with autofill, resend countdown, wrong-code shake, 5-try lockout for 15 minutes**: DONE — `code.tsx:45-215`, `otpManager.ts:7-70`.
- **Devices list and Sign out everywhere**: DONE — `devices.ts:16-52`, `useSession.ts:368-386`.
- **Quiet Lock using expo-local-authentication on app foreground**: DONE — `quietLock.ts:25-95`, `useSession.ts:400-415`.
- **Delete-account entry that calls T-07 endpoint (disabled with note)**: DONE — `auth.ts:114-117`.

## Dependencies added (name, version, reason, licence)
- `@supabase/supabase-js`, `2.117.3`, pinned Supabase client library for authentication and DB operations, MIT.

## Outside-scope edits (file, reason, size of change)
- `apps/mobile/src/navigation/__tests__/routes.test.tsx`: Updated sample route stub test to use `SessionIdea` instead of `AuthWelcome`, because `AuthWelcome` is now implemented as a full screen and is no longer a route stub (4 lines changed).

## UNVERIFIED items (anything you could not prove, and the fallback you built)
- **SMS provider for India phone codes**: UNVERIFIED in local development without live carrier SMS gateway credentials. Built robust fallback through email OTP and local mock OTP handlers.
- **Passkey native hardware integration**: UNVERIFIED without an installed native Passkey library (like react-native-passkey). Provided a stub preview modal with fallback to Google/Apple IdToken OAuth and email OTP.
- **Account deletion**: UNVERIFIED until T-07 endpoint is deployed. Button is marked with informational note.

## Known limitations and follow-ups (each with a task id)
- **T-11**: Will hook up the quiz completion flow to `registerGuestMerger()` so guest Playbook answers are automatically merged when the user creates an account.
- **T-07**: Will implement the `POST /v1/privacy/delete-account` endpoint to enable the delete-account action.

## Fix rounds (left empty by the Builder; filled by the Fixer)
