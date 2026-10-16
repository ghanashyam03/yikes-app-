# T-21 Verification Report: Notifications Engine

## VERDICT
**PASS**

Zero blocking issues identified. All acceptance checks, product rules, and spec requirements verified independently with concrete automated evidence.

---

## 1. Blocking Issues
None. (0 blocking issues)

---

## 2. Non-blocking Notes
1. **Outside-scope edits**:
   - `apps/mobile/jest.config.js`: added `testTimeout: 15000` to prevent Jest timeout on Windows under concurrent worker load (1 line).
   - `apps/mobile/package.json`: updated test script to `jest --watchAll=false --maxWorkers=4` to mitigate CPU starvation on Windows (1 line).
   - `apps/mobile/src/features/coach/__tests__/coachFeatures.test.tsx`: added `{ timeout: 3000 }` to `findByTestId('tile-what-worked')` to match adjacent progressive reveal assertions (1 line).
   - `services/gateway/vitest.config.ts`: increased `testTimeout` to 30000ms for concurrent ESM module loading on Windows (1 line).
   All four outside-scope edits are strictly 1-line test/configuration adjustments for Windows test runner reliability, documented in `REPORT.md`, and do not alter application production code.
2. **Notification Scheduler Adapter Architecture**:
   The engine implements an `InMemoryNotificationScheduler` adapter by default in `apps/mobile/src/features/notifications/scheduler.ts`. This provides a decoupled, testable platform adapter for web and local Jest environments where native push daemons do not run, while supporting drop-in native APNs / FCM bridges.
3. **Weekly Letter Content Generation**:
   As outlined in `TASKS.md`, weekly letter text generation is owned by T-19. T-21 provides the push notification scheduling trigger, quiet-hours filtering, and Gateway dispatch jobs.

---

## 3. Acceptance Table
| Check | Command | Result | Evidence File |
| :--- | :--- | :--- | :--- |
| **Check 1**: Tests of `planNotifications`: max one a day, quiet hours respected, pause respected, welcome-back frequency | `pnpm --filter mobile test planNotifications.test.ts` | PASS (13/13 tests) | `docs/tasks/T-21/evidence/acceptance-1-planNotifications.txt` |
| **Check 2**: A copy test fails if any line contains: `you missed`, `streak`, `don't lose`, `hurry`, `last chance`, `only X left` | `pnpm --filter mobile test notificationsCopy.test.ts` | PASS (15/15 tests) | `docs/tasks/T-21/evidence/acceptance-2-copy.txt` |
| **Check 3**: The permission flow shows the preview first | `pnpm --filter mobile test permissionFlow.test.tsx` | PASS (3/3 tests) | `docs/tasks/T-21/evidence/acceptance-3-permissionFlow.txt` |
| **Check 4**: Toggles actually cancel scheduled items | `pnpm --filter mobile test togglesCancel.test.ts` | PASS (4/4 tests) | `docs/tasks/T-21/evidence/acceptance-4-togglesCancel.txt` |
| **Check 5**: Monorepo build, lint, typecheck, and full test suite (`pnpm check`) | `pnpm check` | PASS (0 errors, 50/50 mobile suites pass, 264/264 tests pass) | `docs/tasks/T-21/evidence/acceptance-5-pnpmCheck.txt` |
| **Check 6**: Gateway push routes, token registration & server jobs | `pnpm --filter gateway test src/routes/__tests__/notify.test.ts` | PASS (8/8 tests) | `docs/tasks/T-21/evidence/gateway-notify.txt` |

---

## 4. Spec Conformance & Focus Audit
| Requirement / Focus Item | Status | Verification & Evidence |
| :--- | :--- | :--- |
| **Max ONE notification per day** | PASS | `planNotifications.ts:394-425` groups candidates by `dateKey` and takes only the highest priority candidate per calendar day. Verified in `planNotifications.test.ts:104-183`. |
| **Strict quiet-hours boundary logic** | PASS | `planNotifications.ts:54-71` & `quietHoursFilter.ts:17-37` correctly handle overnight intervals (e.g. 22:00–08:00) using minute-of-day math. Edge points tested at 21:59, 22:00, 07:59, 08:00. |
| **Pause week supported** | PASS | `planNotifications.ts:125-131` returns zero items if `pausedUntil > now`. `notificationsStore.ts:91-99` and `togglesCancel.test.ts:101-119` confirm `pauseForAWeek` cancels all active scheduled items. |
| **Welcome-back rule (3+ days away, max 1 / 7 days)** | PASS | `planNotifications.ts:150-197` and `welcomeBackJob.ts:76-94` enforce >= 3 days away, cooldown >= 7 days. Verified by `planNotifications.test.ts:227-307` and `notify.test.ts:182-212`. |
| **Strictly NO guilt copy, streak warnings, countdowns** | PASS | `notifications.ts` audited against banned terms (`you missed`, `streak`, `don't lose`, `hurry`, `last chance`, `only X left`). Scanned and enforced by `notificationsCopy.test.ts:66-87`. |
| **Zero clinical words (`treat`, `cure`, `therapy`, `diagnose`)** | PASS | Verified in `notificationsCopy.test.ts:89-105`. Zero occurrences across all user-facing strings and templates. |
| **Zero red for errors / warnings (Honey used)** | PASS | `settings/notifications.tsx` uses `accents.honey.tint` and `accents.honey.pop` for badges and toast alerts; `accents.mint` for toggles. Zero red tokens in code or styles. |
| **JIT permission flow shows preview first** | PASS | `useNotificationPermission.ts:37-52` ensures `openPreviewModal` is invoked prior to `requestNotificationPermissions`. Verified in `permissionFlow.test.tsx:55-84`. |
| **Toggles actually cancel scheduled items** | PASS | `notificationsStore.ts:77-80` triggers `cancelScheduledNotificationsByType` on toggle off. Verified in `togglesCancel.test.ts:74-99`. |
| **Push tokens stored in `notification_prefs` table** | PASS | `notify.ts:144-158` upserts tokens into `notification_prefs` matching table definition in `supabase/migrations/20261015000001_core_accounts.sql:40-51`. |
| **Settings Screen D2 (`settings/notifications.tsx`)** | PASS | Full implementation with quiet hours slider presets, max one a day badge, pause week toggle, and per-type live sample previews. |
| **Pinned dependencies** | PASS | No new dependencies added to workspaces. Existing dependencies remain strictly pinned (no `^` or `~`). |

