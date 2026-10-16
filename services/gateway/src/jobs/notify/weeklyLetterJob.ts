/**
 * weeklyLetterJob.ts — Server job to send Sunday Weekly Letter notifications
 */

import { isInQuietHours } from './quietHoursFilter.js';
import type { PushSender } from './types.js';

export interface WeeklyLetterCandidate {
  userId: string;
  pushToken: string;
  letterId: string;
  quietHoursStart?: string | null | undefined;
  quietHoursEnd?: string | null | undefined;
  pausedUntil?: string | null | undefined;
  toggles?: Record<string, boolean> | null | undefined;
}

export interface WeeklyLetterJobOptions {
  now?: Date;
}

export async function runWeeklyLetterJob(
  candidates: WeeklyLetterCandidate[],
  pushSender: PushSender,
  options: WeeklyLetterJobOptions = {}
): Promise<{ processed: number; sent: number; skipped: number; reasons: string[] }> {
  const now = options.now ?? new Date();
  let sent = 0;
  let skipped = 0;
  const reasons: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.pushToken) {
      skipped++;
      reasons.push(`User ${candidate.userId}: missing push token`);
      continue;
    }

    if (candidate.pausedUntil) {
      const pauseEnd = new Date(candidate.pausedUntil);
      if (pauseEnd.getTime() > now.getTime()) {
        skipped++;
        reasons.push(`User ${candidate.userId}: paused until ${candidate.pausedUntil}`);
        continue;
      }
    }

    if (candidate.toggles && candidate.toggles.weekly_letter === false) {
      skipped++;
      reasons.push(`User ${candidate.userId}: toggle weekly_letter is disabled`);
      continue;
    }

    const quietHours = {
      start: candidate.quietHoursStart ?? '22:00',
      end: candidate.quietHoursEnd ?? '08:00',
    };
    if (isInQuietHours(now, quietHours)) {
      skipped++;
      reasons.push(`User ${candidate.userId}: currently in quiet hours (${quietHours.start} - ${quietHours.end})`);
      continue;
    }

    const res = await pushSender.send({
      to: candidate.pushToken,
      title: 'Weekly Letter',
      body: 'Your Sunday Weekly Letter is ready to read.',
      data: {
        type: 'weekly_letter',
        userId: candidate.userId,
        letterId: candidate.letterId,
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
