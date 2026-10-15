# T-07 Verification Report: Privacy centre and data rights

## VERDICT
**PASS**

Zero blocking issues found. All 5 acceptance checks and all contract/spec requirements have been independently re-run and confirmed with concrete evidence.

---

## Blocking issues
*(None. Zero blocking issues.)*

---

## Non-blocking notes
1. `apps/mobile/src/features/privacy/__tests__/privacy.test.tsx` triggers React test renderer `act(...)` state update warnings during store asynchronous resolution, although all 7 assertions pass cleanly. Consider wrapping state assertions inside `waitFor` or `act` in a future polish pass (T-25).
2. Jest prints an open handles notice on test completion in `apps/mobile/src/features/privacy/__tests__/privacy.test.tsx` due to simulated async timer ticks in the mock client; adding explicit `.unref()` or mock clearing would ensure immediate process termination.

---

## Acceptance table

| Check | Specification / Contract Reference | Command | Result | Evidence Pointer |
|---|---|---|---|---|
| 1. Export contains only that user's rows | TASKS.md T-07 (1); 06-data-safety.md Sec 13 | `pnpm --filter gateway test src/routes/privacy/__tests__/privacy.test.ts` | **PASS** (140ms) | `docs/tasks/T-07/evidence/verifier-gateway-tests.txt` |
| 2. After delete-account, dynamic table inspection finds 0 rows for user across all public tables | TASKS.md T-07 (2); 08-acceptance.md Sec 17 | `pnpm --filter gateway test src/routes/privacy/__tests__/privacy.test.ts` | **PASS** (140ms) | `docs/tasks/T-07/evidence/verifier-dynamic-table-audit.txt` |
| 3. delete-text leaves skills_progress intact | TASKS.md T-07 (3); 05-screens-settings-system.md D3 | `pnpm --filter gateway test src/routes/privacy/__tests__/privacy.test.ts` | **PASS** (140ms) | `docs/tasks/T-07/evidence/verifier-gateway-tests.txt` |
| 4. Routes derive identity solely from JWT and reject foreign identifiers | TASKS.md T-07 (4); AGENTS.md Security | `pnpm --filter gateway test src/routes/privacy/__tests__/privacy.test.ts` | **PASS** (140ms) | `docs/tasks/T-07/evidence/verifier-gateway-tests.txt` |
| 5. Toggling consent persists and is read by canUseForImprovement | TASKS.md T-07 (5); 08-acceptance.md Sec 17 | `pnpm --filter gateway test src/routes/privacy/__tests__/privacy.test.ts` | **PASS** (140ms) | `docs/tasks/T-07/evidence/verifier-gateway-tests.txt` |
| 6. Mobile D3 Privacy centre UI and interactions | 05-screens-settings-system.md D3 | `pnpm --filter mobile test apps/mobile/src/features/privacy/__tests__/privacy.test.tsx` | **PASS** (7.027s) | `docs/tasks/T-07/evidence/verifier-mobile-tests.txt` |
| 7. Monorepo build and static analysis | AGENTS.md Fixed tech stack; verify workflow step 4 | `pnpm install --frozen-lockfile && pnpm check` | **PASS** (all 6 workspaces) | `docs/tasks/T-07/evidence/verifier-pnpm-check.txt` |

---

## Verifier Focus Items Audit

1. **Dynamic table-list deletion test**:
   - The test suite in `services/gateway/src/routes/privacy/__tests__/privacy.test.ts` dynamically queries all 23 public schema tables (`profiles`, `consents`, `notification_prefs`, `entitlements`, `deletion_requests`, `exports`, `playbooks`, `skills_progress`, `sessions_log`, `attempts`, `turns`, `coach_feedback`, `ai_feedback`, `moments`, `energy_checkins`, `micro_reps`, `debriefs`, `ladder_rungs`, `journal_entries`, `weekly_letters`, `ai_calls`, `safety_events`, `ai_usage_daily`).
   - Verifies that after calling `deleteUserAccount()`, exactly 0 rows remain for the deleted user across all 23 tables.
   - Verified that all user-linked tables in Postgres migrations enforce foreign key references to `auth.users(id)` with `ON DELETE CASCADE`.

2. **Authorisation on every route**:
   - Verified `services/gateway/src/routes/privacy/index.ts`: All privacy routes enforce `createAuthMiddleware(env)`.
   - The user identity is extracted strictly from `request.userId` (derived from the validated JWT subject claim).
   - Any client-submitted `userId` in the body or query parameters is strictly ignored.
   - Cross-tenant access is prevented: `GET /v1/privacy/export/:id` explicitly checks `data.user_id !== userId` and rejects foreign access attempts with HTTP 403 Forbidden.

3. **Confirmation friction on destructive actions**:
   - `delete-text`: A confirmation bottom sheet modal (`PrivacyModals.tsx:36-74`) explicitly warns the user that dialogue turns and reflections will be cleared while emphasizing the guarantee that skill progress and stage levels are kept intact. Requires an explicit tap on "Yes, clear practice text" before proceeding.
   - `delete-account`: Implements an OTP verification bottom sheet modal (`PrivacyModals.tsx:77-132`) with a permanent destruction warning, requiring the entry of a fresh 6-digit verification code sent to the user's email/phone before account deletion is triggered.

