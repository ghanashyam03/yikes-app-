/**
 * Crisis terms and pre-filter rules for @yikes/shared
 * High recall rule-based detector for English and Hinglish crisis phrases.
 * Explicitly guards against common awkward-conversation figurative idioms.
 */

export interface CrisisMatchResult {
  isCrisis: boolean;
  category?: 'self-harm' | 'suicide' | 'crisis' | undefined;
  matchedPattern?: string | undefined;
}

// Idioms where "die", "kill", "dead" or "suicide" are used figuratively in benign awkward contexts.
const FIGURATIVE_EXEMPTION_PATTERNS: RegExp[] = [
  /\b(?:die|dying|died)\s+of\s+(?:embarrassment|shame|laughter|boredom|awkwardness|cringe)\b/i,
  /\b(?:die|dying|died)\s+laughing\b/i,
  /\bsocial\s+suicide\b/i,
  /\b(?:career|political)\s+suicide\b/i,
  /\b(?:shoes?|feet|foot|heels?|back|neck|shoulders?|headache|migraine)\s+(?:is|are|was|were)\s+killing\s+me\b/i,
  /\b(?:this|that|the)\s+(?:joke|humour|humor|pun|laugh|meme|skit|scene)\s+killed\s+me\b/i,
  /\b(?:traffic|presentation|meeting|interview|heat|cold|weather|work|schedule|deadline)\s+(?:is|was)\s+killing\s+me\b/i,
  /\bdead\s+(?:tired|serious|silent|silence|ahead|pan|stop|end|centre|center|giveaway|on)\b/i,
  /\bkilling\s+time\b/i,
  /\bkilling\s+it\b/i,
  /\bkill\s+(?:two\s+birds|the\s+mood|the\s+vibe|time|the\s+buzz)\b/i,
  /\bto\s+die\s+for\b/i,
  /\bdressed\s+to\s+kill\b/i,
];

