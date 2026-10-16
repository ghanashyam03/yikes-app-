# Implementation Plan: T-22 — Settings, Support Screen and System States

## Contract & References
- **Contract**: `docs/tasks/TASKS.md` (T-22)
- **Specs**:
  - `docs/spec/05-screens-settings-system.md` (Screens D1, D6, D7, D8, D9, D10, D11, D12, D13, D14)
  - `docs/spec/crisis-resources.md` (Verified 24x7 crisis helplines)
  - `docs/spec/04-design-system.md` (Tokens, glass cards, Honey amber, zero red)
  - `AGENTS.md` & `GEMINI.md`
- **Risk Level**: **RISKY** (Support screen / Safety critical)

---

## 1. Files Owned & Scope

### Files to Create / Modify:
1. `apps/mobile/app/settings/index.tsx`:
   - Screen D1 Settings: Grouped glass cards (Playbook, Coach tone, Rhythm with optional streak toggle defaulting OFF, Reminders link, Appearance, Quiet Lock, Account, Privacy Centre link, Subscription link, Help link, About AI link).
   - Search filter bar at top.
2. `apps/mobile/app/settings/help.tsx`:
   - Screen D6 Help and feedback: Searchable FAQ accordion, contact form, and `ReportAiButton` modal saving to `ai_feedback` table.
3. `apps/mobile/app/settings/about-ai.tsx`:
   - Screen D7 About the AI: Transparent disclosure of AI systems, character disclaimer, Coach capabilities & boundaries, and clinical disclaimer.
4. `apps/mobile/app/support.tsx`:
   - Screen D8 Support screen (Safety):
     - Triggered when user text signals crisis (`crisis: true`).
     - Hush transition: ambient dimmed background, practice paused.
     - **STRICTLY ZERO AI-GENERATED TEXT**: All copy is 100% human-authored from `apps/mobile/src/copy/system.ts`.
     - Verified phone call button (`tel:14416` India Tele-MANAS, `tel:988` US, `tel:116123` UK).
     - Verified SMS button (`sms:741741` US, `sms:85258` UK, or WhatsApp for India).
     - "Contact someone you trust" action.
     - Quiet "Back to practice when you're ready" button.
5. `apps/mobile/src/copy/settings.ts`:
   - User-facing copy for Settings groups, Appearance, Rhythm, Coach tone, Quiet Lock, Help FAQ, and About AI.
6. `apps/mobile/src/copy/system.ts`:
   - User-facing copy for Support screen (D8), Offline banner & card (D9), Partner busy card (D10), Daily limit card (D11), Welcome back (D12), and Error boundary (D14).
7. `apps/mobile/src/features/settings/`:
   - `types.ts`: Settings store types.
   - `useSettings.ts`: Zustand store with persistence for user preferences:
     - `streakEnabled: boolean` (default: **false**).
     - `appearance: 'auto' | 'light' | 'dark'` (default: `'auto'`).
     - `reducedMotionOverride: boolean` (default: `false`).
     - `textScale: number` (default: `1.0`).
     - `hapticsEnabled: boolean` (default: `true`).
     - `soundEnabled: boolean` (default: `true`).
     - `coachTone: 'gentle' | 'straight' | 'funny'`.
     - `weeklyGoal: number` (default: `3`).
     - `isPaused: boolean` (pause practice for a busy week).
   - `ReportAiButton.tsx`: Reusable component rendering a gentle "Report this answer" button with feedback modal and opt-in message attachment.
8. `apps/mobile/src/features/system-states/`:
   - `ConnectivityProvider.tsx` & `useConnectivity.ts`: Network state monitoring; renders subtle D9 offline banner and reconnect card.
   - `BusyCard.tsx`: D10 Partner busy card with shimmer animation and 8-second fallback trigger.
   - `DailyLimitCard.tsx`: D11 Calm daily AI limit card for free/plus users.
   - `WelcomeBackModal.tsx`: D12 Warm return greeting after 3+ days away without guilt copy.
   - `emptyStatesRegistry.ts` & `EmptyStateCard.tsx`: D13 Registry of designed empty states with illustrations and encouragement for Moments, Journal, Gap, Ladder, History.
   - `ErrorBoundary.tsx`: D14 Error boundary with plain friendly words ("Couldn't save that. Try again.") and zero technical stack traces exposed.

---

## 2. Safety & Product Rule Guarantees

### A. Non-Negotiable Support Screen Rules
1. **Zero AI Text**: No prop, route parameter, or API call may supply text to `support.tsx`. All strings are statically referenced from `docs/spec/crisis-resources.md` and `apps/mobile/src/copy/system.ts`.
2. **Real Verified Helplines**:
   - India: Tele-MANAS `14416` (Primary launch market).
   - US: `988`.
   - UK: `116 123`.
   - Never invent numbers or links.
3. **Correct URL Schemes**: `tel:<number>` and `sms:<number>`.
4. **Hush Transition**: Calming dark/hushed palette, practice state paused, zero loud colors or alarms.

### B. Non-Negotiable Gamification & Copy Rules
1. **Streaks Default OFF**: `streakEnabled` in `useSettings` strictly defaults to `false`.
2. **Zero Clinical Claims**: Never use `treat`, `cure`, `therapy`, or `diagnose` in any user-facing copy.
3. **Zero Red**: Error boundary and limits use Honey amber, never red.
4. **Welcome Back No Guilt**: Welcome back screen (D12) welcomes user back warmly without mentioning "missed", "lost streak", or days absent.

---

## 3. Acceptance Verification Plan

1. **Acceptance Check 1 (Safety Screen Zero AI)**:
   - Render test proves `support.tsx` contains no model-generated text and receives no AI data.
2. **Acceptance Check 2 (Helpline URL Schemes)**:
   - Test proves phone and text helpline actions invoke `tel:` and `sms:` with verified crisis numbers from `crisis-resources.md`.
3. **Acceptance Check 3 (Settings Persistence & Streaks Default)**:
   - Test proves `useSettings` persists across restart and `streakEnabled` is strictly `false` by default.
4. **Acceptance Check 4 (Error Boundary Plain Words)**:
   - Test triggers a thrown component error and asserts `ErrorBoundary` renders plain language with retry action, with zero technical stack traces exposed.
5. **Acceptance Check 5 (Dual Mode Rendering)**:
   - All settings and system state screens render cleanly in both Light (Daylight) and Dark (Midnight) modes.
6. **Acceptance Check 6 (Monorepo Check)**:
   - `pnpm check` passes cleanly with 0 lint and 0 typecheck errors.
