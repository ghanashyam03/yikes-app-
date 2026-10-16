# T-17 Report

## Summary (3 sentences)
Implemented social battery logging, real-world micro-rep check-ins with Gap reveals, and post-moment Debrief chats with editable takeaway synthesis. Gateway endpoints provide debrief question generation, safety-guarded answer processing, takeaway distillation, and neutral Coach reflection without scores or grades. Mobile screens C6, C7, and C8 render in calm aesthetics with Lilac debrief styling, draggable haptic battery gauge, and immediate safety routing to Support resources on crisis signals.

## What I built (one line per file)
- `services/gateway/src/routes/debrief.ts`: Gateway endpoints (`/v1/debrief/start`, `/v1/debrief/answer`, `/v1/debrief/finish`, `/v1/checkin/reflect`) with safety checks and neutral reflection.
- `services/gateway/src/routes/__tests__/debrief.test.ts`: Vitest suite testing start, answer safety, takeaway finish, and neutral reflection without grades.
- `apps/mobile/src/copy/checkins.ts`: User-facing copy for Social Battery, Micro-rep check-in, Gap reveal, and Lilac Debrief chat with zero clinical words.
- `apps/mobile/src/features/energy/types.ts`: Type definitions for social battery energy tracking.
- `apps/mobile/src/features/energy/useEnergy.ts`: Zustand store with offline cache and Supabase sync to `energy_checkins` table.
- `apps/mobile/src/features/energy/__tests__/energyScreen.test.tsx`: Test suite for screen C6 battery gauge and tag toggling.
- `apps/mobile/src/features/checkin/types.ts`: Type definitions for micro-rep check-in and gap calculation.
- `apps/mobile/src/features/checkin/computeGap.ts`: Pure functions `computeGap` and `computeWeeklyTrend`.
- `apps/mobile/src/features/checkin/useCheckin.ts`: Zustand store for micro-rep check-in flow with gateway reflection and Supabase `micro_reps` sync.
- `apps/mobile/src/features/checkin/__tests__/computeGap.test.ts`: Unit tests for `computeGap` and `computeWeeklyTrend`.
- `apps/mobile/src/features/checkin/__tests__/checkinScreen.test.tsx`: Jest tests for screen C8 4-step check-in flow and Gap reveal.
- `apps/mobile/src/features/checkin/__tests__/checkinRls.test.ts`: Acceptance tests verifying RLS policy coverage on `energy_checkins`, `micro_reps`, and `debriefs`.
- `apps/mobile/src/features/debrief/types.ts`: Type definitions for debrief messages, takeaway card, and API payloads.
- `apps/mobile/src/features/debrief/debriefApi.ts`: Client API for debrief start, answer, finish, and journal persistence.
- `apps/mobile/src/features/debrief/useDebrief.ts`: Zustand store managing debrief chat, suggested chips, safety trigger routing, and takeaway edits.
- `apps/mobile/src/features/debrief/__tests__/debriefScreen.test.tsx`: Acceptance tests for debrief chat flow, editable essence, and crisis routing to `/support`.
- `apps/mobile/app/energy.tsx`: Screen C6 Social Battery check-in with large draggable battery gauge and tags.
- `apps/mobile/app/checkin/[id].tsx`: Screen C8 Micro-rep check-in with 4 outcome choices, warmth rating, battery gauge, and Gap reveal.
- `apps/mobile/app/debrief/[id].tsx`: Screen C7 Debrief chat with Lilac aesthetic, suggested reply chips, and editable takeaway card.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
|---|---|---|---|
| (1) Tests for computeGap and weekly trend | `pnpm --filter mobile test computeGap.test.ts` | 9 passed (draining gap, warmth gap, bounds, closing/widening trends) | `docs/tasks/T-17/evidence/computeGap-trend-test.txt` |
| (2) Debrief end-to-end with fake provider | `pnpm --filter gateway test debrief.test.ts` | 6 passed (start, answer, finish, reflect) | `docs/tasks/T-17/evidence/debrief-gateway-test.txt` |
| (3) Crisis phrase routes to /support with NO AI text | `pnpm --filter mobile test debriefScreen.test.tsx` | 3 passed (crisis phrase returns `{crisis:true}`, replaces route to `/support`, no AI text added) | `docs/tasks/T-17/evidence/debrief-crisis-routing-test.txt` |
| (4) RLS tests on new writes | `pnpm --filter mobile test checkinRls.test.ts && pnpm db:test` | All passed (owner-only SELECT, INSERT, UPDATE, DELETE on energy_checkins, micro_reps, debriefs) | `docs/tasks/T-17/evidence/rls-writes-test.txt` |
| (5) All states render | `pnpm --filter mobile test energyScreen.test.tsx checkinScreen.test.tsx` | 4 passed (screens C6 and C8 render all steps and interactive states) | `docs/tasks/T-17/evidence/screens-render-test.txt` |
| (6) Monorepo check green | `pnpm check` | Clean pass (lint 0 errors, typecheck 6 workspaces green, 38 test suites 198 tests passed) | `docs/tasks/T-17/evidence/pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- POST /v1/debrief/start returning debriefId & questions: DONE (`services/gateway/src/routes/debrief.ts:98`)
- POST /v1/debrief/answer running safety and handling crisis with NO AI text: DONE (`services/gateway/src/routes/debrief.ts:192`)
- POST /v1/debrief/finish returning takeaway with headline, coreEssence, quoteContext: DONE (`services/gateway/src/routes/debrief.ts:286`)
- POST /v1/checkin/reflect returning 1 neutral line with STRICTLY NO score or grade words: DONE (`services/gateway/src/routes/debrief.ts:384`)
- User-facing copy with zero clinical words (`treat`, `cure`, `therapy`, `diagnose`): DONE (`apps/mobile/src/copy/checkins.ts:1-98`)
- Social Battery store with offline cache & Supabase sync: DONE (`apps/mobile/src/features/energy/useEnergy.ts:38`)
- computeGap pure functions returning gap and trend: DONE (`apps/mobile/src/features/checkin/computeGap.ts:25-96`)
- Screen C6 Energy check-in with draggable battery gauge: DONE (`apps/mobile/app/energy.tsx:18`)
- Screen C8 Micro-rep check-in (4 options, warmth, battery, Gap reveal): DONE (`apps/mobile/app/checkin/[id].tsx:28`)
- Screen C7 Debrief chat with Lilac aesthetic, chips, editable takeaway card, save/discard, and crisis routing: DONE (`apps/mobile/app/debrief/[id].tsx:26`)

## Dependencies added (name, version, reason, licence)
None. Used existing dependencies (`@supabase/supabase-js`, `zustand`, `expo-router`, `zod`, `react-native-reanimated`, `expo-haptics`).

## Outside-scope edits (file, reason, size of change)
None. All created and edited files reside strictly within the contract owned scope.

## UNVERIFIED items (anything you could not prove, and the fallback you built)
None. All contract endpoints and client features verified with automated tests.

## Known limitations and follow-ups (each with a task id)
- Battery aggregation into weekly heat-grids and Coach insight cards is handled in T-18 (`/v1/insights/battery`).
- Automatic push notification reminders for check-ins and debriefs are handled in T-21 (`apps/mobile/src/features/notifications/**`).

## Fix rounds (left empty by the Builder; filled by the Fixer)
(None)
