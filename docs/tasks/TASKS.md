# Task Contracts (T-00 to T-27)

### T-00 — Repo scaffold and tooling
Branch: task/T-00-scaffold
Depends on: none. Parallel with: nothing. Run alone first.
Risk: normal
Read first: AGENTS.md, GEMINI.md, playbook repo map (section 5 of the playbook, summarised in AGENTS.md)
Files owned: root config files, .github/workflows/ci.yml, .env.example, README.md, skeleton of every package, apps/mobile (initial Expo app only), services/gateway (hello service only), scripts/
Build:
pnpm workspace containing apps/mobile, services/gateway, packages/shared, packages/db, packages/content, packages/ai-prompts. Package names @yikes/shared, @yikes/db, @yikes/content, @yikes/ai-prompts, @yikes/gateway, @yikes/mobile.
Strict TypeScript base config. Each package has package.json, src/, tsconfig.json, a Vitest config, and an exports map "./*": "./src/*.ts" so deep imports like @yikes/shared/version work. No barrel files.
apps/mobile: current stable Expo with TypeScript and expo-router. Install react-native-reanimated, react-native-gesture-handler, expo-haptics, react-native-safe-area-context, react-native-svg, zustand, @tanstack/react-query, expo-secure-store, expo-local-authentication, expo-font. Configure Reanimated's Babel plugin. Jest with jest-expo and React Native Testing Library, plus one smoke test that renders the root layout.
services/gateway: Fastify with GET /health returning {"ok":true}, tested with fastify.inject.
Root scripts: check (lint, typecheck, test), lint, typecheck, test, format, db:reset (runs supabase db reset), db:test (placeholder that exits 0 and prints "defined in T-05").
ESLint with typescript-eslint (no-explicit-any as error) and Prettier.
.env.example with exactly the variable names listed in the playbook, empty values.
CI workflow running pnpm install --frozen-lockfile then pnpm check.
Short README: how to install, run the app, run the gateway.
Out of scope: any feature, tokens, Supabase tables, routes beyond the root layout.
Acceptance checks: (1) pnpm install is clean. (2) pnpm check is green. (3) pnpm --filter gateway dev starts and curl localhost:<port>/health returns {"ok":true}. (4) pnpm --filter mobile web serves without errors. (5) A deep import @yikes/shared/version resolves from both mobile and gateway.
Verifier focus: versions pinned, lockfile committed, no any, no feature creep, exports map works, CI file runs the same commands.

