# Implementation Plan: T-24 — Analytics and Observability

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-24)
- **Specs**:
  - `docs/spec/06-data-safety.md`
  - `docs/spec/08-acceptance.md`
- **Risk Level**: **RISKY** (privacy critical)

---

## 1. Files Owned & Scope
- `docs/analytics-events.md`
- `apps/mobile/src/features/analytics/**`
  - `events.ts`
  - `tracker.ts`
  - `sentryScrubber.ts`
  - `__tests__/analytics.test.ts`
- `services/gateway/src/observability/**`
  - `sentryPlugin.ts`
  - `costConfig.ts`
  - `__tests__/observability.test.ts`
- `services/gateway/sql/cost-views.sql`
- Documentation & Evidence:
  - `docs/tasks/T-24/PLAN.md`
  - `docs/tasks/T-24/evidence/**`
  - `docs/tasks/T-24/REPORT.md`

---

## 2. Privacy & Architectural Rules
1. **Zero Free-Text Guarantee**:
   - `docs/analytics-events.md` defines an exact dictionary of allowed event names and allowed property names.
   - `events.ts` enforces this via Zod `.strict()` schemas.
   - String properties are restricted to finite literal enums or strict UUIDs. No free-text strings are permitted.
2. **Strict Consent Gating**:
   - `tracker.ts` wraps PostHog behind `consents.analytics`.
   - If consent is `false` or withdrawn, events are dropped immediately; zero network calls or telemetry payloads are transmitted.
3. **Sentry Privacy Scrubbers**:
   - `sentryScrubber.ts` (mobile) and `sentryPlugin.ts` (gateway Fastify plugin) implement `beforeSend` and `beforeBreadcrumb` scrubbers.
   - Scans exceptions, stack traces, breadcrumbs, tags, and extra context to strictly strip message text, prompts, transcripts, and thoughts.
4. **Cost Views over Telemetry Metadata**:
   - `services/gateway/sql/cost-views.sql` creates `daily_ai_costs` and `monthly_ai_costs` views.
   - Views aggregate tokens, latency, call volume, and estimated costs from `ai_calls` metadata without querying any message text.

---

## 3. Implementation Steps & Acceptance Checks
1. Write `docs/analytics-events.md`.
2. Write `apps/mobile/src/features/analytics/events.ts`.
3. Write `apps/mobile/src/features/analytics/tracker.ts`.
4. Write `apps/mobile/src/features/analytics/sentryScrubber.ts`.
5. Write `apps/mobile/src/features/analytics/__tests__/analytics.test.ts` verifying:
   - Unknown event or free-text property rejection.
   - Event dropping when consent is off or withdrawn.
   - Scrubber removing all message text, prompts, and transcripts.
6. Write `services/gateway/src/observability/costConfig.ts`.
7. Write `services/gateway/src/observability/sentryPlugin.ts`.
8. Write `services/gateway/sql/cost-views.sql`.
9. Write `services/gateway/src/observability/__tests__/observability.test.ts`.
10. Run tests, generate evidence in `docs/tasks/T-24/evidence/`.
11. Complete `docs/tasks/T-24/REPORT.md`.
12. Commit with message: `T-24: privacy-first analytics and observability`.
