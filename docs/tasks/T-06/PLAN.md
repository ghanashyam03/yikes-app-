# Implementation Plan: T-06 — Authentication and Account Lifecycle

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-06)
- **Specs**: `docs/spec/02-auth-onboarding.md` (Section 3), `docs/spec/05-screens-launch-quiz.md` (Screens A9 to A16), `docs/spec/06-data-safety.md`
- **Risk Level**: **RISKY (Security & Privacy)**

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `apps/mobile/package.json`: Add pinned `@supabase/supabase-js: "2.117.3"` (matches gateway).
2. `supabase/config.toml`: Auth configuration (OTP 10-minute expiry, rate limits, email/SMS provider settings).
3. `apps/mobile/src/copy/auth.ts`: All user-facing strings for auth, OTP, consents, age verification, Quiet Lock, error states, and device control.
4. `apps/mobile/src/features/auth/`:
   - `supabaseClient.ts`: Supabase client with secure storage adapter (`expo-secure-store` on native, local storage on web) and automatic token refresh.
   - `useSession.ts`: Full reactive authentication and profile state management with Zustand.
   - `guestStorage.ts`: 7-day local guest progress management, timestamping, expiration checks, and `registerGuestMerger(fn)` integration for T-11.
   - `otpManager.ts`: 6-digit OTP request/verify handlers, 5-try client lockout state machine (15-minute cooldown), resend countdown timer.
   - `ageGate.ts`: Pure age validation logic based on birth year (under-18 gate: stores zero data, executes sign-out, returns kind copy).
   - `consentManager.ts`: Consent state machine and writer to Supabase `consents` table (four kinds: `required`, `analytics`, `improve_ai`, `marketing`).
   - `quietLock.ts`: Background/foreground lifecycle listener using `expo-local-authentication` to require Face ID / biometric authentication on app resume when enabled.
   - `devices.ts`: Session inspection and "Sign out everywhere" (`supabase.auth.signOut({ scope: 'global' })`).
5. `apps/mobile/app/(auth)/`:
   - `welcome.tsx` (A2): Story cards, Start quiz button, "I already have an account" returning sign-in sheet trigger.
   - `sign-in.tsx` (A9, A16): "Save your Playbook" / Returning Sign-in with Apple, Google, Email, Phone, Passkey (unverified stub flag), and "Not now" (keeps 7-day guest).
   - `code.tsx` (A10, A11): Email/phone input, 6-box auto-advancing code entry, paste/autofill, shake on mismatch, 5-try lockout timer.
   - `consent.tsx` (A12): 4 glass cards with toggles (Required, Product analytics, Improve AI, Tips and updates) and Learn More sheets.
   - `age.tsx` (A13): Birth-year wheel; under-18 flow shows gentle rejection and cleans all state.
6. `apps/mobile/src/features/auth/__tests__/`:
   - `otpManager.test.ts`: 5-try lockout, 15-minute cooldown, timer decrement.
   - `ageGate.test.ts`: Under-18 rejection, zero writes, privacy verification.
   - `guestStorage.test.ts`: 7-day expiration, merge execution order.
   - `consents.test.ts`: Consent record creation and persistence.
   - `quietLock.test.ts`: Biometric challenge invocation on foreground transition.
   - `screens.test.tsx`: Screen rendering and accessibility assertions.

---

## 2. Architecture & Design Decisions

### A. Guest Mode & Guest Merger
- Guest sessions store an anonymous device ID and a timestamp in AsyncStorage/SecureStore.
- `isGuestExpired(timestamp)` returns true if > 7 days old.
- `registerGuestMerger(mergerFn)` provides a pluggable registry so subsequent tasks (T-11 for Playbook, T-12/T-15 for sessions) can register hooks that execute atomically when a guest signs up or logs in.

### B. Secure Token Storage & Web Compatibility
- Use `expo-secure-store` for native platforms (iOS/Android) with fallback to in-memory/localStorage on web.
- Tokens are never exposed in logs or Redux/Zustand devtools.

### C. Six-Box OTP & Lockout State Machine
- 6 individual TextInput boxes with ref auto-advancing and backspace retreat.
- On input error, triggers a Reanimated horizontal shake.
- Lockout tracker stores attempt counts and `lockedUntil` timestamp. After 5 failed attempts within a 15-minute window, inputs are disabled and a countdown is displayed.

### D. Age Gate (Zero Storage Under 18)
- A wheel/picker for birth year.
- If `currentYear - birthYear < 18`:
  - Show kind message: "yikes! is designed for adults 18 and older. Take care!"
  - Calls `clearAllLocalData()` and signs out.
  - No birth year, birth date, or flag is written to Supabase or local storage.
- If `>= 18`:
  - Writes `adult_confirmed_at = now()` to `profiles`. Note: strictly **no birth date or birth year** is saved to the database (enforcing T-05 and 06-data-safety.md rules).

### E. Passkey & Phone Providers
- In `auth.ts`, Passkey and Indian SMS OTP are noted as `UNVERIFIED` without live SMS carrier gateway credentials, with graceful fallback to standard email OTP and Google/Apple IdToken OAuth.

---

## 3. Step-by-Step Execution Plan

1. **Setup & Configuration**:
   - Update `apps/mobile/package.json` with pinned `@supabase/supabase-js: "2.117.3"`. Run `pnpm install --frozen-lockfile=false`.
   - Create `supabase/config.toml` with standard auth config.
2. **Copy Strings**:
   - Create `apps/mobile/src/copy/auth.ts` with all strings (no red color, compassionate copy).
3. **Core Auth Logic & Services**:
   - Implement `supabaseClient.ts`, `guestStorage.ts`, `ageGate.ts`, `otpManager.ts`, `consentManager.ts`, `quietLock.ts`, and `devices.ts`.
   - Update `useSession.ts` to connect to Supabase auth events, profile loading, and guest management.
4. **Auth UI Screens**:
   - Implement `(auth)/welcome.tsx`, `sign-in.tsx`, `code.tsx`, `consent.tsx`, and `age.tsx` with full design token integration, 48pt touch targets, and accessibility tags.
5. **Testing**:
   - Author Jest unit tests in `apps/mobile/src/features/auth/__tests__/`.
   - Verify `pnpm check` passes across the monorepo.
6. **Acceptance Verification**:
   - Execute all contract acceptance checks and record evidence in `docs/tasks/T-06/evidence/`.
   - Write `docs/tasks/T-06/REPORT.md`.

---

## 4. Risks & Mitigations
- **Risk**: Storing birth year violates privacy spec.
  - *Mitigation*: Strictly record only `adult_confirmed_at: timestamp` in `profiles`. Never write birth year or birth date anywhere.
- **Risk**: Security tokens leaked in logs.
  - *Mitigation*: Supabase client and auth handlers never log tokens, codes, or credentials.
- **Risk**: Biometrics failing or unavailable.
  - *Mitigation*: Check `hasHardwareAsync()` and `isEnrolledAsync()` before prompting Quiet Lock.
