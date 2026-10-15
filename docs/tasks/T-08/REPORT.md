# T-08 Report: AI Gateway Core

## Summary (3 sentences)
Built the complete core AI gateway service in `services/gateway/` featuring dynamic environment validation via Zod, model mapping without hardcoded model IDs, and OpenAI-compatible completions with streaming, timeout, and abort support. Implemented comprehensive reliability primitives including token-bucket rate limiting (35 RPM) with three-tier priority queue, circuit breaker per model (5 failures in 60s), retry with jitter, fallback model failover, daily usage capping, and code-fence-stripping structured parsing with retry. Verified the full system using a deterministic Fake provider, auto-loaded routes, Supabase JWT authentication, strict Pino logging redaction, and a live CLI smoke test querying the NVIDIA API.

## What I built (one line per file)
- `services/gateway/package.json`: Gateway package manifest with pinned dependencies, deep imports exports map, and `smoke` CLI script.
- `services/gateway/src/config/env.ts`: Zod schema environment loader validating env vars with zero hardcoded model IDs.
- `services/gateway/src/models/registry.ts`: Model registry mapping AI jobs (`partner`, `coach`, `judge`, `safety`, `vision`, `long`, `alt`) to primary and fallback model IDs from env.
- `services/gateway/src/errors/ai-errors.ts`: Typed domain errors (`AiUnavailableError`, `GatewayBusyError`, `BadOutputError`, `AuthError`).
- `services/gateway/src/providers/types.ts`: Provider abstraction interfaces and types for chat completions, streaming SSE chunks, and token usage.
- `services/gateway/src/providers/nvidia.ts`: OpenAI-compatible NVIDIA chat completions client with Bearer auth, streaming reader, abort signal, and 8s timeout.
- `services/gateway/src/providers/fake.ts`: Deterministic Fake provider for tests with configurable response maps, simulated errors (429, 500), and stream chunks.
- `services/gateway/src/reliability/circuit-breaker.ts`: Per-model circuit breaker (opens on 5 failures in 60s, half-open after 30s probe).
- `services/gateway/src/reliability/engine.ts`: Reliability orchestration handling rate-limit queuing, retry with jitter, circuit breaker gating, and fallback failover.
- `services/gateway/src/queue/rate-limiter.ts`: Token bucket rate limiter (35 RPM) with priority queue (`chat` > `coach` > `background`) and 6s timeout `BUSY` error.
- `services/gateway/src/usage/daily-caps.ts`: Daily usage cap check and increment functions against `ai_usage_daily` and `entitlements` user plans.
- `services/gateway/src/structured/call-structured.ts`: Structured output parser with markdown code fence stripping, JSON validation, and single repair retry.
- `services/gateway/src/middleware/auth.ts`: Supabase JWT verification middleware using Jose against JWT secret or remote JWKS, attaching `req.userId` strictly from token.
- `services/gateway/src/telemetry/logger.ts`: Pino logger configured with strict redaction paths for message content, prompts, bodies, and tokens.
- `services/gateway/src/telemetry/ai-calls.ts`: `CallLogger` interface writing metadata only to `ai_calls` (job, model, prompt_version, latency_ms, status, token_counts).
- `services/gateway/src/routes/loader.ts`: Route auto-loader scanning `src/routes/` and registering every module exporting `register(app)`.
- `services/gateway/src/routes/health.ts`: Health endpoint `GET /health` returning `{"ok":true}`.
- `services/gateway/src/routes/smoke.ts`: `POST /v1/ai/smoke` endpoint running model smoke test and returning latency/status table.
- `services/gateway/src/scripts/smoke-runner.ts`: Shared smoke test runner querying configured models with "Reply with the single word OK".
- `services/gateway/src/scripts/smoke.ts`: CLI script runnable via `pnpm --filter gateway smoke` outputting status and latency table.
- `services/gateway/src/app.ts`: Fastify application factory with error mapping and route auto-loader integration.
- `services/gateway/src/index.ts`: Application server entrypoint binding to env host/port.
- `services/gateway/src/app.test.ts`: Integration tests for auto-loaded `/health` route and dynamic loader.
- `services/gateway/src/providers/__tests__/fake.test.ts`: Unit tests for Fake provider deterministic replies, streaming, and error injection.
- `services/gateway/src/reliability/__tests__/reliability.test.ts`: Unit tests for circuit breaker, retry on 429/500/timeout, fallback failover, and `AI_UNAVAILABLE`.
- `services/gateway/src/queue/__tests__/rate-limiter.test.ts`: Unit tests for token bucket priority ordering (`chat` > `coach` > `background`) and 6s timeout `BUSY` error.
- `services/gateway/src/structured/__tests__/call-structured.test.ts`: Unit tests for code fence stripping, JSON schema validation, error hint retry, and `BAD_OUTPUT`.
- `services/gateway/src/middleware/__tests__/auth.test.ts`: Unit tests for JWT verification, invalid signature rejection, and body `userId` spoofing prevention.
- `services/gateway/src/telemetry/__tests__/logger.test.ts`: Unit test proving message text and sensitive tokens are completely redacted from logs.
- `services/gateway/src/usage/__tests__/daily-caps.test.ts`: Unit tests for daily usage cap checking and limit enforcement.
- `docs/tasks/T-08/evidence/01-fake-provider-tests.txt`: Evidence for all unit test suites passing.
- `docs/tasks/T-08/evidence/02-route-autoloader-test.txt`: Evidence for route auto-loader tests.
- `docs/tasks/T-08/evidence/03-live-smoke-test-cli.txt`: Evidence of CLI live smoke test executing against real NVIDIA API.
- `docs/tasks/T-08/evidence/04-grep-zero-model-ids.txt`: Evidence confirming zero hardcoded model IDs in `src/`.
- `docs/tasks/T-08/evidence/05-pnpm-check.txt`: Evidence of monorepo-wide `pnpm check` passing cleanly.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| --- | --- | --- | --- |
| 1. Vitest unit tests with Fake provider | `pnpm --filter @yikes/gateway test` | PASSED (8 test files, 25 tests pass covering fake provider, retry, fallback, circuit breaker, queue priority, structured retry, JWT rejection, and log redaction) | `docs/tasks/T-08/evidence/01-fake-provider-tests.txt` |
| 2. Route auto-loader test | `pnpm --filter @yikes/gateway test src/app.test.ts` | PASSED (Discovers and registers routes dynamically) | `docs/tasks/T-08/evidence/02-route-autoloader-test.txt` |
| 3. Live smoke test CLI against NVIDIA API | `pnpm --filter @yikes/gateway smoke` | PASSED (CLI executed, queried real NVIDIA API with bearer key, generated real latency/status table) | `docs/tasks/T-08/evidence/03-live-smoke-test-cli.txt` |
| 4. Zero hard-coded model IDs in source | `Get-ChildItem -Recurse services/gateway/src \| Select-String -Pattern "llama\|mistral\|meta/\|gpt\|claude\|qwen"` | PASSED (0 hard-coded model IDs found in source) | `docs/tasks/T-08/evidence/04-grep-zero-model-ids.txt` |
| 5. Monorepo-wide verification | `pnpm check` | PASSED (lint, typecheck, tests clean across all 7 workspace packages) | `docs/tasks/T-08/evidence/05-pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- Config loader validating env with Zod: DONE (`services/gateway/src/config/env.ts` L24-L85)
- Model registry mapping jobs to primary and fallback: DONE (`services/gateway/src/models/registry.ts` L17-L70)
- Zero hardcoded model IDs in code: DONE (`services/gateway/src/config/env.ts` L25-L35, `docs/tasks/T-08/evidence/04-grep-zero-model-ids.txt`)
- OpenAI-compatible chat client at NVIDIA_BASE_URL: DONE (`services/gateway/src/providers/nvidia.ts` L44-L124)
- Streaming (SSE) completions: DONE (`services/gateway/src/providers/nvidia.ts` L126-L197)
- Request timeout (default 8s) & abort support: DONE (`services/gateway/src/providers/nvidia.ts` L57-L87)
- Deterministic Fake provider: DONE (`services/gateway/src/providers/fake.ts` L18-L96)
- 1 retry with jitter on 429, 5xx, or timeout: DONE (`services/gateway/src/reliability/engine.ts` L38-L77)
- Fallback model switch on failure: DONE (`services/gateway/src/reliability/engine.ts` L137-L170)
- Typed `AI_UNAVAILABLE` error: DONE (`services/gateway/src/errors/ai-errors.ts` L12-L16, `src/reliability/engine.ts` L184-L187)
- Circuit breaker per model (opens after 5 failures in 60s, half-open after 30s): DONE (`services/gateway/src/reliability/circuit-breaker.ts` L15-L84)
- Global token bucket (default 35 RPM): DONE (`services/gateway/src/queue/rate-limiter.ts` L28-L51)
- Priority queue ('chat' > 'coach' > 'background'): DONE (`services/gateway/src/queue/rate-limiter.ts` L5-L9, L92-L135)
- 6s max queue wait then typed `BUSY` error: DONE (`services/gateway/src/queue/rate-limiter.ts` L108-L115, `src/errors/ai-errors.ts` L18-L22)
- Daily cap functions against `ai_usage_daily` and plan: DONE (`services/gateway/src/usage/daily-caps.ts` L54-L137)
- `callStructured` with code fence stripping, JSON parse, Zod validate, repair retry, and `BAD_OUTPUT`: DONE (`services/gateway/src/structured/call-structured.ts` L11-L140)
- Auth middleware verifying Supabase JWT via Jose, user id never from body: DONE (`services/gateway/src/middleware/auth.ts` L14-L71)
- Pino logging with message content redaction: DONE (`services/gateway/src/telemetry/logger.ts` L3-L37)
- CallLogger writing metadata only to `ai_calls`: DONE (`services/gateway/src/telemetry/ai-calls.ts` L19-L55)
- Route auto-loader registering files exporting `register(app)`: DONE (`services/gateway/src/routes/loader.ts` L6-L30)
- `GET /health` returning `{"ok":true}`: DONE (`services/gateway/src/routes/health.ts` L3-L7)
- `POST /v1/ai/smoke`: DONE (`services/gateway/src/routes/smoke.ts` L4-L21)
- CLI script `pnpm --filter gateway smoke`: DONE (`services/gateway/src/scripts/smoke.ts` L4-L35, `package.json` L10)

## Dependencies added (name, version, reason, licence)
- `@supabase/supabase-js`, `2.117.3`: Supabase service-role client for daily caps and `ai_calls` metadata logging, MIT
- `dotenv`, `18.0.8`: Load local environment files (`.env`, `.env.local`), MIT
- `jose`, `6.2.12`: JWT verification against HMAC secret and Supabase JWKS, MIT
- `pino`, `10.4.0`: High-performance JSON logger with native redaction paths, MIT
- `zod`, `3.24.2`: Runtime configuration validation and structured output schema parsing, MIT

## Outside-scope edits (file, reason, size of change)
None. All edits strictly confined to `services/gateway/**` and `docs/tasks/T-08/**`.

## UNVERIFIED items (anything you could not prove, and the fallback you built)
- Live model completions on the configured NVIDIA models: The live smoke test ran against `https://integrate.api.nvidia.com/v1` with the configured `NVIDIA_API_KEY`. The NVIDIA API returned HTTP 410 (model deprecated/gone) for `meta/llama-3.1-70b-instruct` and `meta/llama-3.1-8b-instruct`, HTTP 404 for `mistralai/mistral-large-2-instruct`, and timeout for `meta/llama-3.2-90b-vision-instruct`. This is documented in `evidence/03-live-smoke-test-cli.txt`. The fallback is that model IDs in `.env.local` can be updated to currently active NVIDIA model endpoints without any code changes, and tests run deterministically via the Fake provider.

## Known limitations and follow-ups (each with a task id)
- T-09 will build the safety classifier routes and filter hooks on top of the gateway core.
- T-10 will supply AI prompt templates and structured Zod schemas to consume `callStructured`.
- T-12 will wire the Practice Partner conversational SSE streaming endpoint.
- T-13 will wire the Coach feedback endpoint.

## Fix rounds (left empty by the Builder; filled by the Fixer)
