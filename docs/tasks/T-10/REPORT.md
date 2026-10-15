# T-10 Report: AI Prompts, Schemas and Eval Harness

## Summary (3 sentences)
Implemented the complete `@yikes/ai-prompts` package containing 11 pure prompt builder functions paired with strict Zod output schemas and labeled prompt sections (ROLE, CONTEXT, RULES, OUTPUT FORMAT, EXAMPLES). Built core domain utilities including verbatim quote verification with whitespace normalization, 0.15 step-clamped hidden mood transitions, median stage calculation from skill votes, and PersonaCard schemas. Established an end-to-end evaluation harness across 10 diverse conversational transcripts verifying schema compliance, exact verbatim quoting, expected pivot placement, and strict honesty rule adherence.

## What I built (one line per file)
- `packages/ai-prompts/package.json`: Manifest configured with `zod: 3.24.2`, `tsx: 4.19.2`, `"./*": "./src/*.ts"` exports, and `eval` CLI script.
- `packages/ai-prompts/src/types.ts`: Domain types for chat messages, playbooks, mood states, skill stages, rubrics, scenarios, and transcripts.
- `packages/ai-prompts/src/persona-card.ts`: Zod schema and TypeScript type for `PersonaCard` with tendencies, topics, and fallback lines.
- `packages/ai-prompts/src/versions.ts`: `PROMPT_VERSIONS` central registry and individual prompt version constants.
- `packages/ai-prompts/src/partner-turn.ts`: Pure prompt builder and Zod schema for `PartnerTurn` with mood states (0-1), realistic unagreeable behavior, and simulated inner thoughts.
- `packages/ai-prompts/src/coach-feedback.ts`: Pure prompt builder and Zod schema for `CoachFeedback` enforcing verbatim quotes, tone variants, and strict honesty rules.
- `packages/ai-prompts/src/prep-card.ts`: Pure prompt builder and Zod schema for `PrepCard` with opener options, two questions, exit lines, and quiet-break recovery.
- `packages/ai-prompts/src/debrief-questions.ts`: Pure prompt builder and Zod schema for `DebriefQuestions` providing 4-5 gentle post-event interview prompts.
- `packages/ai-prompts/src/debrief-takeaway.ts`: Pure prompt builder and Zod schema for `DebriefTakeaway` generating takeaway cards with editable core essence.
- `packages/ai-prompts/src/reply-helper.ts`: Pure prompt builder and Zod schema for `ReplyHelper` with 2 interpretations, mandatory disclaimer, and 3 voice-matched replies.
- `packages/ai-prompts/src/weekly-letter.ts`: Pure prompt builder and Zod schema for `WeeklyLetter` enforcing a <= 150-word personal reflection.
- `packages/ai-prompts/src/scenario-generator.ts`: Pure prompt builder and Zod schema for `ScenarioGenerator` synthesizing personalized scenarios excluding sensitive topics.
- `packages/ai-prompts/src/watch-exchange.ts`: Pure prompt builder and Zod schema for `WatchExchange` generating 40-second modelled dialogue where users tap the skill line.
- `packages/ai-prompts/src/read-scene.ts`: Pure prompt builder and Zod schema for `ReadScene` generating 3 candidate thoughts with true index and cue note.
- `packages/ai-prompts/src/voice-style-summary.ts`: Pure prompt builder and Zod schema for `VoiceStyleSummary` analyzing practice text into tone markers and speech rhythm.
- `packages/ai-prompts/src/utilities.ts`: Core utilities for `verifyQuotes`, `clampMood` (0.15 step limit), and `stageFromVotes` (median across discrete stages).
- `packages/ai-prompts/src/eval/fixtures.ts`: 10 diverse conversation transcripts covering awkward pauses, overshares, disagreements, meetings, and tone variants.
- `packages/ai-prompts/src/eval/harness.ts`: Property-based evaluation engine validating schemas, quotes, pivots, and banned honesty words.
- `packages/ai-prompts/src/eval/run.ts`: CLI script runnable via `pnpm --filter ai-prompts eval` printing an aligned PASS/FAIL results table.
- `packages/ai-prompts/src/__tests__/schemas.test.ts`: Comprehensive unit tests ensuring all 12 schemas accept valid payloads and reject invalid data.
- `packages/ai-prompts/src/__tests__/utilities.test.ts`: Unit tests verifying quote normalization, rejection of paraphrased/invented quotes, mood clamping, and vote medians.
- `packages/ai-prompts/src/__tests__/prompts.test.ts`: Snapshot tests verifying stable output format and labeled sections for all 11 prompt builders.
- `packages/ai-prompts/src/__tests__/eval.test.ts`: Automated test suite executing the evaluation harness and asserting 10/10 fixtures pass.
- `packages/ai-prompts/src/__tests__/__snapshots__/prompts.test.ts.snap`: Vitest snapshot file capturing prompt structures.
- `docs/tasks/T-10/evidence/01-unit-tests.txt`: Evidence output of 51 passing vitest tests in `packages/ai-prompts`.
- `docs/tasks/T-10/evidence/02-eval-harness.txt`: Evidence output of the 10-fixture evaluation harness table.
- `docs/tasks/T-10/evidence/03-pnpm-check.txt`: Monorepo-wide verification evidence showing lint, typecheck, and all test suites passing.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
| --- | --- | --- | --- |
| 1. Unit tests: schemas, verifyQuotes, mood clamp, stage median | `pnpm --filter @yikes/ai-prompts test` | PASSED (51 tests in 4 suites pass; verifies schema acceptance/rejection, quote verification, 0.15 mood step clamp, and vote medians) | `docs/tasks/T-10/evidence/01-unit-tests.txt` |
| 2. Snapshot tests for every prompt builder | `pnpm --filter @yikes/ai-prompts test src/__tests__/prompts.test.ts` | PASSED (11 prompt builder snapshots verified; labeled sections ROLE, CONTEXT, RULES, OUTPUT FORMAT, EXAMPLES present on all) | `docs/tasks/T-10/evidence/01-unit-tests.txt` |
| 3. Eval harness runs end-to-end | `pnpm --filter ai-prompts eval` | PASSED (10/10 fixtures evaluated against schema, verbatim quotes, expected pivot presence, and honesty rules; clean PASS/FAIL table printed) | `docs/tasks/T-10/evidence/02-eval-harness.txt` |
| 4. Workspace check clean | `pnpm check` | PASSED (lint, typecheck, tests clean across all 7 workspace projects) | `docs/tasks/T-10/evidence/03-pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- Pure functions returning chat messages with Zod schemas and labeled parts (ROLE, CONTEXT, RULES, OUTPUT FORMAT, EXAMPLES): DONE (`packages/ai-prompts/src/partner-turn.ts` L28-L120, `packages/ai-prompts/src/coach-feedback.ts` L46-L177, and all prompt files)
- PartnerTurn with mood (0 to 1), realistic not agreeable, reserved, never overshares, distracted, pre-close/end, never claims human, scenario world, private thought: DONE (`packages/ai-prompts/src/partner-turn.ts` L6-L24, L55-L103)
- CoachFeedback with tone variants, verbatim quotes, no praise without a line, no shaming, no labels (shy, anxious, extroverted, introverted), no diagnosis/medical words (treat, cure, therapy, diagnose): DONE (`packages/ai-prompts/src/coach-feedback.ts` L28-L44, L69-L135)
- PrepCard (opener options, two questions, exit line, recovery suggestion, quiet-break idea): DONE (`packages/ai-prompts/src/prep-card.ts` L5-L12, L26-L82)
- DebriefQuestions (gentle 4-5 interview questions): DONE (`packages/ai-prompts/src/debrief-questions.ts` L5-L8, L23-L64)
- DebriefTakeaway (short takeaway card with editable core essence): DONE (`packages/ai-prompts/src/debrief-takeaway.ts` L5-L10, L25-L68)
- ReplyHelper (two readings, mandatory sentence "I can't know what they meant", 3 tone replies): DONE (`packages/ai-prompts/src/reply-helper.ts` L11-L16, L33-L75)
- WeeklyLetter (150 words or fewer): DONE (`packages/ai-prompts/src/weekly-letter.ts` L5-L15, L31-L77)
- ScenarioGenerator (personalized scenario from Playbook, sensitive topic exclusions): DONE (`packages/ai-prompts/src/scenario-generator.ts` L6-L15, L34-L106)
- WatchExchange (watch scene dialogue, user taps line where skill happens): DONE (`packages/ai-prompts/src/watch-exchange.ts` L11-L18, L32-L85)
- ReadScene (scene, three candidate thoughts, true index, cue note): DONE (`packages/ai-prompts/src/read-scene.ts` L10-L16, L27-L86)
- VoiceStyleSummary (summary of user voice style from practice text): DONE (`packages/ai-prompts/src/voice-style-summary.ts` L5-L12, L27-L77)
- Utilities: `verifyQuotes` (exact match after whitespace normalization): DONE (`packages/ai-prompts/src/utilities.ts` L36-L85)
- Utilities: `clampMood` (clamps to at most maxStep=0.15 within [0, 1]): DONE (`packages/ai-prompts/src/utilities.ts` L91-L122)
- Utilities: `stageFromVotes` (median stage of the last 3 votes across 'starting', 'practicing', 'growing', 'natural'): DONE (`packages/ai-prompts/src/utilities.ts` L139-L163)
- PersonaCard schema and types: DONE (`packages/ai-prompts/src/persona-card.ts` L3-L22)
- PROMPT_VERSIONS registry: DONE (`packages/ai-prompts/src/versions.ts` L1-L25)
- Eval harness (10 fixture transcripts, property checks, clean PASS/FAIL table, `pnpm --filter ai-prompts eval`): DONE (`packages/ai-prompts/src/eval/fixtures.ts`, `packages/ai-prompts/src/eval/harness.ts`, `packages/ai-prompts/src/eval/run.ts`)

## Dependencies added (name, version, reason, licence)
- `zod`: `3.24.2`, runtime schema definition and output validation, MIT licence.
- `tsx`: `4.19.2`, TypeScript CLI execution for eval harness runner script, MIT licence.

## Outside-scope edits (file, reason, size of change)
None. All edits strictly confined to `packages/ai-prompts/**` and `docs/tasks/T-10/**`.

## UNVERIFIED items (anything you could not prove, and the fallback you built)
None. All 11 prompts, schemas, utilities, test suites, and 10 evaluation fixtures run and pass deterministically.

## Known limitations and follow-ups (each with a task id)
- Gateway integration: The gateway routes for partner turn (`/v1/partner/turn`) and coach feedback will invoke these prompt builders directly in T-12 and T-15.
- Real model provider evaluation at scale: Expanded 30-fixture evaluation runs against NVIDIA endpoints are scheduled in T-26.

## Fix rounds (left empty by the Builder; filled by the Fixer)
