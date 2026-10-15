import { describe, expect, it } from 'vitest';
import { EVAL_FIXTURES } from '../eval/fixtures.js';
import { evaluateFixture, runEvalHarness } from '../eval/harness.js';

describe('AI Evaluation Harness Test Suite', () => {
  it('contains exactly 10 diverse fixtures covering awkward moments, styles, and tones', () => {
    expect(EVAL_FIXTURES).toHaveLength(10);

    const toneSet = new Set(EVAL_FIXTURES.map((f) => f.toneVariant));
    expect(toneSet).toContain('gentle');
    expect(toneSet).toContain('straight');
    expect(toneSet).toContain('funny');

    const pivotExpectedCount = EVAL_FIXTURES.filter((f) => f.expectedPivot).length;
    expect(pivotExpectedCount).toBeGreaterThanOrEqual(3);
  });

  it('verifies every fixture passes all schema, quote, pivot, and honesty property checks', () => {
    const summary = runEvalHarness(EVAL_FIXTURES);

    expect(summary.total).toBe(10);
    expect(summary.passed).toBe(10);
    expect(summary.failed).toBe(0);

    for (const result of summary.results) {
      expect(result.promptGenerated).toBe(true);
      expect(result.schemaValid).toBe(true);
      expect(result.quotesValid).toBe(true);
      expect(result.invalidQuotes).toEqual([]);
      expect(result.pivotMatched).toBe(true);
      expect(result.honestyPassed).toBe(true);
      expect(result.honestyViolations).toEqual([]);
      expect(result.passed).toBe(true);
    }
  });

  it('detects when a fixture fails honesty or quote verification', () => {
    const badFixture = {
      ...EVAL_FIXTURES[0]!,
      simulatedFeedback: {
        ...EVAL_FIXTURES[0]!.simulatedFeedback,
        worked: [
          {
            quote: 'This quote was never spoken anywhere in the transcript!',
            why: 'Because it was invented.',
          },
        ],
        tryNext: 'You should treat your social habits with therapy.',
      },
    };

    const result = evaluateFixture(badFixture);
    expect(result.quotesValid).toBe(false);
    expect(result.invalidQuotes).toContain('This quote was never spoken anywhere in the transcript!');
    expect(result.honestyPassed).toBe(false);
    expect(result.honestyViolations.some((v) => v.includes('treat') || v.includes('therapy'))).toBe(true);
    expect(result.passed).toBe(false);
  });
});
