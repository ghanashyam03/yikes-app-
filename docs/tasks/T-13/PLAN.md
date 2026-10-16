# Implementation Plan: T-13 — Coach, Inner Voice and Rewind

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-13)
- **Specs**: `docs/spec/03-ai-system.md` (Coach, honesty rules), `docs/spec/05-screens-core.md` (Screens B8 to B10), `docs/spec/04-design-system.md`
- **Risk Level**: **RISKY**

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `services/gateway/src/coach/`:
   - `types.ts`: Request/response schemas for feedback, rewind, compare, and thoughts.
   - `engine.ts`: Core Coach feedback loop calling `buildCoachFeedbackPrompt`, schema validation, `verifyQuotes()` with single-regeneration attempt on invalid quotes, dropping unverified quotes, and authored rubric fallback when no valid quotes remain.
   - `stageTracker.ts`: Updates `skills_progress` using `stageFromVotes(votes)` requiring agreement across the last three votes to change a stage.
   - `judgeSampler.ts`: 20% random sampling of coach outputs evaluated in the background by `MODEL_JUDGE` and stored in `coach_feedback.judge`.
   - `rewindManager.ts`: Creates a branched attempt copying turns `< fromTurn` with `parent_attempt_id` link.
   - `compareEngine.ts`: Evaluates two branched attempts and generates a short comparative summary.
2. `services/gateway/src/routes/coach.ts`:
   - `POST /v1/coach/feedback`: Orchestrates feedback generation and storage.
   - `GET /v1/attempts/:id/thoughts`: Guards thoughts with HTTP 403 Forbidden until `ended_at` is non-null.
   - `POST /v1/partner/rewind`: Creates branch attempt from `fromTurn`.
   - `POST /v1/coach/compare`: Summarizes two paths.
   - `POST /v1/ai/feedback`: Records fairness rating into `ai_feedback` table.
3. `apps/mobile/src/copy/coach.ts`:
   - User-facing copy for Coach tiles ("What worked", "A pivot moment", "Try this next time"), progressive reveal, rewind triggers, Inner Voice scrubber, and fairness thumbs ("Was this fair?").
4. `apps/mobile/src/features/coach/`:
   - `useCoachFeedback.ts`: Hook for fetching and caching Coach feedback, managing skeleton states and word-by-word reveal.
   - `useInnerVoice.ts`: Hook for scrubbing turns and animating floating thought bubbles.
   - `coachApi.ts`: Client for Coach, thoughts, rewind, compare, and fairness endpoints.
5. `apps/mobile/app/session/[id]/coach.tsx`:
   - Full implementation of Screen B8:
     - Coach avatar header.
     - 3 stacked glass tiles: What worked (Mint highlighter), A pivot moment (Honey rule with rewrite and "Try it" button), Try this next time (Lilac rule).
     - Skeleton loading state transitioning to progressive word-by-word reveal.
     - Thumbs up/down ("Was this fair?").
     - Long-press quote to drop into journal.
     - Buttons: "See Maya's thoughts", "Rewind", "Continue".
6. `apps/mobile/app/session/[id]/inner-voice.tsx`:
   - Full implementation of Screen B9:
     - Slow chat replay with turn timeline scrubber.
     - Dashed thought bubbles drifting up beside character portrait in character color.
     - Tap thought to open matching Coach note.
7. Test suites in `services/gateway/src/coach/__tests__/` and `apps/mobile/src/features/coach/__tests__/`.

---

## 2. Honesty & Quality Architecture

### A. Verbatim Quote Guarantee
- Every quote in `worked` and `pivot` must pass `verifyQuotes(feedback, transcript)`.
- If a quote does not match verbatim:
  1. Gateway retries once with the invalid quotes specified as feedback hints to the model.
  2. If invalid quotes persist, they are dropped.
  3. If no valid worked quotes remain, an authored fallback template is used.
- `verified: true` is set on `coach_feedback` only when all quotes strictly match the user's transcript.

### B. Stable Growth Stages (No Mood Swings)
- Skill votes from the Coach are appended to `stage_history`.
- `stageFromVotes(votes)` determines the discrete stage: a stage changes only when the last 3 consecutive votes agree on a new stage.

### C. Thought Confidentiality Guard
- `GET /v1/attempts/:id/thoughts` verifies `ended_at !== null` on the attempt.
- Returns `403 Forbidden` if attempt is ongoing, completely preventing thought leakage during active chat.

---

## 3. Acceptance Verification Plan
1. **Acceptance Check 1**: Unit test where fake provider returns a paraphrased quote proves prompt regeneration then quote dropping.
2. **Acceptance Check 2**: Unit test proves a skill stage changes only after 3 agreeing votes.
3. **Acceptance Check 3**: Endpoint test proves `GET /v1/attempts/:id/thoughts` returns 403 before attempt has ended.
4. **Acceptance Check 4**: Rewind test proves the branched attempt keeps exactly the turns before `fromTurn`.
5. **Acceptance Check 5**: UI states: loading skeletons, progressive text reveal, error state, and AI-down authored fallback.
