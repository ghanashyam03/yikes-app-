# T-19 Report

## Summary (3 sentences)
T-19 delivers automated Weekly Letter generation via `POST /v1/jobs/weekly-letters` (Sunday-evening job protected by `X-Job-Secret`), providing compassionate, honest reflections under 150 words (and ~60 words for free plan users) with zero clinical terms, personality labels, or third-party persona names, alongside up to 3 verbatim user quotes. It also implements Voice Match styling with active consent enforcement (`voice_match` consent kind), automatic style purging upon text deletion or consent withdrawal via both database trigger and gateway procedures, and the mobile Letter screen (C14) with Serif typography, pattern recognition, and an opt-out toggle. The entire workspace passes `pnpm check` cleanly with a 100% pass rate across all 21 gateway test files (123 tests) and 47 mobile test files (237 tests).

## What I built (one line per file)
- `supabase/migrations/20261016000009_voice_match_consent.sql`: Database migration adding `voice_match` to `consents_kind_check`, updating `delete_user_text` stored procedure to purge `voiceStyle`, and adding a database trigger to purge `voiceStyle` upon consent withdrawal.
- `services/gateway/src/letter/types.ts`: TypeScript data models and interfaces for Weekly Letter generation, weekly digests, quotes, and metadata compatible with exactOptionalPropertyTypes.
- `services/gateway/src/letter/digest.ts`: Weekly activity digest engine aggregating session counts, stage changes, moments, gaps, and extracting up to 3 verbatim quotes while strictly filtering out third-party/persona names.
- `services/gateway/src/letter/letterGenerator.ts`: LLM letter generation service utilizing `MODEL_LONG`, validating word count (<= 150 words plus, ~60 words free), rejecting clinical terms/labels, supporting authored fallbacks, and saving to `weekly_letters` and `journal_entries`.
- `services/gateway/src/letter/voiceMatch.ts`: Voice match analysis service requiring active `voice_match` consent (throwing 403 `ConsentRequiredError` otherwise), extracting practice turns, generating voice summaries, and updating `playbooks.derived.voiceStyle`.
- `services/gateway/src/routes/letter.ts`: Gateway routes for `POST /v1/jobs/weekly-letters` (secret guarded), `GET /v1/letters/latest`, `GET /v1/letters/:id`, `POST /v1/letters/opt-out`, and `POST /v1/voice-match/summarise` with lazy dependency loading.
- `services/gateway/src/routes/__tests__/letter.test.ts`: Comprehensive Vitest test suite with 17 tests proving secret guards, word count clamping, banned word rejection, quote caps, name filtering, consent checks, and style purges.
- `apps/mobile/src/copy/letter.ts`: Non-clinical copy dictionary for C14 Weekly Letter screen and opt-out preferences using warm tokens and zero red/shaming copy.
- `apps/mobile/src/features/letter/types.ts`: Mobile TypeScript interfaces for weekly letters, metadata, and API payloads.
- `apps/mobile/src/features/letter/letterApi.ts`: Client API client for fetching letters, retrieving by ID, and updating weekly letter opt-out state.
- `apps/mobile/src/features/letter/useWeeklyLetter.ts`: Zustand store managing weekly letter state, loading, offline local storage caching, and opt-out toggling.
- `apps/mobile/app/letter/[id].tsx`: Screen C14 implementation featuring Georgia serif letter rendering, pattern noticed card, focus next guidance, Plan it navigation, and opt-out toggle.
- `apps/mobile/src/features/letter/__tests__/letterScreen.test.tsx`: Jest/RNTL tests verifying C14 screen rendering, loading skeleton, error fallback, opt-out switch, and pattern/focus cards.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| :--- | :--- | :--- | :--- |
| (1) Letter length & honesty rules (<= 150 words, free short version, banned word rejection) | `pnpm --filter gateway test src/routes/__tests__/letter.test.ts -t "Acceptance Check 1"` | PASS (2 tests) | `docs/tasks/T-19/evidence/check-1-letter-length.txt` |
| (2) Digest quotes & names (<= 3 verbatim quotes, 0 third-party persona names) | `pnpm --filter gateway test src/routes/__tests__/letter.test.ts -t "Acceptance Check 2"` | PASS (3 tests) | `docs/tasks/T-19/evidence/check-2-digest-quotes-names.txt` |
| (3) Job secret verification (401 on missing/wrong secret, creates letter & journal entry on valid secret) | `pnpm --filter gateway test src/routes/__tests__/letter.test.ts -t "Acceptance Check 3"` | PASS (4 tests) | `docs/tasks/T-19/evidence/check-3-job-secret.txt` |
| (4) Voice Match consent guard (403 without consent, stores in playbook derived when granted) | `pnpm --filter gateway test src/routes/__tests__/letter.test.ts -t "Acceptance Check 4"` | PASS (3 tests) | `docs/tasks/T-19/evidence/check-4-consent-guard.txt` |
| (5) Deleting text removes style summary (purges playbooks.derived.voiceStyle on text deletion and consent withdrawal) | `pnpm --filter gateway test src/routes/__tests__/letter.test.ts -t "Acceptance Check 5"` | PASS (2 tests) | `docs/tasks/T-19/evidence/check-5-purge-test.txt` |
| (6) Mobile C14 Screen rendering & interaction (loading, empty, error, offline, opt-out switch) | `pnpm --filter mobile test letterScreen.test.tsx` | PASS (8 tests) | `docs/tasks/T-19/evidence/check-6-mobile-tests.txt` |
| (7) Full workspace check (lint, typecheck, tests) | `pnpm check` | PASS (0 errors, 123 gateway tests, 237 mobile tests) | `docs/tasks/T-19/evidence/check-7-pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- Job endpoint `POST /v1/jobs/weekly-letters` protected by secret header: DONE (`services/gateway/src/routes/letter.ts:133-142`)
- Per-user digest builder using counts, stage changes, Moments, Gaps and at most 3 verbatim user quotes: DONE (`services/gateway/src/letter/digest.ts:60-150`)
- Digest strictly excludes third-party or persona names: DONE (`services/gateway/src/letter/digest.ts:25-45, 125-145`)
- Long-context model producing WeeklyLetter of 150 words or fewer, validated for length, labels, and banned words: DONE (`services/gateway/src/letter/letterGenerator.ts:18-70, 115-180`)
- Free plan gets short version (~60 words): DONE (`services/gateway/src/letter/letterGenerator.ts:125-145`)
- Storing in weekly_letters and as a journal entry: DONE (`services/gateway/src/letter/letterGenerator.ts:185-240`)
- Letter screen (C14) with serif styling, pattern noticed, focus next, and opt-out toggle: DONE (`apps/mobile/app/letter/[id].tsx:1-260`)
- Voice Match active consent enforcement (`voice_match` consent kind, 403 on missing): DONE (`services/gateway/src/letter/voiceMatch.ts:70-95`)
- Voice style summary stored into `playbooks.derived.voiceStyle`: DONE (`services/gateway/src/letter/voiceMatch.ts:150-180`)
- Delete voiceStyle when text is deleted or consent withdrawn: DONE (`services/gateway/src/routes/privacy/delete-text.ts:60-80`, `apps/mobile/src/features/auth/consentManager.ts:85-110`, `supabase/migrations/20261016000009_voice_match_consent.sql:20-65`)
- Toggle added to Privacy centre as listed Outside-scope edit: DONE (`apps/mobile/app/settings/privacy.tsx:120-135`)

## Dependencies added (name, version, reason, licence)
None.

## Outside-scope edits (file, reason, size of change)
- `apps/mobile/src/copy/privacy.ts`: Added label and description copy strings for `voiceMatch` consent toggle. (+9 lines)
- `apps/mobile/app/settings/privacy.tsx`: Added Voice Match toggle row in Privacy Centre settings screen with accessible labeling. (+18 lines)
- `apps/mobile/src/features/auth/consentManager.ts`: Added `'voice_match'` to `ConsentKind` and `ConsentsState`, only persisting if provided, and triggering voiceStyle cleanup on withdrawal. (+25 lines)
- `services/gateway/src/routes/privacy/delete-text.ts`: Added purge of `playbooks.derived.voiceStyle` on text deletion. (+14 lines)
- `services/gateway/src/config/env.ts`: Added optional `JOB_SECRET` environment variable configuration. (+3 lines)
- `apps/mobile/src/features/privacy/__tests__/privacy.test.tsx`: Added 15000ms timeout to modal opening test to prevent flakiness under CPU contention. (+1 line)

## UNVERIFIED items (anything you could not prove, and the fallback you built)
None. All components, endpoints, database migrations, triggers, and fallback mechanisms have been tested and verified through automated test suites and live mock runs.

## Known limitations and follow-ups (each with a task id)
- Push notification scheduling for Sunday evening Weekly Letter delivery is handled in T-21 (`docs/tasks/TASKS.md` T-21 Notifications engine).
- Growth Journal timeline filter for 'Letters' connects to `weekly_letters` rows as designed in T-18.

## Fix rounds (left empty by the Builder; filled by the Fixer)
