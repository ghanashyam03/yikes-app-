# Implementation Plan: T-16 — Moments and Prep

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-16)
- **Specs**: `docs/spec/01-product.md` (Moments), `docs/spec/05-screens-realworld-ai-progress.md` (Screens C1 to C5), `docs/spec/06-data-safety.md`
- **Risk Level**: Normal

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `services/gateway/src/routes/prep.ts`:
   - `POST /v1/prep`: Authenticated endpoint taking `{ momentId, title, description, formality, eventDate }`.
   - Runs scenario-exclusion check (`validateScenarioExclusion(description)`) from T-09: blocks abuse, bereavement, confronting harm, harassment reporting, and medical news kindly with `{ ok: false, reason: "..." }`.
   - Calls `buildPrepCardPrompt` from `@yikes/ai-prompts` (T-10) with user's Playbook context.
   - Validates response with `prepCardOutputSchema`.
   - Returns `{ openerOptions, questions, exitLine, quietBreak, recoveryPlan }`.
2. `apps/mobile/src/copy/moments.ts`:
   - User-facing text for Moments timeline, Past tab, Add Moment sheet, Prep cards, Rehearsal, Pocket card, calendar permission rationale, and exclusion block notice.
3. `apps/mobile/src/features/moments/`:
   - `types.ts`: Moment, PrepPayload, and calendar event schemas.
   - `momentsApi.ts`: Supabase CRUD client for `moments` table and gateway `/v1/prep` caller.
   - `useMoments.ts`: Zustand store with persistence for local guest caching and online Supabase sync.
   - `calendarSync.ts`: Just-in-time calendar access handler (requests permission only when user taps "Add from calendar", imports only explicitly ticked events, retains no other calendar data).
4. `apps/mobile/app/(tabs)/moments.tsx`:
   - Screen C1 Moments tab with battery gauge, timeline, Past segment, Add button, and empty state.
5. `apps/mobile/app/moments/`:
   - `new.tsx`: Screen C2 Add a Moment bottom sheet with formality slider, Moment type chips, and date picker.
   - `[id]/prep.tsx`: Screen C3 Prep for a Moment with editable items, single-item regeneration that preserves edits, and excluded-topic banner.
   - `[id]/rehearse.tsx`: Screen C4 Rehearse starting a dynamic practice partner through the Try engine.
   - `[id]/pocket.tsx`: Screen C5 Pocket card: dark by default, zero animation, offline resilient.
6. Test suites in `services/gateway/src/routes/__tests__/prep.test.ts` and `apps/mobile/src/features/moments/__tests__/`.

---

## 2. Architecture & Privacy Guarantees

### A. Just-In-Time Calendar Permission
- Calendar access is NEVER requested at app launch or onboarding.
- Only requested when user explicitly taps "Add from calendar".
- Presents a modal listing events; imports only the events the user selects with checkmarks.
- No calendar data beyond the selected events is ever saved.

### B. Scenario Exclusion & Kindly Blocking
- If user describes an excluded topic (abuse, bereavement, confronting harm, harassment reporting, medical news), gateway returns `{ ok: false, reason: ... }`.
- App displays a warm, supportive message without generating AI prep, suggesting human support or trusted friends instead.

### C. Offline Pocket Card
- When prep is generated, it is cached in local device storage.
- The Pocket card renders entirely from local cache without making network calls.

---

## 3. Acceptance Verification Plan
1. **Acceptance Check 1**: Moment CRUD operations pass multi-tenant RLS tests.
2. **Acceptance Check 2**: Gateway Prep response strictly matches `prepCardOutputSchema`.
3. **Acceptance Check 3**: Excluded-topic description is blocked kindly with no AI prep generated.
4. **Acceptance Check 4**: Pocket card renders in a unit test with network mocked as offline.
5. **Acceptance Check 5**: Empty state displays correctly on Moments tab.
