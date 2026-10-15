# T-10 Verification: AI Prompts, Schemas and Eval Harness

## VERDICT
**PASS**

Zero blocking issues identified. All contract criteria, spec rules from `docs/spec/03-ai-system.md`, `docs/spec/01-product.md`, `docs/spec/07-content.md`, and workspace checks are met with verified evidence.

---

## Blocking issues
None.

---

## Non-blocking notes
1. Note on Node deprecation warning during eval script execution: When running `pnpm --filter ai-prompts eval`, tsx emits `(node:32632) [DEP0205] DeprecationWarning: module.register() is deprecated`. This originates from tsx's loader integration on Node 22 and does not affect prompt execution, typing, or schema validation.
2. Follow-up integration: Downstream task T-12 will wire `PartnerTurn` and `clampMood` into gateway endpoints (`POST /v1/partner/turn`), and T-15 will wire `CoachFeedback`, `verifyQuotes`, and `stageFromVotes` into Coach feedback processing.

---

## Acceptance table

| Check | Contract Requirement | Command / Inspection | Result | Evidence File |
|---|---|---|---|---|
| **1. Unit tests** | Schemas accept good and reject bad samples; `verifyQuotes` catches paraphrased or invented quotes; `clampMood` enforces 0.15 step limit; `stageFromVotes` calculates stage median. | `pnpm --filter @yikes/ai-prompts test` | **PASSED** (51 tests in 4 suites pass; covers all 12 schemas, quote verification against altered text, 0.15 clamp, and vote medians) | [`docs/tasks/T-10/evidence/verify-03-unit-tests.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-10/evidence/verify-03-unit-tests.txt) |
| **2. Snapshot tests** | Snapshot tests for every prompt builder (11 builders with labeled sections: ROLE, CONTEXT, RULES, OUTPUT FORMAT, EXAMPLES). | `pnpm --filter @yikes/ai-prompts test src/__tests__/prompts.test.ts` | **PASSED** (all 11 builders verified against snapshot; required sections and rule constants confirmed) | [`docs/tasks/T-10/evidence/verify-03-unit-tests.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-10/evidence/verify-03-unit-tests.txt) |
| **3. Eval harness** | Eval harness runs end-to-end: run `pnpm --filter ai-prompts eval` and record the real output table across 10 fixture transcripts. | `pnpm --filter ai-prompts eval` | **PASSED** (10/10 fixtures pass schema, exact quotes, pivot presence matching expectation, and honesty checks; formatted table printed) | [`docs/tasks/T-10/evidence/verify-04-eval-harness.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-10/evidence/verify-04-eval-harness.txt) |
| **4. Monorepo check** | Workspace build, lint, typecheck, and all test suites green across all packages. | `pnpm install --frozen-lockfile && pnpm check` | **PASSED** (lint, 6 workspace typechecks, vitest across shared/db/content/ai-prompts/gateway, and Jest mobile suites pass) | [`docs/tasks/T-10/evidence/verify-02-install-and-check.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-10/evidence/verify-02-install-and-check.txt) |
| **5. Scope check** | All changed files within contract owned files: `packages/ai-prompts/**`, `docs/tasks/T-10/**`, `pnpm-lock.yaml`. | `git diff --stat main...HEAD` | **PASSED** (31 files changed, 0 outside-scope files) | [`docs/tasks/T-10/evidence/verify-01-git-scope.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-10/evidence/verify-01-git-scope.txt) |

---

## Verifier Focus Items Audit

### 1. Honesty rules from `docs/spec/03-ai-system.md`
- **Verbatim quotes**: In [`packages/ai-prompts/src/coach-feedback.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/coach-feedback.ts#L85), Rule 1 explicitly mandates verbatim user excerpts without paraphrasing or grammar cleanup. Checked in code by [`verifyQuotes`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/utilities.ts#L37).
- **No praise without a line**: In [`packages/ai-prompts/src/coach-feedback.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/coach-feedback.ts#L86), Rule 2 explicitly bans generic praise and requires every worked item to anchor directly to a quoted user turn.
- **No shaming**: In [`packages/ai-prompts/src/coach-feedback.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/coach-feedback.ts#L87), Rule 3 prohibits red marks, rankings, and "you failed" copy, treating awkward turns as "not-yet" with rewrites.
- **No labels (shy, anxious, extroverted, introverted)**: Prohibited in [`coach-feedback.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/coach-feedback.ts#L88) Rule 4, [`voice-style-summary.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/voice-style-summary.ts#L38) Rule 2, [`weekly-letter.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/weekly-letter.ts#L52) Rule 5, and [`debrief-takeaway.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/debrief-takeaway.ts#L45) Rule 5.
- **No diagnosis/medical terms (treat, cure, therapy, diagnose)**: Prohibited across all prompt builder rules (e.g., [`coach-feedback.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/coach-feedback.ts#L89) Rule 5).
- **Simulated character boundaries & inner thoughts**: Stated in [`partner-turn.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/partner-turn.ts#L80) Rule 6 & Rule 8 and [`read-scene.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/read-scene.ts#L45) Rule 6 ("Different people, different signals; reveals what THIS character was written to think, not a universal rule").

### 2. Zero hardcoded model IDs
- Grep across `packages/ai-prompts` for model vendor prefixes (`gpt`, `claude`, `llama`, `nemotron`, `mistral`, `qwen`, `deepseek`) and model assignment patterns returned zero hardcoded model strings. Only the word "modelled" (referencing demonstration dialogues) appears. Verified in [`verify-05-hardcoded-models-and-pinned-deps.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-10/evidence/verify-05-hardcoded-models-and-pinned-deps.txt).

### 3. Field name alignment between Prompts and Zod Schemas
Every prompt builder's `OUTPUT FORMAT` block precisely mirrors the structure, keys, and types declared in its respective Zod schema:
- `PartnerTurnOutputSchema`: `reply`, `thought`, `mood` (`engagement`, `rapport`, `patience`, `exitPressure`), `wantsToEnd`, `cue`.
- `CoachFeedbackSchema`: `intro`, `worked` (`quote`, `why`), `pivot` (`quote`, `whatHappened`, `rewrite`) or `null`, `tryNext`, `skillVotes` (`skill`, `stage`, `reason`), `partnerArc`.
- `PrepCardSchema`: `openers` (min 2), `questions` (exact tuple of 2), `exitLine`, `recoverySuggestion`, `quietBreakIdea`.
- `DebriefQuestionsSchema`: `questions` (min 4, max 5).
- `DebriefTakeawaySchema`: `takeaway`, `coreEssence`, `oneNextFocus`.
- `ReplyHelperSchema`: `readings` (exact tuple of 2), `disclaimer`, `replies` (`warm`, `direct`, `light`).
- `WeeklyLetterSchema`: `letter` (<=150 words), `wordCount` (<=150), `patternNoticed`, `nextFocus`.
- `ScenarioGeneratorSchema`: `title`, `setting`, `situation`, `userGoal`, `partnerPersona` (`PersonaCardSchema`), `difficulty`, `openingLine`.
- `WatchExchangeSchema`: `title`, `skillDemonstrated`, `dialogue` (`speaker`, `text`, `demonstratesSkill`), `targetLineIndex`, `explanation`.
- `ReadSceneSchema`: `scene`, `dialogue` (`speaker`, `text`), `candidateThoughts` (exact tuple of 3), `trueIndex` (0..2), `cueNote`.
- `VoiceStyleSummarySchema`: `summary`, `toneMarkers`, `vocabularyTraits`, `sentenceRhythm`, `samplePhrases`.
- `PersonaCardSchema`: `id`, `name`, `role`, `background`, `demeanor`, `speakingStyle`, `topicsEnjoyed`, `topicsAvoided`, `hiddenTendencies`, `fallbackLines`, `baseMood`.

### 4. Mandatory uncertainty sentence in ReplyHelper
- Verified: Declared in [`packages/ai-prompts/src/reply-helper.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/reply-helper.ts#L13) as `disclaimer: z.literal("I can't know what they meant")`, mandated in Rule 2 (line 40), and enforced in schemas tests.

### 5. WeeklyLetter 150-word enforcement
- Verified: Enforced via Zod refinement and wordCount integer cap in [`packages/ai-prompts/src/weekly-letter.ts`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/src/weekly-letter.ts#L6-L12), instructed in Rule 1 (line 48), and tested in schemas unit tests.

### 6. Pinned dependencies
- [`packages/ai-prompts/package.json`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/ai-prompts/package.json) contains strictly pinned versions without caret or tilde prefixes: `zod: "3.24.2"`, `tsx: "4.19.2"`, `typescript: "5.7.2"`, `vitest: "3.0.5"`. Verified in [`verify-05-hardcoded-models-and-pinned-deps.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-10/evidence/verify-05-hardcoded-models-and-pinned-deps.txt).

---

## Claims audit

| Claim in REPORT.md | Verification Method | Status | Notes |
|---|---|---|---|
| Manifest configured with `zod: 3.24.2`, `tsx: 4.19.2`, exports, and `eval` CLI script | Inspect `packages/ai-prompts/package.json` | **TRUE** | Pinned dependencies and `./*` exports map confirmed |
| Domain types defined in `src/types.ts` | Inspect `packages/ai-prompts/src/types.ts` | **TRUE** | Complete domain types present |
| PersonaCard Zod schema and type | Inspect `packages/ai-prompts/src/persona-card.ts` | **TRUE** | Validated against spec properties |
| `PROMPT_VERSIONS` central registry | Inspect `packages/ai-prompts/src/versions.ts` | **TRUE** | Contains versions for all 11 prompt builders |
| 11 pure prompt builder functions paired with Zod output schemas and labeled prompt sections | Inspect all prompt builder source files | **TRUE** | ROLE, CONTEXT, RULES, OUTPUT FORMAT, EXAMPLES present across all builders |
| Verbatim quote verification (`verifyQuotes`) | Inspect code & run `utilities.test.ts` | **TRUE** | Rejects paraphrased and invented quotes, accepts exact matches with whitespace differences |
| Mood clamping (`clampMood`) to 0.15 step limit | Inspect code & run `utilities.test.ts` | **TRUE** | Deltas exceeding 0.15 clamped; bounded to [0.0, 1.0] |
| Stage median calculation (`stageFromVotes`) | Inspect code & run `utilities.test.ts` | **TRUE** | Computes median across last 3 discrete stages |
| 10 evaluation fixtures in `src/eval/fixtures.ts` | Inspect fixture definitions | **TRUE** | Exactly 10 fixtures covering multiple styles and tones |
| Eval harness CLI running via `pnpm --filter ai-prompts eval` | Execute CLI command independently | **TRUE** | 10/10 fixtures PASS table rendered |
| Monorepo workspace check passes | Execute `pnpm check` | **TRUE** | Monorepo lint, typecheck, and test suites green |
| Zero outside-scope file edits | Execute `git diff --stat main...HEAD` | **TRUE** | Only `packages/ai-prompts/**`, `docs/tasks/T-10/**`, and `pnpm-lock.yaml` touched |
| Zero hardcoded model IDs | Grep model names and patterns across package | **TRUE** | Zero model IDs found |
