import { describe, expect, it } from 'vitest';
import { checkDailyCap, incrementDailyUsage, PLAN_LIMITS } from '../daily-caps.js';

describe('Daily Caps', () => {
  it('returns default limits for null supabase client', async () => {
    const res = await checkDailyCap(null, 'user-1', 'turn');
    expect(res.allowed).toBe(true);
    expect(res.plan).toBe('free');

    const inc = await incrementDailyUsage(null, 'user-1', 'turn');
    expect(inc).toBe(1);
  });

  it('has documented limits for free and plus tiers', () => {
    expect(PLAN_LIMITS.free.turnLimit).toBe(24);
    expect(PLAN_LIMITS.free.replyHelperLimit).toBe(3);
    expect(PLAN_LIMITS.plus.turnLimit).toBe(200);
  });
});
