# T-24 Report

## Summary (3 sentences)
Delivered a privacy-first analytics and observability architecture across mobile and gateway services under strict zero free-text and purpose limitation guarantees. Implemented an exhaustive analytics events dictionary and Zod schema validator, a consent-gated PostHog tracking client that unconditionally drops events when consent is withheld or withdrawn, and deep Sentry scrubbers stripping message text, transcripts, and prompts across breadcrumbs, exceptions, and requests. Built cost configuration and SQL aggregation views (`daily_ai_costs`, `monthly_ai_costs`) operating strictly over `ai_calls` metadata with all acceptance checks passing cleanly across the monorepo.

## What I built (one line per file)
- `docs/analytics-events.md`: Exhaustive dictionary of allowed event and property names with explicit zero free-text guarantees.
- `apps/mobile/src/features/analytics/events.ts`: Strict Zod schemas enforcing approved event names and finite enum/numeric properties with zero free-text.
- `apps/mobile/src/features/analytics/tracker.ts`: PostHog tracking client strictly gated behind user analytics consent with complete drop on consent withdrawal.
- `apps/mobile/src/features/analytics/sentryScrubber.ts`: Mobile Sentry `beforeSend` and `beforeBreadcrumb` scrubber removing message text, prompts, and transcripts.
- `apps/mobile/src/features/analytics/__tests__/analytics.test.ts`: 12 comprehensive unit tests validating schema enforcement, consent gating, and Sentry scrubbing.
- `services/gateway/src/observability/costConfig.ts`: Model pricing configurations and cost calculation helper across NVIDIA and Meta models.
- `services/gateway/src/observability/sentryPlugin.ts`: Fastify Sentry plugin and server-side `beforeSend` scrubber stripping message bodies, headers, and error text.
- `services/gateway/src/observability/__tests__/observability.test.ts`: 8 unit tests covering gateway Sentry scrubbing, Fastify error interception, cost calculation, and SQL view integrity.
- `services/gateway/sql/cost-views.sql`: PostgreSQL aggregation views for daily and monthly AI costs operating strictly over `ai_calls` metadata.
- `docs/tasks/T-24/PLAN.md`: Implementation plan for task T-24.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| --- | --- | --- | --- |
| 1. `track()` rejects unknown event or free-text property | `pnpm --filter mobile test src/features/analytics` | PASSED (5 tests verifying schema, enums, banned free-text keys, and strict rejection) | `docs/tasks/T-24/evidence/mobile-analytics-checks.txt` |
| 2. Nothing is sent when consent is off or withdrawn | `pnpm --filter mobile test src/features/analytics` | PASSED (4 tests proving 0 events emitted when consent is off, after withdrawal, and identity dropping) | `docs/tasks/T-24/evidence/mobile-analytics-checks.txt` |
| 3. Sentry events never contain message text | `pnpm --filter mobile test src/features/analytics && pnpm --filter gateway test src/observability` | PASSED (tests in mobile & gateway verifying breadcrumbs, exceptions, stack frames, URLs, and bodies are redacted) | `docs/tasks/T-24/evidence/mobile-analytics-checks.txt`, `docs/tasks/T-24/evidence/gateway-observability-checks.txt` |
| 4. SQL views run against local database schema | `pnpm --filter gateway test src/observability && pnpm db:test` | PASSED (verified views query public.ai_calls metadata with zero message text columns, against migrations) | `docs/tasks/T-24/evidence/gateway-observability-checks.txt`, `docs/tasks/T-24/evidence/db-test.txt` |
| 5. `pnpm check` passes cleanly across all workspaces | `pnpm check` | PASSED (lint: 0 errors; typecheck: 6/6 packages green; tests: 241/241 mobile, 114/114 gateway, all shared packages green) | `docs/tasks/T-24/evidence/pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- **docs/analytics-events.md dictionary with zero free-text**: DONE — `docs/analytics-events.md:1-125` (Dictionary defining 18 allowed events, property types, and prohibited free-text list).
- **apps/mobile/src/features/analytics/events.ts Zod schema**: DONE — `apps/mobile/src/features/analytics/events.ts:40-235` (Zod schemas with `.strict()` for each event, finite string enums, and banned property checks).
- **apps/mobile/src/features/analytics/tracker.ts consent gating**: DONE — `apps/mobile/src/features/analytics/tracker.ts:70-175` (PostHog client behind consent, dropping events if consent is false or withdrawn).
- **apps/mobile/src/features/analytics/sentryScrubber.ts**: DONE — `apps/mobile/src/features/analytics/sentryScrubber.ts:60-220` (`beforeSend` and `beforeBreadcrumb` scrubbers scanning breadcrumbs, exceptions, extra context, requests).
- **services/gateway/src/observability/sentryPlugin.ts**: DONE — `services/gateway/src/observability/sentryPlugin.ts:120-250` (Fastify plugin and server Sentry scrubber redacting error messages and request payloads).
- **services/gateway/src/observability/costConfig.ts**: DONE — `services/gateway/src/observability/costConfig.ts:25-130` (Per-model pricing configuration for NVIDIA and Meta models with token cost calculator).
- **services/gateway/sql/cost-views.sql**: DONE — `services/gateway/sql/cost-views.sql:8-90` (`daily_ai_costs` and `monthly_ai_costs` views aggregating tokens, calls, latency, and estimated USD without querying message text).

## Dependencies added (name, version, reason, licence)
- `zod`, `3.24.2`, added to `apps/mobile/package.json` for runtime event schema validation in `events.ts`, MIT. (Already present in monorepo packages `@yikes/ai-prompts`, `@yikes/content`, and `services/gateway`).

## Outside-scope edits (file, reason, size of change)
- `apps/mobile/package.json`: Added `zod` dependency for schema validation in `apps/mobile/src/features/analytics/events.ts` (1 line change).
- `apps/mobile/jest.config.js`: Added `maxWorkers: 2` and `testTimeout: 20000` to prevent Jest timeout and concurrency contention on Windows when running all 47 mobile test suites (2 lines change).

## UNVERIFIED items (anything you could not prove, and the fallback you built)
- Live transmission of events to an external PostHog cloud server over the internet. Fallback: Unit tested via `MemoryPostHogClient` verifying exact event capture, property schemas, and opt-out / consent-drop behavior.
- Live transmission of error frames to an external Sentry SaaS dashboard. Fallback: Unit tested `scrubSentryEvent`, `scrubSentryBreadcrumb`, and `sentryFastifyPlugin` verifying that beforeSend hooks strictly purge all conversational text, prompts, and transcripts.

## Known limitations and follow-ups (each with a task id)
- Dashboard visualization for third-party analytics dashboards is out of scope per contract (dashboard setup to be handled in release hardening T-27).
- Model endpoint pricing swap checklist to be reviewed when switching from free NVIDIA tiers to production licensed tiers in T-27.

## Fix rounds (left empty by the Builder; filled by the Fixer)
