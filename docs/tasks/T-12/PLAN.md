# Implementation Plan: T-12 — Practice Partner API and Try Chat

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-12)
- **Specs**: `docs/spec/03-ai-system.md` (Section 5), `docs/spec/05-screens-core.md` (Screen B7), `docs/spec/04-design-system.md`
- **Risk Level**: **RISKY (Core AI Loop)**

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `services/gateway/src/partner/`:
   - `types.ts`: Partner request/response schemas, SSE event types, attempt state machine.
   - `engine.ts`: Core partner loop executing safety prefilter (T-09), prompt construction (T-10 `buildPartnerTurnPrompt`), structured call via model registry, mood clamping (`clampMood`), output guardrail, turn persistence, and fallback lines handling.
   - `fallbackLines.ts`: Authored character fallback responses for offline or provider failures.
2. `services/gateway/src/routes/partner.ts`:
   - `POST /v1/partner/start`: Creates `attempts` row, returns opening dialogue.
   - `POST /v1/partner/turn`: Streams SSE events (`typing`, `reply`, `done`) or returns JSON with reply, new mood, wantsToEnd, cue. Thought is stored in DB but strictly never returned in turn response!
   - `POST /v1/partner/suggest`: Generates 3 reply suggestions in user's register.
   - `POST /v1/partner/hint`: Generates 1 coaching hint card idea.
   - `POST /v1/partner/end`: Marks attempt finished with `ended_at` and `ended_reason`, returns inner voice thoughts.
3. `apps/mobile/src/copy/try.ts`:
   - User-facing text for Try screen, turns, hints, pass button, idle cue ("Take your time"), thinking states ("Maya is thinking"), offline and cap cards.
4. `apps/mobile/src/features/try/`:
   - `useTrySession.ts`: React hook / state machine managing attempt lifecycle, SSE streaming client, message list, typing indicators, idle timers (20s), and turn caps.
   - `partnerApi.ts`: HTTP and SSE client for `/v1/partner/*`.
5. `apps/mobile/app/session/[id]/try.tsx`:
   - Full implementation of Screen B7 per specs and `b07-try.svg`.
   - Dynamic avatar expressions reflecting partner's hidden mood.
   - Turn counter pill without countdown timer.
   - 3 suggestion chips that populate the input field.
   - Edge states: 8s thinking state, silent retry, scripted fallback, offline card, cap card.
   - On completion (user finish, turn cap, or wantsToEnd), transitions to `/session/[id]/coach?attemptId=...`.
6. `apps/mobile/app/tools/free-chat.tsx`:
   - Free chat screen powered by the partner engine with configurable persona.
7. Test suites in `services/gateway/src/partner/__tests__/` and `apps/mobile/src/features/try/__tests__/`.

---

## 2. Architecture & Security Controls

### A. Thought Leakage Prevention
- Partner inner voice thoughts are saved to the `turns` table with `thought` column for subsequent Coach and Inner Voice reveal (T-13).
- In `POST /v1/partner/turn`, the response object and SSE streams contain ONLY:
  `{ reply, mood, wantsToEnd, cue }`.
- `thought` is strictly excluded from `POST /v1/partner/turn` responses. Only `POST /v1/partner/end` returns thoughts after the chat is completed.

### B. Safety on Both Directions
- User message is verified through gateway safety checker (`checkText(userText, 'inbound')`). If crisis -> immediately returns `{ crisis: true }` without AI text, triggering mobile `useSafetyRoute()` navigation to `/support`.
- Partner model output is checked through output guard (`validateOutput()`) to forbid clinical terms and human claims, plus outbound safety check.

### C. Rate Limits & Daily Caps
- Checks user plan and daily usage against `ai_usage_daily`. If cap exceeded -> returns typed `CAP_REACHED` error without consuming tokens.
- Free chat mode uses priority 'chat' with max 6s wait in gateway token bucket.

### D. Provider Failures & Degraded Mode
- Primary model failure triggers 1 retry with jitter, then fallback model.
- If both models fail, selects authored fallback lines from character card and marks attempt `degraded: true` with calm "is taking a moment" UI.

---

## 3. Acceptance Verification Plan
1. **Acceptance Check 1**: Gateway tests with fake provider: schema retry, mood clamp, crisis returns no AI text, daily caps enforced, thoughts hidden until end, fallback lines used on provider failure.
2. **Acceptance Check 2**: Mobile app tests for all states: normal chat, typing indicator, 20s idle line, 8s slow reply thinking state, offline state, cap reached state.
3. **Acceptance Check 3**: Live NVIDIA API integration: a complete 6-turn chat executed against the live API; latency per turn logged in table.
4. **Acceptance Check 4**: Pino log audit: zero message text logged.
