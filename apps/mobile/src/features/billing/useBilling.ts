import { create } from 'zustand';
import { DEFAULT_FREE_ENTITLEMENTS, fetchEntitlements } from './billingApi';
import {
  DEFAULT_OFFERINGS,
  getSubscriptionOfferings,
  purchasePackage,
  restoreCustomerPurchases,
} from './billingSdk';
import {
  type BillingState,
  type PlanFeaturesData,
  type PlanLimitsData,
  type PlanType,
} from './types';

interface BillingStore extends BillingState {
  limits: PlanLimitsData;
  features: PlanFeaturesData;
  setSelectedOfferingId: (id: string) => void;
  setPlan: (plan: PlanType, expiresAt?: string | null) => void;
  setJourney: (sessionsCompleted: number, realStepsCompleted: number) => void;
  fetchOfferings: () => Promise<void>;
  purchase: (offeringId?: string) => Promise<{ success: boolean; isPlus: boolean }>;
  restorePurchases: () => Promise<{ success: boolean; isPlus: boolean }>;
  refreshEntitlements: (token?: string | null) => Promise<void>;
}

export const useBilling = create<BillingStore>((set, get) => ({
  currentPlan: 'free',
  isActive: true,
  expiresAt: null,
  isLoading: false,
  error: null,
  offerings: DEFAULT_OFFERINGS,
  selectedOfferingId: DEFAULT_OFFERINGS[0]?.id ?? 'plus_monthly',
  limits: DEFAULT_FREE_ENTITLEMENTS.limits,
  features: DEFAULT_FREE_ENTITLEMENTS.features,
  journey: {
    sessionsCompleted: 5,
    realStepsCompleted: 2,
  },

  setSelectedOfferingId: (id: string) => set({ selectedOfferingId: id }),

  setPlan: (plan: PlanType, expiresAt: string | null = null) => {
    const isPlus = plan === 'plus';
    set({
      currentPlan: plan,
      isActive: true,
      expiresAt,
      limits: {
        chatTurnsDaily: isPlus ? 120 : 40,
        replyHelperWeekly: isPlus ? -1 : 3,
        prepWeekly: isPlus ? -1 : 1,
      },
      features: {
        unlimitedChat: isPlus,
        unlimitedReplyHelper: isPlus,
        unlimitedPrep: isPlus,
        weeklyLetter: isPlus,
        voiceMatch: isPlus,
        batteryInsights: isPlus,
      },
    });
  },

  setJourney: (sessionsCompleted: number, realStepsCompleted: number) => {
    set({
      journey: { sessionsCompleted, realStepsCompleted },
    });
  },

  fetchOfferings: async () => {
    try {
      const offerings = await getSubscriptionOfferings();
      set({
        offerings,
        selectedOfferingId: offerings[0]?.id ?? 'plus_monthly',
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load offerings' });
    }
  },

  purchase: async (offeringId?: string) => {
    const targetId = offeringId ?? get().selectedOfferingId;
    set({ isLoading: true, error: null });
    try {
      const res = await purchasePackage(targetId);
      if (res.success && res.isPlus) {
        get().setPlan('plus', new Date(Date.now() + 30 * 86400000).toISOString());
      }
      set({ isLoading: false });
      return res;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Purchase failed',
      });
      return { success: false, isPlus: false };
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await restoreCustomerPurchases();
      if (res.success && res.isPlus) {
        get().setPlan('plus', new Date(Date.now() + 30 * 86400000).toISOString());
      }
      set({ isLoading: false });
      return res;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Restore failed',
      });
      return { success: false, isPlus: false };
    }
  },

  refreshEntitlements: async (token?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchEntitlements(token);
      set({
        currentPlan: data.plan,
        isActive: data.isActive,
        expiresAt: data.expiresAt,
        limits: data.limits,
        features: data.features,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch entitlements',
      });
    }
  },
}));
