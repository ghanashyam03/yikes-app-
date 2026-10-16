export type AppearancePreference = 'auto' | 'light' | 'dark';
export type CoachTone = 'gentle' | 'straight' | 'funny';

export interface SettingsState {
  // Gamification & Rhythm (Strict Rule: streakEnabled defaults to false)
  streakEnabled: boolean;
  weeklyGoal: number;
  isPaused: boolean;

  // Appearance & Accessibility
  appearance: AppearancePreference;
  reducedMotionOverride: boolean;
  textScale: number;

  // Sensory feedback
  hapticsEnabled: boolean;
  soundEnabled: boolean;

  // Coach preference
  coachTone: CoachTone;

  // Actions
  setStreakEnabled: (enabled: boolean) => void;
  setWeeklyGoal: (goal: number) => void;
  setIsPaused: (paused: boolean) => void;
  setAppearance: (pref: AppearancePreference) => void;
  setReducedMotionOverride: (override: boolean) => void;
  setTextScale: (scale: number) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setCoachTone: (tone: CoachTone) => void;
  resetSettings: () => void;
}

export const DEFAULT_SETTINGS = {
  streakEnabled: false, // Non-negotiable: streaks default off per Rule #2
  weeklyGoal: 3,
  isPaused: false,
  appearance: 'auto' as AppearancePreference,
  reducedMotionOverride: false,
  textScale: 1.0,
  hapticsEnabled: true,
  soundEnabled: true,
  coachTone: 'gentle' as CoachTone,
};
