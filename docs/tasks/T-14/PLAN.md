# Implementation Plan: T-14 — Content Package and Idea, Watch, Read Beats

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-14)
- **Specs**: `docs/spec/07-content.md`, `docs/spec/01-product.md` (Core session), `docs/spec/05-screens-core.md` (Screens B3 to B6)
- **Risk Level**: Normal

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `packages/content/package.json`: Add pinned `"zod": "3.24.2"`, `"tsx": "4.19.2"`, and `"validate": "tsx src/validate.ts"` script.
2. `packages/content/src/`:
   - `types.ts`: Zod schemas and TypeScript types for Skill, SituationLevel, SessionRecord, Persona, and SessionState.
   - `skills.ts`: 12 skills with keys, names, descriptions, and Coach rubrics (worked / not yet).
   - `levels.ts`: 5 situation levels (friendly one-to-one, colleague, senior, groups, high stakes).
   - `personas.ts`: 6 personas (Maya, Alex, Sam, Dev, Priya, Rohan) with persona cards, two-color palettes (no red), and >=12 authored fallback lines each.
   - `sessions/`: Unit 1 (8 sessions) and Unit 2 (8 sessions) formatted per spec (idea, watch, read, try, coach rubric, out-there).
   - `sessionMachine.ts`: Pure, serializable state machine for session beats (Idea -> Watch -> Read -> Try -> Coach -> Out there -> Complete), with skip, pause, and resume.
   - `validate.ts`: Content validation CLI script scanning schemas, counts (16 sessions, 6 personas), excluded topics, banned words (`treat`, `cure`, `therapy`, `diagnose`), and color palette rules.
3. `services/gateway/src/routes/content.ts`:
   - `POST /v1/content/watch`: Personalizes watch exchange for user's scenario world, caches in-memory, falls back to authored default.
   - `POST /v1/content/read`: Personalizes read scene for user's scenario world, caches in-memory, falls back to authored default.
4. `apps/mobile/src/copy/session.ts`:
   - User-facing copy for Idea, Watch, Read, navigation, "Show me", and "Different people, different signals".
5. `apps/mobile/src/features/session-steps/`:
   - `useSessionStep.ts`: Hook for loading session content, managing current step, and calling gateway personalization.
6. `apps/mobile/app/session/[id]/`:
   - `idea.tsx` (B4): 28pt serif rule, 2 example bubbles, collapsible "Why this works", Next button.
   - `watch.tsx` (B5): Interactive chat replay; tap line where skill happens, glow feedback, "Close. Look at the question", and "Show me" button.
   - `read.tsx` (B6): 3 candidate thought cards; on selection, true thought drifts up in partner color with cue note and mandatory disclaimer: "Different people, different signals".
7. Unit and integration tests in `packages/content/src/__tests__/` and `apps/mobile/src/features/session-steps/__tests__/`.

---

## 2. Acceptance Verification Plan
1. **Acceptance Check 1**: `pnpm --filter content validate` passes: 16 sessions, 6 personas, zero banned words, zero red palettes.
2. **Acceptance Check 2**: State machine tests: transitions through all beats, skips optional beats, serializes and resumes cleanly from stored JSON.
3. **Acceptance Check 3**: Read reveal logic tests: true thought index verified, cue note present, "Different people, different signals" copy confirmed.
4. **Acceptance Check 4**: Screens render in both Daylight and Midnight modes on web with fake provider and with provider offline.
