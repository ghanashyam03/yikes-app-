/**
 * Scenario-exclusion validator for generated scenarios and Moment descriptions.
 * Excluded categories per docs/spec/03-ai-system.md:
 * 1. Abuse (domestic, physical, sexual, emotional)
 * 2. Bereavement (grief, funeral, death of a loved one)
 * 3. Confronting someone who harmed you (abusers, assault, stalking)
 * 4. Harassment reporting (HR complaint, formal bullying / assault reports)
 * 5. Medical news (terminal diagnosis, cancer, severe pathology, disclosing fatal illness)
 */

export interface ScenarioValidationResult {
  ok: boolean;
  reason?: string | undefined;
  category?: 'abuse' | 'bereavement' | 'confronting_harm' | 'harassment_reporting' | 'medical_news' | undefined;
}

interface ExcludedCategoryRule {
  category: 'abuse' | 'bereavement' | 'confronting_harm' | 'harassment_reporting' | 'medical_news';
  label: string;
  patterns: RegExp[];
}

const EXCLUDED_CATEGORIES: ExcludedCategoryRule[] = [
  {
    category: 'abuse',
    label: 'Abuse or domestic violence',
    patterns: [
      /\b(?:domestic\s+violence|domestic\s+abuse)\b/i,
      /\b(?:physically|emotionally|sexually|verbally)\s+abusive\b/i,
      /\b(?:physical|emotional|sexual|verbal|child|spousal|elder)\s+abuse\b/i,
      /\b(?:my\s+partner|my\s+spouse|my\s+ex|my\s+parent)\s+(?:beats|hits|abuses|chokes)\s+me\b/i,
      /\b(?:toxic|abusive)\s+(?:relationship|household|marriage|home)\b/i,
      /\bhit(?:ting)?\s+me\s+out\s+of\s+anger\b/i,
    ],
  },
  {
    category: 'bereavement',
    label: 'Bereavement, grief, and mourning',
    patterns: [
      /\b(?:bereavement|mourning|grieving)\b/i,
      /\b(?:death|loss)\s+of\s+(?:my|a)\s+(?:mother|father|mom|dad|child|son|daughter|partner|spouse|husband|wife|friend|sister|brother|grandparent)\b/i,
      /\bplanning\s+(?:a\s+|the\s+)?funeral\b/i,
      /\bcondolence[s]?\b/i,
      /\bpassed\s+away\s+recently\b/i,
      /\bgrief\s+(?:counseling|process|support)\b/i,
      /\bafter\s+(?:my|their)\s+death\b/i,
    ],
  },
  {
    category: 'confronting_harm',
    label: 'Confronting someone who caused serious harm',
    patterns: [
      /\bconfront(?:ing)?\s+(?:my\s+)?(?:abuser|assailant|attacker|stalker)\b/i,
      /\bconfront(?:ing)?\s+(?:someone|the\s+person)\s+who\s+(?:harmed|abused|assaulted|violated|stalked|hurt)\s+me\b/i,
      /\bstanding\s+up\s+to\s+my\s+abuser\b/i,
      /\bfacing\s+the\s+person\s+who\s+(?:attacked|traumatized|assaulted)\s+me\b/i,
    ],
  },
  {
    category: 'harassment_reporting',
    label: 'Formal harassment reporting',
    patterns: [
      /\breport(?:ing)?\s+(?:[a-z]+\s+)?harassment\b/i,
      /\b(?:filing|file|submit(?:ting)?)\s+(?:a\s+)?(?:[a-z]+\s+)*(?:harassment|hr|police|formal|eeoc|title\s+ix)\s+(?:complaint|report)\b/i,
      /\b(?:harassment|hr|police)\s+(?:complaint|report)\b/i,
      /\breport(?:ing)?\s+(?:my\s+)?(?:stalker|assault|workplace\s+bullying)\s+to\s+(?:hr|police|authorities)\b/i,
      /\bwhistleblower\s+retaliation\b/i,
    ],
  },
  {
    category: 'medical_news',
    label: 'Severe medical diagnoses or delivering grave prognosis',
    patterns: [
      /\b(?:terminal|incurable|fatal)\s+(?:illness|disease|cancer|diagnosis|condition)\b/i,
      /\bdelivering\s+(?:bad|fatal|grave|terminal)\s+medical\s+news\b/i,
      /\btelling\s+(?:someone|family|kids)\s+i\s+have\s+(?:cancer|tumou?r|stage\s+[34]|terminal)\b/i,
      /\bpalliative\s+care\b/i,
      /\bmonths?\s+left\s+to\s+live\b/i,
      /\bchronic\s+fatal\b/i,
    ],
  },
];

/**
 * Validates whether a scenario or Moment description is safe or falls into excluded categories.
 */
export function validateScenario(text: string): ScenarioValidationResult {
  if (!text || text.trim().length === 0) {
    return { ok: true };
  }

  const normalized = text.toLowerCase();

  for (const rule of EXCLUDED_CATEGORIES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized) || pattern.test(text)) {
        return {
          ok: false,
          category: rule.category,
          reason: `Scenario falls into excluded category: ${rule.label}. yikes! does not support rehearsal of high-acuity crisis or trauma situations.`,
        };
      }
    }
  }

  return { ok: true };
}
