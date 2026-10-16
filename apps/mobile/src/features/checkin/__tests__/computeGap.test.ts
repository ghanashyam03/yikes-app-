import { computeGap, computeWeeklyTrend } from '../computeGap';

describe('T-17 computeGap pure functions', () => {
  it('correctly calculates draining gap when actual is less draining than forecast', () => {
    const forecast = { draining: 7, warmth: 5 };
    const actual = { draining: 4, warmth: 7 };

    const result = computeGap(forecast, actual);
    expect(result.drainingGap).toBe(3); // 7 - 4 = 3
    expect(result.warmthGap).toBe(2); // 7 - 5 = 2
    expect(result.direction).toBe('less_draining');
    expect(result.absoluteDrainingGap).toBe(3);
  });

  it('correctly calculates draining gap when actual is more draining than forecast', () => {
    const forecast = { draining: 3, warmth: 6 };
    const actual = { draining: 6, warmth: 4 };

    const result = computeGap(forecast, actual);
    expect(result.drainingGap).toBe(-3); // 3 - 6 = -3
    expect(result.warmthGap).toBe(-2);
    expect(result.direction).toBe('more_draining');
    expect(result.absoluteDrainingGap).toBe(3);
  });

  it('correctly handles exact match', () => {
    const forecast = { draining: 5, warmth: 5 };
    const actual = { draining: 5, warmth: 5 };

    const result = computeGap(forecast, actual);
    expect(result.drainingGap).toBe(0);
    expect(result.warmthGap).toBe(0);
    expect(result.direction).toBe('exact');
    expect(result.absoluteDrainingGap).toBe(0);
  });

  it('correctly handles bounds at 0 and 10', () => {
    const forecast = { draining: 10, warmth: 0 };
    const actual = { draining: 0, warmth: 10 };

    const result = computeGap(forecast, actual);
    expect(result.drainingGap).toBe(10);
    expect(result.warmthGap).toBe(10);
    expect(result.direction).toBe('less_draining');
  });
});

describe('T-17 computeWeeklyTrend pure functions', () => {
  it('returns stable for empty array', () => {
    const result = computeWeeklyTrend([]);
    expect(result.averageGap).toBe(0);
    expect(result.trendDirection).toBe('stable');
    expect(result.totalCheckins).toBe(0);
  });

  it('returns stable for single checkin', () => {
    const result = computeWeeklyTrend([{ drainingGap: 3 }]);
    expect(result.averageGap).toBe(3);
    expect(result.trendDirection).toBe('stable');
    expect(result.totalCheckins).toBe(1);
  });

  it('detects a closing trend when earlier gaps were larger than recent gaps', () => {
    // Earlier: 5, 4 (avg 4.5). Later: 2, 1 (avg 1.5).
    const gaps = [
      { drainingGap: 5 },
      { drainingGap: 4 },
      { drainingGap: 2 },
      { drainingGap: 1 },
    ];

    const result = computeWeeklyTrend(gaps);
    expect(result.averageGap).toBe(3);
    expect(result.trendDirection).toBe('closing');
  });

  it('detects a widening trend when recent gaps are larger than earlier gaps', () => {
    // Earlier: 1, 1 (avg 1). Later: 4, 5 (avg 4.5).
    const gaps = [
      { drainingGap: 1 },
      { drainingGap: 1 },
      { drainingGap: 4 },
      { drainingGap: 5 },
    ];

    const result = computeWeeklyTrend(gaps);
    expect(result.trendDirection).toBe('widening');
  });

  it('detects a stable trend when gap differences remain within margin', () => {
    const gaps = [
      { drainingGap: 2 },
      { drainingGap: 2 },
      { drainingGap: 2 },
      { drainingGap: 2 },
    ];

    const result = computeWeeklyTrend(gaps);
    expect(result.averageGap).toBe(2);
    expect(result.trendDirection).toBe('stable');
  });
});
