import { describe, expect, it } from 'vitest';
import {
  evaluateUsage,
  getPlanLimits,
  isUsageAllowed,
  PLAN_LIMITS,
} from '../limits.js';

describe('Plan Limits & Usage Evaluation (T-23)', () => {
  it('holds documented default plan limits for free and plus tiers', () => {
    expect(PLAN_LIMITS.free.chatTurnsDaily).toBe(40);
    expect(PLAN_LIMITS.free.replyHelperWeekly).toBe(3);
    expect(PLAN_LIMITS.free.prepWeekly).toBe(1);

    expect(PLAN_LIMITS.plus.chatTurnsDaily).toBe(120);
    expect(PLAN_LIMITS.plus.replyHelperWeekly).toBe(Number.POSITIVE_INFINITY);
    expect(PLAN_LIMITS.plus.prepWeekly).toBe(Number.POSITIVE_INFINITY);
  });

  it('evaluates free tier chat turns correctly (cap 40)', () => {
    const under = evaluateUsage('free', 'chat_turns', 10);
    expect(under.allowed).toBe(true);
    expect(under.remaining).toBe(30);
    expect(under.isUnlimited).toBe(false);

    const edge = evaluateUsage('free', 'chat_turns', 39);
    expect(edge.allowed).toBe(true);
    expect(edge.remaining).toBe(1);

    const atLimit = evaluateUsage('free', 'chat_turns', 40);
    expect(atLimit.allowed).toBe(false);
    expect(atLimit.remaining).toBe(0);

    const overLimit = evaluateUsage('free', 'chat_turns', 45);
    expect(overLimit.allowed).toBe(false);
    expect(overLimit.remaining).toBe(0);
  });

  it('evaluates free tier reply helper (cap 3/week) and prep (cap 1/week)', () => {
    expect(isUsageAllowed('free', 'reply_helper', 2)).toBe(true);
    expect(isUsageAllowed('free', 'reply_helper', 3)).toBe(false);

    expect(isUsageAllowed('free', 'prep', 0)).toBe(true);
    expect(isUsageAllowed('free', 'prep', 1)).toBe(false);
  });

  it('evaluates plus tier with higher daily chat limit (120) and unlimited weekly features', () => {
    // 120 daily turns
    expect(isUsageAllowed('plus', 'chat_turns', 119)).toBe(true);
    expect(isUsageAllowed('plus', 'chat_turns', 120)).toBe(false);

    // Unlimited reply helper
    const replyEval = evaluateUsage('plus', 'reply_helper', 999);
    expect(replyEval.allowed).toBe(true);
    expect(replyEval.isUnlimited).toBe(true);
    expect(replyEval.remaining).toBe(Number.POSITIVE_INFINITY);

    // Unlimited prep
    const prepEval = evaluateUsage('plus', 'prep', 500);
    expect(prepEval.allowed).toBe(true);
    expect(prepEval.isUnlimited).toBe(true);
    expect(prepEval.remaining).toBe(Number.POSITIVE_INFINITY);
  });

  it('allows custom/editable plan limits override', () => {
    const custom = {
      free: { chatTurnsDaily: 50, replyHelperWeekly: 5, prepWeekly: 2 },
      plus: { chatTurnsDaily: 250, replyHelperWeekly: 100, prepWeekly: 100 },
    };

    const res = evaluateUsage('free', 'chat_turns', 45, custom);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(5);

    expect(getPlanLimits('free', custom).chatTurnsDaily).toBe(50);
  });
});
