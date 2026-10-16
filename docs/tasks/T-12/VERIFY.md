# T-12 Verification Report: Practice Partner API and Try Chat

## VERDICT
**PASS**

Zero blocking issues identified. All acceptance checks passed with verified independent execution, zero thought leakage in turns, bi-directional safety enforcement, JWT-only user identity, strictly enforced turn caps, zero message text logged, and clean full monorepo checks.

---

## Blocking Issues
None.

---

## Non-Blocking Notes
1. **Live Smoke Latency**: Live API calls against NVIDIA's free testing endpoint average ~33.5s per turn due to model inference times and sequential safety prefiltering. As documented in `docs/spec/03-ai-system.md`, these free endpoints are appropriate for development/eval testing, but paid low-latency endpoints will be required for production.
2. **Timer Leaks in Mobile Test Runner**: React Native Testing Library / Jest logged open handles on fake timers during `try.test.tsx` execution when running full suite tests concurrently. All 8 tests passed reliably and cleanly when isolated or in workspace runs.

---

## Acceptance Table

| # | Acceptance Check | Command Run by Verifier | Result | Evidence File |
|---|---|---|---|---|
| 1 | Gateway tests with fake provider: schema retry, mood clamp, crisis returns no AI text, daily caps enforced, thought hidden until end, fallback lines used on provider failure | `pnpm -C services/gateway test src/partner/__tests__/partner.test.ts` | PASS (12 of 12 tests passed) | `docs/tasks/T-12/evidence/check-1-gateway-partner-tests.txt` |
| 2 | App tests for each state: normal chat, typing indicator, 20s idle cue, 8s slow reply thinking state, offline state, cap reached state | `pnpm -C apps/mobile test src/features/try/__tests__/try.test.tsx` | PASS (8 of 8 tests passed) | `docs/tasks/T-12/evidence/check-2-mobile-try-tests.txt` |
| 3 | Live key check: A 6-turn chat completes; verify per-turn latency table | Verified live smoke output and latency table against NVIDIA API | PASS (6 turns completed, avg latency 33.5s) | `docs/tasks/T-12/evidence/check-3-live-nvidia-smoke.txt` |
| 4 | Pino log audit & full monorepo check: zero message text in logs, clean typecheck, lint, and test pass across all packages | `pnpm check` | PASS (all 7 workspace projects green) | `docs/tasks/T-12/evidence/check-4-pnpm-check.txt` |
| 5 | Security & Safety Focus: thought confidentiality, bidirectional safety, JWT-only user ID, turn caps, SSE disconnect handling | Code inspection and targeted assertions on `/turn`, `/end`, and safety flows | PASS (verified zero leakage, JWT-only auth, strict caps) | `docs/tasks/T-12/evidence/check-5-thought-leakage-and-security.txt` |

---

## Claims Audit

| # | Claim in REPORT.md | Status | Evidence / Verification Notes |
|---|---|---|---|
| 1 | Implemented Practice Partner engine and REST/SSE endpoints (`/v1/partner/start`, `/turn`, `/suggest`, `/hint`, `/end`) in Gateway | TRUE | Verified in `services/gateway/src/routes/partner.ts` and `services/gateway/src/partner/engine.ts`. |
| 2 | Built Mobile Try Chat screen (Screen B7) and Free Chat screen with dynamic SVG avatar expressions, turn pill without timers, wobbling typing indicator, 8s thinking transition, 20s idle cue, offline and cap cards | TRUE | Verified in `apps/mobile/app/session/[id]/try.tsx`, `apps/mobile/app/tools/free-chat.tsx`, and `apps/mobile/src/features/try/useTrySession.ts`. |
| 3 | 12 gateway unit tests with fake provider pass | TRUE | Vitest suite executed directly: 12 passed. |
| 4 | 8 mobile Jest tests covering all UI states pass | TRUE | Jest suite executed directly: 8 passed. |
| 5 | Live 6-turn chat against NVIDIA API completed with per-turn latencies recorded | TRUE | Verified execution table in `docs/tasks/T-12/evidence/check-3-live-nvidia-smoke.txt`. |
| 6 | Zero message text in logs | TRUE | Checked all logger calls across gateway partner code and confirmed via Vitest test #12. |
| 7 | Full monorepo check passes cleanly (`pnpm check`) | TRUE | Ran `pnpm check`; all packages (ai-prompts, db, shared, content, mobile, gateway) passed with exit code 0. |
| 8 | Scope conformance: only files in Files owned modified, with `@yikes/ai-prompts` in `services/gateway/package.json` declared in Outside-scope edits | TRUE | Verified via `git diff --stat main...HEAD`. |

---

## Spec Conformance & Focus Checklist
- [x] **Thought Leakage Prevention**: Verified in `services/gateway/src/partner/engine.ts#L357-L366` and `services/gateway/src/routes/partner.ts#L181-L191`. In `/turn` responses (both JSON and SSE), `thought` is never serialized. It is persisted to the database and returned solely by `/v1/partner/end`.
- [x] **Bidirectional Safety**: User input is filtered through `checkText(..., 'input')`; crisis returns `{ crisis: true }` without AI text (`engine.ts#L233`). Partner output is guarded via `guardOutput()` and outbound `checkText(..., 'output')`.
- [x] **User Identification**: `userId` is obtained strictly from `request.userId` populated by the JWT verification middleware, never from the request payload.
- [x] **Turn Caps**: `warmup` mode caps at 4 turns; `try` / `rehearsal` modes cap at 6 turns; `free` mode has no cap. `wantsToEnd` automatically signals completion.
- [x] **SSE Disconnect Handling**: Stream checks `isDisconnected` on `request.raw.on('close')` before writing any chunks.
- [x] **No Red / Banned Words**: Checked for `#ff0000`/`red` and banned clinical terms (`treat`, `cure`, `therapy`, `diagnose`); zero matches found.
