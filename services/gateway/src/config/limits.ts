export type PlanType = 'free' | 'plus';

export type LimitFeature = 'chat_turns' | 'reply_helper' | 'prep';

export interface PlanLimits {
  chatTurnsDaily: number;
  replyHelperWeekly: number;
  prepWeekly: number;
}

/**
 * Editable default plan limits for free and plus tiers.
 * - Free: 40 chat turns a day, 3 Reply Helper uses a week, 1 Prep a week.
 * - Plus: 120 turns a day, unlimited Reply Helper, unlimited Prep.
 */
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    chatTurnsDaily: 40,
    replyHelperWeekly: 3,
    prepWeekly: 1,
  },
  plus: {
    chatTurnsDaily: 120,
    replyHelperWeekly: Number.POSITIVE_INFINITY,
    prepWeekly: Number.POSITIVE_INFINITY,
  },
};

export interface UsageEvaluation {
  allowed: boolean;
  plan: PlanType;
  feature: LimitFeature;
  currentUsage: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

/**
 * Pure function to retrieve the limits configuration for a plan.
 */
export function getPlanLimits(
  plan: PlanType,
  customLimits: Record<PlanType, PlanLimits> = PLAN_LIMITS
): PlanLimits {
  return customLimits[plan] ?? customLimits.free;
}

/**
 * Pure function to evaluate a user's usage against their plan limits.
 */
export function evaluateUsage(
  plan: PlanType,
  feature: LimitFeature,
  currentUsage: number,
  customLimits: Record<PlanType, PlanLimits> = PLAN_LIMITS
): UsageEvaluation {
  const limits = getPlanLimits(plan, customLimits);
  let limit: number;

  switch (feature) {
    case 'chat_turns':
      limit = limits.chatTurnsDaily;
      break;
    case 'reply_helper':
      limit = limits.replyHelperWeekly;
      break;
    case 'prep':
      limit = limits.prepWeekly;
      break;
    default: {
      const _exhaustiveCheck: never = feature;
      throw new Error(`Unknown feature limit: ${_exhaustiveCheck}`);
    }
  }

  const isUnlimited = !Number.isFinite(limit);
  const allowed = isUnlimited || currentUsage < limit;
  const remaining = isUnlimited ? Number.POSITIVE_INFINITY : Math.max(0, limit - currentUsage);

  return {
    allowed,
    plan,
    feature,
    currentUsage,
    limit,
    remaining,
    isUnlimited,
  };
}

/**
 * Pure function checking if an additional usage unit is permitted.
 */
export function isUsageAllowed(
  plan: PlanType,
  feature: LimitFeature,
  currentUsage: number,
  customLimits: Record<PlanType, PlanLimits> = PLAN_LIMITS
): boolean {
  return evaluateUsage(plan, feature, currentUsage, customLimits).allowed;
}
