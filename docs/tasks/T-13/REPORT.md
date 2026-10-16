# T-13 Report

## Summary (3 sentences)
Built the Gateway Coach Engine with strict verbatim quote verification, one-shot regeneration on invalid quotes, unverified quote dropping, authored rubric fallbacks, stable 3-consecutive-agreeing-votes stage progression, and confidential thoughts access protection. Implemented Screen B8 (Coach) featuring three stacked glass tiles (What worked with Mint highlighter swipe, Pivot moment with rewrite and Try it rewind, Try this next time), fairness thumbs rating, and long-press quote saving to the growth journal. Implemented Screen B9 (Inner Voice) featuring a turn scrubber timeline, slow replay, character-tinted dashed thought bubbles, matching coach observations, and an honest uncertainty disclaimer.

## What I built (one line per file)
- `services/gateway/src/coach/types.ts`: Request/response schemas and types for feedback, thoughts, rewind, compare, and ai fairness.
- `services/gateway/src/coach/fallbackTemplates.ts`: Authored rubric fallbacks for skills when unverified quotes are dropped or models reconnect.
- `services/gateway/src/coach/stageTracker.ts`: Skills progress manager enforcing the rule that a stage changes only when 3 consecutive votes agree on the new stage.
- `services/gateway/src/coach/judgeSampler.ts`: Background 20% random sampling of coach outputs to the judge model stored in `coach_feedback.judge`.
- `services/gateway/src/coach/rewindManager.ts`: Branching attempt manager copying turns strictly before `fromTurn` and linking `parent_attempt_id`.
- `services/gateway/src/coach/compareEngine.ts`: Comparative summary engine evaluating original and retried conversation paths side by side.
- `services/gateway/src/coach/engine.ts`: Core CoachEngine orchestrating prompt building, structured model calls, verbatim verification, single-retry, and quote dropping.
- `services/gateway/src/coach/__tests__/stageTracker.test.ts`: Unit tests verifying the 3-agreeing-votes stage transition rule.
- `services/gateway/src/coach/__tests__/rewindManager.test.ts`: Unit tests verifying rewind branching and turn filtering before `fromTurn`.
- `services/gateway/src/coach/__tests__/coachEngine.test.ts`: Unit tests proving quote regeneration on paraphrased output and unverified quote dropping.
- `services/gateway/src/routes/coach.ts`: Fastify routes for feedback, thoughts (403 before end), rewind, compare, and ai fairness.
- `services/gateway/src/routes/__tests__/coachRoutes.test.ts`: Route integration tests verifying endpoints, thoughts guard (403 active / 200 ended), rewind, compare, and feedback.
- `apps/mobile/src/copy/coach.ts`: User-facing copy for Coach tiles, feedback labels, fairness thumbs, rewind alerts, inner voice replay, and honesty disclaimers.
- `apps/mobile/src/features/coach/coachApi.ts`: Client API layer for coach feedback, thoughts, rewind, compare, and fairness ratings.
- `apps/mobile/src/features/coach/useCoachFeedback.ts`: State hook for coach feedback, skeleton loading, progressive reveal, fairness ratings, and journal drops.
- `apps/mobile/src/features/coach/useInnerVoice.ts`: State hook for scrubbing conversation turns, slow replay, and thought inspection.
- `apps/mobile/app/session/[id]/coach.tsx`: Screen B8 with coach avatar header, 3 stacked glass tiles, highlighter swipe, Try it rewind, thumbs rating, and journal saving.
- `apps/mobile/app/session/[id]/inner-voice.tsx`: Screen B9 with turn timeline scrubber, slow replay, floating dashed thought bubbles, and coach note link.
- `apps/mobile/src/features/coach/__tests__/coachFeatures.test.tsx`: Mobile component tests covering skeleton loading, progressive reveal, error states, and AI-down fallback.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
|---|---|---|---|
| 1. Paraphrased quote proves regeneration then dropping unverified quotes | `pnpm --filter gateway test coachEngine.test.ts` | PASS (2/2 tests) | `docs/tasks/T-13/evidence/check-1-verbatim-regeneration.txt` |
| 2. Skill stage changes only after 3 agreeing votes | `pnpm --filter gateway test stageTracker.test.ts` | PASS (4/4 tests) | `docs/tasks/T-13/evidence/check-2-stage-history.txt` |
| 3. Thoughts returns 403 before attempt end | `pnpm --filter gateway test coachRoutes.test.ts` | PASS (7/7 tests) | `docs/tasks/T-13/evidence/check-3-thoughts-guard.txt` |
| 4. Rewind keeps exactly turns before fromTurn | `pnpm --filter gateway test rewindManager.test.ts` | PASS (2/2 tests) | `docs/tasks/T-13/evidence/check-4-rewind-branch.txt` |
| 5. Mobile UI states (loading skeleton, progressive reveal, error, AI-down fallback) | `pnpm --filter mobile test coachFeatures.test.tsx` | PASS (7/7 tests) | `docs/tasks/T-13/evidence/check-5-mobile-ui-states.txt` |
| Monorepo Check | `pnpm check` | PASS (113 mobile, 86 gateway, 0 errors) | `docs/tasks/T-13/evidence/check-6-pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- POST /v1/coach/feedback loads transcript, thoughts, Playbook, rubric, calls CoachFeedback prompt: **DONE** (`services/gateway/src/coach/engine.ts#L86-L150`)
- Verifies quotes with verifyQuotes; regenerates once on invalid quote; drops unverified quotes: **DONE** (`services/gateway/src/coach/engine.ts#L152-L215`)
- Falls back to authored rubric for skill when no valid worked items remain: **DONE** (`services/gateway/src/coach/engine.ts#L217-L230`, `services/gateway/src/coach/fallbackTemplates.ts#L140-L175`)
- Saves coach_feedback with verified boolean: **DONE** (`services/gateway/src/coach/engine.ts#L232-L260`)
- Updates skills_progress stage using 3 agreeing votes rule: **DONE** (`services/gateway/src/coach/stageTracker.ts#L36-L55`, `services/gateway/src/coach/engine.ts#L262-L278`)
- 20% random sampling of outputs sent to judge model in background, stored in judge jsonb: **DONE** (`services/gateway/src/coach/judgeSampler.ts#L36-L100`, `services/gateway/src/coach/engine.ts#L280-L290`)
- GET /v1/attempts/:id/thoughts returns 403 Forbidden until attempt ended: **DONE** (`services/gateway/src/coach/engine.ts#L305-L330`, `services/gateway/src/routes/coach.ts#L125-L165`)
- POST /v1/partner/rewind creates branch attempt keeping turns < fromTurn: **DONE** (`services/gateway/src/coach/rewindManager.ts#L45-L155`, `services/gateway/src/routes/coach.ts#L167-L200`)
- POST /v1/coach/compare generates comparative summary of two paths: **DONE** (`services/gateway/src/coach/compareEngine.ts#L21-L125`, `services/gateway/src/routes/coach.ts#L202-L240`)
- POST /v1/ai/feedback saves fairness rating: **DONE** (`services/gateway/src/routes/coach.ts#L242-L280`)
- Screen B8: Coach avatar header, 3 stacked glass tiles (Worked, Pivot with Try it rewind, Try next), progressive reveal, highlighter swipe, fairness thumbs, quote saving to journal: **DONE** (`apps/mobile/app/session/[id]/coach.tsx#L1-L400`)
- Screen B9: Inner voice replay, turn timeline scrubber, floating dashed thought bubbles, matching coach note, honesty disclaimer, done button: **DONE** (`apps/mobile/app/session/[id]/inner-voice.tsx#L1-L300`)
- User-facing copy in coach.ts: **DONE** (`apps/mobile/src/copy/coach.ts#L1-L60`)
- No red in UI, no clinical words, no shaming: **DONE** (`apps/mobile/app/session/[id]/coach.tsx`, `apps/mobile/src/copy/coach.ts`)

## Dependencies added (name, version, reason, licence)
None. Used only installed monorepo packages.

## Outside-scope edits (file, reason, size of change)
None. All created and modified files are strictly within T-13 Files owned.

## UNVERIFIED items (anything you could not prove, and the fallback you built)
None. All 5 acceptance checks and full `pnpm check` passed with verified evidence.

## Known limitations and follow-ups (each with a task id)
- T-15 integrates full session runner beats (Idea -> Watch -> Read -> Try -> Coach -> Out there).
- T-18 links journal saving directly to persistent Growth Journal screen timeline.

## Fix rounds (left empty by the Builder; filled by the Fixer)
*(Empty)*
