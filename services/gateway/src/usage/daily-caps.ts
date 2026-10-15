import type { SupabaseClient } from '@supabase/supabase-js';

export type UsageType = 'turn' | 'reply_helper' | 'prep';

export interface DailyCapLimits {
  turnLimit: number;
  replyHelperLimit: number;
  prepLimit: number;
}

export const PLAN_LIMITS: Record<'free' | 'plus', DailyCapLimits> = {
  free: {
    turnLimit: 24,
    replyHelperLimit: 3,
    prepLimit: 3,
  },
  plus: {
    turnLimit: 200,
    replyHelperLimit: 50,
    prepLimit: 50,
  },
};

export interface CapCheckResult {
  allowed: boolean;
  plan: 'free' | 'plus';
  current: number;
  limit: number;
}

export async function getUserPlan(
  supabase: SupabaseClient | null,
  userId: string
): Promise<'free' | 'plus'> {
  if (!supabase) return 'free';

  try {
    const { data, error } = await supabase
      .from('entitlements')
      .select('plan, is_active, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return 'free';

    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return 'free';
    }

    return data.plan === 'plus' ? 'plus' : 'free';
  } catch {
    return 'free';
  }
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkDailyCap(
  supabase: SupabaseClient | null,
  userId: string,
  type: UsageType,
  today = getTodayDateString()
): Promise<CapCheckResult> {
  if (!supabase) {
    return { allowed: true, plan: 'free', current: 0, limit: 1000 };
  }

  const plan = await getUserPlan(supabase, userId);
  const limits = PLAN_LIMITS[plan];
  const limit =
    type === 'turn'
      ? limits.turnLimit
      : type === 'reply_helper'
      ? limits.replyHelperLimit
      : limits.prepLimit;

  try {
    const { data, error } = await supabase
      .from('ai_usage_daily')
      .select('turn_count, reply_helper_count, prep_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle();

    if (error || !data) {
      return { allowed: true, plan, current: 0, limit };
    }

    const current =
      type === 'turn'
        ? data.turn_count ?? 0
        : type === 'reply_helper'
        ? data.reply_helper_count ?? 0
        : data.prep_count ?? 0;

    return {
      allowed: current < limit,
      plan,
      current,
      limit,
    };
  } catch {
    return { allowed: true, plan, current: 0, limit };
  }
}

export async function incrementDailyUsage(
  supabase: SupabaseClient | null,
  userId: string,
  type: UsageType,
  today = getTodayDateString()
): Promise<number> {
  if (!supabase) return 1;

  const column =
    type === 'turn'
      ? 'turn_count'
      : type === 'reply_helper'
      ? 'reply_helper_count'
      : 'prep_count';

  try {
    const { data: existing } = await supabase
      .from('ai_usage_daily')
      .select('id, turn_count, reply_helper_count, prep_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle();

    if (existing) {
      const newCount = ((existing as Record<string, number>)[column] ?? 0) + 1;
      await supabase
        .from('ai_usage_daily')
        .update({
          [column]: newCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      return newCount;
    } else {
      await supabase.from('ai_usage_daily').insert({
        user_id: userId,
        usage_date: today,
        turn_count: type === 'turn' ? 1 : 0,
        reply_helper_count: type === 'reply_helper' ? 1 : 0,
        prep_count: type === 'prep' ? 1 : 0,
      });
      return 1;
    }
  } catch {
    return 1;
  }
}
