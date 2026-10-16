# Implementation Plan: T-20 — Reply Helper

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-20)
- **Specs**: `docs/spec/03-ai-system.md`, `docs/spec/05-screens-realworld-ai-progress.md` (Screen C11), `docs/spec/06-data-safety.md`
- **Risk Level**: **RISKY (Images of Private Chats)**

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `apps/mobile/package.json`: Add pinned `"expo-image-picker": "16.0.6"` (exact version matching installed Expo SDK 52).
2. `services/gateway/src/routes/reply.ts`:
   - `POST /v1/reply/helper`: Handles text paste or image payload.
   - For images: validates size (<= 4MB, <= 1280px max dimension), sends to vision model (`MODEL_VISION`) or fake provider for text extraction.
   - Runs inbound safety check on extracted or pasted text (T-09).
   - Invokes ReplyHelper prompt builder from `@yikes/ai-prompts` (T-10), parses with `replyHelperOutputSchema`.
   - Enforces the mandatory uncertainty sentence: `"I can't know what they meant"`.
   - Increments user's `reply_helper_count` in `ai_usage_daily` and checks tier caps.
   - Writes ONLY telemetry metadata to `ai_calls` (job: `'reply'`, latency, status, tokens).
   - STRICT PRIVACY GUARANTEE: Zero image bytes and zero message text stored in database or logs!
3. `apps/mobile/src/copy/reply.ts`:
   - User-facing text for Reply Helper header, paste mode, screenshot mode, blur warning, readings header, three reply tones (warm, direct, light), copy toast, save to journal, and cap reached.
4. `apps/mobile/src/features/reply-helper/`:
   - `types.ts`: Reply request and result interfaces.
   - `replyApi.ts`: Client communicating with `/v1/reply/helper`.
   - `useReplyHelper.ts`: Hook managing paste input, image picking via `expo-image-picker`, image resizing to <= 1280px, blur toggle, API submission, and Save to journal.
5. `apps/mobile/app/tools/reply-helper.tsx`:
   - Full implementation of Screen C11 per specs and `c11-reply-helper.svg`.
   - Segmented control: "Paste a message" | "Upload screenshot".
   - Screenshot mode: picker, preview, name-blur warning with explicit skip.
   - Result view:
     - "WHAT THEY MAY MEAN" (2 readings with honest uncertainty line).
     - "THREE REPLY OPTIONS" (WARM, DIRECT, LIGHT) with Copy and inline Edit.
     - "Save to journal" button writing chosen reply to `journal_entries` only when tapped.
   - Graceful fallback: If vision model is unavailable, offers calm fallback to paste mode.
6. Test suites in `services/gateway/src/routes/__tests__/reply.test.ts` and `apps/mobile/src/features/reply-helper/__tests__/`.

---

## 2. Privacy & Security Architecture

### A. Zero Image Storage
- Image data is processed in memory during the HTTP request.
- No image bytes are saved to disk, object storage, database tables, or logs.
- Gateway strictly ignores any instruction to save screenshots.

### B. Zero Text Logging
- Pino logger strips message text via `REDACTED_PATHS`.
- `ai_calls` receives only metadata (`job: 'reply'`, latency, model, tokens).

### C. Honest Uncertainty Language
- Schema and prompts mandate that readings do not state what the sender definitely thought, incorporating the required sentence: `"I can't know what they meant"`.

---

## 3. Acceptance Verification Plan
1. **Acceptance Check 1**: Tests with fake vision model returning extracted text successfully end-to-end.
2. **Acceptance Check 2**: Test proves no image bytes or text are logged or stored in Supabase or Pino logs.
3. **Acceptance Check 3**: Size limits (4 MB and 1280 px) strictly enforced with clear rejection error.
4. **Acceptance Check 4**: Daily/weekly usage caps enforced via `ai_usage_daily`.
5. **Acceptance Check 5**: All UI states render cleanly in Daylight and Midnight modes on web.
