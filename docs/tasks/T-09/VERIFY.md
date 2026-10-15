# T-09 Verification: Safety Layer

## Verdict
**FAIL**

Two blocking issues were identified during independent verification:
1. **Critical Recall Leak in Hinglish Crisis Detection**: In [crisis-terms.ts](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/shared/src/safety/crisis-terms.ts#L67), the regex pattern requires `apni/apne jaan le` followed by `lena` (i.e. "apni jaan le lena"), which fails to match standard natural Hinglish suicidal expressions such as "apni jaan lena chahta hu" ("I want to take my own life"). In degraded mode when `MODEL_SAFETY` is unavailable, this allows crisis messages through with `verdict: "allow"`.
2. **Corrupted Crisis Helpline Resource Parsing**: In [resources.ts](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/services/gateway/src/safety/resources.ts#L74-L115), stripping leading whitespace before inspecting bullet headers causes indented sub-bullets (e.g. `  - **Alternate Phone**: 1800-891-4416`, `  - **Website**: https://...`, `  - **Verification**: ...`) to be treated as top-level helpline headers. Consequently, Tele-MANAS loses its alternate phone and website, while spurious bogus helplines named "Alternate Phone", "Website", and "Verification" are inserted into the crisis directory.

---

## Blocking issues

### 1. Hinglish Crisis Pre-filter Misses "apni jaan lena" Phrasing
- **File and Line**: [`packages/shared/src/safety/crisis-terms.ts` L67](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/packages/shared/src/safety/crisis-terms.ts#L67)
- **What is wrong**: The regex pattern is defined as:
  ```typescript
  { pattern: /\bapn[ie]\s+jaan\s+le\s+(?:lunga|lungi|lena)\b/i, category: 'suicide' }
  ```
  Because the regex demands the token `le` before `(?:lunga|lungi|lena)`, it requires phrasing like "apni jaan le lena" or "apni jaan le lunga". However, the standard grammatical phrasing in Hindi/Hinglish for taking one's life is "apni jaan lena" (e.g., "apni jaan lena chahta hu" / "apni jaan lena chahti hu" / "apni jaan lena hai"). Natural inputs with "apni jaan lena chahta hu" return `{ isCrisis: false }`. In degraded mode when `MODEL_SAFETY` is down, `checkText("apni jaan lena chahta hu")` returns `{ verdict: "allow" }`.
- **Contract / Spec Line Broken**:
  - [TASKS.md L146](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/TASKS.md#L146): "It combines (a) a fast rule-based crisis pre-filter with high recall (English plus common Hinglish phrases, kept in packages/shared/src/safety/crisis-terms.ts)... Either one flagging crisis returns crisis. If the safety model is down, use rules only and mark degraded."
  - [TASKS.md L155](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/TASKS.md#L155): "Verifier focus: recall on crisis phrasing (write ten of your own)... fail-safe behaviour."
- **How to reproduce**:
  Run in node/vitest:
  ```typescript
  import { checkCrisisRules } from './packages/shared/src/safety/crisis-terms.js';
  const res = checkCrisisRules("apni jaan lena chahta hu");
  // res.isCrisis is false (Expected: true)
  ```

### 2. Crisis Resources Markdown Parser Corrupts Helplines on Indented Sub-bullets
- **File and Line**: [`services/gateway/src/safety/resources.ts` L74-L115](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/services/gateway/src/safety/resources.ts#L74-L115)
- **What is wrong**:
  At line 74, `line = rawLine.trim()` strips all leading indentation.
  At line 91, the helpline name detector checks:
  ```typescript
  if (line.startsWith('- **') && !line.startsWith('- **Phone') && !line.startsWith('- **SMS'))
  ```
  In [docs/spec/crisis-resources.md](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/spec/crisis-resources.md#L10-L15), sub-bullets for Tele-MANAS and other helplines are indented:
  ```markdown
  - **Tele-MANAS (Government of India, National Tele Mental Health Programme)**
    - **Phone**: 14416 (Toll-Free, 24x7, Multilingual across all Indian languages)
    - **Alternate Phone**: 1800-891-4416
    - **Website**: https://telemanas.mohfw.gov.in
    - **Verification**: Verified official National Mental Health initiative under Ministry of Health and Family Welfare (MoHFW), Govt of India.
  ```
  Because `line.trim()` removes the indentation, `- **Alternate Phone**:` matches `line.startsWith('- **')` and does NOT match `- **Phone`. It flushes Tele-MANAS immediately, sets `currentHelpline.name = 'Alternate Phone'`, and then treats `Website` and `Verification` as subsequent fake helplines.
  As a result:
  1. Tele-MANAS has `alternatePhone: undefined` and `website: undefined`.
  2. Spurious fake helplines with names "Alternate Phone", "Website", "Verification", and "Chat" are generated into `dir.allHelplines`.
- **Contract / Spec Line Broken**:
  - [TASKS.md L151](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/TASKS.md#L151): "Crisis resources loaded only from docs/spec/crisis-resources.md... Never invent a helpline number."
  - [TASKS.md L155](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/TASKS.md#L155): "Verifier focus: ... no invented numbers, fail-safe behaviour."
- **How to reproduce**:
  Run in node/vitest:
  ```typescript
  import { loadCrisisResources } from './services/gateway/src/safety/resources.js';
  const dir = loadCrisisResources();
  const telemanas = dir.allHelplines.find(h => h.name.includes('Tele-MANAS'));
  console.log(telemanas.alternatePhone); // undefined
  console.log(dir.allHelplines.map(h => h.name)); // contains 'Alternate Phone', 'Website', 'Verification'
  ```

---

## Non-blocking notes
1. **Pino Logger Field Whitelist**: While `text`, `content`, `prompt`, `thought`, `reply`, and `rawText` are properly redacted via `REDACTED_PATHS` in [logger.ts](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/services/gateway/src/telemetry/logger.ts#L3-L26), callers should be careful not to log raw user input under generic keys such as `user_input` or `msg`.
2. **Exclusion Validation in Gateway Routes**: [scenarios.ts](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/services/gateway/src/safety/scenarios.ts#L87-L107) validates scenarios and Moment descriptions as pure functions, which will be integrated in T-16 (Moments & Prep) and T-14 (Scenario generation).

---

## Acceptance table

| Check | Command | Result | Evidence File |
| --- | --- | --- | --- |
| 1. Fixtures: 30 benign allowed, 20 crisis flagged, 10 injection strings neutralized | `pnpm --filter @yikes/gateway test src/safety/__tests__/safety.test.ts` | **PASS (builder fixtures)** / **FAIL on novel Hinglish crisis phrasing** | [`docs/tasks/T-09/evidence/check-verifier-audit.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-09/evidence/check-verifier-audit.txt) |
| 2. Degraded mode flags crisis fixtures when model is down | `pnpm --filter @yikes/gateway test src/safety/__tests__/safety.test.ts` | **PASS (builder fixtures)** / **FAIL for Hinglish phrase "apni jaan lena chahta hu"** | [`docs/tasks/T-09/evidence/check-verifier-audit.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-09/evidence/check-verifier-audit.txt) |
| 3. Test proves no message text in safety_events or logs | `pnpm --filter @yikes/gateway test src/safety/__tests__/safety.test.ts` | **PASS** (DB insert contains only `kind` and `source`; Pino redacts message text) | [`docs/tasks/T-09/evidence/check-verifier-audit.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-09/evidence/check-verifier-audit.txt) |
| 4. Resource loader refuses file with UNVERIFIED entries | `pnpm --filter @yikes/gateway test src/safety/__tests__/safety.test.ts` | **PASS on rejection of UNVERIFIED / missing**; **FAIL on parser corruption of valid sub-bullets** | [`docs/tasks/T-09/evidence/check-verifier-audit.txt`](file:///c:/Users/ghana/OneDrive/Desktop/yikes-app!/docs/tasks/T-09/evidence/check-verifier-audit.txt) |

---

## Claims audit

| Claim in REPORT.md | Status | Verification Detail |
| --- | --- | --- |
| "High-recall English and Hinglish rule-based crisis detector with idiomatic awkward-conversation exemptions" | **PARTIALLY TRUE** | Idiomatic awkward-conversation exemptions have 0% false positives (verified across 10 novel awkward phrases). However, Hinglish recall fails on standard phrasing "apni jaan lena chahta hu" due to `le\s+(?:lunga|lungi|lena)` regex bug. |
| "Vitest suite proving 30 benign awkward phrases pass and 20 crisis phrases flag with 100% recall" | **TRUE** | Verified that `packages/shared/src/safety/__tests__/crisis-terms.test.ts` passes with its 30 benign and 20 crisis fixtures. |
| "Prompt injection guard with `<user_message>` envelope, token sanitization, and `buildSafeMessages()`" | **TRUE** | Verified all 10 injection strings neutralized and safely enclosed with token sanitization. |
| "Scenario exclusion validator rejecting abuse, bereavement, confronting harm, harassment reporting, and medical news" | **TRUE** | Verified against all 5 excluded categories in `scenarios.test.ts` and `verifier-audit.test.ts`. |
| "Output guard rejecting claims of being human and forbidding clinical therapy terms" | **TRUE** | Verified rejection of human identity claims and clinical terms (`treat`, `cure`, `therapy`, `diagnose`) in `output-guard.ts`. |
| "Crisis resource parser for docs/spec/crisis-resources.md refusing missing or UNVERIFIED resources" | **FALSE** | While it throws on `UNVERIFIED` and missing files, its parsing of valid markdown is broken: strips sub-bullet indentation, turning `Alternate Phone`, `Website`, and `Verification` into fake helplines and corrupting Tele-MANAS fields. |
| "Gateway safety engine combining rule pre-filters, model evaluation, and resilient degraded fallback mode" | **TRUE** | Degraded mode architecture correctly activates when model is down, though hindered by the crisis terms regex bug. |
| "Fastify route `POST /v1/safety/check` with JWT authentication and privacy-guaranteed `safety_events` logging" | **TRUE** | Verified 401 unauthenticated response and metadata-only `{ kind, source }` logging to Supabase. |
| "Mobile hook `useSafetyRoute` navigating to `/support` when gateway safety verdict is crisis" | **TRUE** | Verified via Jest tests in `useSafetyRoute.test.ts`: navigates to `/support` on `crisis`, does not navigate on `allow` or `block`. |
| "zero message text logging" | **TRUE** | Verified that neither the route nor database inserts include user message text. |

---

## Verifier Focus Items Summary

1. **Recall on crisis phrasing (10 novel phrases)**:
   - English: "I genuinely want to die right now" (FLAGGED), "I don't want to wake up anymore" (FLAGGED), "thinking about killing myself tonight" (FLAGGED), "I'm going to take my own life tomorrow" (FLAGGED), "planning my suicide note" (FLAGGED).
   - Hinglish: "ab jeena nahi chahti mai" (FLAGGED), "zeher kha lungi agar fail ho gaya" (FLAGGED), "khud ko marna chahta hu" (FLAGGED), "phaasi laga raha hu" (FLAGGED).
   - Hinglish Missed: "apni jaan lena chahta hu" (**MISSED** - Blocking Issue 1).
2. **False-positive rate on awkward conversations**:
   - 0% false positives verified across: "I died of embarrassment during my toast", "this presentation is killing me", "I want to disappear from this party", "my shoes are killing me", "I was dead tired after the workshop", "bringing that up was total social suicide", "I wanted to sink into the floor when I dropped my plate", "I just wanted to crawl into a hole and hide", "I died laughing when he forgot his lines", "just killing time before my interview starts". All returned `allow`.
3. **Output guard**:
   - Correctly rejected AI identity claims ("I am a real human", "I am a real person", "I am not an AI").
   - Correctly rejected clinical terms ("treat", "cure", "therapy", "diagnose") in coaching copy.
   - Allowed constructive non-clinical feedback.
4. **Crisis Resource Loader**:
   - Correctly refused files containing `UNVERIFIED` markers.
   - Correctly refused non-existent files.
   - Failed parser data integrity on indented sub-bullets (**MISSED** - Blocking Issue 2).
5. **Fail-safe behavior**:
   - Gracefully falls back to degraded mode when model provider fails or times out.
6. **Privacy**:
   - Proved zero message text stored in `safety_events` or output to logs.
