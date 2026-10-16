/**
 * isReviewDue:
 * Flags a skill as review-due when it has had no practice for 14 or more days.
 * If the skill has never been practiced (null/undefined), it is not fading yet.
 */
export const REVIEW_DUE_THRESHOLD_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isReviewDue(
  lastPracticedAt: string | Date | number | null | undefined,
  now: Date = new Date()
): boolean {
  if (!lastPracticedAt) {
    return false;
  }

  const practiceDate =
    typeof lastPracticedAt === 'string' || typeof lastPracticedAt === 'number'
      ? new Date(lastPracticedAt)
      : lastPracticedAt;

  const practiceTime = practiceDate.getTime();
  if (isNaN(practiceTime)) {
    return false;
  }

  const currentTime = now.getTime();
  const diffMs = currentTime - practiceTime;

  if (diffMs < 0) {
    return false;
  }

  const diffDays = diffMs / MS_PER_DAY;
  return diffDays >= REVIEW_DUE_THRESHOLD_DAYS;
}
