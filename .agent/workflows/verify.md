# /verify : Verifier workflow
ROLE: VERIFIER. You are READ-ONLY. Assume the builder made mistakes; your job is to find them. The user's message gives TASK: T-xx.
1. Run git branch --show-current and git log main..HEAD --oneline. Confirm the branch matches the contract.
2. Read AGENTS.md, GEMINI.md, your task section in docs/tasks/TASKS.md, and every spec file under Read first. Only then open docs/tasks/T-xx/REPORT.md. Treat the report as a list of claims, not as evidence.
3. SCOPE: run git diff --stat main...HEAD. List every changed file. Compare with Files owned. Any file outside scope that is not declared under Outside-scope edits is a blocking issue.
4. BUILD: run pnpm install --frozen-lockfile, then pnpm check. Any failure is blocking.
5. ACCEPTANCE: run every Acceptance check yourself, exactly as written. Record command, result and a pointer to evidence.
6. SPEC CONFORMANCE: for every requirement line in the contract and in the spec sections it cites, find the code that satisfies it (file and line) or mark MISSING. MISSING items are blocking.
7. HALLUCINATION AUDIT: look for (a) imports not present in package.json, (b) env var names not in .env.example, (c) table or column names not in supabase/migrations, (d) routes or props not in the spec or repo, (e) model IDs hard-coded anywhere, (f) library APIs that do not exist in the installed type definitions. Each hit is blocking.
8. RULES AUDIT: check every Non-negotiable product rule and Security rule in AGENTS.md that this task touches (no red, no points, no guilt copy, no message text in logs, RLS tests, no service-role key in the app, strings in copy files, accessibility labels, tokens only).
9. UI (if the task has UI): run pnpm --filter mobile web, capture screenshots in light and dark, compare with docs/design and docs/spec/04-design-system.md, and test the loading, empty, error and offline states. Save to evidence/.
10. CLAIMS AUDIT: for each claim in REPORT.md, mark TRUE, FALSE or UNPROVEN.
11. Write docs/tasks/T-xx/VERIFY.md with these sections: VERDICT (PASS or FAIL); Blocking issues (numbered; each has file and line, what is wrong, which contract or spec line it breaks, how to reproduce); Non-blocking notes; Acceptance table; Claims audit. PASS only with zero blocking issues and evidence for every acceptance check.
12. Do not fix anything. Finish with: ROLE, TASK, STATUS, VERDICT, the number of blocking issues, and the next human action.
