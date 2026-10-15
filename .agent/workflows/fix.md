# /fix : Fixer workflow
ROLE: FIXER. The user's message gives TASK: T-xx.
1. Confirm the branch. Read AGENTS.md, GEMINI.md, your task section, and docs/tasks/T-xx/VERIFY.md in full.
2. Fix ONLY the blocking issues in VERIFY.md, in order. One commit per issue: "T-xx: fix issue 3 <summary>". No new features, no refactors, no cleanup outside the issue.
3. If you disagree with an issue, do not ignore it. Explain in REPORT.md under Fix rounds, with evidence, and tell the human.
4. After each fix run pnpm check, and rerun the acceptance check that failed.
5. Append a Fix round N section to REPORT.md: issue number, what changed, files, evidence.
6. Finish with STATUS and the next human action (start a NEW Verifier chat).
