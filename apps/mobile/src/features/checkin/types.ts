export type CheckinOutcome = 'yes' | 'tried' | 'no' | 'no_chance';
export type WarmthRating = 'warmer' | 'same' | 'colder';

export interface ForecastValues {
  draining: number; // 0 to 10
  warmth: number; // 0 to 10
}

export interface ActualValues {
  draining: number; // 0 to 10
  warmth: number; // 0 to 10
}

export type GapDirection = 'less_draining' | 'more_draining' | 'exact';

export interface GapResult {
  drainingGap: number;
  warmthGap: number;
  direction: GapDirection;
  absoluteDrainingGap: number;
}

export type TrendDirection = 'closing' | 'widening' | 'stable';

export interface WeeklyTrendResult {
  averageGap: number;
  trendDirection: TrendDirection;
  totalCheckins: number;
}

export interface CheckinSubmission {
  id: string;
  userId?: string | undefined;
  momentId?: string | undefined;
  outcome: CheckinOutcome;
  landed: boolean;
  actualDrain: number;
  actualWarmth: number;
  forecastDrain: number;
  forecastWarmth: number;
  coachReflection?: string | undefined;
  createdAt: string;
}
