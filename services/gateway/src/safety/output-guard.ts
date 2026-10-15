/**
 * Output guard for model-generated content.
 * Enforces non-negotiable product rules:
 * 1. Characters never claim to be human.
 * 2. Coaching and user-facing copy never contains banned clinical words:
 *    treat, cure, therapy, diagnose (and their inflections).
 */

export interface OutputGuardResult {
  ok: boolean;
  reason?: string | undefined;
  violations?: string[] | undefined;
}

// Patterns where a model output claims to be a real human or denies its AI nature
const HUMAN_IDENTITY_CLAIMS: RegExp[] = [
  /\bi(?:'m|\s+am)\s+(?:a\s+)?(?:real\s+)?human(?:s|\s+being)?\b/i,
  /\bi(?:'m|\s+am)\s+a\s+real\s+person\b/i,
  /\bas\s+a\s+(?:human|living\s+person)\b/i,
  /\bi(?:'m|\s+am)\s+not\s+(?:an?\s+)?(?:ai|bot|robot|model|machine|artificial\s+intelligence)\b/i,
  /\bi\s+have\s+(?:flesh\s+and\s+blood|a\s+physical\s+body|human\s+organs)\b/i,
  /\bmy\s+human\s+life\b/i,
];

// Clinical terms strictly forbidden in coaching and user copy
const CLINICAL_BANNED_WORDS = [
  { root: 'treat', pattern: /\b(?:treat|treats|treating|treated|treatment|treatments)\b/i },
  { root: 'cure', pattern: /\b(?:cure|cures|curing|cured|curable)\b/i },
  { root: 'therapy', pattern: /\b(?:therapy|therapies|therapist|therapists|therapeutic)\b/i },
  { root: 'diagnose', pattern: /\b(?:diagnose|diagnoses|diagnosing|diagnosed|diagnosis|diagnostic|diagnostics)\b/i },
];

/**
 * Validates generated model text against output guardrails.
 * @param text The model output string to check.
 * @param context The role of the output ('coach' or 'partner'). Clinical words are strictly forbidden in coaching copy.
 */
export function guardOutput(
  text: string,
  context: 'coach' | 'partner' = 'partner'
): OutputGuardResult {
  if (!text || text.trim().length === 0) {
    return { ok: true };
  }

  const violations: string[] = [];

  // Check 1: AI cannot claim to be human
  for (const pattern of HUMAN_IDENTITY_CLAIMS) {
    if (pattern.test(text)) {
      violations.push('Identity violation: character claims to be human or denies AI nature');
      break;
    }
  }

  // Check 2: Banned clinical words
  // Coaching copy must NEVER contain clinical claims or terms
  // Also enforce across partner text to maintain safety boundaries
  for (const item of CLINICAL_BANNED_WORDS) {
    if (item.pattern.test(text)) {
      violations.push(`Clinical word violation: forbidden clinical term '${item.root}' found in ${context} copy`);
    }
  }

  if (violations.length > 0) {
    return {
      ok: false,
      reason: violations.join('; '),
      violations,
    };
  }

  return { ok: true };
}
