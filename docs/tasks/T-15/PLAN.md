# Implementation Plan: T-15 — Session Assembly: Today, Path, Runner, Warm-up

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-15)
- **Specs**: `docs/spec/05-screens-core.md` (Screens B1 to B3, B11 to B13), `docs/spec/05-screens-launch-quiz.md` (Screens A6, A7), `docs/spec/01-product.md`
- **Risk Level**: Normal

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `apps/mobile/src/copy/today.ts`:
   - All user-facing strings for Today bento, next session recommendation reasons, Take it easy mode, Moment tiles, check-in cards, evidence cards, Path units, and completion lines.
2. `apps/mobile/src/features/today/`:
   - `chooseNextSession.ts`: Pure algorithmic function selecting the next session from Playbook pathOrder and current `skills_progress` stages, outputting `{ session, reason, lengthMinutes }`.
   - `useToday.ts`: Hook for loading today state (greeting, rhythm progress, next session, upcoming moment, active check-in, recent evidence quote).
3. `apps/mobile/src/features/path/`:
   - `usePath.ts`: Hook mapping curriculum units, sessions, and `skills_progress` stages into a curved visual node list with locked/unlocked state and bottom sheet inspection.
4. `apps/mobile/src/features/session-runner/`:
   - `useSessionRunner.ts`: State machine controller executing beats sequentially:
     - Full mode: `idea` -> `watch` -> `read` -> `try` -> `coach` -> `out-there` -> `complete`
     - Take it easy mode: `idea` -> `try` (3 turns) -> `coach` (short) -> `complete`
   - `runnerStorage.ts`: Autosaves current beat and state so quitting and reopening mid-session resumes exactly where the user left off.
5. `apps/mobile/app/(tabs)/index.tsx`:
   - Full Today screen (B1) implementation.
6. `apps/mobile/app/(tabs)/path.tsx`:
   - Full Path screen (B2) with curved SVG path, glowing node rings, and session detail bottom sheet.
7. `apps/mobile/app/session/[id]/out-there.tsx`:
   - Screen B11: Real-world micro-rep cards with Forecast screen (two no-default sliders: draining and warmth).
8. `apps/mobile/app/session/[id]/complete.tsx`:
   - Screen B12: Evidence line, rhythm ring segment advance, soft haptic, no confetti.
9. `apps/mobile/app/(onboarding)/warmup.tsx`:
   - Screen A6: 4-turn baseline warm-up chat with partner.
10. `apps/mobile/app/(onboarding)/coach-read.tsx`:
    - Screen A7: Bento screen with Coach's first read, two strengths, one rewrite, and Lilac glow pulse.
11. Test suites in `apps/mobile/src/features/today/__tests__/`, `apps/mobile/src/features/path/__tests__/`, and `apps/mobile/src/features/session-runner/__tests__/`.

---

## 2. Architecture & Design Alignment

### A. chooseNextSession Logic
- Checks user Playbook `pathOrder` and `hardestPlaces`.
- Identifies the earliest skill in `starting` or `practicing` stage that has not been practiced today.
- Provides grounded, human explanations: "Because follow-up questions are your first step", "Because you wanted to get better at meetings", etc.

### B. Rhythm vs Streaks
- Rhythm ring tracks sessions completed in the current calendar week against the user's chosen goal (2 to 5 sessions).
- Take it easy sessions count 100% toward the rhythm ring.
- No streaks or guilt copy.

### C. First-Run End-to-End Walkthrough
- New user completes Quiz -> Warmup chat (A6) -> Coach's first read (A7) -> Playbook reveal (A8) -> Today (B1) -> Session 01 -> Session complete (B12).

---

## 3. Acceptance Verification Plan
1. **Acceptance Check 1**: Unit tests for `chooseNextSession` across 6 distinct user profiles and progress states; rhythm calculation tests; mid-session state resumption test.
2. **Acceptance Check 2**: Automated walkthrough test simulating the complete first-run path on web using the fake provider.
3. **Acceptance Check 3**: Today and Path render all 4 UI states (loading, empty, error, offline) in both Daylight and Midnight modes.
