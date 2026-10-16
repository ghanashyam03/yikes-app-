import { isReviewDue } from '../reviewDue';

describe('T-18 review-due rule (14 days)', () => {
  const baseNow = new Date('2026-10-16T12:00:00Z');

  it('returns false when lastPracticedAt is null or undefined (unpracticed)', () => {
    expect(isReviewDue(null, baseNow)).toBe(false);
    expect(isReviewDue(undefined, baseNow)).toBe(false);
  });

  it('returns false when practiced today', () => {
    const today = new Date('2026-10-16T08:00:00Z');
    expect(isReviewDue(today, baseNow)).toBe(false);
  });

  it('returns false when practiced 13 days ago', () => {
    const thirteenDaysAgo = new Date(
      baseNow.getTime() - 13 * 24 * 60 * 60 * 1000
    );
    expect(isReviewDue(thirteenDaysAgo, baseNow)).toBe(false);
  });

  it('returns true when practiced exactly 14 days ago', () => {
    const fourteenDaysAgo = new Date(
      baseNow.getTime() - 14 * 24 * 60 * 60 * 1000
    );
    expect(isReviewDue(fourteenDaysAgo, baseNow)).toBe(true);
  });

  it('returns true when practiced 20 days ago', () => {
    const twentyDaysAgo = new Date(
      baseNow.getTime() - 20 * 24 * 60 * 60 * 1000
    );
    expect(isReviewDue(twentyDaysAgo.toISOString(), baseNow)).toBe(true);
  });

  it('returns false for future timestamps or invalid dates', () => {
    const future = new Date(baseNow.getTime() + 100000);
    expect(isReviewDue(future, baseNow)).toBe(false);
    expect(isReviewDue('not-a-date', baseNow)).toBe(false);
  });
});
