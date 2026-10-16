# T-12 Report: Practice Partner API and Try Chat

## Summary (3 sentences)
Implemented the Practice Partner engine and REST/SSE endpoints (`/v1/partner/start`, `/turn`, `/suggest`, `/hint`, and `/end`) in the AI Gateway with strict thought confidentiality, inbound crisis pre-filtering, mood clamping, and authored fallback degraded modes.
Built the complete Mobile Try Chat screen (Screen B7) and Free Chat screen with dynamic SVG avatar expressions reacting to partner mood, a turn pill without countdown timers, wobbling typing indicator, 8s slow reply calm thinking transition, 20s idle cue, and edge state cards for offline and daily limit reached.
Verified all functionality across 12 gateway unit tests with fake provider, 8 mobile Jest tests covering all UI states, a live 6-turn chat against NVIDIA's API with measured per-turn latencies, and clean `pnpm check` execution across all workspace packages.

## What I built (one line per file)
- `services/gateway/src/partner/types.ts`: Partner request and response schemas, Zod validators, and attempt/turn types.
- `services/gateway/src/partner/fallbackLines.ts`: Authored character fallback responses and default Maya persona card for offline and degraded modes.
- `services/gateway/src/partner/engine.ts`: Core partner loop executing safety prefilter, prompt construction, mood clamping (max 0.15 step), output guardrails, daily turn caps, and thought persistence.
- `services/gateway/src/partner/live-smoke.ts`: Live smoke testing script executing a 6-turn chat against NVIDIA API and logging per-turn latencies.
- `services/gateway/src/partner/__tests__/partner.test.ts`: Vitest test suite testing start, turn, mood clamp, crisis, schema retry, fallback lines, thoughts hidden until end, and zero message text in logs.
- `services/gateway/src/routes/partner.ts`: Fastify route handler registering POST `/v1/partner/start`, `/turn` (with SSE streaming), `/suggest`, `/hint`, and `/end`.
- `apps/mobile/src/copy/try.ts`: User-facing copy for Try screen, turns, hints, pass button, idle cue, thinking state, offline and cap cards.
- `apps/mobile/src/features/try/partnerApi.ts`: HTTP and SSE client for gateway partner endpoints with error handling and fallback support.
- `apps/mobile/src/features/try/useTrySession.ts`: React hook managing chat session lifecycle, mood-to-expression mapping, 8s slow reply timer, 20s idle cue timer, and turns.
- `apps/mobile/src/features/try/__tests__/try.test.tsx`: Jest test suite testing normal chat, typing indicator, 20s idle line, 8s thinking state, offline state, and daily cap reached.
- `apps/mobile/app/session/[id]/try.tsx`: Full implementation of Screen B7 Try chat screen per specifications.
- `apps/mobile/app/tools/free-chat.tsx`: Free chat screen using the partner engine in free mode with no turn limit.
- `docs/tasks/T-12/evidence/check-1-gateway-partner-tests.txt`: Command output of gateway partner tests (12 passed).
- `docs/tasks/T-12/evidence/check-2-mobile-try-tests.txt`: Command output of mobile Try screen tests (8 passed).
- `docs/tasks/T-12/evidence/check-3-live-nvidia-smoke.txt`: Output and latency table of the 6-turn live chat against NVIDIA API.
- `docs/tasks/T-12/evidence/check-4-pnpm-check.txt`: Command output of full workspace `pnpm check`.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| :--- | :--- | :--- | :--- |
| 1. Gateway tests with fake provider (schema retry, mood clamp, crisis returns no AI text, cap enforced, thought hidden until end, fallback lines on provider failure) | `pnpm -C services/gateway test src/partner/__tests__/partner.test.ts` | PASS (12 tests passed) | `docs/tasks/T-12/evidence/check-1-gateway-partner-tests.txt` |
| 2. App tests for each state (normal chat, typing indicator, 20s idle line, 8s slow reply thinking state, offline state, cap reached state) | `pnpm -C apps/mobile test src/features/try/__tests__/try.test.tsx` | PASS (8 tests passed) | `docs/tasks/T-12/evidence/check-2-mobile-try-tests.txt` |
| 3. Live 6-turn chat against NVIDIA API with per-turn latency table | `pnpm --filter @yikes/gateway exec tsx src/partner/live-smoke.ts` | PASS (6 turns completed, avg latency 33.5s) | `docs/tasks/T-12/evidence/check-3-live-nvidia-smoke.txt` |
| 4. Zero message text in logs & full monorepo check | `pnpm check` | PASS (lint, typecheck, and all test suites green) | `docs/tasks/T-12/evidence/check-4-pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- POST /v1/partner/start: creates attempt row and returns opening line and initial mood: **DONE** (`services/gateway/src/routes/partner.ts#L88-L125`, `services/gateway/src/partner/engine.ts#L84-L188`)
- POST /v1/partner/turn inbound safety check (crisis returns {crisis:true} with NO AI text): **DONE** (`services/gateway/src/partner/engine.ts#L210-L235`)
- Prompt constructed via buildPartnerTurnPrompt: **DONE** (`services/gateway/src/partner/engine.ts#L248-L260`)
- Mood clamped to max 0.15 step via clampMood: **DONE** (`services/gateway/src/partner/engine.ts#L303-L305`)
- Output guardrail and outbound safety check applied: **DONE** (`services/gateway/src/partner/engine.ts#L306-L331`)
- Thought stored in turns table but strictly omitted from turn response: **DONE** (`services/gateway/src/partner/engine.ts#L338-L362`, verified in `services/gateway/src/partner/__tests__/partner.test.ts#L91-L157`)
- SSE streaming events (typing, reply, done) & JSON fallback: **DONE** (`services/gateway/src/routes/partner.ts#L146-L208`)
- POST /v1/partner/suggest returns 3 suggestions in user's register: **DONE** (`services/gateway/src/routes/partner.ts#L225-L251`, `services/gateway/src/partner/engine.ts#L367-L432`)
- POST /v1/partner/hint returns 1 coaching idea: **DONE** (`services/gateway/src/routes/partner.ts#L254-L280`, `services/gateway/src/partner/engine.ts#L437-L499`)
- POST /v1/partner/end ends attempt and reveals inner thoughts: **DONE** (`services/gateway/src/routes/partner.ts#L283-L313`, `services/gateway/src/partner/engine.ts#L504-L540`)
- Turn caps enforced (try 6, warmup 4, free unlimited): **DONE** (`services/gateway/src/partner/engine.ts#L57-L68`, `services/gateway/src/partner/engine.ts#L333-L336`)
- Provider failure fallback model then authored character lines with degraded: true: **DONE** (`services/gateway/src/partner/engine.ts#L278-L301`)
- Header with partner avatar whose expression dynamically follows mood: **DONE** (`apps/mobile/app/session/[id]/try.tsx#L70-L86`, `apps/mobile/src/features/try/useTrySession.ts#L25-L37`)
- Turn counter pill with strictly no countdown timer: **DONE** (`apps/mobile/app/session/[id]/try.tsx#L102-L119`)
- Left-aligned partner bubbles in surface tint, right-aligned user bubbles in Lilac: **DONE** (`apps/mobile/app/session/[id]/try.tsx#L173-L186`)
- Wobbling typing indicator in partner accent color: **DONE** (`apps/mobile/app/session/[id]/try.tsx#L189-L204`)
- 3 suggested reply chips dropping into input field: **DONE** (`apps/mobile/app/session/[id]/try.tsx#L252-L278`, `apps/mobile/src/features/try/useTrySession.ts#L248-L252`)
- Quiet Pass link and Need a hint button: **DONE** (`apps/mobile/app/session/[id]/try.tsx#L320-L347`)
- Faint 20s idle cue line: **DONE** (`apps/mobile/app/session/[id]/try.tsx#L207-L213`, `apps/mobile/src/features/try/useTrySession.ts#L79-L87`)
- 8s slow reply switching from typing to calm "Maya is thinking": **DONE** (`apps/mobile/app/session/[id]/try.tsx#L196-L203`, `apps/mobile/src/features/try/useTrySession.ts#L175-L180`)
- Edge states (offline card, daily cap reached card, silent retry): **DONE** (`apps/mobile/app/session/[id]/try.tsx#L137-L170`, `apps/mobile/src/features/try/useTrySession.ts#L182-L245`)
- Route transition to Coach screen with attemptId on finish: **DONE** (`apps/mobile/src/features/try/useTrySession.ts#L273-L285`)
- Free chat screen with partner engine in free mode: **DONE** (`apps/mobile/app/tools/free-chat.tsx#L1-L300`)

## Dependencies added (name, version, reason, licence)
- `@yikes/ai-prompts`: `workspace:*`, internal monorepo package added to `services/gateway/package.json` to import prompt schemas, types, versions, and `buildPartnerTurnPrompt` as mandated by contract, MIT licence.

## Outside-scope edits (file, reason, size of change)
- `services/gateway/package.json`: Added `"@yikes/ai-prompts": "workspace:*"` under dependencies (1 line). Required so the gateway service can resolve imports from `@yikes/ai-prompts` per T-12 contract.

## UNVERIFIED items (anything you could not prove, and the fallback you built)
None. All components, contracts, API routes, streaming, safety routes, and tests have been verified and demonstrated.

## Known limitations and follow-ups (each with a task id)
- Coach feedback generation and verbatim quote verification after completion (T-13).
- Additional authored persona definitions and situation levels (T-14).
- Warm-up chat flow wiring during onboarding session runner (T-15).

## Fix rounds (left empty by the Builder; filled by the Fixer)
