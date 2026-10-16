# Implementation Plan: T-17 — Social Battery, Check-ins, Gap Game and Debrief

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-17)
- **Specs**:
  - `docs/spec/01-product.md` (Section 7: Moments, Social Battery, Gap Game)
  - `docs/spec/05-screens-realworld-ai-progress.md` (Screens C6, C7, C8)
  - `docs/spec/03-ai-system.md` (Debrief prompts & honesty rules)
  - `docs/spec/06-data-safety.md`
- **Risk Level**: Normal

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `services/gateway/src/routes/debrief.ts`:
   - `POST /v1/debrief/start`: Generates 4-5 gentle questions via `buildDebriefQuestionsPrompt`.
   - `POST /v1/debrief/answer`: Runs safety check; on crisis flags `{ crisis: true }` with no AI text; advances question or marks done.
   - `POST /v1/debrief/finish`: Generates editable Takeaway card via `buildDebriefTakeawayPrompt`, saves to `debriefs` table.
   - `POST /v1/checkin/reflect`: Small structured call taking forecast vs actual and returning a neutral single line of Coach reflection.
2. `apps/mobile/src/copy/checkins.ts`:
   - Copy strings for Energy check-in (C6), tags, micro-rep check-in (C8), Gap reveal, Coach reflection, and Debrief chat (C7).
3. `apps/mobile/src/features/energy/`:
   - `types.ts`, `useEnergy.ts` managing energy logging to `energy_logs` table.
4. `apps/mobile/src/features/checkin/`:
   - `types.ts`, `computeGap.ts` (pure functions for `computeGap` and `computeWeeklyTrend`), `useCheckin.ts`.
5. `apps/mobile/src/features/debrief/`:
   - `types.ts`, `debriefApi.ts`, `useDebrief.ts` managing debrief chat, safety routing, and journal save/discard.
6. `apps/mobile/app/energy.tsx`:
   - Screen C6 Energy check-in with large draggable battery, haptics, tag chips, and Save button.
7. `apps/mobile/app/checkin/`:
   - `[id].tsx` (Screen C8 Micro-rep check-in & Gap reveal).
8. `apps/mobile/app/debrief/`:
   - `[id].tsx` (Screen C7 Debrief chat with Lilac aesthetic, chips/typing, and editable Takeaway card).
9. Tests in `apps/mobile/src/features/checkin/__tests__/` and `services/gateway/src/routes/__tests__/debrief.test.ts`.

---

## 2. Product Rule Guarantees
1. **Neutral Gap Language**: No scores, grades, points, or success/failure judgements. Gap is simply information ("You expected 7; it was 4.").
2. **Editable & Discardable Takeaway**: User can edit the core essence of the takeaway before saving, or discard it entirely.
3. **Safety Protection**: Any crisis phrase entered in Debrief chat immediately triggers `{ crisis: true }` and routes to `/support` with zero AI text.
4. **Zero Red**: Error/warning states use Honey amber.
5. **No Clinical Terms**: Zero occurrences of `treat`, `cure`, `therapy`, `diagnose`.

---

## 3. Acceptance Verification Plan
1. Tests for `computeGap` and `computeWeeklyTrend`.
2. Full Debrief chat runs end to end with fake provider.
3. A crisis phrase in a Debrief answer flags crisis and returns no AI text.
4. RLS tests prove multi-tenant isolation on energy_logs, debriefs, and micro_reps.
5. Energy screen (C6), Check-in (C8), and Debrief chat (C7) render in both Light and Dark modes.
6. Monorepo health (`pnpm check`) is completely green.