// High-confidence crisis phrases (English)
const ENGLISH_CRISIS_PATTERNS: { pattern: RegExp; category: 'self-harm' | 'suicide' | 'crisis' }[] = [
  { pattern: /\b(?:kill|killing)\s+(?:my\s*self|myself)\b/i, category: 'suicide' },
  { pattern: /\b(?:want|wanna|wishing|wish)\s+(?:to\s+)?(?:die|be\s+dead)\b/i, category: 'suicide' },
  { pattern: /\b(?:end|ending)\s+(?:my\s+life|it\s+all)\b/i, category: 'suicide' },
  { pattern: /\b(?:take|taking)\s+my\s+(?:own\s+)?life\b/i, category: 'suicide' },
  { pattern: /\b(?:commit|committing)\s+suicide\b/i, category: 'suicide' },
  { pattern: /\bplanning\s+(?:to\s+commit\s+suicide|my\s+suicide|to\s+die)\b/i, category: 'suicide' },
  { pattern: /\bthinking\s+(?:of|about)\s+(?:suicide|killing\s+myself|ending\s+my\s+life)\b/i, category: 'suicide' },
  { pattern: /\bsuicidal\s+(?:thoughts?|ideation|tendenc(?:y|ies)|feelings?)\b/i, category: 'suicide' },
  { pattern: /\bbetter\s+off\s+dead\b/i, category: 'suicide' },
  { pattern: /\bno\s+reason\s+to\s+live\b/i, category: 'suicide' },
  { pattern: /\bcan'?t\s+go\s+on\s+living\b/i, category: 'suicide' },
  { pattern: /\b(?:don'?t|do\s+not)\s+want\s+to\s+wake\s+up\s+anymore\b/i, category: 'suicide' },
  { pattern: /\b(?:hang|hanging)\s+myself\b/i, category: 'suicide' },
  { pattern: /\b(?:slit|slitting|cut|cutting)\s+my\s+wrists?\b/i, category: 'self-harm' },
  { pattern: /\boverdose(?:\s+on\s+.*)?\b/i, category: 'suicide' },
  { pattern: /\bjumpi?n?g?\s+off\s+(?:a\s+bridge|a\s+building|the\s+roof)\s+(?:to\s+die)?\b/i, category: 'suicide' },
  { pattern: /\bkill\s+me\s+please\b/i, category: 'suicide' },
  { pattern: /\bfeel\s+like\s+killing\s+myself\b/i, category: 'suicide' },
  { pattern: /\bwish\s+i\s+was\s+(?:dead|never\s+born)\b/i, category: 'suicide' },
  { pattern: /\bgoing\s+to\s+kill\s+myself\b/i, category: 'suicide' },
  { pattern: /\bself\s*harm(?:ing)?\b/i, category: 'self-harm' },
  { pattern: /\bhurt(?:ing)?\s+myself\s+on\s+purpose\b/i, category: 'self-harm' },
  // Standalone "suicide" when not exempted by social/career suicide
  { pattern: /\bsuicide\b/i, category: 'suicide' },
];

// Hinglish crisis phrases
const HINGLISH_CRISIS_PATTERNS: { pattern: RegExp; category: 'self-harm' | 'suicide' | 'crisis' }[] = [
  { pattern: /\bmar\s+jaa?na\s+chah?t[aie](?:\s+h(?:oon?|u))?\b/i, category: 'suicide' },
  { pattern: /\bzindagi\s+khatam\s+karn[aie]\b/i, category: 'suicide' },
  { pattern: /\bkhatam\s+karna\s+chah?t[aie]\b/i, category: 'suicide' },
  { pattern: /\bjaan\s+de\s+d[ue]ng[ai]\b/i, category: 'suicide' },
  { pattern: /\bzeher\s+kha\s+(?:l[ue]ng[ai]|raha|rahi)\b/i, category: 'suicide' },
  { pattern: /\bkhud\s*kush[ie]\b/i, category: 'suicide' },
  { pattern: /\baatma?\s*hatya\b/i, category: 'suicide' },
  { pattern: /\bapn[ie]\s+jaan\s+(?:le\s+)?(?:lunga|lungi|lena)\b/i, category: 'suicide' },
  { pattern: /\bjeen[aie]\s+k[ie]\s+ich+ha\s+nah?i\b/i, category: 'suicide' },
  { pattern: /\bab\s+jeena\s+nahi\s+chaht[aie]\b/i, category: 'suicide' },
  { pattern: /\bjine\s+ka\s+man\s+nahi\b/i, category: 'suicide' },
  { pattern: /\bkhud\s+ko\s+marna\s+chaht[aie]\b/i, category: 'suicide' },
  { pattern: /\bphaasi\s+laga\s+(?:lunga|lungi|raha|rahi)\b/i, category: 'suicide' },
  { pattern: /\bhaath\s+ki\s+nas\s+kaat\b/i, category: 'self-harm' },
];

/**
 * Normalizes input text for crisis analysis
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/['’]/g, "'") // normalize quotes
    .replace(/[^\w\s']/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether text contains an exempted benign figurative idiom
 */
export function isFigurativeExemption(rawText: string): boolean {
  for (const pattern of FIGURATIVE_EXEMPTION_PATTERNS) {
    if (pattern.test(rawText)) {
      return true;
    }
  }
  return false;
}

/**
 * Fast rule-based crisis detector
 * Evaluates text against English and Hinglish crisis patterns with figurative exemption checking.
 */
export function checkCrisisRules(text: string): CrisisMatchResult {
  if (!text || text.trim().length === 0) {
    return { isCrisis: false };
  }

  const normalized = normalizeText(text);

  // Check Hinglish patterns first
  for (const item of HINGLISH_CRISIS_PATTERNS) {
    if (item.pattern.test(normalized) || item.pattern.test(text)) {
      return {
        isCrisis: true,
        category: item.category,
        matchedPattern: item.pattern.source,
      };
    }
  }

  // Check English patterns
  for (const item of ENGLISH_CRISIS_PATTERNS) {
    if (item.pattern.test(normalized) || item.pattern.test(text)) {
      // Check if this specific match is a known figurative idiom (e.g. "died of embarrassment", "social suicide")
      if (isFigurativeExemption(text) || isFigurativeExemption(normalized)) {
        // Only exempt if the match was specifically the word like "suicide" or "die" inside the exempt phrase,
        // and NOT an explicit self-harm statement like "I want to kill myself, died of embarrassment"
        const hasExplicitSelfHarm =
          /\b(?:kill|killing)\s+(?:my\s*self|myself)\b/i.test(normalized) ||
          /\b(?:end|ending)\s+(?:my\s+life|it\s+all)\b/i.test(normalized) ||
          /\b(?:take|taking)\s+my\s+(?:own\s+)?life\b/i.test(normalized) ||
          /\b(?:hang|hanging)\s+myself\b/i.test(normalized) ||
          /\b(?:slit|slitting|cut|cutting)\s+my\s+wrists?\b/i.test(normalized);

        if (!hasExplicitSelfHarm) {
          continue;
        }
      }

      return {
        isCrisis: true,
        category: item.category,
        matchedPattern: item.pattern.source,
      };
    }
  }

  return { isCrisis: false };
}
