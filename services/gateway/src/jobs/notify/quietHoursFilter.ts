/**
 * quietHoursFilter.ts — Server-side quiet hours evaluation
 */

export interface QuietHours {
  start: string;
  end: string;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(':');
  const h = Number.parseInt(hStr ?? '0', 10);
  const m = Number.parseInt(mStr ?? '0', 10);
  return Math.min(1439, Math.max(0, h * 60 + m));
}

export function isInQuietHours(date: Date, quietHours?: QuietHours | null): boolean {
  if (!quietHours || !quietHours.start || !quietHours.end) {
    return false;
  }

  const startMins = parseTimeToMinutes(quietHours.start);
  const endMins = parseTimeToMinutes(quietHours.end);

  if (startMins === endMins) {
    return false;
  }

  const curMins = date.getHours() * 60 + date.getMinutes();

  if (startMins > endMins) {
    // Overnight quiet hours (e.g. 22:00 to 08:00)
    return curMins >= startMins || curMins < endMins;
  }

  return curMins >= startMins && curMins < endMins;
}
