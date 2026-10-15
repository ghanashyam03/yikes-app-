# T-11 Report

## Summary (3 sentences)
Implemented the complete onboarding personalization quiz (Q1 through Q14), optional 8-statement deeper profile, Playbook derivation engine, and cinematic Playbook reveal screen for the yikes! mobile application. The shared playbook package defines data-driven question schemas, a 24-step real-world difficulty library, and the pure `derivePlaybook` transformation producing pace, battery profile, hardest places, initial 3 steps, coach tone, weekly rhythm goal, reminder window, routine anchor, starting difficulty, path order, and scenario world with documented defaults when skipped. All screens feature autosave and state resumption via Zustand with local persistence, strictly null initial slider values, guest merge hooks syncing local Playbooks to Supabase upon sign-in, and pass all acceptance checks with 100% green tests across workspaces.

## What I built (one line per file)
- `packages/shared/src/playbook/questions.ts`: Data-driven Q1 to Q14 question definitions with types, sections, options, reasons, moment forms, and custom habit anchors.
- `packages/shared/src/playbook/deeper.ts`: 8 deeper profile statements on a 5-point scale tuning starting difficulty without personality labels.
- `packages/shared/src/playbook/firstSteps.ts`: `FIRST_STEPS_LIBRARY` containing 24 real-world micro-reps graded across difficulty levels 1 to 5.
- `packages/shared/src/playbook/derivePlaybook.ts`: Pure derivation function mapping quiz and deeper responses to a personalized `DerivedPlaybook` with documented fallbacks for skipped questions.
- `packages/shared/src/playbook/__tests__/derivePlaybook.test.ts`: Vitest unit tests verifying playbook derivation across 6 diverse answer combinations including all-skipped.
- `packages/shared/src/playbook/__tests__/questions.test.ts`: Vitest suite proving all 14 questions, 8 deeper statements, and 24 first steps strictly match the product specification.
- `apps/mobile/src/copy/onboarding.ts`: Centralized user-facing copy for intro preview tiles, quiz questions, deeper profile statements, and playbook reveal cards.
- `apps/mobile/src/features/onboarding/store.ts`: Zustand store with asynchronous local persistence, instant answer autosave, mid-quiz reload resumption, and null slider initial states.
- `apps/mobile/src/features/onboarding/guestMerger.ts`: Guest merger callback registered with `registerGuestMerger` to sync local Playbook answers and derived data to Supabase `playbooks` table upon authentication.
- `apps/mobile/src/features/onboarding/__tests__/store.test.ts`: Jest tests verifying reload resumption at the exact question step, answer preservation, and null slider defaults.
- `apps/mobile/src/features/onboarding/__tests__/guestMerger.test.ts`: Jest tests verifying automatic sync of local playbook data to Supabase upon login.
- `apps/mobile/src/features/onboarding/__tests__/screens.test.tsx`: Component integration and accessibility tests for intro, quiz steps, deeper profile, and playbook reveal screens.
- `apps/mobile/app/(onboarding)/intro.tsx`: Quiz intro screen (A3) with headline, mascot, 4 feature preview cards, "Begin" button, and "Skip, use defaults" link.
- `apps/mobile/app/(onboarding)/quiz/[step].tsx`: Dynamic question screen (A4, steps 1..14) with progress line, back navigation, large chips, `NoDefaultSlider`, moment form, custom anchor input, disabled Next button until answered, and always-visible Skip link.
- `apps/mobile/app/(onboarding)/deeper.tsx`: Optional deeper profile screen (A5) with 8 statements on 5-step scale, continue and skip buttons.
- `apps/mobile/app/(onboarding)/playbook.tsx`: Payoff screen (A8) displaying 5 glass cards (with a tilted battery card), edit pencils, first session ready badge, and "Save my Playbook" CTA routing to `/(auth)/sign-in`.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| :--- | :--- | :--- | :--- |
| (1) Unit tests for derivePlaybook on 6 answer sets, including all-skipped | `pnpm --filter @yikes/shared test src/playbook/__tests__/derivePlaybook.test.ts` | PASS (6/6 tests) | `docs/tasks/T-11/evidence/01-unit-tests-shared.txt` |
| (2) Reload resumes at the same question with the same answers | `pnpm --filter mobile test src/features/onboarding/__tests__/store.test.ts` | PASS | `docs/tasks/T-11/evidence/02-unit-tests-mobile.txt` |
| (3) Whole quiz completable on web in both modes | `pnpm --filter mobile test src/features/onboarding/__tests__/screens.test.tsx` | PASS (light & dark screenshots captured) | `docs/tasks/T-11/evidence/onboarding-quiz-light.jpg`, `docs/tasks/T-11/evidence/onboarding-quiz-dark.jpg` |
| (4) A test proves sliders start null | `pnpm --filter mobile test src/features/onboarding/__tests__/store.test.ts` | PASS | `docs/tasks/T-11/evidence/02-unit-tests-mobile.txt` |
| (5) A test proves every question appears in the spec | `pnpm --filter @yikes/shared test src/playbook/__tests__/questions.test.ts` | PASS (17/17 assertions) | `docs/tasks/T-11/evidence/03-spec-conformance.txt` |
| (6) pnpm check green across all workspaces | `pnpm check` | PASS (0 errors across 6 workspaces) | `docs/tasks/T-11/evidence/04-pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- **Data-driven question definitions Q1 to Q14 exactly as in spec**: DONE — `packages/shared/src/playbook/questions.ts:74-230`.
- **Optional deeper profile (8 statements on 5-step scale)**: DONE — `packages/shared/src/playbook/deeper.ts:10-21`, `apps/mobile/app/(onboarding)/deeper.tsx:1-215`.
- **Library of 24 real-world steps graded 1 to 5 in difficulty**: DONE — `packages/shared/src/playbook/firstSteps.ts:9-150`.
- **derivePlaybook producing 11 fields with documented defaults when skipped**: DONE — `packages/shared/src/playbook/derivePlaybook.ts:50-290`.
- **Quiz intro screen A3**: DONE — `apps/mobile/app/(onboarding)/intro.tsx:1-175`.
- **Quiz question screen A4 with progress line, back, Next disabled until answered, Skip visible, no default slider, instant autosave**: DONE — `apps/mobile/app/(onboarding)/quiz/[step].tsx:1-410`.
- **Q3 mini Moment form (type, what, when)**: DONE — `apps/mobile/app/(onboarding)/quiz/[step].tsx:265-330`.
- **Q14 custom anchor input**: DONE — `apps/mobile/app/(onboarding)/quiz/[step].tsx:332-375`.
- **Playbook reveal screen A8 with glass tiles, Edit pencils, tilted tile, and Save button**: DONE — `apps/mobile/app/(onboarding)/playbook.tsx:1-385`.
- **Zustand store with local persistence & resumption**: DONE — `apps/mobile/src/features/onboarding/store.ts:50-135`.
- **Register guest merger writing to Supabase playbooks table**: DONE — `apps/mobile/src/features/onboarding/guestMerger.ts:6-32`.

## Dependencies added (name, version, reason, licence)
None. Used existing pinned packages (`zustand`, `expo-haptics`, `@yikes/shared`, `@supabase/supabase-js`).

## Outside-scope edits (file, reason, size of change)
None. All edits strictly within `packages/shared/src/playbook/**`, `apps/mobile/app/(onboarding)/**`, `apps/mobile/src/features/onboarding/**`, and `apps/mobile/src/copy/onboarding.ts`.

## UNVERIFIED items (anything you could not prove, and the fallback you built)
None. All components, schemas, store persistence mechanisms, and guest mergers are verified with real unit and integration tests.

## Known limitations and follow-ups (each with a task id)
- Connecting warm-up chat (A6) and Coach's first read (A7) into the onboarding flow is owned by T-15.
- Supabase account creation handoff (A9) is owned by T-06.

## Fix rounds (left empty by the Builder; filled by the Fixer)
*(Empty)*
