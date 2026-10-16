# T-20 Report: Reply Helper

## Summary (3 sentences)
Implemented the Reply Helper feature across the gateway and mobile client, supporting both text paste and screenshot upload with vision model text extraction. The gateway enforces image size (<= 4MB) and dimension (<= 1280px) constraints, runs inbound safety checks, applies daily/weekly tier caps, and logs only job telemetry with zero text or image retention in databases or logs. The mobile app implements Screen C11 with paste and screenshot tabs, a clear blur warning with explicit skip, honest uncertainty phrasing ("I can't know what they meant"), three reply tone cards with inline editing, clipboard copy, and opt-in saving to the Growth Journal.

## What I built (one line per file)
- `apps/mobile/package.json`: Added pinned dependency `"expo-image-picker": "16.0.6"`.
- `pnpm-lock.yaml`: Updated dependency lockfile for `expo-image-picker`.
- `services/gateway/src/routes/reply.ts`: Implemented `POST /v1/reply/helper` with binary image dimension parsing, size checks, vision OCR extraction, safety classification, daily cap tracking, and structured reply generation.
- `services/gateway/src/routes/__tests__/reply.test.ts`: Added unit and integration tests covering paste mode, vision extraction, 4MB and 1280px limit rejections, safety blocks, vision fallback, zero-text telemetry logging, and usage caps.
- `apps/mobile/src/copy/reply.ts`: Created comprehensive copy dictionary adhering to Soft Pop voice, honest uncertainty rules, and zero guilt language.
- `apps/mobile/src/features/reply-helper/types.ts`: Defined TypeScript interfaces for request parameters, responses, image picker payloads, and state management.
- `apps/mobile/src/features/reply-helper/replyApi.ts`: Implemented HTTP client communicating with `/v1/reply/helper` with typed `ReplyApiError` error handling.
- `apps/mobile/src/features/reply-helper/useReplyHelper.ts`: Built React hook coordinating image selection via `expo-image-picker`, blur warnings with explicit skip, API calls, inline reply editing, copying, and journal saving.
- `apps/mobile/src/features/reply-helper/__tests__/replyHelper.test.tsx`: Added UI integration tests covering paste mode, screenshot picker flow, blur warning skip, inline editing, journal saving, vision fallback, and cap limits.
- `apps/mobile/app/tools/reply-helper.tsx`: Implemented full Screen C11 per design specs with segmented mode tabs, honest readings, three reply options (Warm, Direct, Light), copy buttons, and opt-in journal persistence.
- `docs/tasks/T-20/evidence/gateway-reply-tests.txt`: Test execution evidence for gateway reply helper route.
- `docs/tasks/T-20/evidence/mobile-reply-tests.txt`: Test execution evidence for mobile Reply Helper screen.
- `docs/tasks/T-20/evidence/pnpm-check.txt`: Full workspace `pnpm check` evidence showing all lint, typecheck, and tests green.

