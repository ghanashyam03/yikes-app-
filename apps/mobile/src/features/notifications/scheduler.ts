/**
 * scheduler.ts — Local notification scheduling engine & platform adapter
 * 
 * Manages scheduling, cancellation by type, quiet hours enforcement,
 * and push token registration with expo-notifications (or adapter fallback).
 */

import { isInQuietHours, planNotifications } from './planNotifications';
import type {
  NotificationType,
  PlanNotificationsState,
  QuietHours,
  ScheduledNotificationItem,
} from './types';

export interface NotificationSchedulerAdapter {
  schedule(item: ScheduledNotificationItem): Promise<string>;
  cancel(id: string): Promise<void>;
  cancelByType(type: NotificationType): Promise<void>;
  cancelAll(): Promise<void>;
  getScheduled(): Promise<ScheduledNotificationItem[]>;
  requestPermissions(): Promise<boolean>;
  getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'>;
  getPushToken(): Promise<string | null>;
}

/**
 * In-memory / cross-platform adapter used for web, testing, and environments
 * where native expo-notifications is unavailable.
 */
export class InMemoryNotificationScheduler implements NotificationSchedulerAdapter {
  private scheduled = new Map<string, ScheduledNotificationItem>();
  private permissionStatus: 'granted' | 'denied' | 'undetermined' = 'undetermined';
  private pushToken: string | null = 'mock-push-token-yikes-123';

  async schedule(item: ScheduledNotificationItem): Promise<string> {
    this.scheduled.set(item.id, item);
    return item.id;
  }

  async cancel(id: string): Promise<void> {
    this.scheduled.delete(id);
  }

  async cancelByType(type: NotificationType): Promise<void> {
    for (const [id, item] of this.scheduled.entries()) {
      if (item.type === type) {
        this.scheduled.delete(id);
      }
    }
  }

  async cancelAll(): Promise<void> {
    this.scheduled.clear();
  }

  async getScheduled(): Promise<ScheduledNotificationItem[]> {
    return Array.from(this.scheduled.values()).sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }

  async requestPermissions(): Promise<boolean> {
    this.permissionStatus = 'granted';
    return true;
  }

  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    return this.permissionStatus;
  }

  setPermissionStatus(status: 'granted' | 'denied' | 'undetermined'): void {
    this.permissionStatus = status;
  }

  async getPushToken(): Promise<string | null> {
    return this.pushToken;
  }

  setPushToken(token: string | null): void {
    this.pushToken = token;
  }
}

// Default adapter instance
let activeAdapter: NotificationSchedulerAdapter = new InMemoryNotificationScheduler();

/**
 * Override the active notification scheduler adapter (useful for testing or platform injection)
 */
export function setSchedulerAdapter(adapter: NotificationSchedulerAdapter): void {
  activeAdapter = adapter;
}

export function getSchedulerAdapter(): NotificationSchedulerAdapter {
  return activeAdapter;
}

/**
 * Schedule a local notification, verifying that it never violates quiet hours.
 */
export async function scheduleLocalNotification(
  item: ScheduledNotificationItem,
  quietHours?: QuietHours
): Promise<string | null> {
  if (quietHours && isInQuietHours(new Date(item.scheduledAt), quietHours)) {
    // Strictly reject any notification scheduled inside quiet hours
    return null;
  }

  return activeAdapter.schedule(item);
}

/**
 * Cancel a specific scheduled notification by ID.
 */
export async function cancelScheduledNotification(id: string): Promise<void> {
  await activeAdapter.cancel(id);
}

/**
 * Cancel all scheduled notifications of a given type.
 * Used when a user toggles off a notification category in Settings.
 */
export async function cancelScheduledNotificationsByType(type: NotificationType): Promise<void> {
  await activeAdapter.cancelByType(type);
}

/**
 * Cancel all scheduled notifications across all types.
 * Used when user pauses everything for a week.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await activeAdapter.cancelAll();
}

/**
 * Retrieve all currently scheduled notifications.
 */
export async function getScheduledNotifications(): Promise<ScheduledNotificationItem[]> {
  return activeAdapter.getScheduled();
}

/**
 * Request notification permissions from device/adapter.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  return activeAdapter.requestPermissions();
}

/**
 * Query current notification permission status.
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  return activeAdapter.getPermissionStatus();
}

/**
 * Get device push token for server-sent pushes.
 */
export async function getPushTokenAsync(): Promise<string | null> {
  return activeAdapter.getPushToken();
}

/**
 * Re-computes and syncs all local scheduled notifications from state.
 * Cancels existing schedule and schedules planned items that respect max 1/day,
 * quiet hours, and pause status.
 */
export async function rescheduleAll(
  state: PlanNotificationsState
): Promise<ScheduledNotificationItem[]> {
  // Cancel all existing scheduled items first
  await cancelAllScheduledNotifications();

  // Compute fresh plan
  const items = planNotifications(state);

  // Schedule each planned item
  for (const item of items) {
    await activeAdapter.schedule(item);
  }

  return items;
}
