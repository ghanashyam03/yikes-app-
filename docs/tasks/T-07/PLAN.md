# Implementation Plan: T-07 — Privacy Centre and Data Rights

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-07)
- **Specs**: `docs/spec/06-data-safety.md`, `docs/spec/05-screens-settings-system.md` (Screen D3), `docs/spec/08-acceptance.md`
- **Risk Level**: **RISKY (Deletes Data)**

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `supabase/migrations/20261016000008_privacy_helpers.sql`:
   - Adds any missing index or helper function for privacy operations.
   - Refines `purge_expired_text()` or grants permissions for service-role deletion tasks.
2. `services/gateway/src/routes/privacy/`:
   - `export.ts`: `POST /v1/privacy/export` assembling all user data across all tables into a JSON structure, recording in `exports`, returning a download URL valid for 24 hours.
   - `delete-text.ts`: `POST /v1/privacy/delete-text` deleting `turns` (message content) and transcripts in `debriefs`, while strictly preserving `skills_progress`, `sessions_log`, and attempts metadata.
   - `delete-account.ts`: `POST /v1/privacy/delete-account` requiring fresh OTP verification, inserting a `deletion_requests` record, and executing `auth.admin.deleteUser(userId)` which cascades across all foreign keys to remove all user rows.
   - `purge.ts`: Internal / admin endpoint or utility for `purge_expired_text()`.
   - `can-use.ts`: `canUseForImprovement(userId)` query function verifying if user has granted `improve_ai` consent.
   - `index.ts`: Route registration under `/v1/privacy`.
3. `apps/mobile/src/copy/privacy.ts`:
   - User-facing text for consent toggles, plain-language explanations, destructive action warnings, OTP confirmation modals, and export banners.
4. `apps/mobile/src/features/privacy/`:
   - `usePrivacy.ts`: Zustand/hook for managing consents, requesting data export, initiating text deletion, and account deletion with confirmation friction.
   - `privacyApi.ts`: HTTP client talking to the gateway privacy endpoints using JWT auth.
5. `apps/mobile/app/settings/privacy.tsx`:
   - Full implementation of Screen D3:
     - 4 consent toggles with plain-language explanations (Required, Analytics, Improve AI, Tips/Marketing).
     - "Download my data" section with 24h link generation.
     - "Delete my practice text" button with double confirmation modal (emphasizes: keeps progress, deletes turns & transcripts).
     - "Delete my account" button with OTP verification modal (emphasizes: removes everything, 30-day notice, cannot undo).
     - Disclaimer notice: "Already-trained models cannot be untrained."
6. `services/gateway/src/routes/privacy/__tests__/` & `apps/mobile/src/features/privacy/__tests__/`:
   - Integration & unit tests for export isolation, zero-row post-deletion audit across `information_schema.tables`, `delete-text` preserving `skills_progress`, rejection of foreign user IDs, and `canUseForImprovement` verification.

---

## 2. Architecture & Security Controls

### A. Authorisation & JWT Enforcement
- All gateway privacy endpoints extract `userId` strictly from verified Supabase JWT (`req.userId`), never from body or headers.
- Cross-user operations are impossible.

### B. Dynamic Schema Deletion Verification
- Test queries all user tables dynamically:
  - `profiles`, `consents`, `playbooks`, `skills_progress`, `sessions_log`, `attempts`, `turns`, `coach_feedback`, `ai_feedback`, `moments`, `energy_checkins`, `micro_reps`, `debriefs`, `ladder_rungs`, `journal_entries`, `weekly_letters`, `notification_prefs`, `entitlements`, `ai_usage_daily`, `deletion_requests`, `exports`.
- Verifies that after `delete-account`, `SELECT count(*) WHERE user_id = :userId` is strictly 0 across every single table.

### C. Selective Text Deletion (`delete-text`)
- Deletes rows in `turns` where attempt belongs to `userId`.
- Clears `transcript` jsonb in `debriefs` table for `userId` (sets to empty array `[]` or null).
- Clears `body` in `journal_entries` if text was stored.
- Explicitly leaves `skills_progress`, `sessions_log`, and attempts metadata intact so user keeps their skill stages and count.

### D. Confirmation Friction on Destructive Actions
- `delete-text` requires explicit confirmation with summary of what is kept and what is removed.
- `delete-account` requires re-authenticating with fresh 6-digit OTP to prevent accidental or malicious deletion.

---

## 3. Acceptance Verification Plan
1. **Acceptance Check 1**: Export contains only that user's rows and zero records belonging to another user.
2. **Acceptance Check 2**: After delete-account, dynamic inspection of every table finds zero rows for the deleted user.
3. **Acceptance Check 3**: delete-text leaves `skills_progress` rows and stages intact.
4. **Acceptance Check 4**: Routes reject attempts to request data for another user's identifier.
5. **Acceptance Check 5**: Toggling `improve_ai` consent persists to database and is accurately reflected by `canUseForImprovement(userId)`.
