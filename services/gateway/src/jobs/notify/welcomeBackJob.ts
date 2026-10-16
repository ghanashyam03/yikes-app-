/**
 * welcomeBackJob.ts — Server job to send warm welcome-back notifications
 * 
 * PRODUCT RULES:
 * - 3 or more days away
 * - At most one warm notification
 * - At most once per 7 days
 * - Strictly respects quiet hours and pause week
 * - Zero guilt copy, zero streaks
 */

import { isInQuietHours } from './quietHoursFilter.js';
import type { PushSender } from './types.js';

export interface WelcomeBackJobOptions {
  now?: Date;
}

export interface WelcomeBackCandidate {
  userId: string;
  pushToken: string;
  lastActiveAt: string | Date;
  lastWelcomeBackAt?: string | Date | null | undefined;
  quietHoursStart?: string | null | undefined;
  quietHoursEnd?: string | null | undefined;
  pausedUntil?: string | null | undefined;
  toggles?: Record<string, boolean> | null | undefined;
}

export async function runWelcomeBackJob(
  candidates: WelcomeBackCandidate[],
  pushSender: PushSender,
  options: WelcomeBackJobOptions = {}
): Promise<{ processed: number; sent: number; skipped: number; reasons: string[] }> {
  const now = options.now ?? new Date();
  let sent = 0;
  let skipped = 0;
  const reasons: string[] = [];

  for (const candidate of candidates) {
    // 1. Verify push token exists
    if (!candidate.pushToken) {
      skipped++;
      reasons.push(`User ${candidate.userId}: missing push token`);
      continue;
    }

    // 2. Pause check: if paused until a future timestamp, skip
    if (candidate.pausedUntil) {
      const pauseEnd = new Date(candidate.pausedUntil);
      if (pauseEnd.getTime() > now.getTime()) {
        skipped++;
        reasons.push(`User ${candidate.userId}: paused until ${candidate.pausedUntil}`);
        continue;
      }
    }

    // 3. Toggle check: if welcome_back is explicitly disabled, skip
    if (candidate.toggles && candidate.toggles.welcome_back === false) {
      skipped++;
      reasons.push(`User ${candidate.userId}: toggle welcome_back is disabled`);
      continue;
    }

    // 4. Quiet hours check: never send during quiet hours
    const quietHours = {
      start: candidate.quietHoursStart ?? '22:00',
      end: candidate.quietHoursEnd ?? '08:00',
    };
    if (isInQuietHours(now, quietHours)) {
      skipped++;
      reasons.push(`User ${candidate.userId}: currently in quiet hours (${quietHours.start} - ${quietHours.end})`);
      continue;
    }

    // 5. User away rule: user must be away for 3 or more days
    const lastActive = new Date(candidate.lastActiveAt);
    const daysAway = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAway < 3) {
      skipped++;
      reasons.push(`User ${candidate.userId}: away for only ${daysAway.toFixed(1)} days (minimum 3 required)`);
      continue;
    }

    // 6. Frequency cap: at most once per 7 days
    if (candidate.lastWelcomeBackAt) {
      const lastSent = new Date(candidate.lastWelcomeBackAt);
      const daysSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastSent < 7) {
        skipped++;
        reasons.push(`User ${candidate.userId}: welcome back sent ${daysSinceLastSent.toFixed(1)} days ago (cooldown 7 days)`);
        continue;
      }
    }

    // All rules passed: Send warm notification
    const res = await pushSender.send({
      to: candidate.pushToken,
      title: 'yikes!',
      body: 'Good to see you again. Maya is ready whenever you are.',
      data: {
        type: 'welcome_back',
        userId: candidate.userId,
      },
    });

    if (res.success) {
      sent++;
    } else {
      skipped++;
      reasons.push(`User ${candidate.userId}: send failed with ${res.error}`);
    }
  }

  return {
    processed: candidates.length,
    sent,
    skipped,
    reasons,
  };
}
