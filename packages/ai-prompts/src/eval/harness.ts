import {
  CoachFeedbackSchema,
  buildCoachFeedbackPrompt,
  type CoachFeedback,
} from '../coach-feedback.js';
import { verifyQuotes } from '../utilities.js';
import { EVAL_FIXTURES, type EvalFixture } from './fixtures.js';

export interface FixtureCheckResult {
  fixtureId: string;
  name: string;
  toneVariant: string;
  promptGenerated: boolean;
  schemaValid: boolean;
  quotesValid: boolean;
  invalidQuotes: string[];
  pivotExpected: boolean;
  pivotPresent: boolean;
  pivotMatched: boolean;
  honestyPassed: boolean;
  honestyViolations: string[];
  passed: boolean;
}

export interface EvalHarnessSummary {
  total: number;
  passed: number;
  failed: number;
  results: FixtureCheckResult[];
}

const BANNED_HONESTY_WORDS = [
  'shy',
  'anxious',
  'extroverted',
  'introverted',
  'treat',
  'cure',
  'therapy',
  'diagnose',
];

/**
 * Checks if non-quoted coach text contains any prohibited label or medical term.
 */
export function checkHonestyRules(feedback: CoachFeedback): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Scrutinize non-quoted text: intro, why reasons, pivot explanation & rewrite, tryNext, skill reasons, partnerArc
  const textsToCheck: string[] = [
    feedback.intro,
    ...feedback.worked.map((w) => w.why),
    ...(feedback.pivot ? [feedback.pivot.whatHappened, feedback.pivot.rewrite] : []),
    feedback.tryNext,
    ...feedback.skillVotes.map((v) => v.reason),
    feedback.partnerArc,
  ];

  for (const text of textsToCheck) {
    for (const banned of BANNED_HONESTY_WORDS) {
      const regex = new RegExp(`\\b${banned}\\b`, 'i');
      if (regex.test(text)) {
        violations.push(`Found banned word "${banned}" in: "${text.substring(0, 60)}..."`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function evaluateFixture(fixture: EvalFixture): FixtureCheckResult {
  // 1. Prompt builder generation check
  let promptGenerated = false;
  try {
    const messages = buildCoachFeedbackPrompt({
      transcript: fixture.transcript,
      thoughts: fixture.thoughts,
      playbook: fixture.playbook,
      skillRubric: fixture.skillRubric,
      toneVariant: fixture.toneVariant,
    });
    promptGenerated =
      Array.isArray(messages) &&
      messages.length === 2 &&
      messages[0] !== undefined &&
      messages[0].content.includes('### ROLE') &&
      messages[0].content.includes('### RULES');
  } catch {
    promptGenerated = false;
  }

  // 2. Schema check on simulated feedback
  const parseResult = CoachFeedbackSchema.safeParse(fixture.simulatedFeedback);
  const schemaValid = parseResult.success;
  const feedback = fixture.simulatedFeedback;

  // 3. Verbatim quotes verification against transcript
  const quoteCheck = verifyQuotes(feedback, fixture.transcript);
  const quotesValid = quoteCheck.valid;

  // 4. Pivot expectation check
  const pivotPresent = feedback.pivot !== null;
  const pivotMatched = pivotPresent === fixture.expectedPivot;

  // 5. Honesty rules check
  const honesty = checkHonestyRules(feedback);

  const passed =
    promptGenerated &&
    schemaValid &&
    quotesValid &&
    pivotMatched &&
    honesty.passed;

  return {
    fixtureId: fixture.id,
    name: fixture.name,
    toneVariant: fixture.toneVariant,
    promptGenerated,
    schemaValid,
    quotesValid,
    invalidQuotes: quoteCheck.invalidQuotes,
    pivotExpected: fixture.expectedPivot,
    pivotPresent,
    pivotMatched,
    honestyPassed: honesty.passed,
    honestyViolations: honesty.violations,
    passed,
  };
}

export function runEvalHarness(fixtures: EvalFixture[] = EVAL_FIXTURES): EvalHarnessSummary {
  const results = fixtures.map(evaluateFixture);
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  return {
    total: fixtures.length,
    passed,
    failed,
    results,
  };
}
