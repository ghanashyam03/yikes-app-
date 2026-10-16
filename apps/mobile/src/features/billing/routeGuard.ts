/**
 * Billing & Paywall Route Guard.
 * Spec rule: The paywall sheet must NEVER appear during a chat, a Debrief, or the support screen.
 *
 * Forbidden routes:
 * - /session/:id/try (live chat practice)
 * - /debrief/* (debriefing and reflection after a moment)
 * - /support (crisis safety screen)
 * - /tools/free-chat (open chat practice)
 */

export function normalizeRoute(pathname: string): string {
  if (!pathname) return '';
  const withoutQuery = pathname.split('?')[0] ?? '';
  let clean = (withoutQuery.split('#')[0] ?? '').trim();
  // Ensure starts with /
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  // Strip trailing slashes unless root
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.replace(/\/+$/, '');
  }
  return clean;
}

export function isPaywallForbiddenRoute(pathname: string): boolean {
  const normalized = normalizeRoute(pathname);

  // 1. /session/*/try
  if (/^\/session\/[^/]+\/try(\/.*)?$/i.test(normalized)) {
    return true;
  }

  // 2. /debrief/*
  if (/^\/debrief(\/.*)?$/i.test(normalized)) {
    return true;
  }

  // 3. /support
  if (/^\/support(\/.*)?$/i.test(normalized)) {
    return true;
  }

  // 4. /tools/free-chat
  if (/^\/tools\/free-chat(\/.*)?$/i.test(normalized)) {
    return true;
  }

  return false;
}
