import {
  getRemainingTries,
  recordFailedAttempt,
  resetAttempts,
  isLockedOut,
  getLockoutRemainingTime,
  clearAllAttempts,
  MAX_OTP_TRIES,
  LOCKOUT_DURATION_MS
} from '../otpManager';

describe('otpManager', () => {
  const testTarget = 'test@example.com';

  beforeEach(() => {
    clearAllAttempts();
  });

  it('starts with MAX_OTP_TRIES (5) remaining tries and not locked out', () => {
    expect(getRemainingTries(testTarget)).toBe(MAX_OTP_TRIES);
    expect(isLockedOut(testTarget)).toBe(false);
  });

  it('decrements tries with each failed attempt', () => {
    const res1 = recordFailedAttempt(testTarget);
    expect(res1.triesLeft).toBe(4);
    expect(res1.isLocked).toBe(false);
    expect(getRemainingTries(testTarget)).toBe(4);

    const res2 = recordFailedAttempt(testTarget);
    expect(res2.triesLeft).toBe(3);
    expect(res2.isLocked).toBe(false);
    expect(getRemainingTries(testTarget)).toBe(3);
  });

  it('locks out after 5 failed attempts for 15 minutes', () => {
    const baseTime = 1000000;
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt(testTarget, baseTime);
    }
    expect(isLockedOut(testTarget, baseTime)).toBe(false);

    // 5th failed attempt
    const res5 = recordFailedAttempt(testTarget, baseTime);
    expect(res5.triesLeft).toBe(0);
    expect(res5.isLocked).toBe(true);
    expect(res5.lockoutUntil).toBe(baseTime + LOCKOUT_DURATION_MS);
    expect(isLockedOut(testTarget, baseTime)).toBe(true);

    // 14 minutes later: still locked
    const after14Mins = baseTime + 14 * 60 * 1000;
    expect(isLockedOut(testTarget, after14Mins)).toBe(true);
    const remaining = getLockoutRemainingTime(testTarget, after14Mins);
    expect(remaining.minutes).toBe(1);
    expect(remaining.seconds).toBe(0);

    // 15 minutes later: cooldown expires and resets
    const after15Mins = baseTime + 15 * 60 * 1000;
    expect(isLockedOut(testTarget, after15Mins)).toBe(false);
    expect(getRemainingTries(testTarget)).toBe(MAX_OTP_TRIES);
  });

  it('resets attempts on successful verification', () => {
    recordFailedAttempt(testTarget);
    recordFailedAttempt(testTarget);
    expect(getRemainingTries(testTarget)).toBe(3);

    resetAttempts(testTarget);
    expect(getRemainingTries(testTarget)).toBe(MAX_OTP_TRIES);
    expect(isLockedOut(testTarget)).toBe(false);
  });
});