## Acceptance checks (table: check | command | result | evidence file)
| Check | Command | Result | Evidence File |
|---|---|---|---|
| 1. Tests with fake vision model returning extracted text | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` | PASS (11/11 tests) | `docs/tasks/T-20/evidence/gateway-reply-tests.txt` |
| 2. Test proving zero image bytes or text stored/logged | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` | PASS | `docs/tasks/T-20/evidence/gateway-reply-tests.txt` |
| 3. Size limit enforcement tests (4 MB, 1280 px) | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` | PASS | `docs/tasks/T-20/evidence/gateway-reply-tests.txt` |
| 4. Usage caps enforcement tests | `pnpm --filter @yikes/gateway test src/routes/__tests__/reply.test.ts` | PASS | `docs/tasks/T-20/evidence/gateway-reply-tests.txt` |
| 5. All UI states render and function in mobile tests | `pnpm --filter @yikes/mobile test src/features/reply-helper/__tests__/replyHelper.test.tsx` | PASS (7/7 tests) | `docs/tasks/T-20/evidence/mobile-reply-tests.txt` |
| 6. Clean lint, typecheck, and full test suite across workspace | `pnpm check` | PASS (all 6 workspaces) | `docs/tasks/T-20/evidence/pnpm-check.txt` |

## Spec conformance (each requirement from the contract: DONE, PARTIAL or NOT DONE, with file and line)
- **Pinned dependency expo-image-picker 16.0.6**: DONE — `apps/mobile/package.json` L20.
- **POST /v1/reply/helper text and image support**: DONE — `services/gateway/src/routes/reply.ts` L120-L408.
- **Image max 4MB size check**: DONE — `services/gateway/src/routes/reply.ts` L270-L277.
- **Image max 1280px dimension check**: DONE — `services/gateway/src/routes/reply.ts` L280-L294.
- **Vision model text extraction with fallback**: DONE — `services/gateway/src/routes/reply.ts` L297-L342.
- **Inbound safety check (checkText)**: DONE — `services/gateway/src/routes/reply.ts` L345-L368.
- **ReplyHelper prompt builder with schema validation**: DONE — `services/gateway/src/routes/reply.ts` L370-L397.
- **Enforces 2 readings and mandatory "I can't know what they meant"**: DONE — `services/gateway/src/routes/reply.ts` L400-L402 and `packages/ai-prompts/src/reply-helper.ts`.
- **Enforces 3 reply suggestions (warm, direct, light)**: DONE — `services/gateway/src/routes/reply.ts` L404-L408.
- **Checks and increments reply_helper_count in ai_usage_daily**: DONE — `services/gateway/src/routes/reply.ts` L245-L258, L405.
- **Writes only metadata to ai_calls (job: 'reply')**: DONE — `services/gateway/src/routes/reply.ts` L223-L232.
- **Zero image bytes and zero message text stored/logged**: DONE — `services/gateway/src/routes/reply.ts` L223-L408, proven in `reply.test.ts` L266-L294.
- **User-facing copy file for Reply Helper without guilt words**: DONE — `apps/mobile/src/copy/reply.ts` L1-L79.
- **useReplyHelper hook managing modes, image picker, blur, submission, journal**: DONE — `apps/mobile/src/features/reply-helper/useReplyHelper.ts` L19-L260.
- **Screen C11 implementation with tabs, readings, replies, inline edit, copy, and journal save**: DONE — `apps/mobile/app/tools/reply-helper.tsx` L18-L460.
- **Save to journal button inserting into journal_entries only when tapped**: DONE — `apps/mobile/src/features/reply-helper/useReplyHelper.ts` L223-L248 and `apps/mobile/app/tools/reply-helper.tsx` L450-L458.
- **Graceful fallback offering paste mode when vision model is unavailable**: DONE — `services/gateway/src/routes/reply.ts` L334-L341 and `apps/mobile/app/tools/reply-helper.tsx` L281-L296.

## Dependencies added (name, version, reason, licence)
- `expo-image-picker`: `16.0.6`, pinned dependency for selecting screenshots on mobile devices, MIT licence.

## Outside-scope edits (file, reason, size of change)
None. All edited files are strictly within the T-20 Files owned contract.

## UNVERIFIED items (anything you could not prove, and the fallback you built)
- **On-device automatic region blur**: On-device native canvas/CoreImage blurring of arbitrary user coordinates cannot be implemented without specialized native image processing modules outside Expo SDK defaults. Marked as UNVERIFIED in `apps/mobile/src/features/reply-helper/useReplyHelper.ts` (L23-L26) and displayed a prominent privacy warning with an explicit "Skip & continue" option in `apps/mobile/app/tools/reply-helper.tsx` (L258-L276).

## Known limitations and follow-ups (each with a task id)
- Real device photo library permissions and native crop/blur UI integration will undergo polish in T-25 (Accessibility, motion, and polish pass).
- Paywall upgrade routing from the Reply Helper usage limit card will be connected in T-23 (Billing and plan limits).

## Fix rounds (left empty by the Builder; filled by the Fixer)
