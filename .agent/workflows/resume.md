# /resume : Resume workflow
Use when a Builder chat was lost, got confused, or failed twice. ROLE: BUILDER. The user's message gives TASK: T-xx.
1. Confirm the branch. Run git status and git log main..HEAD --oneline.
2. Read AGENTS.md, GEMINI.md, your task section, and any existing REPORT.md, QUESTIONS.md and VERIFY.md.
3. Do not assume earlier work is correct. Run pnpm check and the acceptance checks to learn the true state.
4. Write a short Resume plan artifact: what exists, what is missing, what is broken.
5. Continue from the task protocol, step 3 onward.
