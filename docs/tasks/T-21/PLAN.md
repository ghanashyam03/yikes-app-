# Implementation Plan: T-21 — Notifications Engine

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-21)
- **Specs**:
  - `docs/spec/01-product.md` (notifications, Rhythm)
  - `docs/spec/05-screens-settings-system.md` (Screens D2, D12)
- **Risk Level**: Normal

---

## 1. Files Owned & Scope
- `apps/mobile/src/features/notifications/**`
- `apps/mobile/app/settings/notifications.tsx`
- `apps/mobile/src/copy/notifications.ts`
- `services/gateway/src/routes/notify.ts`
- `services/gateway/src/jobs/notify/**`

---

## 2. Product Rules
- Max ONE notification per day across all types.
- Quiet hours strictly respected (never scheduled inside quiet hours).
- Pause week supported (zero notifications scheduled when paused).
- Welcome-back rule (3+ days away: max 1 warm notification per 7 days).
- Zero guilt, zero streak threats, zero countdowns.
- Zero clinical words (treat, cure, therapy, diagnose). Never red; use Honey.
- Permission flow requested just in time after setting reminder window, preceded by a sample preview.

---

## 3. Implementation Steps
1. Create `apps/mobile/src/copy/notifications.ts` with warm, specific lines and zero banned/guilt/clinical words.
2. Create `apps/mobile/src/features/notifications/types.ts` defining preferences, notification items, and planning parameters.
3. Create `apps/mobile/src/features/notifications/planNotifications.ts` implementing pure planning logic with max 1/day, quiet hours, pause week, and welcome-back throttling.
4. Create `apps/mobile/src/features/notifications/notificationsStore.ts` for reactive client state and local storage.
5. Create `apps/mobile/src/features/notifications/scheduler.ts` providing scheduling and cancellation routines.
6. Create `apps/mobile/src/features/notifications/useNotificationPermission.ts` and `NotificationPreviewCard.tsx`.
7. Implement `apps/mobile/app/settings/notifications.tsx` (Screen D2) with per-type toggles, live previews, quiet hours slider, and pause week button.
8. Implement `services/gateway/src/routes/notify.ts` and `services/gateway/src/jobs/notify/**` for push token registration, preference sync, and server-sent pushes.
9. Write comprehensive test suites for planNotifications, copy rules, permission preview flow, and toggle cancellation.
10. Run acceptance checks and verify `pnpm check` passes cleanly.
