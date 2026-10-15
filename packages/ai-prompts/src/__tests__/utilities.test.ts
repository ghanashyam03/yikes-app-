import { describe, expect, it } from 'vitest';
import type { MoodState } from '../types.js';
import { clampMood, stageFromVotes, verifyQuotes } from '../utilities.js';

describe('AI Prompts Utilities', () => {
  describe('verifyQuotes', () => {
    const transcript = [
      { role: 'user' as const, text: 'Hey Maya, got a minute to look at this spreadsheet?' },
      { role: 'partner' as const, text: 'Sure, what is up?' },
      { role: 'user' as const, text: 'The   revenue   column   looks   misaligned on tab two.' },
      { role: 'partner' as const, text: 'Ah, I see that now.' },
    ];

    it('accepts exact quotes matching transcript', () => {
      const feedback = {
        worked: [{ quote: 'got a minute to look at this spreadsheet?' }],
        pivot: null,
      };
      const result = verifyQuotes(feedback, transcript);
      expect(result.valid).toBe(true);
      expect(result.invalidQuotes).toEqual([]);
    });

    it('matches quotes despite irregular whitespace in quote or transcript', () => {
      const feedback = {
        worked: [{ quote: 'The revenue column looks misaligned on tab two.' }],
        pivot: null,
      };
      const result = verifyQuotes(feedback, transcript);
      expect(result.valid).toBe(true);
      expect(result.invalidQuotes).toEqual([]);
    });

    it('catches and reports a paraphrased quote', () => {
      const feedback = {
        worked: [
          // Paraphrased: "do you have a minute" instead of "got a minute"
          { quote: 'Hey Maya, do you have a minute to look at this spreadsheet?' },
        ],
        pivot: null,
      };
      const result = verifyQuotes(feedback, transcript);
      expect(result.valid).toBe(false);
      expect(result.invalidQuotes).toContain('Hey Maya, do you have a minute to look at this spreadsheet?');
    });

    it('catches and reports an invented quote', () => {
      const feedback = {
        worked: [{ quote: 'I really love spreadsheets so much!' }],
        pivot: { quote: 'You are completely wrong about row 14' },
      };
      const result = verifyQuotes(feedback, transcript);
      expect(result.valid).toBe(false);
      expect(result.invalidQuotes).toHaveLength(2);
      expect(result.invalidQuotes).toContain('I really love spreadsheets so much!');
      expect(result.invalidQuotes).toContain('You are completely wrong about row 14');
    });

    it('handles raw string transcripts', () => {
      const rawText = 'I think we should test amber buttons on the landing page.';
      const feedback = ['test amber buttons on the landing page'];
      const result = verifyQuotes(feedback, rawText);
      expect(result.valid).toBe(true);
    });
  });

  describe('clampMood', () => {
    const baseMood: MoodState = {
      engagement: 0.5,
      rapport: 0.4,
      patience: 0.7,
      exitPressure: 0.2,
    };

    it('preserves changes when delta is within maxStep (0.15)', () => {
      const proposed: MoodState = {
        engagement: 0.6, // delta +0.10 <= 0.15
        rapport: 0.45,  // delta +0.05 <= 0.15
        patience: 0.65, // delta -0.05 <= 0.15
        exitPressure: 0.3, // delta +0.10 <= 0.15
      };

      const result = clampMood(baseMood, proposed, 0.15);
      expect(result).toEqual({
        engagement: 0.6,
        rapport: 0.45,
        patience: 0.65,
        exitPressure: 0.3,
      });
    });

    it('enforces 0.15 step limit when change exceeds maxStep in either direction', () => {
      const proposed: MoodState = {
        engagement: 0.9, // +0.40 -> should clamp to 0.5 + 0.15 = 0.65
        rapport: 0.8,    // +0.40 -> should clamp to 0.4 + 0.15 = 0.55
        patience: 0.2,   // -0.50 -> should clamp to 0.7 - 0.15 = 0.55
        exitPressure: 0.8,// +0.60 -> should clamp to 0.2 + 0.15 = 0.35
      };

      const result = clampMood(baseMood, proposed, 0.15);
      expect(result.engagement).toBe(0.65);
      expect(result.rapport).toBe(0.55);
      expect(result.patience).toBe(0.55);
      expect(result.exitPressure).toBe(0.35);
    });

    it('firmly clamps values within [0.0, 1.0] boundaries', () => {
      const edgeMood: MoodState = {
        engagement: 0.05,
        rapport: 0.95,
        patience: 0.0,
        exitPressure: 1.0,
      };

      const proposed: MoodState = {
        engagement: -0.5, // below 0
        rapport: 1.5,    // above 1
        patience: -0.2,
        exitPressure: 1.8,
      };

      const result = clampMood(edgeMood, proposed, 0.15);
      expect(result.engagement).toBe(0.0);
      expect(result.rapport).toBe(1.0);
      expect(result.patience).toBe(0.0);
      expect(result.exitPressure).toBe(1.0);
    });
  });

  describe('stageFromVotes', () => {
    it('defaults to "starting" when votes list is empty', () => {
      expect(stageFromVotes([])).toBe('starting');
    });

    it('returns the single stage when only 1 vote exists', () => {
      expect(stageFromVotes(['growing'])).toBe('growing');
      expect(stageFromVotes([{ stage: 'natural' }])).toBe('natural');
    });

    it('computes conservative median for 2 votes', () => {
      expect(stageFromVotes(['starting', 'growing'])).toBe('starting');
      expect(stageFromVotes(['practicing', 'natural'])).toBe('practicing');
    });

    it('computes accurate median for 3 votes across all permutations', () => {
      // 0, 1, 2 -> 1 ('practicing')
      expect(stageFromVotes(['starting', 'practicing', 'growing'])).toBe('practicing');
      expect(stageFromVotes(['growing', 'starting', 'practicing'])).toBe('practicing');

      // 1, 2, 2 -> 2 ('growing')
      expect(stageFromVotes(['growing', 'growing', 'practicing'])).toBe('growing');

      // 0, 3, 3 -> 3 ('natural')
      expect(stageFromVotes(['natural', 'starting', 'natural'])).toBe('natural');

      // 1, 1, 3 -> 1 ('practicing')
      expect(stageFromVotes(['natural', 'practicing', 'practicing'])).toBe('practicing');

      // 2, 2, 2 -> 2 ('growing')
      expect(stageFromVotes(['growing', 'growing', 'growing'])).toBe('growing');
    });

    it('evaluates only the last 3 votes when more than 3 votes are provided', () => {
      // Last 3 are 'growing', 'natural', 'natural' -> median is 'natural'
      const history = ['starting', 'starting', 'practicing', 'growing', 'natural', 'natural'];
      expect(stageFromVotes(history)).toBe('natural');
    });

    it('accepts vote objects with a stage property', () => {
      const votes = [
        { stage: 'starting', skill: 'exits', reason: 'r1' },
        { stage: 'practicing', skill: 'exits', reason: 'r2' },
        { stage: 'practicing', skill: 'exits', reason: 'r3' },
      ];
      expect(stageFromVotes(votes)).toBe('practicing');
    });
  });
});
