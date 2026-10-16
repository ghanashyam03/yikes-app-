# T-26 Plan: End-to-End Tests, AI Evaluation, and Load Test

- Files owned:
  - e2e/**
  - packages/ai-prompts/eval/**
  - services/gateway/test/integration/**
  - docs/test-report.md
  - docs/tasks/T-26/**

## Steps:
1. **Maestro Flows (`e2e/**`)**:
   - Create declarative Maestro yaml flows:
     - `onboarding_flow.yaml`: Onboarding -> Playbook -> guest -> first session -> Coach -> Out there
     - `signin_flow.yaml`: Sign-in
     - `moment_flow.yaml`: Add Moment, Prep, Rehearse
     - `checkin_flow.yaml`: Check-in with Gap reveal
     - `privacy_flow.yaml`: Privacy export and delete
     - `paywall_flow.yaml`: Paywall
     - `crisis_flow.yaml`: Crisis phrase to Support screen
   - Add a test runner/validator script `e2e/validate-flows.mjs` verifying syntax and flow step definitions.

2. **AI Evaluation Suite (`packages/ai-prompts/eval/**`)**:
   - Create 30 transcript fixtures:
     - 10 labelled baseline fixtures (labelled by builder)
     - 20 fixtures flagged DRAFT
   - Evaluation runner `packages/ai-prompts/eval/run-eval.ts` evaluating fixtures against prompts/models in fake/real mode:
     - Valid JSON: threshold >= 98%
     - Verbatim quotes: threshold 100% after guard
     - Partner stays in character: threshold >= 90%
     - Stage assignments consistency across 3 runs: threshold >= 80%
   - Prints PASS/FAIL per threshold.

3. **Gateway Load Test (`services/gateway/test/integration/load.test.ts`)**:
   - Load test script simulating concurrent users against the 35 req/min limit.
   - Proves queue returns BUSY / 429 cleanly without crash.

4. **Test Report (`docs/test-report.md`)**:
   - Complete document recording Maestro flows, AI evaluation thresholds, and load test output.

5. **Evidence and Reporting**:
   - Save evidence in `docs/tasks/T-26/evidence/`.
   - Copy `docs/tasks/REPORT_TEMPLATE.md` to `docs/tasks/T-26/REPORT.md` and fill honestly.
