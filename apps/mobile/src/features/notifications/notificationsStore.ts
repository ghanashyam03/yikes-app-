/**
 * notificationsStore.ts — Reactive state management for notification preferences
 */

import { create } from 'zustand';
import type {
  NotificationToggles,
  NotificationType,
  QuietHours,
  ReminderWindow,
} from './types';
import {
  cancelAllScheduledNotifications,
  cancelScheduledNotificationsByType,
} from './scheduler';

export interface NotificationStoreState {
  toggles: NotificationToggles;
  quietHours: QuietHours;
  reminderWindow: ReminderWindow;
  pausedUntil: string | null;
  pushToken: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  showPreviewModal: boolean;
  samplePreviewType: NotificationType;

  // Actions
  setToggle: (type: NotificationType, value: boolean) => Promise<void>;
  setQuietHours: (quietHours: QuietHours) => void;
  setReminderWindow: (window: ReminderWindow) => void;
  pauseForAWeek: () => Promise<void>;
  unpause: () => Promise<void>;
  setPushToken: (token: string | null) => void;
  setPermissionStatus: (status: 'granted' | 'denied' | 'undetermined') => void;
  openPreviewModal: (type?: NotificationType) => void;
  closePreviewModal: () => void;
  resetDefaults: () => void;
}

const DEFAULT_TOGGLES: NotificationToggles = {
  rhythm_nudge: true,
  moment_prompt: true,
  checkin_nudge: true,
  review_due: true,
  weekly_letter: true,
  welcome_back: true,
};

const DEFAULT_QUIET_HOURS: QuietHours = {
  start: '22:00',
  end: '08:00',
};

const DEFAULT_REMINDER_WINDOW: ReminderWindow = {
  start: '09:00',
  end: '21:00',
};

export const useNotificationsStore = create<NotificationStoreState>((set) => ({
  toggles: { ...DEFAULT_TOGGLES },
  quietHours: { ...DEFAULT_QUIET_HOURS },
  reminderWindow: { ...DEFAULT_REMINDER_WINDOW },
  pausedUntil: null,
  pushToken: null,
  permissionStatus: 'undetermined',
  showPreviewModal: false,
  samplePreviewType: 'rhythm_nudge',

  setToggle: async (type: NotificationType, value: boolean) => {
    set((state) => ({
      toggles: {
        ...state.toggles,
        [type]: value,
      },
    }));

    // PRODUCT RULE: Disabling a toggle cancels any scheduled items for that type
    if (!value) {
      await cancelScheduledNotificationsByType(type);
    }
  },

  setQuietHours: (quietHours: QuietHours) => {
    set({ quietHours });
  },

  setReminderWindow: (reminderWindow: ReminderWindow) => {
    set({ reminderWindow });
  },

  pauseForAWeek: async () => {
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const pausedUntil = new Date(Date.now() + oneWeekMs).toISOString();

    set({ pausedUntil });

    // PRODUCT RULE: Pause week cancels all scheduled notifications
    await cancelAllScheduledNotifications();
  },

  unpause: async () => {
    set({ pausedUntil: null });
  },

  setPushToken: (pushToken: string | null) => {
    set({ pushToken });
  },

  setPermissionStatus: (permissionStatus: 'granted' | 'denied' | 'undetermined') => {
    set({ permissionStatus });
  },

  openPreviewModal: (type: NotificationType = 'rhythm_nudge') => {
    set({ showPreviewModal: true, samplePreviewType: type });
  },

  closePreviewModal: () => {
    set({ showPreviewModal: false });
  },

  resetDefaults: () => {
    set({
      toggles: { ...DEFAULT_TOGGLES },
      quietHours: { ...DEFAULT_QUIET_HOURS },
      reminderWindow: { ...DEFAULT_REMINDER_WINDOW },
      pausedUntil: null,
      pushToken: null,
      permissionStatus: 'undetermined',
      showPreviewModal: false,
      samplePreviewType: 'rhythm_nudge',
    });
  },
}));
