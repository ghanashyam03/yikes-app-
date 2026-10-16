import type {
  ActualValues,
  ForecastValues,
  GapDirection,
  GapResult,
  TrendDirection,
  WeeklyTrendResult,
} from './types';

/**
 * Pure function: computeGap(forecast, actual)
 * Calculates the difference between forecast and actual experience.
 *
 * drainingGap: forecast.draining - actual.draining
 * - Positive: situation was less draining than expected (lighter than feared).
 * - Negative: situation was more draining than anticipated.
 * - Zero: exactly as expected.
 *
 * warmthGap: actual.warmth - forecast.warmth
 * - Positive: other person was warmer than expected.
 * - Negative: other person was cooler than expected.
 */
export function computeGap(
  forecast: ForecastValues,
  actual: ActualValues
): GapResult {
  const drainingGap = forecast.draining - actual.draining;
  const warmthGap = actual.warmth - forecast.warmth;
  const absoluteDrainingGap = Math.abs(drainingGap);

  let direction: GapDirection = 'exact';
  if (drainingGap > 0) {
    direction = 'less_draining';
  } else if (drainingGap < 0) {
    direction = 'more_draining';
  }

  return {
    drainingGap,
    warmthGap,
    direction,
    absoluteDrainingGap,
  };
}

/**
 * Pure function: computeWeeklyTrend(gaps)
 * Evaluates whether the gap between forecast and actual is closing over time.
 * When early gaps are larger than recent gaps, the trend is 'closing' (forecasts closer to reality).
 */
export function computeWeeklyTrend(
  gaps: Array<{ drainingGap: number; absoluteDrainingGap?: number }>
): WeeklyTrendResult {
  if (!gaps || gaps.length === 0) {
    return {
      averageGap: 0,
      trendDirection: 'stable',
      totalCheckins: 0,
    };
  }

  const absoluteValues = gaps.map((g) =>
    g.absoluteDrainingGap !== undefined
      ? g.absoluteDrainingGap
      : Math.abs(g.drainingGap)
  );

  const sum = absoluteValues.reduce((acc, v) => acc + v, 0);
  const averageGap = Math.round((sum / absoluteValues.length) * 10) / 10;

  if (absoluteValues.length < 2) {
    return {
      averageGap,
      trendDirection: 'stable',
      totalCheckins: absoluteValues.length,
    };
  }

  // Compare first half with second half (chronological order)
  const midpoint = Math.floor(absoluteValues.length / 2);
  const earlierSlice = absoluteValues.slice(0, midpoint);
  const laterSlice = absoluteValues.slice(midpoint);

  const earlierAvg =
    earlierSlice.reduce((a, b) => a + b, 0) / earlierSlice.length;
  const laterAvg = laterSlice.reduce((a, b) => a + b, 0) / laterSlice.length;

  const diff = earlierAvg - laterAvg;
  let trendDirection: TrendDirection = 'stable';
  if (diff > 0.3) {
    trendDirection = 'closing';
  } else if (diff < -0.3) {
    trendDirection = 'widening';
  }

  return {
    averageGap,
    trendDirection,
    totalCheckins: absoluteValues.length,
  };
}
