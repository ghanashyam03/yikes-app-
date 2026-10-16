export type PlanType = 'free' | 'plus';

export interface PlanLimitsData {
  chatTurnsDaily: number;
  replyHelperWeekly: number;
  prepWeekly: number;
}

export interface PlanFeaturesData {
  unlimitedChat: boolean;
  unlimitedReplyHelper: boolean;
  unlimitedPrep: boolean;
  weeklyLetter: boolean;
  voiceMatch: boolean;
  batteryInsights: boolean;
}

export interface EntitlementsResponse {
  userId: string;
  plan: PlanType;
  isActive: boolean;
  expiresAt: string | null;
  limits: PlanLimitsData;
  features: PlanFeaturesData;
}

export interface SubscriptionOffering {
  id: string;
  identifier: string;
  title: string;
  priceString: string;
  rawPrice: number;
  currencyCode: string;
  period: 'monthly' | 'annual';
  freeTrialDays: number;
}

export interface UserJourneySummary {
  sessionsCompleted: number;
  realStepsCompleted: number;
}

export interface BillingState {
  currentPlan: PlanType;
  isActive: boolean;
  expiresAt: string | null;
  isLoading: boolean;
  error: string | null;
  offerings: SubscriptionOffering[];
  selectedOfferingId: string;
  journey: UserJourneySummary;
}
