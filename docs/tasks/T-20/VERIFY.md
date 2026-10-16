# T-20 Verification Report: Reply Helper

## VERDICT
**FAIL**

There is 1 blocking issue preventing acceptance: the required offline UI state is not implemented or tested on the Reply Helper screen.

---

## Blocking Issues

### 1. Missing Offline State Implementation and Test
- **File and Line**: `apps/mobile/app/tools/reply-helper.tsx` (L301-L306), `apps/mobile/src/features/reply-helper/useReplyHelper.ts` (L173-L175), `apps/mobile/src/features/reply-helper/__tests__/replyHelper.test.tsx`
- **What is wrong**:
  The Reply Helper screen does not implement or render an explicit offline state. When a network error occurs during reply generation (such as when the user is disconnected from the internet), `useReplyHelper.ts` catches the failure and falls back to setting `error: replyCopy.errors.generic` ("Couldn’t generate suggestions. Please try again."). There is no dedicated offline state banner/card or offline messaging, and `replyHelper.test.tsx` contains 0 tests verifying the offline state.
- **Which contract or spec line it breaks**:
  - Contract T-20 Acceptance check (5) in `docs/tasks/TASKS.md` and prompt: "(5) All UI states render: paste mode, upload mode, result state with readings and 3 replies, cap reached, offline, and vision-down fallback."
  - `AGENTS.md` Code Conventions (L49): "Every screen implements loading, empty, error and offline states."
- **How to reproduce**:
  1. Inspect `apps/mobile/src/features/reply-helper/useReplyHelper.ts` lines 173–175: network fetch failures fall into generic error handling.
  2. Inspect `apps/mobile/app/tools/reply-helper.tsx`: notice there is no offline card or offline handling.
  3. Inspect `apps/mobile/src/features/reply-helper/__tests__/replyHelper.test.tsx`: notice test suite has 7 tests covering paste, upload, disclaimer, editing, journal, fallback, and cap, but 0 tests asserting an offline state.
- **Recommended fix for the Fixer**:
  1. Add an offline copy entry in `apps/mobile/src/copy/reply.ts` (e.g., `offlineTitle` / `offlineBody` or `errors.offline`).
  2. In `useReplyHelper.ts`, detect network/offline failures (or maintain an `isOffline` state) and surface the offline message.
  3. In `apps/mobile/app/tools/reply-helper.tsx`, render an offline card/notice when offline.
  4. In `apps/mobile/src/features/reply-helper/__tests__/replyHelper.test.tsx`, add a test verifying that when a network failure occurs, the offline state renders.

---

## Non-blocking Notes
1. **Zero Text and Image Retention (Privacy)**: Verified through code inspection and automated test (`services/gateway/src/routes/__tests__/reply.test.ts` L267-L294) that no image bytes, base64 payloads, or extracted conversation text are written to database tables, storage buckets, or server logs. Only standard call telemetry metadata (`job: 'reply'`) is recorded in `ai_calls`.
2. **Pinned Dependencies**: `expo-image-picker` is strictly pinned to `"16.0.6"` in `apps/mobile/package.json` without `^` or `~`.
3. **Honest Uncertainty Copy**: The mandatory sentence `"I can't know what they meant"` is strictly enforced across schema (`packages/ai-prompts/src/reply-helper.ts`), gateway route (`services/gateway/src/routes/reply.ts` L393-L395), copy dictionary (`apps/mobile/src/copy/reply.ts` L43), and mobile screen (`apps/mobile/app/tools/reply-helper.tsx` L356).
4. **On-Device Blur Transparency**: Per task contract, on-device automatic blur was marked `UNVERIFIED` in `apps/mobile/src/features/reply-helper/useReplyHelper.ts` and `REPORT.md`, with a clear privacy warning and explicit skip option rendered on upload.
5. **Clean Workspace Checks**: `pnpm install --frozen-lockfile` and full `pnpm check` pass cleanly with zero lint, typecheck, or test regressions.

---

## Acceptance Table

| Check | Requirement | Result | Command & Evidence Pointer |
|---|---|---|---|
| (1) Fake Vision Model Tests | Verify image payload is sent, extracted, and passed to ReplyHelper | **PASS** | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` (`docs/tasks/T-20/evidence/verifier-gateway-reply-tests.txt`) |
| (2) Zero Stored / Logged Image & Text | Prove no image bytes or text are logged or stored in Supabase or Pino logs | **PASS** | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` (L267–L294) & `docs/tasks/T-20/evidence/verifier-privacy-and-uncertainty-audit.txt` |
| (3) Size Limit Enforced | Image > 4 MB or > 1280 px rejected | **PASS** | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` (L194–L237) (`docs/tasks/T-20/evidence/verifier-gateway-reply-tests.txt`) |
| (4) Caps Enforced | Free tier weekly cap limit enforced via ai_usage_daily | **PASS** | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` (L298–L346) & `apps/mobile/src/features/reply-helper/__tests__/replyHelper.test.tsx` (L250–L267) |
| (5) All UI States Render | Paste mode, upload mode, result state with readings and 3 replies, cap reached, offline, and vision-down fallback | **FAIL** | Paste, upload, results, cap, and fallback render; **offline state is missing in UI and tests** (`docs/tasks/T-20/evidence/verifier-offline-gap-audit.txt`) |

---

## Claims Audit

| Claim in REPORT.md | Auditor Verification | Status |
|---|---|---|
| "Added pinned dependency expo-image-picker: 16.0.6" | Inspected `apps/mobile/package.json` L20: `"expo-image-picker": "16.0.6"`. | **TRUE** |
| "POST /v1/reply/helper text and image support with binary image dimension parsing and size checks" | Inspected `services/gateway/src/routes/reply.ts` and executed `reply.test.ts`. | **TRUE** |
| "Safety check on extracted text blocking crisis and unsafe content" | Inspected `services/gateway/src/routes/reply.ts` L336-L358 and tested in `reply.test.ts` L145-L163. | **TRUE** |
| "Writes only metadata to ai_calls (job: 'reply') with zero image bytes and zero message text stored/logged" | Tested in `reply.test.ts` L267-L294 and verified against `ai-calls.ts`. | **TRUE** |
| "Screen C11 implementation with tabs, readings, replies, inline edit, copy, and journal save" | Tested in `replyHelper.test.tsx` L75-L248. | **TRUE** |
| "All UI states render and function in mobile tests" | Tested 7 mobile tests; paste, upload, result, cap, and fallback pass, but offline state is missing. | **FALSE** |
| "Full workspace pnpm check passes" | Executed `pnpm check`: all 6 workspaces passed 105 mobile tests, 71 gateway tests, and all typechecks. | **TRUE** |

---

## Evidence Files Summary
- `docs/tasks/T-20/evidence/verifier-pnpm-frozen-install.txt`
- `docs/tasks/T-20/evidence/verifier-pnpm-check.txt`
- `docs/tasks/T-20/evidence/verifier-gateway-reply-tests.txt`
- `docs/tasks/T-20/evidence/verifier-mobile-reply-tests.txt`
- `docs/tasks/T-20/evidence/verifier-privacy-and-uncertainty-audit.txt`
- `docs/tasks/T-20/evidence/verifier-offline-gap-audit.txt`
