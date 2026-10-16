# T-20 Verification Report: Reply Helper

## VERDICT
**PASS**

Zero blocking issues identified. All acceptance criteria, spec requirements, and previous blocking issues have been thoroughly audited and verified through independent automated testing and source code inspection.

---

## Blocking Issues
None.

---

## Non-blocking Notes
1. **Resolved Offline State (Previous Issue 1)**:
   - In Fix Round 1, offline strings were added to `apps/mobile/src/copy/reply.ts` (`replyCopy.offline` with title, description, retry).
   - `useReplyHelper.ts` now accurately detects network connection failures and tracks `isOffline`.
   - `apps/mobile/app/tools/reply-helper.tsx` renders a Honey-tinted card with `WinceMascot` (pose="offline"), clear typography, and a "Try again" retry button.
   - Verified with unit test in `apps/mobile/src/features/reply-helper/__tests__/replyHelper.test.tsx` (L269-L294), confirming card rendering upon network rejection and recovery upon retry.
2. **Zero Text and Image Retention (Privacy)**:
   - Verified through code inspection and automated test (`services/gateway/src/routes/__tests__/reply.test.ts` L267-L294) that no image bytes, base64 payloads, or extracted conversation text are written to database tables, storage buckets, or server logs. Only standard call telemetry metadata (`job: 'reply'`) is recorded in `ai_calls`.
   - In mobile client, saving to Growth Journal only occurs upon explicit user tap of "Save to journal".
3. **Pinned Dependencies**:
   - `expo-image-picker` is strictly pinned to `"16.0.6"` in `apps/mobile/package.json` without `^` or `~`.
4. **Honest Uncertainty Copy**:
   - The mandatory phrase `"I can't know what they meant"` is strictly enforced across schema (`packages/ai-prompts/src/reply-helper.ts`), gateway route fallback (`services/gateway/src/routes/reply.ts` L392-L395), copy dictionary (`apps/mobile/src/copy/reply.ts` L43), and mobile screen (`apps/mobile/app/tools/reply-helper.tsx` L375).
5. **On-Device Blur Transparency**:
   - On-device automatic region blur was noted as `UNVERIFIED` per contract instructions, displaying a prominent privacy warning with an explicit "Skip & continue" option in `apps/mobile/app/tools/reply-helper.tsx` (L283-L301).
6. **Clean Workspace Checks**:
   - `pnpm install --frozen-lockfile` and full `pnpm check` pass cleanly with zero lint errors, zero type errors, and 100% passing tests across all 6 workspaces (106 mobile unit tests, 71 gateway tests).

---

## Acceptance Table

| Check | Requirement | Result | Command & Evidence Pointer |
|---|---|---|---|
| (1) Fake Vision Model Tests | Verify image payload is sent, extracted by vision model, and passed to ReplyHelper | **PASS** | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` (`docs/tasks/T-20/evidence/verifier-gateway-reply-tests.txt`) |
| (2) Zero Stored / Logged Image & Text | Prove no image bytes or text are logged or stored in Supabase or server logs | **PASS** | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` (L267–L294) & `docs/tasks/T-20/evidence/verifier-privacy-and-uncertainty-audit.txt` |
| (3) Size Limit Enforced | Image > 4 MB or > 1280 px dimension rejected with typed 400 error | **PASS** | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` (L194–L237) (`docs/tasks/T-20/evidence/verifier-gateway-reply-tests.txt`) |
| (4) Caps Enforced | Free tier weekly/daily cap limit enforced via ai_usage_daily with 429 response | **PASS** | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` (L298–L346) & `apps/mobile/src/features/reply-helper/__tests__/replyHelper.test.tsx` (L250–L267) |
| (5) All UI States Render | Paste mode, upload mode, result state with readings and 3 replies, cap reached, offline state, and vision-down fallback | **PASS** | `pnpm --filter @yikes/mobile test src/features/reply-helper/__tests__/replyHelper.test.tsx` (8/8 tests pass) (`docs/tasks/T-20/evidence/verifier-mobile-reply-tests.txt` & `docs/tasks/T-20/evidence/verifier-offline-resolved.txt`) |

---

## Claims Audit

| Claim in REPORT.md | Auditor Verification | Status |
|---|---|---|
| "Added pinned dependency expo-image-picker: 16.0.6" | Inspected `apps/mobile/package.json` L20: `"expo-image-picker": "16.0.6"`. | **TRUE** |
| "POST /v1/reply/helper text and image support with binary image dimension parsing and size checks" | Inspected `services/gateway/src/routes/reply.ts` L21-L295 and executed `reply.test.ts`. | **TRUE** |
| "Safety check on extracted text blocking crisis and unsafe content" | Inspected `services/gateway/src/routes/reply.ts` L336-L358 and tested in `reply.test.ts` L145-L163. | **TRUE** |
| "Writes only metadata to ai_calls (job: 'reply') with zero image bytes and zero message text stored/logged" | Tested in `reply.test.ts` L267-L294 and verified against `replyCallLogger`. | **TRUE** |
| "Screen C11 implementation with tabs, readings, replies, inline edit, copy, and journal save" | Tested in `replyHelper.test.tsx` L75-L248 and inspected in `reply-helper.tsx`. | **TRUE** |
| "Renders offline state card when network request fails due to offline error" | Tested in `replyHelper.test.tsx` L269-L294 and inspected in `reply-helper.tsx` L128-L148. | **TRUE** |
| "All UI states render and function in mobile tests" | Executed 8 mobile tests; paste, upload, result, cap, offline, and fallback all pass cleanly. | **TRUE** |
| "Full workspace pnpm check passes" | Executed `pnpm check`: all 6 workspaces passed 106 mobile tests, 71 gateway tests, and all typechecks/lints. | **TRUE** |

---

## Evidence Files Summary
- `docs/tasks/T-20/evidence/verifier-pnpm-frozen-install.txt`: Verification of clean frozen lockfile installation.
- `docs/tasks/T-20/evidence/verifier-pnpm-check.txt`: Verification of full workspace lint, typecheck, and test suite.
- `docs/tasks/T-20/evidence/verifier-gateway-reply-tests.txt`: Gateway reply helper API test suite execution (11/11 tests passing).
- `docs/tasks/T-20/evidence/verifier-mobile-reply-tests.txt`: Mobile reply helper test suite execution (8/8 tests passing).
- `docs/tasks/T-20/evidence/verifier-offline-resolved.txt`: Verification of offline state UI card, copy, hook detection, and retry test.
- `docs/tasks/T-20/evidence/verifier-privacy-and-uncertainty-audit.txt`: Audit of zero text/image logging, mandatory disclaimer enforcement, and safe blur handling.
