# /build : Builder workflow
ROLE: BUILDER. The user's message gives TASK: T-xx.
1. Run git branch --show-current. It must equal the Branch written in the task contract. If not, stop and tell the user.
2. Read in full: AGENTS.md, GEMINI.md, your section of docs/tasks/TASKS.md, and every file listed under Read first.
3. Check every task in Depends on is merged: run git log main --oneline and look for the commit "Merge T-yy" for each. If one is missing, write docs/tasks/T-xx/QUESTIONS.md and stop.
4. Create an Implementation Plan artifact: each file to create or change, confirmed to be inside Files owned; risks; open questions. If the task is marked RISKY, stop and wait for approval. If you have an open question, write QUESTIONS.md and stop.
5. Build in small steps. After each step run pnpm check and fix failures before continuing.
6. Run each Acceptance check exactly as written. Save a summary of every command output in docs/tasks/T-xx/evidence/.
7. For UI work, capture light and dark screenshots into evidence/.
8. Copy docs/tasks/REPORT_TEMPLATE.md to docs/tasks/T-xx/REPORT.md and fill every section honestly. Mark anything you could not verify as UNVERIFIED.
9. git add -A, then commit with the message "T-xx: <summary>". Do not merge. Do not push.
10. Finish with: ROLE, TASK, STATUS, a five-line summary, and the next action for the human (start a Verifier chat).
