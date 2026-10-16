# Implementation Plan: T-23 — Subscriptions, Paywall and Plan Limits

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-23)
- **Specs**:
  - `docs/spec/06-data-safety.md` (Plans, entitlements, limits)
  - `docs/spec/05-screens-settings-system.md` (Screens D4: Subscription, D5: Paywall moment)
  - `docs/spec/04-design-system.md` (Soft Pop design tokens, colors, equal button weight)
- **Risk Level**: **RISKY** (financial/billing logic)

---

## 1. Files Owned & Scope
- `apps/mobile/app/paywall.tsx` (takes over stub)
- `apps/mobile/app/settings/subscription.tsx` (takes over stub)
- `apps/mobile/src/features/billing/**`:
  - `types.ts`
  - `billingApi.ts`
  - `billingSdk.ts`
  - `useBilling.ts`
  - `routeGuard.ts`
  - `__tests__/routeGuard.test.ts`
  - `__tests__/paywallMount.test.tsx`
  - `__tests__/billingCopy.test.ts`
- `apps/mobile/src/copy/billing.ts`
- `services/gateway/src/config/limits.ts`
- `services/gateway/src/routes/billing.ts`
- `services/gateway/src/routes/__tests__/billing.test.ts`

Outside-scope edits:
- `apps/mobile/package.json` (add pinned `react-native-purchases: 10.13.0` per contract requirement)
- `pnpm-lock.yaml` (updated with pinned dependency)

---

## 2. Key Architectural Decisions & Safeguards

### A. Gateway Plan Limits (`services/gateway/src/config/limits.ts`)
- Configurable defaults:
  - **Free tier**: 40 chat turns per day, 3 Reply Helper uses per week, 1 Prep per week.
  - **Plus tier**: 120 chat turns per day, unlimited Reply Helper, unlimited Prep.
- Pure evaluation functions:
  - `evaluateUsage(plan, feature, currentUsage, customLimits)`: returns `{ allowed, plan, currentUsage, limit, remaining, isUnlimited }`
  - `getPlanLimits(plan)`: returns full limits object
  - `isUsageAllowed(plan, feature, currentUsage)`: boolean check

### B. Gateway Billing Routes (`services/gateway/src/routes/billing.ts`)
- **POST `/v1/billing/webhook`**:
  - Authenticates signature via Bearer token in `Authorization` header (`Bearer <token>`).
  - Validates against configured `REVENUECAT_WEBHOOK_AUTH_TOKEN` (or fallback token for tests).
  - Handles RevenueCat event types:
    - `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION`, `PRODUCT_CHANGE` -> upgrades user to `plus`, sets `is_active: true`, sets `expires_at`.
    - `EXPIRATION`, `REVOCATION` -> downgrades user to `free`, sets `is_active: false`.
    - `CANCELLATION` -> keeps active until `expiration_at_ms`.
  - Writes directly to Supabase `entitlements` table.
- **GET `/v1/billing/entitlements`**:
  - Requires user JWT authorization.
  - Reads active entitlement from `entitlements` table.
  - Returns current plan, expiration, and quota limits computed from `limits.ts`.

### C. Forbidden Route Guard (`apps/mobile/src/features/billing/routeGuard.ts`)
- Spec rule: The paywall must **never** mount during chat, debrief, or support.
- `isPaywallForbiddenRoute(pathname: string): boolean`:
  - Strictly returns `true` for:
    - `/session/*/try` (e.g. `/session/123/try`)
    - `/debrief/*` (e.g. `/debrief/123`)
    - `/support`
    - `/tools/free-chat`
  - Returns `false` for other routes.
- When `PaywallModal` mounts, if `isPaywallForbiddenRoute(pathname)` is true, it immediately returns `null` and calls `router.back()` to prohibit mounting.

### D. Dark Pattern Prevention & Copy Integrity (`apps/mobile/src/copy/billing.ts`)
- **Equal visual weight**: "Not now" and "Try free" have identical visual stature and prominent 48pt touch targets. No faint or hidden dismiss buttons.
- **Zero clinical words**: Grep and unit tests strictly assert absence of `treat`, `cure`, `therapy`, `diagnose`.
- **Zero red alerts**: Warnings or limit notices use `Honey` amber only.
- Clear cancellation terms and one-tap restore link.
- Shows user's own journey (e.g., sessions and micro-reps completed).

### E. SDK Abstraction (`billingSdk.ts`)
- Wraps `react-native-purchases` safely so that Web, Jest, and offline environments work without crashing on missing native modules.
- Provides fallback offerings for sandbox / dev / web preview.

---

## 3. Implementation Order
1. Build `services/gateway/src/config/limits.ts` + unit tests.
2. Build `services/gateway/src/routes/billing.ts` + acceptance tests (signature check, state transitions, limits).
3. Build `apps/mobile/src/copy/billing.ts`.
4. Build `apps/mobile/src/features/billing/**` (types, routeGuard, billingApi, billingSdk, useBilling).
5. Build `apps/mobile/app/settings/subscription.tsx` (D4: 3-card comparison, local price, restore, cancel).
6. Build `apps/mobile/app/paywall.tsx` (D5: user journey, equal buttons, route prohibition).
7. Run all acceptance tests and verify evidence.
8. Capture mobile web UI screenshots for light and dark modes.
