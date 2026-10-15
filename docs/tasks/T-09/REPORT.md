# T-09 Report: Safety Layer

## Summary (3 sentences)
Built a multi-tiered safety architecture featuring a deterministic rule-based crisis pre-filter in `@yikes/shared` (English and Hinglish), prompt-injection defense with role token neutralization, scenario exclusion filters, and clinical/human-claim output guards. Implemented the gateway checker orchestrating fast pre-filtering with `MODEL_SAFETY` analysis, incorporating a fail-safe degraded mode when the model is unreachable, and exposed an authenticated `POST /v1/safety/check` endpoint with privacy-guaranteed metadata-only logging (`safety_events`). Completed mobile client integration via the `useSafetyRoute` navigation hook, validated with 100% recall across crisis fixtures, zero false positives on benign awkward-conversation expressions, and verified zero message text logging.

## What I built (one line per file)
- `packages/shared/src/safety/crisis-terms.ts`: High-recall English and Hinglish rule-based crisis detector with idiomatic awkward-conversation exemptions.
- `packages/shared/src/safety/__tests__/crisis-terms.test.ts`: Vitest suite proving 30 benign awkward phrases pass and 20 crisis phrases flag with 100% recall.
- `services/gateway/src/safety/injection.ts`: Prompt injection guard with `<user_message>` envelope, token sanitization, and `buildSafeMessages()`.
- `services/gateway/src/safety/scenarios.ts`: Scenario exclusion validator rejecting abuse, bereavement, confronting harm, harassment reporting, and medical news.
- `services/gateway/src/safety/output-guard.ts`: Output guard rejecting claims of being human and forbidding clinical therapy terms (`treat`, `cure`, `therapy`, `diagnose`).
- `services/gateway/src/safety/resources.ts`: Crisis resource parser for `docs/spec/crisis-resources.md` refusing missing or UNVERIFIED resources.
- `services/gateway/src/safety/checker.ts`: Gateway safety engine combining rule pre-filters, model evaluation, and resilient degraded fallback mode.
- `services/gateway/src/routes/safety.ts`: Fastify route `POST /v1/safety/check` with JWT authentication and privacy-preserving `safety_events` logging.
- `services/gateway/src/safety/__tests__/safety.test.ts`: Comprehensive test suite verifying all 4 acceptance checks, degraded mode, and privacy guarantees.
- `services/gateway/src/safety/__tests__/route.test.ts`: Route integration tests verifying 401 unauthenticated rejection and metadata-only logging.
- `apps/mobile/src/features/safety/useSafetyRoute.ts`: Mobile hook navigating to `/support` when gateway safety verdict is crisis.
- `apps/mobile/src/features/safety/__tests__/useSafetyRoute.test.ts`: Unit tests verifying hook navigation on crisis and non-navigation on allow/block.
- `docs/tasks/T-09/evidence/check-1-shared-tests.txt`: Evidence of shared crisis terms test run (30 benign, 20 crisis).
- `docs/tasks/T-09/evidence/check-1-2-3-4-gateway-safety-tests.txt`: Evidence of gateway safety tests (all 4 acceptance checks).
- `docs/tasks/T-09/evidence/check-route-tests.txt`: Evidence of `POST /v1/safety/check` route tests.
- `docs/tasks/T-09/evidence/check-mobile-hook-test.txt`: Evidence of mobile `useSafetyRoute` hook tests.
- `docs/tasks/T-09/evidence/check-pnpm-check.txt`: Evidence of monorepo-wide lint, typecheck, and test completion.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| --- | --- | --- | --- |
| 1. Fixtures: 30 benign allowed, 20 crisis flagged, 10 injection neutralized | `pnpm --filter @yikes/gateway test src/safety/__tests__/safety.test.ts` | PASSED (0 false positives on benign, 100% crisis recall, 10 injection strings safely neutralized) | `docs/tasks/T-09/evidence/check-1-2-3-4-gateway-safety-tests.txt` |
| 2. Degraded mode flags crisis fixtures when model is down | `pnpm --filter @yikes/gateway test src/safety/__tests__/safety.test.ts` | PASSED (all 20 crisis fixtures flagged in degraded mode; benign allowed with `degraded: true`) | `docs/tasks/T-09/evidence/check-1-2-3-4-gateway-safety-tests.txt` |
| 3. Test proves no message text in safety_events or logs | `pnpm --filter @yikes/gateway test src/safety/__tests__/safety.test.ts` | PASSED (DB insert payload has kind & source only; Pino logger redacts sensitive message text) | `docs/tasks/T-09/evidence/check-1-2-3-4-gateway-safety-tests.txt` |
| 4. Resource loader refuses file with UNVERIFIED entries | `pnpm --filter @yikes/gateway test src/safety/__tests__/safety.test.ts` | PASSED (loads verified resources cleanly; throws error and refuses UNVERIFIED entries or missing file) | `docs/tasks/T-09/evidence/check-1-2-3-4-gateway-safety-tests.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- `packages/shared/src/safety/crisis-terms.ts`: DONE (`packages/shared/src/safety/crisis-terms.ts` L1-L150)
- `services/gateway/src/safety/checker.ts`: DONE (`services/gateway/src/safety/checker.ts` L1-L148)
- `services/gateway/src/safety/scenarios.ts`: DONE (`services/gateway/src/safety/scenarios.ts` L1-L105)
- `services/gateway/src/safety/injection.ts`: DONE (`services/gateway/src/safety/injection.ts` L1-L74)
- `services/gateway/src/safety/output-guard.ts`: DONE (`services/gateway/src/safety/output-guard.ts` L1-L68)
- `services/gateway/src/safety/resources.ts`: DONE (`services/gateway/src/safety/resources.ts` L1-L135)
- `services/gateway/src/routes/safety.ts`: DONE (`services/gateway/src/routes/safety.ts` L1-L127)
- `apps/mobile/src/features/safety/useSafetyRoute.ts`: DONE (`apps/mobile/src/features/safety/useSafetyRoute.ts` L1-L32)
- Fast rule-based crisis pre-filter (English + Hinglish): DONE (`packages/shared/src/safety/crisis-terms.ts` L23-L150)
- MODEL_SAFETY query with strict prompt: DONE (`services/gateway/src/safety/checker.ts` L33-L125)
- Degraded mode fallback: DONE (`services/gateway/src/safety/checker.ts` L127-L144)
- Scenario exclusion for 5 domains: DONE (`services/gateway/src/safety/scenarios.ts` L19-L105)
- Delimited text envelope & token removal: DONE (`services/gateway/src/safety/injection.ts` L17-L74)
- Non-human claim & clinical term output guard: DONE (`services/gateway/src/safety/output-guard.ts` L14-L68)
- Verified crisis resources loader refusing UNVERIFIED: DONE (`services/gateway/src/safety/resources.ts` L45-L60)
- Authenticated POST /v1/safety/check logging kind & source only: DONE (`services/gateway/src/routes/safety.ts` L26-L125)
- Mobile navigation hook to '/support': DONE (`apps/mobile/src/features/safety/useSafetyRoute.ts` L16-L32)

## Dependencies added (name, version, reason, licence)
None. All components use existing workspace dependencies (`zod`, `jose`, `@supabase/supabase-js`, `pino`, `vitest`, `jest`).

## Outside-scope edits (file, reason, size of change)
None. All created and modified files are strictly within `Files owned`:
- `packages/shared/src/safety/**`
- `services/gateway/src/safety/**`
- `services/gateway/src/routes/safety.ts`
- `apps/mobile/src/features/safety/**`
- `docs/tasks/T-09/**`

## UNVERIFIED items (anything you could not prove, and the fallback you built)
None. All rules, degraded fallbacks, model integrations, routes, and mobile navigation hooks have been proved through automated tests.

## Known limitations and follow-ups (each with a task id)
- T-10 will use `wrapUserText` and `buildSafeMessages` across all AI prompt templates (`PartnerTurn`, `CoachFeedback`, `ReplyHelper`).
- T-12 will invoke `checkText` before passing user messages to practice partners and check partner outputs through `checkText(output, 'output')`.
- T-22 will build the complete visual Support screen UI in `apps/mobile/app/support.tsx` displaying the static crisis resources parsed by `loadCrisisResources()`.

## Fix rounds (left empty by the Builder; filled by the Fixer)
