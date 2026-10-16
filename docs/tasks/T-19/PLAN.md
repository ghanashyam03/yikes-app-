# Implementation Plan: T-19 — Weekly Letter and Voice Match

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-19)
- **Specs**:
  - `docs/spec/03-ai-system.md` (Weekly letter, Voice Match, honesty rules)
  - `docs/spec/06-data-safety.md` (Stored text privacy, consent management)
  - `docs/spec/05-screens-realworld-ai-progress.md` (Screen C14: Weekly Letter)
- **Risk Level**: **RISKY** (uses stored text)

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `supabase/migrations/20261016000009_voice_match_consent.sql`:
   - Adds `'voice_match'` to allowed `consent_kind` enum.
2. `services/gateway/src/routes/letter.ts`:
   - `POST /v1/jobs/weekly-letters`: Protected by `X-Job-Secret`. Generates letters <= 150 words using digest (max 3 verbatim quotes, 0 third-party names). Stores in `weekly_letters` and `journal_entries`.
   - `GET /v1/letters/latest` & `GET /v1/letters/:id`.
   - `POST /v1/voice-match/summarise`: Checks `voice_match` consent; updates `playbooks.derived.voiceStyle`.
3. `services/gateway/src/letter/`:
   - `digest.ts`, `letterGenerator.ts`, `voiceMatch.ts`.
4. `apps/mobile/src/copy/letter.ts`:
   - Copy for Weekly Letter screen (C14), opt-out toggle, and Voice Match consent.
5. `apps/mobile/src/features/letter/`:
   - `types.ts`, `letterApi.ts`, `useWeeklyLetter.ts`.
6. `apps/mobile/app/letter/[id].tsx`:
   - Screen C14 Weekly Letter with serif layout, noticed pattern, next focus, Plan it button, and opt-out toggle.
7. Listed Outside-scope edits:
   - In `apps/mobile/src/copy/privacy.ts` & `apps/mobile/app/settings/privacy.tsx`: add `voice_match` consent toggle.
   - In `services/gateway/src/routes/privacy/delete.ts`: purge `playbooks.derived.voiceStyle` on text deletion.
8. Tests in `services/gateway/src/routes/__tests__/letter.test.ts` and `apps/mobile/src/features/letter/__tests__/letterScreen.test.tsx`.

---

## 2. Privacy & Product Rule Guarantees
1. Letter length strictly <= 150 words.
2. Digest contains <= 3 verbatim quotes and 0 third-party names.
3. Job requires secret header.
4. Voice style is never stored without explicit active consent.
5. Deleting text removes voice style summary.
6. Zero clinical terms, zero red.

---

## 3. Acceptance Verification Plan
1. Letter length test (<= 150 words).
2. Digest test (<= 3 quotes, 0 third-party names).
3. Secret header test (rejects missing/wrong secret with 401).
4. Consent guard test (voice style rejected without consent).
5. Purge test (text deletion purges voiceStyle).
6. Monorepo health (`pnpm check`).
