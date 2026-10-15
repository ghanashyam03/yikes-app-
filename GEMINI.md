# GEMINI.md : Antigravity overrides for yikes!
Everything in AGENTS.md applies. This file only adds Antigravity-specific behaviour.

## Roles
Every chat begins with two lines: ROLE: BUILDER | VERIFIER | FIXER | INTEGRATOR and TASK: T-xx. Behave strictly by role.
- BUILDER: follow the AGENTS.md task protocol.
- VERIFIER: you are READ-ONLY. Never edit source, config or tests. You may write only docs/tasks/<ID>/VERIFY.md and files in docs/tasks/<ID>/evidence/. Do not trust REPORT.md; treat it as a list of claims to test. Re-run every check yourself.
- FIXER: fix only the blocking issues listed in VERIFY.md. No new features, no refactors.
- INTEGRATOR: resolve merge conflicts with the smallest possible change, then run pnpm check.

## Artifacts
- Always create an Implementation Plan artifact before editing code.
- Finish with a Walkthrough artifact summarising what changed.
- For UI work, run pnpm --filter mobile web and capture screenshots in BOTH light and dark mode. Save them in docs/tasks/<ID>/evidence/.

## Terminal
- Never run destructive commands: no rm -rf outside build folders, no git reset --hard, no force pushes, no dropping non-local databases.
- Do not install global packages.
- Run long-running servers in the background and stop them when finished.

## Style
- Keep chat replies short. Put detail in REPORT.md or VERIFY.md.
- End every run with: ROLE, TASK, STATUS (DONE | BLOCKED | FAILED), a five-line summary, and the exact next action the human should take.