---

## 5. Claims Audit (docs/tasks/T-21/REPORT.md)
| # | Claim in REPORT.md | Audit Status | Evidence / Verification |
| :--- | :--- | :--- | :--- |
| 1 | `apps/mobile/src/copy/notifications.ts` notification copy library with warm lines, zero guilt terms, zero clinical words | TRUE | File verified; 15 test assertions in `notificationsCopy.test.ts` pass cleanly. |
| 2 | `apps/mobile/src/features/notifications/types.ts` TypeScript contracts for notification types, preferences, and state | TRUE | File verified; comprehensive types compile cleanly under `tsc --noEmit`. |
| 3 | `apps/mobile/src/features/notifications/planNotifications.ts` pure scheduling function with max 1/day, quiet hours, pause week | TRUE | Pure function verified; 13 test cases in `planNotifications.test.ts` pass cleanly. |
| 4 | `apps/mobile/src/features/notifications/notificationsStore.ts` reactive Zustand store managing toggles, quiet hours, pause | TRUE | Verified by code inspection and reactive store assertions in `togglesCancel.test.ts`. |
| 5 | `apps/mobile/src/features/notifications/scheduler.ts` notification scheduling adapter with cancellation by type | TRUE | Verified; adapter functions tested in `togglesCancel.test.ts`. |
| 6 | `apps/mobile/src/features/notifications/useNotificationPermission.ts` JIT hook ensuring preview is shown before prompt | TRUE | Verified by code inspection and `permissionFlow.test.tsx:55-84`. |
| 7 | `apps/mobile/src/features/notifications/NotificationPreviewCard.tsx` preview banner modeling system notifications | TRUE | Component verified; renders correctly with accessible labels. |
| 8 | `apps/mobile/src/features/notifications/NotificationPermissionModal.tsx` dialog showing preview before permission request | TRUE | Component verified; tested with RNTL in `permissionFlow.test.tsx`. |
| 9 | `apps/mobile/app/settings/notifications.tsx` Screen D2 with toggles, previews, quiet hours presets, and pause button | TRUE | Verified; accessible components, token styling, honey tint, zero red. |
| 10 | `services/gateway/src/jobs/notify/types.ts` push sender interface & MockPushSender | TRUE | Verified; exports contracts and mock sender used in test suites. |
| 11 | `services/gateway/src/jobs/notify/quietHoursFilter.ts` server-side quiet hours evaluation | TRUE | Verified; minute-of-day algorithm identical to mobile engine. |
| 12 | `services/gateway/src/jobs/notify/welcomeBackJob.ts` welcome-back push dispatch job with 3+ days and 7-day cooldown rules | TRUE | Verified; tests pass in `services/gateway/src/routes/__tests__/notify.test.ts`. |
| 13 | `services/gateway/src/jobs/notify/weeklyLetterJob.ts` Sunday weekly letter push notification job | TRUE | Verified; tests pass in `services/gateway/src/routes/__tests__/notify.test.ts`. |
| 14 | `services/gateway/src/routes/notify.ts` Fastify routes for token registration, prefs sync, and job triggers | TRUE | Verified; authenticated routes, input schema validation with zod, Supabase sync. |
| 15 | Check 1: `pnpm --filter mobile test planNotifications.test.ts` passes (13/13 tests) | TRUE | Re-executed independently; 13/13 passed in 2.43s. |
| 16 | Check 2: `pnpm --filter mobile test notificationsCopy.test.ts` passes (15/15 tests) | TRUE | Re-executed independently; 15/15 passed in 2.27s. |
| 17 | Check 3: `pnpm --filter mobile test permissionFlow.test.tsx` passes (3/3 tests) | TRUE | Re-executed independently; 3/3 passed in 7.94s. |
| 18 | Check 4: `pnpm --filter mobile test togglesCancel.test.ts` passes (4/4 tests) | TRUE | Re-executed independently; 4/4 passed in 3.92s. |
| 19 | Check 5: `pnpm check` passes cleanly across all workspaces | TRUE | Re-executed independently; 0 lint errors, 0 type errors, 50 mobile test suites pass. |

---

## 6. Hallucination & Security Audit
- **Imports**: All imported packages are present in workspace `package.json` files (`zustand`, `@tanstack/react-query`, `fastify`, `jose`, `@supabase/supabase-js`, `zod`).
- **Environment variables**: Gateway routes use `process.env.JOB_SECRET` with dev fallback; auth middleware uses existing `SUPABASE_JWT_SECRET`. No new undefined env vars introduced.
- **Database schema**: `notification_prefs` table and columns (`user_id`, `push_token`, `window_start`, `window_end`, `quiet_hours_start`, `quiet_hours_end`, `paused_until`, `toggles`) match `supabase/migrations/20261015000001_core_accounts.sql` exactly.
- **Model IDs**: Zero AI models hardcoded or invoked.
- **Security & Privacy**: No personal message text is logged or included in notifications. Push tokens are user-scoped with strict JWT authentication. Service-role key is only accessed on gateway server-side.
