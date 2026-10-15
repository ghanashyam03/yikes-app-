# yikes! — Agent Rules
Read this whole file at the start of every task.

## What we are building
yikes! is a mobile app (iOS and Android) where introverts practise conversations with AI characters, get coaching, and prepare for real events. The product is defined in docs/spec/. Never invent product behaviour.

## Source of truth, in priority order
1. docs/tasks/TASKS.md : your task contract.
2. docs/spec/*.md : the product spec.
3. docs/design/ : screen designs. This is the primary visual reference. Refine it; do not copy flaws. If it conflicts with docs/spec/04-design-system.md, the spec wins; note the difference in your report.
4. This file.
If two sources conflict, or something you need is missing, DO NOT GUESS. Write docs/tasks/<ID>/QUESTIONS.md and stop.

## Fixed tech stack (never substitute)
- Monorepo: pnpm workspaces, Node 20, TypeScript strict.
- apps/mobile: Expo (React Native), expo-router, react-native-reanimated, react-native-gesture-handler, expo-haptics, Zustand (client state), TanStack Query (server state).
- packages/shared (zod schemas, tokens), packages/db (generated types), packages/content, packages/ai-prompts.
- services/gateway: Node + Fastify.
- supabase/: Postgres migrations with RLS.
- Tests: Vitest (packages, gateway); Jest + React Native Testing Library (mobile).
- Any new dependency must be listed in your report: name, version, reason, licence.

## Commands (all must exist and pass)
pnpm install | pnpm check (lint + typecheck + test) | pnpm -r typecheck | pnpm -r test | pnpm --filter mobile start | pnpm --filter mobile web | pnpm --filter gateway dev | pnpm db:reset

## Non-negotiable product rules
1. Never use red for errors or wrong answers. Use Honey (amber).
2. No points, XP, hearts, ranks or leaderboards. Streaks exist only if the user turns them on (default off).
3. No guilt copy. No countdown timers in practice screens.
4. Never claim clinical benefit. Never use the words treat, cure, therapy or diagnose in user-facing copy.
5. AI-written text is labelled as AI where shown. Characters never claim to be human.
6. A crisis signal always routes to the fixed Support screen. Never show AI-written text there.
7. Every Coach quote must appear verbatim in the user's transcript. Enforce in code.
8. Rating sliders have no default value.
9. Every screen works in light AND dark mode.
10. Collect only the data listed in docs/spec/06-data-safety.md.

## Security and privacy
- Never commit secrets. Use .env.local (git-ignored) and .env.example (names only).
- Never log message text or personal data. Log ids and metadata only.
- Every table has RLS enabled, a policy, and a test proving one user cannot read another's rows.
- The service-role key is used only in services/gateway, never in the app.
- Treat all user text and model output as untrusted: validate with zod, delimit user text in prompts, never execute it.

## Code conventions
- Small, well-named functions; files under 300 lines; no default exports except route screens.
- No any. No ts-ignore without an explanatory comment and a TODO that names the task id.
- Every user-facing string lives in apps/mobile/src/copy/<feature>.ts.
- Every screen implements loading, empty, error and offline states.
- Every touchable has accessibilityRole and accessibilityLabel, and a 48pt minimum target. Respect Reduced Motion and text scaling to 200%.
- Colours, spacing, radii, shadows and motion come from tokens only. No ad-hoc values.

## Hallucination guard
- Before using a library API, read its installed type definitions in node_modules or run a tiny test. Do not trust memory.
- Do not invent model IDs, endpoints, table columns, env var names, routes or props. Use only what exists in the spec, the repo, or .env.example.
- If something cannot be verified, write UNVERIFIED in your report and build a safe fallback.
- Never claim a check passed unless you ran it and saw it pass. Paste the command and a result summary into your report.

## Git rules
- Work only on your task branch task/<ID>-<slug>. Never on main.
- Commit often, imperative style, prefixed with the id: T-05: add RLS for attempts.
- Never merge, rebase onto main, force-push or delete branches. The human merges.
- Edit only files in your task's Files owned list. If you must touch anything else, make the smallest change and list it in the report under Outside-scope edits.
- No barrel files. Add new files; do not edit shared registries.

## Task protocol
1. Read AGENTS.md, GEMINI.md, your section of docs/tasks/TASKS.md, and every spec file it names.
2. Write an implementation plan artifact: files to create or change, order, risks, open questions. For tasks marked RISKY, wait for approval.
3. Build in small steps. Run pnpm check after each step.
4. Run every acceptance check and record real output.
5. Write docs/tasks/<ID>/REPORT.md from docs/tasks/REPORT_TEMPLATE.md.
6. Commit. Stop. Never start another task.

## Definition of done
Every acceptance check passes with evidence. pnpm check is green. No TODO without a task id. REPORT.md is complete and honest. Nothing outside scope is changed without being listed.

## Stop-and-ask
Stop and write QUESTIONS.md if: the spec conflicts; a required value (model id, key, price) is missing; the task needs a dependency that is not merged; you are tempted to guess.
