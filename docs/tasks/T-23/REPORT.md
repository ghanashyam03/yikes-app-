# T-23 Report

## Summary (3 sentences)
Delivered the full Subscriptions, Paywall and Plan Limits system across the mobile app and backend gateway, integrating the RevenueCat SDK abstraction with localized store offerings, trial disclosure, restore purchases, and subscription management. Built the Subscription screen (D4) with a 3-card comparison and the Paywall sheet (D5) celebrating the user's personal journey, strictly protected by route guards from ever mounting during live chat, debrief, or crisis support. Verified end-to-end conformance with zero clinical words, strictly equal visual weight for dismiss/primary CTAs, authenticated webhook entitlement transitions, and 100% clean monorepo verification via `pnpm check`.

## What I built (one line per file)
- `services/gateway/src/config/limits.ts`: Default editable plan quotas (Free: 40 turns/day, 3 reply helper/wk, 1 prep/wk; Plus: 120 turns/day, unlimited reply helper/prep) and pure evaluation functions (`evaluateUsage`, `getPlanLimits`, `isUsageAllowed`).
- `services/gateway/src/config/__tests__/limits.test.ts`: 5 unit tests for plan limits and usage quota calculations.
- `services/gateway/src/routes/billing.ts`: Signed RevenueCat webhook route (`POST /v1/billing/webhook`) and user entitlements endpoint (`GET /v1/billing/entitlements`).
- `services/gateway/src/routes/__tests__/billing.test.ts`: 12 integration tests validating signature verification, entitlement state transitions, authenticated JWT entitlements, and DB fallbacks.
- `apps/mobile/src/copy/billing.ts`: Centralized user-facing billing copy strictly verified for zero clinical words, zero artificial urgency, and equal visual stature for CTAs.
- `apps/mobile/src/features/billing/types.ts`: TypeScript interfaces for billing state, offerings, entitlement plans, limits, and user journey metrics.
- `apps/mobile/src/features/billing/routeGuard.ts`: Route safety guard function `isPaywallForbiddenRoute` prohibiting paywall display on `/session/*/try`, `/debrief/*`, `/support`, `/tools/free-chat`.
- `apps/mobile/src/features/billing/__tests__/routeGuard.test.ts`: 6 unit tests validating route guard restrictions on all forbidden and permitted routes.
- `apps/mobile/src/features/billing/billingSdk.ts`: Cross-platform RevenueCat abstraction wrapping `react-native-purchases` safely for web/tests/native with fallback offerings.
- `apps/mobile/src/features/billing/billingApi.ts`: Client API layer fetching authenticated entitlements and limits from the gateway.
- `apps/mobile/src/features/billing/useBilling.ts`: Zustand store managing billing state, active plan, entitlements, offerings, purchase execution, and restore flows.
- `apps/mobile/src/features/billing/__tests__/billingCopy.test.ts`: 5 unit tests asserting zero clinical words, no countdown timers/dark patterns, equal CTA weights, and clear cancellation terms.
- `apps/mobile/src/features/billing/__tests__/paywallMount.test.tsx`: 5 RNTL tests verifying that paywall strictly refuses to mount on forbidden routes and mounts on permitted routes with equal button weights.
- `apps/mobile/src/features/billing/__tests__/subscriptionScreen.test.tsx`: 4 RNTL tests verifying 3-card comparison, local price display, restore action, and manage subscription link.
- `apps/mobile/app/settings/subscription.tsx`: Settings screen D4 featuring 3-card plan comparison, localized price pill, 7-day free trial terms, restore button, and manage subscription link.
- `apps/mobile/app/paywall.tsx`: Screen D5 paywall bottom sheet featuring user journey celebration, perks list, Honey amber accents, route guard dismissal, and equal visual weight buttons ("Not now" / "Try free for 7 days").

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| --- | --- | --- | --- |
| (1) Webhook signature test accepts valid and rejects invalid requests | `pnpm --filter gateway vitest run src/routes/__tests__/billing.test.ts -t "signature"` | PASS (2/2 tests) | `docs/tasks/T-23/evidence/check1-webhook-signature.txt` |
| (2) Entitlement transition tests: free to Plus, expiry, refund | `pnpm --filter gateway vitest run src/routes/__tests__/billing.test.ts -t "Transition"` | PASS (6/6 tests) | `docs/tasks/T-23/evidence/check2-entitlement-transitions.txt` |
| (3) A test proves the paywall cannot mount on the forbidden routes | `pnpm --filter mobile test src/features/billing/__tests__/routeGuard.test.ts src/features/billing/__tests__/paywallMount.test.tsx` | PASS (11/11 tests) | `docs/tasks/T-23/evidence/check3-forbidden-routes.txt` |
| (4) Caps change with the plan | `pnpm --filter gateway vitest run src/config/__tests__/limits.test.ts src/routes/__tests__/billing.test.ts -t "Entitlements API"` | PASS (8/8 tests) | `docs/tasks/T-23/evidence/check4-plan-caps.txt` |
| (5) Clean monorepo check (lint, typecheck, test) | `pnpm check` | PASS (Exit code 0, 0 lint errors, 0 TS errors, all 50 mobile suites & 22 gateway files pass) | `docs/tasks/T-23/evidence/check5-pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- **RevenueCat SDK (`react-native-purchases`) with offerings**: DONE - `apps/mobile/src/features/billing/billingSdk.ts:1-92` (configured with package offerings, fallback packages for sandbox/dev/web, safe native module lazy-require).
- **Subscription screen (D4)**: DONE - `apps/mobile/app/settings/subscription.tsx:22-280` (3-card plan comparison Free vs Plus monthly vs Plus annual, local currency price pill, 7-day trial terms, restore purchases button, manage subscription link via OS store URLs).
- **Paywall sheet (D5)**: DONE - `apps/mobile/app/paywall.tsx:25-282` (calm bottom sheet, Soft Pop tokens, Honey amber badges, perks card, one-tap restore link).
- **Shown after 5th session or first Plus feature, never on chat, Debrief or Support routes**: DONE - `apps/mobile/src/features/billing/routeGuard.ts:9-25` and `apps/mobile/app/paywall.tsx:34-46,66-69` (guard strictly rejects `/session/*/try`, `/debrief/*`, `/support`, `/tools/free-chat` with immediate unmount/back).
- **User's own journey in the copy**: DONE - `apps/mobile/src/copy/billing.ts:31-33`, `apps/mobile/app/paywall.tsx:75-81,148-167` (highlights sessions completed and real-world micro-reps taken, e.g., "5 practice sessions · 2 real-world steps").
- **Local-currency price from store**: DONE - `apps/mobile/src/features/billing/billingSdk.ts:51-68`, `apps/mobile/app/settings/subscription.tsx:43-46`, `apps/mobile/app/paywall.tsx:71-74` (reads `priceString` from RevenueCat package with fallback).
- **Not now equal in visual weight**: DONE - `apps/mobile/app/paywall.tsx:243-264` and `apps/mobile/app/settings/subscription.tsx:210-230` (both buttons rendered side-by-side in equal `flex: 1` containers with identical min-height 48pt touch targets, standard Soft Pop Button styling, zero faint dismissals).
- **Restore purchases**: DONE - `apps/mobile/src/features/billing/billingSdk.ts:80-91`, `apps/mobile/app/settings/subscription.tsx:55-63`, `apps/mobile/app/paywall.tsx:93-102`.
- **Manage-subscription link**: DONE - `apps/mobile/app/settings/subscription.tsx:65-76,236-249` (opens native iOS App Store / Android Play Store subscription management URLs via `Linking.openURL`).
- **Signed RevenueCat webhook writing entitlements**: DONE - `services/gateway/src/routes/billing.ts:63-145` (validates Bearer token signature against `REVENUECAT_WEBHOOK_AUTH_TOKEN`, writes directly to Supabase `entitlements` table).
- **Plan limits as editable defaults in `limits.ts`**: DONE - `services/gateway/src/config/limits.ts:1-68` (Free: 40 chat turns/day, 3 reply helper/wk, 1 prep/wk; Plus: 120 turns/day, unlimited reply helper/prep).
- **Dark pattern checks**: DONE - `apps/mobile/src/copy/billing.ts:1-85` and `apps/mobile/src/features/billing/__tests__/billingCopy.test.ts:1-75` (zero countdown timers, zero false urgency, zero clinical words).

## Dependencies added (name, version, reason, licence)
- `react-native-purchases`: `10.13.0`, Required by contract for RevenueCat in-app subscriptions, MIT licence.

## Outside-scope edits (file, reason, size of change)
- `apps/mobile/package.json`: Added pinned `react-native-purchases: 10.13.0` dependency per contract instructions; adjusted test script to `--maxWorkers=3` to avoid worker process starvation on Windows (+2 lines).
- `pnpm-lock.yaml`: Lockfile updated to lock `react-native-purchases@10.13.0` and its sub-dependencies.

## UNVERIFIED items (anything you could not prove, and the fallback you built)
- Live production Apple App Store and Google Play Store purchase transactions. (Reason: Requires production App Store Connect / Google Play Console developer accounts and live app build). Fallback: Implemented sandbox testing flow documentation, offline mock mode in `billingSdk.ts`, and full automated unit/integration tests verifying the RevenueCat SDK abstraction and server webhook transitions.

## Known limitations and follow-ups (each with a task id)
- Live RevenueCat dashboard webhook URL registration and shared secret generation for staging/production deployment (Task T-27 Release Hardening).
- Real-time client subscription state push via WebSocket/SSE instead of on-demand entitlement refresh (Future enhancement / T-24 observability).

## Fix rounds (left empty by the Builder; filled by the Fixer)
*(Left empty by the Builder)*
