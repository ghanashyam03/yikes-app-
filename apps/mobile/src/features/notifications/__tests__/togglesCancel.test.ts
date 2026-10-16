/**
 * togglesCancel.test.ts — Acceptance Check 4: Toggles actually cancel scheduled items
 */

import { useNotificationsStore } from '../notificationsStore';
import {
  getScheduledNotifications,
  InMemoryNotificationScheduler,
  scheduleLocalNotification,
  setSchedulerAdapter,
} from '../scheduler';
import type { ScheduledNotificationItem } from '../types';

describe('T-21 Acceptance Check 4: Toggles actually cancel scheduled items', () => {
  let mockAdapter: InMemoryNotificationScheduler;

  const mockItems: ScheduledNotificationItem[] = [
    {
      id: 'rn-1',
      type: 'rhythm_nudge',
      title: 'yikes!',
      body: 'Morning quiet moment.',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      dateKey: '2026-10-20',
      priority: 40,
    },
    {
      id: 'mp-1',
      type: 'moment_prompt',
      title: 'Moment prompt',
      body: '1 hour until Team sync.',
      scheduledAt: new Date(Date.now() + 172800000).toISOString(),
      dateKey: '2026-10-21',
      priority: 100,
    },
    {
      id: 'cn-1',
      type: 'checkin_nudge',
      title: 'Check-in',
      body: 'How is your social battery feeling?',
      scheduledAt: new Date(Date.now() + 259200000).toISOString(),
      dateKey: '2026-10-22',
      priority: 50,
    },
    {
      id: 'wl-1',
      type: 'weekly_letter',
      title: 'Weekly Letter',
      body: 'Your Sunday Weekly Letter is ready.',
      scheduledAt: new Date(Date.now() + 345600000).toISOString(),
      dateKey: '2026-10-23',
      priority: 80,
    },
  ];

  beforeEach(async () => {
    mockAdapter = new InMemoryNotificationScheduler();
    setSchedulerAdapter(mockAdapter);
    useNotificationsStore.getState().resetDefaults();

    // Populate scheduler with test items
    for (const item of mockItems) {
      await scheduleLocalNotification(item);
    }
  });

  it('initially contains all 4 scheduled items', async () => {
    const scheduled = await getScheduledNotifications();
    expect(scheduled.length).toBe(4);
    expect(scheduled.map((s) => s.type)).toContain('rhythm_nudge');
    expect(scheduled.map((s) => s.type)).toContain('moment_prompt');
  });

  it('cancels scheduled rhythm_nudge items when rhythm_nudge toggle is turned OFF', async () => {
    // Act: toggle off rhythm_nudge
    await useNotificationsStore.getState().setToggle('rhythm_nudge', false);

    // Assert: rhythm_nudge is cancelled
    const remaining = await getScheduledNotifications();
    expect(remaining.length).toBe(3);

    const rhythmItems = remaining.filter((item) => item.type === 'rhythm_nudge');
    expect(rhythmItems).toHaveLength(0);

    // Other items must remain scheduled
    expect(remaining.map((item) => item.type)).toContain('moment_prompt');
    expect(remaining.map((item) => item.type)).toContain('checkin_nudge');
    expect(remaining.map((item) => item.type)).toContain('weekly_letter');
  });

  it('cancels scheduled moment_prompt items when moment_prompt toggle is turned OFF', async () => {
    await useNotificationsStore.getState().setToggle('moment_prompt', false);

    const remaining = await getScheduledNotifications();
    expect(remaining.length).toBe(3);

    const momentItems = remaining.filter((item) => item.type === 'moment_prompt');
    expect(momentItems).toHaveLength(0);
  });

  it('cancels ALL scheduled notifications when pauseForAWeek is invoked', async () => {
    // Verify items exist before pause
    const beforePause = await getScheduledNotifications();
    expect(beforePause.length).toBe(4);

    // Act: activate pause week
    await useNotificationsStore.getState().pauseForAWeek();

    // Assert: store records pausedUntil 7 days in the future
    const pausedUntil = useNotificationsStore.getState().pausedUntil;
    expect(pausedUntil).toBeTruthy();
    const pausedTime = new Date(pausedUntil!).getTime();
    expect(pausedTime).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);

    // Assert: ALL scheduled items are completely cancelled
    const afterPause = await getScheduledNotifications();
    expect(afterPause).toEqual([]);
    expect(afterPause.length).toBe(0);
  });
});
