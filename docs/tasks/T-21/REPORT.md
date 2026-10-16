# T-21 Report: Notifications Engine

## Summary (3 sentences)
Built the complete notifications engine for yikes! strictly enforcing product rules: max one notification per day, quiet hours enforcement, pause week support, and welcome-back frequency capping. Developed a warm, zero-guilt copy library with sample previews, just-in-time permission flow, and Settings Screen D2 with live toggle previews. Implemented Gateway endpoints to register push tokens in the `notification_prefs` table and trigger server-sent pushes for the Sunday Weekly Letter and warm welcome-back notifications.

---

## What I built (one line per file)
- `apps/mobile/src/copy/notifications.ts`: Notification copy library with warm lines, zero guilt terms, zero clinical words, and sample previews.
- `apps/mobile/src/features/notifications/types.ts`: TypeScript contracts for notification types, preferences, scheduler adapters, and planning state.
- `apps/mobile/src/features/notifications/planNotifications.ts`: Pure scheduling function guaranteeing max 1/day, strict quiet hours, pause week, and welcome-back throttling.
- `apps/mobile/src/features/notifications/notificationsStore.ts`: Reactive Zustand store managing toggles, quiet hours, pause week, and scheduled notifications.
- `apps/mobile/src/features/notifications/scheduler.ts`: Cross-platform local notification scheduling adapter with cancellation by type and quiet hours guard.
- `apps/mobile/src/features/notifications/useNotificationPermission.ts`: Hook for just-in-time permission flow ensuring sample preview is shown before system prompt.
- `apps/mobile/src/features/notifications/NotificationPreviewCard.tsx`: Reusable ambient banner preview card modeling system notifications.
- `apps/mobile/src/features/notifications/NotificationPermissionModal.tsx`: Just-in-time preview dialog showing what notifications look like before requesting system permission.
- `apps/mobile/app/settings/notifications.tsx`: Screen D2 with per-category toggles, live previews, quiet-hours slider presets, and pause week button.
- `services/gateway/src/jobs/notify/types.ts`: Gateway push sender interface and MockPushSender for reliable job dispatching and testing.
- `services/gateway/src/jobs/notify/quietHoursFilter.ts`: Server-side quiet hours evaluation helper.
- `services/gateway/src/jobs/notify/welcomeBackJob.ts`: Gateway job sending warm welcome-back pushes (away >= 3 days, max 1 per 7 days, non-paused, non-quiet hours).
- `services/gateway/src/jobs/notify/weeklyLetterJob.ts`: Gateway job sending Sunday Weekly Letter push notifications.
- `services/gateway/src/routes/notify.ts`: Fastify route plugin for push token registration, preference retrieval/update, and job triggers.
- `apps/mobile/src/features/notifications/__tests__/planNotifications.test.ts`: Test suite verifying max 1/day, quiet hours, pause week, and welcome back rules.
- `apps/mobile/src/features/notifications/__tests__/notificationsCopy.test.ts`: Rigorous test suite proving absence of banned guilt phrases and clinical words.
- `apps/mobile/src/features/notifications/__tests__/permissionFlow.test.tsx`: Test suite asserting sample preview is rendered before system permission request.
- `apps/mobile/src/features/notifications/__tests__/togglesCancel.test.ts`: Test suite asserting category toggles and pause week cancel scheduled notifications.
- `services/gateway/src/routes/__tests__/notify.test.ts`: Test suite verifying push token registration, preference sync, and server push jobs.

---

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| :--- | :--- | :--- | :--- |
| **Check 1**: Tests of `planNotifications`: max one a day, quiet hours respected, pause respected, welcome-back frequency | `pnpm --filter mobile test planNotifications.test.ts` | PASS (13/13 tests) | `docs/tasks/T-21/evidence/acceptance-1-planNotifications.txt` |
| **Check 2**: A copy test fails if any line contains: you missed, streak, don't lose, hurry, last chance, only X left | `pnpm --filter mobile test notificationsCopy.test.ts` | PASS (15/15 tests) | `docs/tasks/T-21/evidence/acceptance-2-copy.txt` |
| **Check 3**: The permission flow shows the preview first | `pnpm --filter mobile test permissionFlow.test.tsx` | PASS (3/3 tests) | `docs/tasks/T-21/evidence/acceptance-3-permissionFlow.txt` |
| **Check 4**: Toggles actually cancel scheduled items | `pnpm --filter mobile test togglesCancel.test.ts` | PASS (4/4 tests) | `docs/tasks/T-21/evidence/acceptance-4-togglesCancel.txt` |
| **Check 5**: `pnpm check` passes cleanly across all workspaces | `pnpm check` | PASS (0 lint errors, 0 type errors, 386 tests pass) | `docs/tasks/T-21/evidence/acceptance-5-pnpmCheck.txt` |