4. **Telemetry and logging hygiene (no message content in logs)**:
   - Audited all logger calls in `export.ts`, `delete-text.ts`, `delete-account.ts`, `can-use.ts`, `purge.ts`, and `index.ts`.
   - Logger calls record only user IDs, table identifiers, counts, or error strings. Conversation turns, transcripts, reflection text, and OTP tokens are never logged.

5. **Pinned packages**:
   - `git diff --stat main...HEAD` shows `package.json` and `pnpm-lock.yaml` were untouched.
   - Zero new external packages were introduced.

---

## Claims Audit (docs/tasks/T-07/REPORT.md)

| Claim in REPORT.md | Verifier Finding | Verdict |
|---|---|---|
| Summary: Built D3 Privacy centre, gateway endpoints, database helpers, and client-side data rights | Confirmed in code and tests | **TRUE** |
| `supabase/migrations/20261016000008_privacy_helpers.sql` added indexes, export payload column, and stored procedures | Confirmed in file inspection and db test | **TRUE** |
| `services/gateway/src/routes/privacy/types.ts` defines zod schemas and interfaces | File exists and compiles cleanly | **TRUE** |
| `services/gateway/src/routes/privacy/can-use.ts` queries consents for active improve_ai | Tested in gateway test line 570 | **TRUE** |
| `services/gateway/src/routes/privacy/export.ts` aggregates all tables and creates 24h export | Tested in gateway test line 339 | **TRUE** |
| `services/gateway/src/routes/privacy/delete-text.ts` clears text, keeps skills_progress | Tested in gateway test line 453 | **TRUE** |
| `services/gateway/src/routes/privacy/delete-account.ts` verifies OTP and cascades | Tested in gateway test line 407 | **TRUE** |
| `services/gateway/src/routes/privacy/purge.ts` calls purge_expired_text | Tested in gateway test line 620 | **TRUE** |
| `services/gateway/src/routes/privacy/index.ts` registers endpoints with auth middleware | Confirmed in code and route tests | **TRUE** |
| `services/gateway/src/routes/privacy.ts` exports register and canUseForImprovement | File exists and re-exports cleanly | **TRUE** |
| `services/gateway/src/routes/privacy/__tests__/privacy.test.ts` covers all acceptance checks | Ran independently: 7/7 tests pass | **TRUE** |
| `apps/mobile/src/copy/privacy.ts` contains plain-language copy | All user-facing strings imported from copy | **TRUE** |
| `apps/mobile/src/features/privacy/privacyApi.ts` communicates with gateway endpoints | All methods typed and tested | **TRUE** |
| `apps/mobile/src/features/privacy/usePrivacy.ts` manages consents and modals | Store handles all actions and rollbacks | **TRUE** |
| `apps/mobile/src/features/privacy/PrivacyModals.tsx` implements destructive friction modals | Modals render with accessible buttons | **TRUE** |
| `apps/mobile/src/features/privacy/__tests__/privacy.test.tsx` component test suite passes | Ran independently: 7/7 tests pass | **TRUE** |
| `apps/mobile/app/settings/privacy.tsx` renders D3 Privacy centre | Screen renders all sections and disclaimers | **TRUE** |
| Acceptance check 1 (Export contains only that user's rows) passes | Re-run independently: PASS | **TRUE** |
| Acceptance check 2 (0 rows across all tables after delete-account) passes | Re-run independently: PASS | **TRUE** |
| Acceptance check 3 (delete-text preserves skills_progress) passes | Re-run independently: PASS | **TRUE** |
| Acceptance check 4 (Routes reject foreign user identifiers) passes | Re-run independently: PASS | **TRUE** |
| Acceptance check 5 (Consent toggles persist and canUse reflects state) passes | Re-run independently: PASS | **TRUE** |
| Acceptance check 6 (Mobile component tests pass) passes | Re-run independently: PASS | **TRUE** |
| Acceptance check 7 (pnpm check passes) passes | Re-run independently: PASS | **TRUE** |
| No new dependencies added | Verified via git diff on lockfile | **TRUE** |
| Outside-scope edits: `packages/db/src/migrations.test.ts` (1 line) | Documented and minimal | **TRUE** |

---

## Evidence Files Summary
- `docs/tasks/T-07/evidence/verifier-scope-check.txt`
- `docs/tasks/T-07/evidence/verifier-pnpm-check.txt`
- `docs/tasks/T-07/evidence/verifier-gateway-tests.txt`
- `docs/tasks/T-07/evidence/verifier-mobile-tests.txt`
- `docs/tasks/T-07/evidence/verifier-dynamic-table-audit.txt`
- `docs/tasks/T-07/evidence/acceptance-gateway.txt`
- `docs/tasks/T-07/evidence/acceptance-mobile.txt`
- `docs/tasks/T-07/evidence/pnpm-check.txt`
