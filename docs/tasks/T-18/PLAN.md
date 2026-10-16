# Implementation Plan: T-18 — You Tab, Journal, Ladder, Gap and Battery Screens

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-18)
- **Specs**:
  - `docs/spec/05-screens-realworld-ai-progress.md` (Screens C12, C13, C15, C16, C17, C18)
  - `docs/spec/01-product.md` (Section 7: Social Battery, Gap Game, Quiet Ladder)
  - `docs/spec/06-data-safety.md` (Aggregated statistics only for insights)
  - `docs/spec/04-design-system.md`
- **Risk Level**: Normal

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `services/gateway/src/routes/insights.ts`:
   - `POST /v1/insights/battery`: Accepts aggregated statistics only. Generates 3 insight cards and Plan my week recovery suggestion.
   - `POST /v1/ladder/suggest`: Generates next ladder rung suggestion.
2. `apps/mobile/src/copy/you.ts`:
   - Copy strings for You tab (C12), Growth Journal (C13), Skill detail (C15), Gap chart (C16), Battery patterns (C17), Quiet Ladder (C18), and empty states.
3. `apps/mobile/src/features/you/`:
   - `types.ts`, `useYou.ts`.
4. `apps/mobile/src/features/journal/`:
   - `types.ts`, `journalApi.ts`, `useJournal.ts`.
5. `apps/mobile/src/features/ladder/`:
   - `types.ts`, `ladderApi.ts`, `useLadder.ts`.
6. Mobile Screens:
   - `apps/mobile/app/(tabs)/you.tsx` (Screen C12 You tab bento).
   - `apps/mobile/app/journal.tsx` (Screen C13 Growth Journal).
   - `apps/mobile/app/skill/[id].tsx` (Screen C15 Skill detail with stage ring, 3 evidence quotes, Review due badge).
   - `apps/mobile/app/gap.tsx` (Screen C16 Gap screen with SVG line chart, shaded gap, screen reader text alternative, tap to check-in).
   - `apps/mobile/app/battery.tsx` (Screen C17 Battery patterns heat-grid and 3 insight cards).
   - `apps/mobile/app/ladder.tsx` (Screen C18 Quiet Ladder with 8-10 rungs, reorder, add, rewrite, mark done, AI suggest next).
7. Tests in `apps/mobile/src/features/you/__tests__/`, `apps/mobile/src/features/journal/__tests__/`, `apps/mobile/src/features/ladder/__tests__/`, and `services/gateway/src/routes/__tests__/insights.test.ts`.

---

## 2. Product Rule Guarantees
1. Never a score or number as headline: quiet line of evidence.
2. Real verbatim quotes in "Why I think so".
3. Accessible alternatives for charts.
4. Insights endpoint receives strictly aggregates.
5. Zero red; Honey amber for badges.
6. Zero clinical terms.

---

## 3. Acceptance Verification Plan
1. Tests for review-due rule (14 days), heat-grid aggregation, ladder reorder.
2. Every screen has a designed empty state.
3. Charts have text alternatives.
4. The insights route receives only aggregates.
5. `pnpm check` passes cleanly across all workspaces.