---

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
| Requirement | Status | File and Line | Notes |
| :--- | :--- | :--- | :--- |
| Pure planning function `planNotifications(state)` | DONE | `apps/mobile/src/features/notifications/planNotifications.ts:104-360` | Guarantees at most 1/day, never in quiet hours, 0 when paused, welcome back frequency |
| Max ONE notification per day guarantee | DONE | `apps/mobile/src/features/notifications/planNotifications.ts:330-355` | Highest priority candidate picked per calendar day |
| Strict quiet hours enforcement | DONE | `apps/mobile/src/features/notifications/planNotifications.ts:46-68, 318-323` | Rejects/filters any candidate falling inside quiet hours window |
| Pause week supported (zero notifications scheduled) | DONE | `apps/mobile/src/features/notifications/planNotifications.ts:108-117` | Returns empty array when `pausedUntil > now` |
| Welcome-back rule (3+ days away: max 1 warm notification, max 1 per 7 days) | DONE | `apps/mobile/src/features/notifications/planNotifications.ts:130-184` | Warm greeting only, resets rhythm ring without comment |
| Permission flow requested JIT with sample-notification preview first | DONE | `apps/mobile/src/features/notifications/useNotificationPermission.ts:38-51` | Preview modal is displayed prior to system alert trigger |
| Local scheduling with expo-notifications / scheduler adapter | DONE | `apps/mobile/src/features/notifications/scheduler.ts:60-155` | Handles rhythm nudge, moment prompts, check-ins, review due, and weekly letter |
| Push tokens saved in `notification_prefs` table | DONE | `services/gateway/src/routes/notify.ts:133-188` | `POST /v1/notify/token` upserts token into `notification_prefs` |
| Warm, specific copy library without guilt or countdowns | DONE | `apps/mobile/src/copy/notifications.ts:10-108` | Scanned and validated: zero banned phrases, zero clinical words |
| Settings Screen D2 (`settings/notifications.tsx`) | DONE | `apps/mobile/app/settings/notifications.tsx:32-340` | Toggles per type with live sample preview, quiet-hours selector, pause week button |
| Toggles actually cancel scheduled items | DONE | `apps/mobile/src/features/notifications/notificationsStore.ts:75-80` | Disabling toggle calls `cancelScheduledNotificationsByType` |
| Gateway notify routes & scheduled jobs | DONE | `services/gateway/src/routes/notify.ts:125-325` | Push token registration and jobs for welcome back and weekly letter |

---

## Dependencies added (name, version, reason, licence)
None. Used existing workspace dependencies (`zustand`, `@tanstack/react-query`, `fastify`, `jose`, `@supabase/supabase-js`, `zod`).

---

## Outside-scope edits (file, reason, size of change)
1. `services/gateway/vitest.config.ts`: Increased `testTimeout` from 15000ms to 30000ms to prevent timeout under concurrent ESM module loading on Windows (1 line changed).
2. `apps/mobile/jest.config.js`: Added `testTimeout: 15000` to prevent timeout under concurrent worker load on Windows (1 line changed).
3. `apps/mobile/package.json`: Updated test script to `"jest --watchAll=false --maxWorkers=4"` to prevent CPU saturation and timer starvation on Windows (1 line changed).
4. `apps/mobile/src/features/coach/__tests__/coachFeatures.test.tsx`: Added `{ timeout: 3000 }` to `findByTestId('tile-what-worked')` on line 108 matching adjacent assertions for progressive reveal (1 line changed).

---

## UNVERIFIED items (anything you could not prove, and the fallback you built)
None. All acceptance checks, pure function edge cases, copy assertions, toggle cancellations, and gateway endpoints were verified with automated tests.

---

## Known limitations and follow-ups (each with a task id)
- Weekly Letter text generation model is implemented in T-19.

---

## Fix rounds (left empty by the Builder; filled by the Fixer)
*(Left empty)*
