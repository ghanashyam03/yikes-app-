import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorageAdapter, supabase } from '../auth/supabaseClient';
import { computeGap } from './computeGap';
import type {
  CheckinOutcome,
  CheckinSubmission,
  ForecastValues,
  GapResult,
  WarmthRating,
} from './types';

export interface CheckinState {
  step: 1 | 2 | 3 | 4; // 1: question, 2: landed, 3: energy, 4: gap reveal
  outcome: CheckinOutcome | null;
  warmth: WarmthRating | null;
  actualDrain: number; // 0 to 10
  forecast: ForecastValues;
  gapResult: GapResult | null;
  coachReflection: string | null;
  isLoading: boolean;
  error: string | null;
  submissions: CheckinSubmission[];

  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setOutcome: (outcome: CheckinOutcome) => void;
  setWarmth: (warmth: WarmthRating) => void;
  setActualDrain: (drain: number) => void;
  setForecast: (forecast: ForecastValues) => void;
  submitCheckin: (
    momentId?: string,
    userId?: string,
    gatewayUrl?: string,
    token?: string
  ) => Promise<CheckinSubmission>;
  resetFlow: () => void;
}

export const CHECKIN_STORAGE_KEY = 'yikes_checkin_store';

function generateLocalId(): string {
  return `microrep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export const useCheckin = create<CheckinState>()(
  persist(
    (set, get) => ({
      step: 1,
      outcome: null,
      warmth: null,
      actualDrain: 5,
      forecast: { draining: 7, warmth: 5 },
      gapResult: null,
      coachReflection: null,
      isLoading: false,
      error: null,
      submissions: [],

      setStep: (step: 1 | 2 | 3 | 4) => set({ step }),

      setOutcome: (outcome: CheckinOutcome) => set({ outcome }),

      setWarmth: (warmth: WarmthRating) => set({ warmth }),

      setActualDrain: (drain: number) => {
        const clamped = Math.max(0, Math.min(10, Math.round(drain)));
        set({ actualDrain: clamped });
      },

      setForecast: (forecast: ForecastValues) => set({ forecast }),

      submitCheckin: async (
        momentId?: string,
        userId?: string,
        gatewayUrl = process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3000',
        token?: string
      ): Promise<CheckinSubmission> => {
        const state = get();
        set({ isLoading: true, error: null });

        const outcome = state.outcome ?? 'yes';
        const warmth = state.warmth ?? 'same';
        const actualDrain = state.actualDrain;
        const forecast = state.forecast;

        // Map warmth to numeric value for comparison: warmer = 8, same = 5, colder = 2
        const actualWarmthNumeric =
          warmth === 'warmer' ? 8 : warmth === 'colder' ? 2 : 5;

        const gap = computeGap(forecast, {
          draining: actualDrain,
          warmth: actualWarmthNumeric,
        });

        const landed = outcome === 'yes' || outcome === 'tried';
        let coachReflection = `You expected ${forecast.draining} out of 10 draining; it was ${actualDrain}.`;

        // Attempt gateway coach reflection call
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers.authorization = `Bearer ${token}`;
          }

          const res = await fetch(`${gatewayUrl}/v1/checkin/reflect`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              forecast: {
                draining: forecast.draining,
                warmth: forecast.warmth,
              },
              actual: {
                draining: actualDrain,
                warmth: actualWarmthNumeric,
              },
              landed,
              outcome,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.reflection) {
              coachReflection = data.reflection;
            }
          }
        } catch {
          // Offline fallback is already set
        }

        const localId = generateLocalId();
        const nowIso = new Date().toISOString();

        const submission: CheckinSubmission = {
          id: localId,
          userId,
          momentId,
          outcome,
          landed,
          actualDrain,
          actualWarmth: actualWarmthNumeric,
          forecastDrain: forecast.draining,
          forecastWarmth: forecast.warmth,
          coachReflection,
          createdAt: nowIso,
        };

        set((prev) => ({
          step: 4,
          gapResult: gap,
          coachReflection,
          isLoading: false,
          submissions: [submission, ...prev.submissions],
        }));

        // Sync to Supabase micro_reps if authenticated
        if (userId) {
          try {
            await supabase.from('micro_reps').insert({
              user_id: userId,
              moment_id: momentId ?? null,
              forecast_drain: forecast.draining,
              forecast_warmth: forecast.warmth,
              actual_drain: actualDrain,
              actual_warmth: actualWarmthNumeric,
              outcome,
              landed,
            });
          } catch {
            // Retain local record
          }
        }

        return submission;
      },

      resetFlow: () => {
        set({
          step: 1,
          outcome: null,
          warmth: null,
          actualDrain: 5,
          gapResult: null,
          coachReflection: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: CHECKIN_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: (state) => ({
        submissions: state.submissions,
      }),
    }
  )
);