### T-01 — Spec import and split
Branch: task/T-01-spec
Depends on: T-00. Parallel with: T-02, T-05
Risk: normal
Read first: docs/spec/SPEC_FULL.md, docs/design/ images
Files owned: docs/spec/** (except crisis-resources.md), docs/design/README.md, docs/tasks/DECISIONS.md, scripts/check-spec-split.mjs
Build:
Split SPEC_FULL.md by section into: 01-product.md (sections 1, 2, 6, 7), 02-auth-onboarding.md (3, 4), 03-ai-system.md (5, 14), 04-design-system.md (8), 05-screens-launch-quiz.md (9), 05-screens-core.md (10), 05-screens-realworld-ai-progress.md (11), 05-screens-settings-system.md (12), 06-data-safety.md (13, 16), 07-content.md (15), 08-acceptance.md (17). Text is copied verbatim. Add only a one-line header naming the source sections.
docs/spec/INDEX.md: each file, its source sections, one-line summary.
docs/spec/GLOSSARY.md: Playbook, Moment, Session, Inner Voice, Coach, Gap, Quiet Ladder, Battery, Rhythm, Partner, Persona, Wince. Definitions taken from the spec only.
docs/tasks/DECISIONS.md: the open decisions with the defaults the build will use: launch market India, English first; streak off by default; Plus price a placeholder [PRICE]; calendar connection optional.
docs/design/README.md: one paragraph per design image saying what it shows and listing visible differences from 04-design-system.md that implementers must resolve in favour of the spec.
scripts/check-spec-split.mjs: concatenates the split files in order, removes the added headers, and compares with SPEC_FULL.md.
Out of scope: changing the meaning of any spec text; any code except the check script.
Acceptance checks: (1) node scripts/check-spec-split.mjs reports identical content. (2) Every spec section 1 to 17 appears in exactly one file. (3) INDEX.md links resolve.
Verifier focus: verbatim copying (run your own diff), nothing paraphrased or dropped, decisions list matches the spec's open decisions.

### T-02 — Design tokens, theme and primitives
Branch: task/T-02-tokens
Depends on: T-00. Parallel with: T-01, T-05
Risk: normal
Read first: docs/spec/04-design-system.md, docs/design/ images
Files owned: packages/shared/src/tokens/**, apps/mobile/src/theme/**, apps/mobile/src/ui/primitives/**, apps/mobile/src/ui/icons/**, apps/mobile/src/copy/common.ts, apps/mobile/app/dev/gallery.tsx
Build:
Tokens exactly as in the spec tables: Midnight and Daylight colours (base, surface 1, surface 2, glass recipe, ink, muted, Ember gradient, Lilac, Mint, Honey, Sky, Bubblegum, each with tint and pop), 8pt spacing scale, radii (card 28, sheet 36, pill), type roles and scale, motion (springs: playful stiffness 300 damping 26, calm damping 30; durations 180, 280, 420 ms), haptic map, glow (dark) and coloured shadow (light) recipes.
ThemeProvider with light, dark and auto (follows system), useTheme(), and a 300 ms crossfade between modes.
Fonts via expo-font: Bricolage Grotesque, Plus Jakarta Sans, Instrument Serif Italic, with system fallbacks.
Primitives: Text (role variants), Button (primary Ember gradient with Ink text, secondary, ghost; press squish to 94% with spring overshoot; loading dots; disabled with dashed edge), Chip (selectable, pop on tap), Card (glossy bead with top-left inner highlight; tint variants), Screen (safe area plus ambient drifting bubble backdrop that stops under Reduced Motion).
Icons as SVG: home, path, calendar, person, plus, back, send, check, close, battery.
Every primitive implements default, pressed, focused (3px Lilac ring with 2px offset), selected, disabled, loading.
Dev-only gallery route showing every primitive in both modes with a toggle.
A contrast test that computes the WCAG ratio for every text-on-background token pair and asserts AA.
Out of scope: interactive components (T-03), navigation (T-04).
Acceptance checks: (1) pnpm check green including the contrast test. (2) Gallery renders in both modes on pnpm --filter mobile web. (3) A test proves the backdrop stops when Reduced Motion is on. (4) A script or test asserts every token value equals the value in the spec table.
Verifier focus: values against the spec table, no hard-coded colours outside tokens (grep), focus ring visible, press feel uses Reanimated not JS timers.

### T-03 — Interactive components
Branch: task/T-03-components
Depends on: T-02. Parallel with: T-04, T-08
Risk: normal
Read first: docs/spec/04-design-system.md (micro-interactions table), docs/spec/05-screens-core.md
Files owned: apps/mobile/src/ui/components/**, apps/mobile/src/copy/components.ts, apps/mobile/app/dev/gallery-components.tsx
Build: NoDefaultSlider (value is null until first touch; thumb inflates from the track; tick haptic per step; configurable range; adjustable accessibility actions), BatteryGauge (display and drag modes; liquid fill with sloshing surface; Mint to Honey to Ember; haptic every 10%), RhythmRing (segment fill with bulge and one sparkle), ChatBubble (user, partner, dashed thought variants), TypingDots (wobble in a given colour), CharacterAvatar (SVG faces with four expressions: neutral, warm, distracted, wrapping up; palette per character), WinceMascot (six poses: curious, sleepy, thinking, proud, peeking, offline), BottomSheet (glass, drag to dismiss), Skeleton (shimmering bubble shapes), EvidenceLine (tilted sticker with highlighter swipe), ThoughtBubble (floats up, wobbles, pops on tap), EmptyState, ErrorBubble (Honey, shakes once, never red), Toast. Each has all states from the spec and a Reduced Motion variant. All animation runs on the UI thread with Reanimated worklets.
Out of scope: any screen, any data fetching.
Acceptance checks: (1) Tests: slider is null by default; battery value mapping; avatar expression switching. (2) Gallery shows every component in both modes. (3) RNTL queries find accessibilityLabel and role on each interactive component. (4) A test covers the Reduced Motion path.
Verifier focus: no default slider value, haptics not spamming, accessibility actions, no JS-thread animation loops, no red anywhere.

### T-04 — Navigation shell and route stubs
Branch: task/T-04-navigation
Depends on: T-02. Parallel with: T-03, T-08
Risk: normal
Read first: docs/spec/05-screens-*.md (all four), docs/spec/04-design-system.md
Files owned: apps/mobile/app/** (except files other tasks take over, listed in their contracts), apps/mobile/src/navigation/**, apps/mobile/src/features/auth/useSession.ts (stub), apps/mobile/src/copy/navigation.ts
Build:
Typed expo-router layout with a floating glass TabBar: Today, Path, Moments, You, plus a centred Ember Practice button that opens the Practice sheet as a modal. Liquid selection blob that stretches between tabs; icon bounce; both modes.
One stub route per screen in the spec, each rendering Screen with its title and the text "Not built yet" (from copy). Required routes: (auth)/welcome, (auth)/sign-in, (auth)/code, (auth)/consent, (auth)/age, (onboarding)/intro, (onboarding)/quiz/[step], (onboarding)/deeper, (onboarding)/warmup, (onboarding)/coach-read, (onboarding)/playbook, (tabs)/index, (tabs)/path, (tabs)/moments, (tabs)/you, practice (modal), session/[id]/idea, watch, read, try, coach, inner-voice, out-there, complete, moments/new, moments/[id]/prep, rehearse, pocket, energy, checkin/[id], debrief/[id], tools/free-chat, tools/reply-helper, journal, letter/[id], skill/[id], gap, battery, ladder, settings/index, settings/notifications, settings/privacy, settings/subscription, settings/help, settings/about-ai, support, paywall.
useSession() stub returning a guest state, and a root redirect rule: no profile goes to (onboarding)/intro.
Back gestures follow the finger; standard transitions only.
Out of scope: any business logic, real data, shared-element card expansion.
Acceptance checks: (1) A test enumerates every required route file and fails if one is missing. (2) pnpm check green. (3) Every stub opens on web in both modes. (4) Typed routes compile with no any casts.
Verifier focus: route list against the spec screens, tab bar accessibility (labels, roles, 48pt targets), no logic leaked into stubs.

### T-05 — Database schema, RLS and generated types
Branch: task/T-05-schema
Depends on: T-00. Parallel with: T-01, T-02
Risk: RISKY (security). Wait for plan approval.
Read first: docs/spec/06-data-safety.md, docs/spec/01-product.md, docs/spec/03-ai-system.md
Files owned: supabase/**, packages/db/**, scripts/gen-db-types.mjs
Build: migrations (one per domain group) creating these tables with sensible types, foreign keys to auth.users, created_at defaults and on delete cascade: profiles (user_id, display_name, locale, theme_pref, adult_confirmed_at; no birth year, no date of birth), consents (user_id, kind in required/analytics/improve_ai/marketing, granted, updated_at), playbooks (user_id, answers jsonb, derived jsonb, version), skills_progress (user_id, skill_key, stage in starting/practicing/growing/natural, stage_history jsonb), sessions_log, attempts (id, user_id, session_id, persona_id, mode in try/warmup/rehearsal/free, state jsonb, parent_attempt_id, turns_count, ended_at, ended_reason), turns (attempt_id, idx, role, text, thought, mood jsonb, expires_at default 90 days), coach_feedback (attempt_id, payload jsonb, model, prompt_version, verified, judge jsonb), ai_feedback (user_id, target_kind, target_id, rating), moments, energy_checkins, micro_reps (forecast and actual drain/warmth, outcome, landed), debriefs, ladder_rungs, journal_entries, weekly_letters, notification_prefs, entitlements, ai_calls (metadata only: job, model, prompt_version, latency, status, token counts), safety_events (kind and source only, no text), ai_usage_daily, deletion_requests, exports. RLS on every table. Owner-only select, insert, update, delete where user_id = auth.uid(); child tables (turns, coach_feedback) through their parent. ai_calls, safety_events writable only by the service role and not readable by users. entitlements readable by owner, writable by service role. A SQL function purge_expired_text() deleting expired turns. supabase/seed.sql with a dev user helper. pnpm db:reset, pnpm db:test, and scripts/gen-db-types.mjs producing packages/db/src/types.ts.
Out of scope: app code, gateway code.
Acceptance checks: (1) pnpm db:reset succeeds from zero. (2) pnpm db:test passes: a test lists every table in public and asserts RLS is enabled; for each user-owned table a two-user test proves user B reads zero of user A's rows and cannot insert rows for user A. (3) Types generate and compile. (4) No column anywhere stores a birth year, date of birth or message text outside turns, debriefs and journal_entries.
Verifier focus: write your own extra RLS probes, including joins; look for any table missing RLS; check privacy columns; check cascade deletes.

### T-06 — Authentication and account
Branch: task/T-06-auth
Depends on: T-04, T-05. Parallel with: T-09, T-10, T-11
Risk: RISKY (security)
Read first: docs/spec/02-auth-onboarding.md, docs/spec/05-screens-launch-quiz.md (A9 to A16)
Files owned: apps/mobile/app/(auth)/**, apps/mobile/src/features/auth/** (takes over useSession.ts from T-04), apps/mobile/src/copy/auth.ts, the auth section of supabase/config.toml
Build: guest mode (progress kept locally for 7 days, merged on sign-up through registerGuestMerger(fn) which T-11 fills); Continue with Apple and Google via Supabase signInWithIdToken; email one-time code (6 digits, 10-minute expiry) with signInWithOtp and verifyOtp; phone code via the Supabase phone provider (SMS provider settings come from env; if not configurable locally, mark UNVERIFIED and gate behind a feature flag); passkey offer only if a supported library is installed, otherwise a feature flag set off and noted UNVERIFIED; birth-year wheel where under 18 shows the kind message, signs out and stores nothing; consent cards writing consents; secure session storage with expo-secure-store and silent refresh; six-box code entry with autofill, resend countdown, wrong-code shake, five-try lockout for 15 minutes (client plus Supabase rate limits); devices list and Sign out everywhere; Quiet Lock using expo-local-authentication on app foreground; delete-account entry that calls the T-07 endpoint (button disabled with a note until T-07 is merged).
Out of scope: Playbook data, privacy centre screens, notifications.
Acceptance checks: (1) Unit tests: lockout timing, age gate stores nothing, guest merge ordering. (2) Local email OTP login works against local Supabase and its mail inbox. (3) After login the user can read only their own profiles row. (4) Sign out clears secure storage. (5) No token or code appears in logs.
Verifier focus: under-18 path, token storage, lockout bypass attempts, accessibility of code boxes, UNVERIFIED items clearly labelled.

### T-07 — Privacy centre and data rights
Branch: task/T-07-privacy
Depends on: T-06. Parallel with: T-12, T-14, T-20
Risk: RISKY (deletes data)
Read first: docs/spec/06-data-safety.md, docs/spec/05-screens-settings-system.md (D3), docs/spec/08-acceptance.md
Files owned: services/gateway/src/routes/privacy/**, apps/mobile/app/settings/privacy.tsx (takes over the stub), apps/mobile/src/features/privacy/**, apps/mobile/src/copy/privacy.ts, a new migration file for privacy helpers
Build: gateway routes POST /v1/privacy/export (builds a JSON file of all the user's rows, stores it, returns a link valid for 24 hours), POST /v1/privacy/delete-text (deletes turns and debrief transcripts, keeps progress), POST /v1/privacy/delete-account (requires a fresh OTP verification, writes a deletion_requests row, deletes the auth user and cascades), a scheduled call for purge_expired_text(). The Privacy centre screen per D3 with consent toggles, plain-language explanations, and a confirmation step before every destructive action. A helper canUseForImprovement(userId) that later tasks must use before reusing text.
Out of scope: emailing the export (provide the link in-app), analytics.
Acceptance checks: (1) Export contains only that user's rows. (2) After delete-account, a test that lists every table from information_schema finds zero rows for the user. (3) delete-text leaves skills_progress intact. (4) Routes reject another user's identifiers. (5) Toggling a consent persists and is read by canUseForImprovement.
Verifier focus: dynamic table-list deletion test, authorisation on every route, confirmation friction on destructive actions, no content in logs.

### T-08 — AI gateway core
Branch: task/T-08-gateway
Depends on: T-00, T-05. Parallel with: T-03, T-04
Risk: RISKY (secrets, rate limits)
Read first: docs/spec/03-ai-system.md, docs/spec/06-data-safety.md
Files owned: services/gateway/** only
Build:
Config loader validating env with zod; fails fast with a clear message. Variable names are exactly those in .env.example.
Model registry mapping each job (partner, coach, judge, safety, vision, long, alt) to a primary and fallback model from env. No model ID appears in code.
Provider client for an OpenAI-compatible chat completions API at NVIDIA_BASE_URL with a bearer key: normal and streaming (SSE) calls, request timeout (default 8 s, configurable), abort support.
Reliability: one retry with jitter on 429, 5xx or timeout; then the fallback model; then a typed AI_UNAVAILABLE error. A circuit breaker per model (opens after 5 failures in 60 s, half-open after 30 s).
Rate limiting: a global token bucket (RPM_LIMIT, default 35) with a priority queue (live chat first, then coach, then background). A caller waits at most 6 s, then gets a typed BUSY error. Per-user daily caps read from ai_usage_daily and the user's plan, with functions to increment and check.
callStructured(job, messages, zodSchema): strips code fences, parses JSON, validates, retries once with the validation error as a hint, otherwise a typed BAD_OUTPUT error.
Auth middleware verifying the Supabase JWT (using jose against the project's JWKS or secret) and attaching userId. The user id never comes from the request body.
Logging with pino and redaction of message content; an ai_calls writer through a CallLogger interface (metadata only: job, model, prompt version, latency, status, tokens).
Route auto-loader registering every file in src/routes/ that exports register(app); GET /health; POST /v1/ai/smoke; a CLI pnpm --filter gateway smoke that sends "Reply with the single word OK" to every configured model ID and prints a PASS or FAIL table with latency, so the owner learns which IDs are valid.
A deterministic fake provider selected by AI_PROVIDER=fake for tests.
Out of scope: partner or coach logic, prompts, safety rules.
Acceptance checks: (1) With the fake provider pnpm --filter gateway test is green, covering retry and fallback, circuit breaker, queue priority order, structured retry, JWT rejection, and log redaction (a test proves message text never reaches logs). (2) The route auto-loader test passes. (3) If an API key is available, run the smoke CLI and paste the table; if not, mark UNVERIFIED. (4) grep finds no hard-coded model ID.
Verifier focus: request-per-minute arithmetic, no user id from body, secrets never logged, behaviour when the provider returns malformed JSON, whether the smoke table was truly run.

### T-09 — Safety layer
Branch: task/T-09-safety
Depends on: T-08. Parallel with: T-06, T-10, T-11
Risk: RISKY (user wellbeing)
Read first: docs/spec/03-ai-system.md (guardrails), docs/spec/05-screens-settings-system.md (D8), docs/spec/crisis-resources.md
Files owned: services/gateway/src/safety/**, services/gateway/src/routes/safety.ts, packages/shared/src/safety/**, apps/mobile/src/features/safety/** (hook only; the Support screen is built in T-22)
Build:
checkText(text, direction) returning allow, block or crisis with categories. It combines (a) a fast rule-based crisis pre-filter with high recall (English plus common Hinglish phrases, kept in packages/shared/src/safety/crisis-terms.ts) and (b) the safety model (MODEL_SAFETY) through a strict wrapper prompt. Either one flagging crisis returns crisis. If the safety model is down, use rules only and mark degraded.
A scenario-exclusion validator for generated scenarios and Moment descriptions: abuse, bereavement, confronting someone who harmed you, harassment reporting, medical news. Returns {ok, reason}.
Prompt-injection defence: wrapUserText() with unambiguous delimiters and removal of role-like tokens, plus buildSafeMessages().
Output guard: reject text where the character claims to be human, or that contains the words treat, cure, therapy or diagnose in coaching copy.
POST /v1/safety/check (authenticated) logging a safety_events row (kind and source only, no text).
Crisis resources loaded only from docs/spec/crisis-resources.md. If that file is missing or has any entry marked UNVERIFIED, stop and write QUESTIONS.md. Never invent a helpline number.
A mobile hook useSafetyRoute() that navigates to the support route when the gateway returns crisis.
Out of scope: the Support screen UI, partner or coach logic.
Acceptance checks: (1) Tests with fixtures: 30 benign messages allowed, 20 crisis phrases flagged, 10 injection strings neutralised. (2) Degraded mode (safety model down) still flags the crisis fixtures. (3) A test proves no message text is stored in safety_events or logs. (4) The resource loader refuses a file with UNVERIFIED entries.
Verifier focus: recall on crisis phrasing (write ten of your own), false-positive rate on ordinary awkward-conversation text, no invented numbers, fail-safe behaviour.

### T-10 — AI prompts, schemas and eval harness
Branch: task/T-10-prompts
Depends on: T-08. Parallel with: T-09
Risk: normal
Read first: docs/spec/03-ai-system.md, docs/spec/01-product.md, docs/spec/07-content.md
Files owned: packages/ai-prompts/**
Build: pure functions that return chat messages, each paired with a zod output schema and a PROMPT_VERSIONS constant. Every prompt template has labelled parts: ROLE, CONTEXT, RULES, OUTPUT FORMAT, EXAMPLES.
PartnerTurn. Input: persona card, scenario, Playbook summary (not raw history), recent turns, hidden mood. Output: {reply, thought, mood:{engagement,rapport,patience,exitPressure}, wantsToEnd, cue} with each mood value 0 to 1. Rules: realistic not agreeable; reserved at first; never over-shares; sometimes distracted; can pre-close and end; never claims to be human; stays inside the scenario world; the thought is the character's honest private reaction.
CoachFeedback. Input: transcript, thoughts, Playbook, skill rubric. Output: {intro, worked:[{quote,why}], pivot:{quote,whatHappened,rewrite}|null, tryNext, skillVotes:[{skill,stage,reason}], partnerArc}. Tone variants gentle, straight, funny. Rules from the honesty section: quotes verbatim, no praise without a line, no shaming, no labels, no diagnosis.
PrepCard, DebriefQuestions, DebriefTakeaway, ReplyHelper (two readings plus three replies in warm, direct and light tones, with the sentence that it cannot know what they meant), WeeklyLetter (150 words at most), ScenarioGenerator, WatchExchange, ReadScene (scene, three candidate thoughts, true index, cue note), VoiceStyleSummary.
Utilities: verifyQuotes(feedback, transcript) (exact match after whitespace normalisation; returns invalid quotes), clampMood(prev, next, maxStep=0.15), stageFromVotes(votes) (median of the last 3), PersonaCard schema.
Eval harness pnpm --filter ai-prompts eval running 10 fixture transcripts through the gateway (fake or real) and printing a table of property checks (quotes valid, pivot present when expected, schema valid).
Out of scope: calling models (the gateway does that), safety rules, content libraries.
Acceptance checks: (1) Unit tests: schemas accept good and reject bad samples; verifyQuotes catches a paraphrased quote; mood clamp; stage median. (2) Snapshot tests for every prompt builder. (3) Eval harness runs end to end with the fake provider.
Verifier focus: each honesty rule from 03-ai-system.md appears in the right prompt (check by search), no model IDs, prompt and schema agree on field names.

### T-11 — Quiz, Playbook and onboarding screens
Branch: task/T-11-quiz
Depends on: T-03, T-04, T-05. Parallel with: T-06, T-09, T-10
Risk: normal
Read first: docs/spec/02-auth-onboarding.md (the quiz), docs/spec/05-screens-launch-quiz.md (A2 to A5, A8), docs/design/
Files owned: apps/mobile/app/(onboarding)/intro.tsx, quiz/**, deeper.tsx, playbook.tsx, apps/mobile/src/features/onboarding/**, apps/mobile/src/copy/onboarding.ts, packages/shared/src/playbook/**. (Welcome carousel lives in (auth)/welcome owned by T-06; T-11 owns only the content component it renders, WelcomeStory.)
Build:
Data-driven question definitions q1 to q14 exactly as in the spec table (types, options, groups).
Screens: quiz intro (A3), one question per screen (A4) with progress line, back, Next disabled until answered, Skip always visible, no default on sliders, instant autosave of each answer so quitting mid-quiz resumes exactly, Q3 mini Moment form, Q14 custom anchor. Optional deeper profile (A5) with these eight statements on a 5-step scale: I feel energised after time with a group; I prefer one-to-one conversations; I start conversations easily; I think before I speak; I feel nervous before meetings; I recover quickly after an awkward moment; I enjoy meeting new people; I need time alone to recharge.
derivePlaybook(answers) producing {pace, batteryProfile, hardestPlaces, firstSteps[3], coachTone, weeklyGoal, window, anchor, startDifficulty, pathOrder, scenarioWorld} following the answer-to-change table in the spec. Skipped questions yield documented defaults. A firstStepsLibrary of 24 small real-world steps graded 1 to 5 in difficulty.
Playbook reveal (A8): glass tiles with Edit pencils, one tilted tile, built per the design. Persist locally (Zustand with persistence) and, when signed in, to playbooks; fill registerGuestMerger from T-06.
Out of scope: warm-up chat and Coach's first read (T-15), account creation (T-06).
Acceptance checks: (1) Unit tests for derivePlaybook on six answer sets, including all-skipped. (2) Reload resumes at the same question with the same answers. (3) Whole quiz completable on web in both modes. (4) A test proves sliders start null. (5) A test proves every question appears in the spec.
Verifier focus: mapping table fidelity, defaults when skipped, resumability, copy in files, accessibility of chips.

### T-12 — Practice Partner API and Try chat
Branch: task/T-12-partner-try
Depends on: T-03, T-04, T-08, T-09, T-10. Parallel with: T-07, T-14, T-20
Risk: RISKY (core AI loop)
Read first: docs/spec/03-ai-system.md, docs/spec/05-screens-core.md (B7), docs/spec/04-design-system.md
Files owned: services/gateway/src/routes/partner.ts, services/gateway/src/partner/**, apps/mobile/app/session/[id]/try.tsx and apps/mobile/app/tools/free-chat.tsx (take over the stubs), apps/mobile/src/features/try/**, apps/mobile/src/copy/try.ts
Build:
Gateway. POST /v1/partner/start (persona or inline persona, scenario, mode) creates an attempts row and returns the opening line. POST /v1/partner/turn runs: safety check on the user text (T-09) then the PartnerTurn prompt (T-10) with recent turns and hidden state, structured call, mood clamp, output guard, safety check on the reply, save both turns (the thought stored but not returned), and stream the reply over SSE as events typing, reply, done. POST /v1/partner/suggest returns three suggested replies in the user's register; POST /v1/partner/hint returns one idea. POST /v1/partner/end ends the attempt and then returns the thoughts. Turn caps by mode (try 6, warm-up 4). Per-user daily cap via T-08. Provider failure uses the fallback model, then the persona's authored fallback lines, and marks the attempt degraded. A crisis result returns {crisis:true} with no AI text.
App. The Try screen per B7: header with avatar whose expression follows the partner's mood, turn pill with no timer, bubbles, wobbling typing indicator, three suggestion chips that fill the text field, text field, send, quiet Pass link, hint card, a faint "Take your time" after 20 seconds idle. States: slow reply (typing indicator, then after 8 s a calm "is thinking" message), silent retry once on failure, offer a short scripted version if AI is down, offline card, cap reached card. Ends on user action, turn cap or wantsToEnd, then routes to the Coach screen with the attempt id.
Out of scope: Coach feedback, rewind, personas content (T-14), warm-up wiring (T-15).
Acceptance checks: (1) Gateway tests with the fake provider: schema retry, mood clamp, crisis path returns no AI text, cap enforced, thought hidden until end, fallback lines used on provider failure. (2) App tests for each state. (3) With a real key, a 6-turn chat completes; paste per-turn latency. (4) No message text in logs.
Verifier focus: thought leakage (call turn and inspect every response), safety on both directions, user id only from JWT, turn cap, SSE disconnect handling.

### T-13 — Coach, Inner Voice and Rewind
Branch: task/T-13-coach
Depends on: T-12. Parallel with: T-16, T-22, T-24
Risk: RISKY
Read first: docs/spec/03-ai-system.md (Coach, honesty rules), docs/spec/05-screens-core.md (B8 to B10), docs/spec/04-design-system.md
Files owned: services/gateway/src/routes/coach.ts, services/gateway/src/coach/**, apps/mobile/app/session/[id]/coach.tsx and inner-voice.tsx (take over stubs), apps/mobile/src/features/coach/**, apps/mobile/src/copy/coach.ts
Build:
Gateway. POST /v1/coach/feedback {attemptId} loads transcript, thoughts, Playbook and the skill rubric, calls CoachFeedback, runs verifyQuotes; on any invalid quote regenerates once with the list of invalid quotes, then drops invalid items; if no valid "worked" item remains, uses an authored fallback template for the skill. Stores coach_feedback with verified. Appends the skill votes and applies stageFromVotes so a stage changes only when the last three votes agree on a different stage. Sends about 20% of outputs to the judge model in the background and stores the result in judge. GET /v1/attempts/:id/thoughts (403 before the attempt has ended). POST /v1/partner/rewind {attemptId, fromTurn} creates a branch attempt that keeps earlier turns. POST /v1/coach/compare summarising two paths. POST /v1/ai/feedback saving the fairness thumbs.
App. Coach screen (B8): three stacked glass tiles (What worked, A pivot moment, Try this next time), text revealing word by word after skeletons, Mint highlighter swipe on worked lines, a Try it button that rewinds with the rewrite pre-filled, Rewind by tapping any of the user's messages, thumbs for fairness, long-press a quote to drop it into the journal. Inner Voice (B9): slow replay, thoughts float up in the character's colour, scrubber, tap to open the matching Coach note.
Out of scope: the session player and Today (T-15), weekly letter (T-19).
Acceptance checks: (1) A test where the fake provider returns a paraphrased quote proves regeneration then dropping. (2) A test proves a stage changes only after three agreeing votes. (3) thoughts returns 403 before end. (4) Rewind keeps exactly the turns before fromTurn. (5) UI states: loading skeleton, error, AI-down fallback.
Verifier focus: the verbatim-quote guarantee end to end, rewind data correctness, nothing from the judge shown to users, no shaming or red in copy, honesty rules present in output copy.

### T-14 — Content package and Idea, Watch, Read steps
Branch: task/T-14-content
Depends on: T-03, T-04, T-10. Parallel with: T-07, T-12, T-20
Risk: normal
Read first: docs/spec/07-content.md, docs/spec/01-product.md (core session), docs/spec/05-screens-core.md (B3 to B6)
Files owned: packages/content/**, apps/mobile/app/session/[id]/idea.tsx, watch.tsx, read.tsx (take over stubs), apps/mobile/src/features/session-steps/**, apps/mobile/src/copy/session.ts, services/gateway/src/routes/content.ts
Build:
Content definitions, validated by zod: the 12 skills (key, name, plain-language description, Coach rubric text describing what worked and not yet look like), the 5 situation levels, Unit 1 (8 sessions) and Unit 2 (8 sessions). Each session record follows the session format in 07-content.md: skill, level, idea (rule, example), watch (authored default exchange), read (scene, three candidate thoughts, true index, cue note), try (persona id, scenario brief, hidden mood start, turn limit), coach rubric (worked, not yet, two sample chats), three out-there options.
Six personas: warm talker, brisk professional, the quiet one, distracted senior, enthusiastic newcomer, sceptical colleague. Each has a persona card, a two-colour palette, and at least 12 authored fallback lines.
pnpm --filter content validate: schema, counts, excluded-topic scan, banned words (treat, cure, therapy, diagnose), no red in palettes.
Screens: Idea (B4), Watch (B5, tap the line where the move happens, with Show me), Read (B6: three thought cards; after choosing, the true thought drifts up in the character's colour with the cue note and the line "Different people, different signals").
POST /v1/content/watch and /read personalise an exchange or scene for the user's scenario world through the gateway, cache per (session, world, tone) in memory, and fall back to the authored default on any failure.
sessionMachine: a pure, serialisable state machine for the beats Idea, Watch, Read, Try, Coach, Out there, Complete with skip, pause and resume.
Out of scope: Try and Coach screens (T-12, T-13), Today and Path (T-15).
Acceptance checks: (1) validate passes: 16 sessions, 6 personas. (2) State machine tests including skip and resume from a serialised state. (3) A test of the Read reveal logic. (4) Screens work in both modes with the fake provider and with the provider down.
Verifier focus: read three sessions end to end for tone, realism and rubric specificity; excluded topics; schema against 07-content.md; honest uncertainty copy on Read.

### T-15 — Session assembly: Today, Path, runner, warm-up
Branch: task/T-15-sessions
Depends on: T-11, T-13, T-14. Parallel with: T-17, T-21
Risk: normal
Read first: docs/spec/05-screens-core.md (B1 to B3, B11 to B13), docs/spec/05-screens-launch-quiz.md (A6, A7), docs/spec/01-product.md
Files owned: apps/mobile/app/(tabs)/index.tsx, path.tsx, apps/mobile/app/session/[id]/out-there.tsx, complete.tsx, apps/mobile/app/(onboarding)/warmup.tsx, coach-read.tsx, apps/mobile/src/features/today/**, path/**, session-runner/**, apps/mobile/src/copy/today.ts
Build: Today bento per B1 (greeting, weekly Rhythm ring, hero next-session card with the reason line, Moment tile or empty state, check-in tile when due, evidence tile from the latest Coach quote); chooseNextSession(playbook, progress) as a pure tested function; Path (B2) as a curved glowing node map with growth-stage rings, a bottom sheet and Try ahead; session intro (B3); the runner wiring every beat through sessionMachine; Out there with the Forecast screen (B11) writing micro_reps; Session complete (B12) with one evidence line and no confetti; Take it easy mode (B13: Idea, a 3-turn chat, short Coach line) counting fully toward Rhythm; the warm-up chat (A6, 4 turns) and the Coach's first read (A7), saving baseline votes to skills_progress; full guest-mode support (local only).
Out of scope: Moments content, Journal, Ladder, notifications.
Acceptance checks: (1) Tests: chooseNextSession on six scenarios; Rhythm calculation; resume from a mid-session state. (2) With the fake provider, a first-run walkthrough on web goes Quiz, warm-up, Coach read, Playbook, Today, a full session, complete. (3) Empty, loading, error and offline states render on Today and Path.
Verifier focus: next-session reasons match the spec, Take it easy counts toward Rhythm, no points or streaks, guest to account hand-off.

### T-16 — Moments and Prep
Branch: task/T-16-moments
Depends on: T-12, T-04, T-05. Parallel with: T-13, T-22, T-24
Risk: normal
Read first: docs/spec/01-product.md (Moments), docs/spec/05-screens-realworld-ai-progress.md (C1 to C5)
Files owned: apps/mobile/app/(tabs)/moments.tsx, apps/mobile/app/moments/**, apps/mobile/src/features/moments/**, apps/mobile/src/copy/moments.ts, services/gateway/src/routes/prep.ts
Build: the Moments tab timeline with a Past segment and an Add button (C1); the Add Moment sheet (C2) with validation, optional Add from calendar using a read-only calendar permission requested at that moment and only the events the user ticks; Prep (C3) calling POST /v1/prep for opener options, two questions, an exit line, a quiet-break idea and a recovery plan, each item editable and regenerable without losing edits, with the scenario-exclusion check (T-09) on the description; Rehearse (C4) starting a partner built from the Moment through the Try engine; the Pocket card (C5), fully usable offline from locally cached prep.
Out of scope: energy check-ins and Debrief (T-17), notifications (T-21).
Acceptance checks: (1) Moment CRUD passes RLS tests. (2) The Prep response matches its schema. (3) An excluded-topic description is blocked kindly. (4) The Pocket card renders in a test with the network off. (5) Empty state present.
Verifier focus: calendar permission is just-in-time, no calendar data kept beyond ticked events, edits survive regenerate.

### T-17 — Social Battery, check-ins, Gap Game and Debrief
Branch: task/T-17-checkins
Depends on: T-16. Parallel with: T-15, T-21
Risk: normal
Read first: docs/spec/01-product.md (section 7), docs/spec/05-screens-realworld-ai-progress.md (C6 to C8)
Files owned: apps/mobile/app/energy.tsx, apps/mobile/app/checkin/**, apps/mobile/app/debrief/**, apps/mobile/src/features/energy/**, checkin/**, debrief/**, apps/mobile/src/copy/checkins.ts, services/gateway/src/routes/debrief.ts
Build: the Energy check-in (C6) with a draggable battery and optional tags; the micro-rep Check-in (C8: four options, how it landed, energy, then the Gap reveal with a one-line Coach reflection from a small structured call); computeGap(forecast, actual) and a weekly trend function, both pure and tested; the Debrief chat (C7) with start, answer and finish endpoints using the DebriefQuestions and Takeaway prompts, safety routing, an editable Takeaway card that can be saved to the journal or discarded.
Out of scope: charts and patterns (T-18), notification timing (T-21).
Acceptance checks: (1) Tests for computeGap and the trend. (2) A Debrief end to end with the fake provider. (3) A crisis phrase in a Debrief answer routes to Support with no AI text. (4) RLS tests on the new writes. (5) All states render.
Verifier focus: no score or grade language anywhere, neutral Gap copy, the Takeaway is editable and discardable.

### T-18 — You tab, Journal, Ladder, Gap and Battery screens
Branch: task/T-18-you
Depends on: T-15, T-17. Parallel with: T-19, T-23
Risk: normal
Read first: docs/spec/05-screens-realworld-ai-progress.md (C12 to C18), docs/spec/01-product.md
Files owned: apps/mobile/app/(tabs)/you.tsx, journal.tsx, skill/[id].tsx, gap.tsx, battery.tsx, ladder.tsx, apps/mobile/src/features/you/**, journal/**, ladder/**, apps/mobile/src/copy/you.ts, services/gateway/src/routes/insights.ts
Build: the You bento (C12); the Growth Journal timeline with All, Wins, Letters and Debriefs filters, favourite and delete (C13); Skill detail (C15) with the stage ring and a "Why I think so" section of three evidence quotes from different sessions, plus a Review due badge when a skill has had no practice for 14 days; the Gap chart (C16) drawn with react-native-svg with a text summary for screen readers; Battery patterns (C17) as a heat grid from aggregated energy data plus three insight cards written by POST /v1/insights/battery from aggregated statistics only, never raw text, and a Plan my week suggestion; the Quiet Ladder (C18) seeded from the Playbook with reorder, add, rewrite, mark done, and an AI suggestion for the next rung; a Playbook edit entry.
Out of scope: Weekly Letter generation (T-19).
Acceptance checks: (1) Tests: review-due rule, heat-grid aggregation, ladder reorder. (2) Every screen has a designed empty state. (3) Charts have text alternatives. (4) The insights route is shown, by test, to receive only aggregates.
Verifier focus: evidence quotes are real and verbatim, no numeric score shown as the headline, accessibility of charts.

### T-19 — Weekly Letter and Voice Match
Branch: task/T-19-letter
Depends on: T-13, T-17, T-07. Parallel with: T-18, T-23
Risk: RISKY (uses stored text)
Read first: docs/spec/03-ai-system.md, docs/spec/06-data-safety.md, docs/spec/05-screens-realworld-ai-progress.md (C14)
Files owned: services/gateway/src/routes/letter.ts, services/gateway/src/letter/**, apps/mobile/app/letter/[id].tsx, apps/mobile/src/features/letter/**, apps/mobile/src/copy/letter.ts, one new migration adding the consent kind voice_match
Build: a job endpoint POST /v1/jobs/weekly-letters protected by a secret header; a per-user digest builder using counts, stage changes, Moments, Gaps and at most three verbatim user quotes; the long-context model producing a WeeklyLetter of 150 words or fewer, validated for length, labels and banned words; storing in weekly_letters and as a journal entry; the Letter screen (C14) with an opt-out; the free plan gets a short version. Voice Match: only when the user turns on the new voice_match consent, summarise their style into playbooks.derived.voiceStyle; delete it when text is deleted or consent is withdrawn. Add the toggle to the Privacy centre as a listed Outside-scope edit.
Out of scope: notifications scheduling (T-21).
Acceptance checks: (1) Letter length test. (2) A digest test proves no more than three verbatim quotes and no third-party names. (3) The job rejects a missing or wrong secret. (4) Voice style is never stored without consent. (5) Deleting text removes the style summary.
Verifier focus: privacy of digest contents, labels and clinical words absent, the long-model fallback.

### T-20 — Reply Helper
Branch: task/T-20-reply-helper
Depends on: T-03, T-04, T-09, T-10. Parallel with: T-07, T-12, T-14
Risk: RISKY (images of private chats)
Read first: docs/spec/03-ai-system.md, docs/spec/05-screens-realworld-ai-progress.md (C11)
Files owned: apps/mobile/app/tools/reply-helper.tsx, apps/mobile/src/features/reply-helper/**, apps/mobile/src/copy/reply.ts, services/gateway/src/routes/reply.ts
Build: paste mode and screenshot mode (expo-image-picker). Before upload the app offers an on-device blur of names; if blur cannot be implemented, mark UNVERIFIED and show a clear warning with an explicit skip. The image is resized to at most 1280 px and 4 MB and sent to the gateway, which extracts the conversation with the vision model (MODEL_VISION), runs the safety check on the extracted text, then calls ReplyHelper for two possible readings (including the line "I can't know what they meant") and three replies in warm, direct and light tones in the user's voice. Nothing is stored: no image bytes and no text in the database or logs; only ai_calls metadata and the weekly counter. A Save to journal button stores the chosen reply only when tapped. Free users get a few uses a week through ai_usage_daily. If vision is down, fall back to paste mode.
Out of scope: sending messages anywhere, storing screenshots.
Acceptance checks: (1) Tests with a fake vision model. (2) A test proves no image bytes or text are logged or stored. (3) Size limit enforced. (4) Caps enforced. (5) All UI states render.
Verifier focus: privacy of image handling, uncertainty language, no definitive claims about what the other person feels.

### T-21 — Notifications engine
Branch: task/T-21-notifications
Depends on: T-06, T-16. Parallel with: T-15, T-17
Risk: normal
Read first: docs/spec/01-product.md (notifications, Rhythm), docs/spec/05-screens-settings-system.md (D2, D12)
Files owned: apps/mobile/src/features/notifications/**, apps/mobile/app/settings/notifications.tsx (takes over stub), apps/mobile/src/copy/notifications.ts, services/gateway/src/routes/notify.ts, services/gateway/src/jobs/notify/**
Build: permission requested just in time, after the user sets a reminder window, preceded by a sample-notification preview; local scheduling with expo-notifications for the rhythm nudge (built from the user's window and anchor), Moment prompts (evening before, an hour before, 30 minutes after), check-in nudges, review due and the Sunday-evening Weekly Letter; push tokens saved in notification_prefs for server-sent pushes (letter ready, welcome back) through a gateway job; quiet hours, per-type toggles, pause for a week; the welcome-back rule (3 or more days away: at most one warm notification, at most once per 7 days). A pure planNotifications(state) function that guarantees at most one notification per day and never inside quiet hours. A copy library with warm, specific lines.
Out of scope: the Weekly Letter text (T-19).
Acceptance checks: (1) Tests of planNotifications: max one a day, quiet hours respected, pause respected, welcome-back frequency. (2) A copy test fails if any line contains: you missed, streak, don't lose, hurry, last chance, only X left. (3) The permission flow shows the preview first.
Verifier focus: guilt language, timing logic edge cases (time zones, daylight changes), toggles actually cancel scheduled items.

### T-22 — Settings, Support screen and system states
Branch: task/T-22-settings
Depends on: T-07, T-09, T-04. Parallel with: T-13, T-16, T-24
Risk: RISKY (the Support screen)
Read first: docs/spec/05-screens-settings-system.md (all), docs/spec/crisis-resources.md, docs/spec/04-design-system.md
Files owned: apps/mobile/app/settings/index.tsx, help.tsx, about-ai.tsx, apps/mobile/app/support.tsx, apps/mobile/src/features/settings/**, system-states/**, apps/mobile/src/copy/settings.ts, apps/mobile/src/copy/system.ts
Build: Settings (D1) with search, Playbook, Coach tone, Rhythm (weekly goal, optional streak toggle default off, pause), Appearance (light, dark, auto, text size, Reduced Motion override, haptics, sound), Quiet Lock, Account, Privacy centre link; Help and feedback (D6) with a reusable ReportAiButton saving to ai_feedback and attaching a message only with explicit consent; About the AI (D7); the Support screen (D8) with fixed human-written text from the copy file and resources from the shared loader, calling and texting buttons, a hush transition, practice paused, and a quiet Back to practice; an offline banner and connectivity provider (D9); the busy card (D10), the daily-limit card (D11), the Welcome back screen (D12), the empty-state registry (D13), and an error boundary with plain words (D14).
Out of scope: notifications screen (T-21), paywall (T-23).
Acceptance checks: (1) A render test proves the Support screen contains no model-generated text and receives no AI data. (2) Phone and text links use the correct schemes. (3) Settings persist across restart. (4) The error boundary shows plain words and one action. (5) All screens work in both modes.
Verifier focus: every Support screen string traced to the copy file or the resource file; no invented numbers; the streak toggle defaults off.

### T-23 — Subscriptions, paywall and plan limits
Branch: task/T-23-billing
Depends on: T-22, T-08. Parallel with: T-18, T-19
Risk: RISKY (money)
Read first: docs/spec/06-data-safety.md (plans), docs/spec/05-screens-settings-system.md (D4, D5)
Files owned: apps/mobile/app/paywall.tsx, apps/mobile/app/settings/subscription.tsx (take over stubs), apps/mobile/src/features/billing/**, apps/mobile/src/copy/billing.ts, services/gateway/src/routes/billing.ts, services/gateway/src/config/limits.ts
Build: the RevenueCat SDK (react-native-purchases) with offerings; the Subscription screen (D4) and the paywall sheet (D5): shown after the fifth session or the first time a Plus feature is opened, never on chat, Debrief or Support routes; the user's own journey in the copy; local-currency price from the store; Not now equal in weight; restore purchases; manage-subscription link. A signed RevenueCat webhook in the gateway writing entitlements. limits.ts holding the plan limits as editable defaults (free: 40 chat turns a day, 3 Reply Helper uses a week, 1 Prep a week; Plus: 120 turns a day, unlimited Reply Helper and Prep), read by the cap checks from T-08. Document sandbox testing steps; if a purchase cannot be tested, mark UNVERIFIED.
Out of scope: pricing numbers (use placeholders), tax or legal copy.
Acceptance checks: (1) Webhook signature test accepts valid and rejects invalid requests. (2) Entitlement transition tests: free to Plus, expiry, refund. (3) A test proves the paywall cannot mount on the forbidden routes. (4) Caps change with the plan.
Verifier focus: webhook authentication, no entitlement trust from the client, dark-pattern check (equal Not now, clear terms, easy cancel).

### T-24 — Analytics and observability
Branch: task/T-24-analytics
Depends on: T-07. Parallel with: T-13, T-16, T-22
Risk: RISKY (privacy)
Read first: docs/spec/06-data-safety.md, docs/spec/08-acceptance.md
Files owned: apps/mobile/src/features/analytics/**, services/gateway/src/observability/**, services/gateway/sql/cost-views.sql, docs/analytics-events.md
Build: PostHog behind the analytics consent; a typed track() with a zod-enforced allow-list of event names and property names and no free text: session_started, step_completed, session_completed, moment_added, checkin_done, paywall_viewed, purchase_started, and the others listed in docs/analytics-events.md; Sentry in the app and the gateway with a beforeSend scrubber removing message text; cost views over ai_calls with a cost-config.ts of placeholder per-model prices.
Out of scope: dashboards in third-party tools.
Acceptance checks: (1) A test proves track() rejects an unknown event or any free-text property. (2) A test proves nothing is sent when consent is off or after it is withdrawn. (3) A scrubber test proves Sentry events never contain message text. (4) The SQL views run against the local database.
Verifier focus: try to leak text through breadcrumbs, URLs and error messages.

### T-25 — Accessibility, motion and polish pass
Branch: task/T-25-polish
Depends on: T-18, T-20, T-22 (and all earlier UI tasks merged). Parallel with: nothing. Run alone.
Risk: normal
Read first: docs/spec/04-design-system.md, docs/spec/08-acceptance.md, docs/design/
Files owned: it may edit any UI file, only for accessibility, motion, haptics, copy-state coverage and visual polish. No behaviour changes. Also owns docs/a11y-report.md and scripts/audit-*.mjs.
Build: audit and fix accessibility labels, roles and reading order on every route; text scaling to 200%; Reduced Motion everywhere; contrast in both modes; the haptic map applied consistently; a route-state registry test proving every route implements loading, empty, error and offline; screen-reader announcements for typing, reveals and milestones; visible focus rings; the quiet milestone animation (a bubble rises to the Journal tab and settles); the signature micro-interactions in the spec table all present; grep-based tests that fail on red colours, hard-coded colours and hard-coded user-facing strings. Compare every key screen with docs/design/ and note intentional differences.
Out of scope: new features.
Acceptance checks: (1) The route-state registry test passes. (2) An axe audit on web shows zero serious or critical violations on the gallery and ten key routes. (3) The grep tests pass. (4) docs/a11y-report.md lists what was fixed and what remains with reasons.
Verifier focus: screenshots light and dark of ten key screens against the design, 200% text overflow, focus order, real use with a screen reader on one flow.

### T-26 — End-to-end tests, AI evaluation and load test
Branch: task/T-26-e2e
Depends on: T-25. Parallel with: nothing. Run alone.
Risk: normal
Read first: docs/spec/08-acceptance.md, docs/spec/03-ai-system.md
Files owned: e2e/**, packages/ai-prompts/eval/**, services/gateway/test/integration/**, docs/test-report.md
Build: Maestro flows run against a gateway in fake-provider mode: onboarding to Playbook to guest to first session to Coach to Out there; sign-in; add Moment, Prep, Rehearse; check-in with Gap reveal; privacy export and delete; paywall; a crisis phrase to the Support screen. An AI evaluation of 30 transcript fixtures (the first 10 labelled by you, the rest drafted by the agent and flagged DRAFT) against the real provider if a key exists, printing thresholds: valid JSON at least 98% after retry; verbatim quotes 100% after the guard; partner stays in character at least 90% (checked by the judge model); stage assignments consistent across three runs at least 80%. A load test (autocannon or k6) that simulates many users against the 35 requests-a-minute limit and proves the queue returns BUSY cleanly without crashes.
Out of scope: fixing product bugs found (list them in the report and raise new tasks).
Acceptance checks: (1) All Maestro flows pass. (2) The evaluation prints every threshold with PASS or FAIL. (3) The load test report is saved in docs/test-report.md.
Verifier focus: flows really exercise the app (not mocked screens), labels in DRAFT fixtures clearly marked, load test uses the configured limit.

### T-27 — Release hardening
Branch: task/T-27-release
Depends on: all earlier tasks merged. Parallel with: nothing. Run alone.
Risk: RISKY
Read first: docs/spec/06-data-safety.md, docs/spec/08-acceptance.md, AGENTS.md
Files owned: eas.json, app.config.ts, services/gateway/Dockerfile, deployment config, docs/release/**, scripts/security-*.mjs
Build: dev, staging and production configuration with separate environment files and Supabase projects; EAS build profiles; placeholder icon and splash from the Wince mascot; permission usage strings written in plain words; the gateway Dockerfile and a deployment config for your chosen host; a model endpoint swap checklist (moving from the free NVIDIA endpoints to paid or licensed ones, with a note to read the provider's current terms first); docs/release/privacy-labels.md mapping every collected data type to the store privacy forms; store listing draft copy that avoids clinical claims; a final RLS audit script and pnpm audit; a dependency licence report; a rollback plan.
Out of scope: submitting to the stores.
Acceptance checks: (1) pnpm check, the e2e flows and the RLS audit are green. (2) The Dockerfile builds and the container's /health responds. (3) The privacy-label table covers every table and analytics event. (4) No secret exists in git history (run a secret scan and paste the result).
Verifier focus: secrets, staging versus production separation, every data type in the privacy-label table, clinical wording in store copy.
