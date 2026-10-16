import { SITUATION_LEVELS_LIST } from './levels.js';
import { PERSONAS_LIST } from './personas.js';
import { SESSIONS } from './sessions.js';
import { SKILLS_LIST } from './skills.js';
import {
  PersonaSchema,
  SessionRecordSchema,
  SituationLevelSchema,
  SkillSchema,
} from './types.js';

// Words strictly banned from content (clinical / medical framing)
export const BANNED_CLINICAL_REGEX = /\b(treat|treatment|treating|cure|curative|therapy|therapist|therapeutic|diagnose|diagnosis|diagnosing|diagnostic)\b/i;

// Excluded topics: abuse, bereavement, harassment, self-harm, medical emergencies
export const EXCLUDED_TOPICS_REGEX = /\b(abuse|abusive|bereavement|funeral|mourning|harassment|suicide|self-harm|chemotherapy|oncology|terminal illness)\b/i;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function isRedHue(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  // Red in RGB has high R and significantly lower G and B
  if (r > 180 && g < 100 && b < 100) {
    return true;
  }
  // Convert to HSV / Hue
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  if (delta === 0) return false;

  let hue = 0;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  if (max === rNorm) {
    hue = ((gNorm - bNorm) / delta) % 6;
  } else if (max === gNorm) {
    hue = (bNorm - rNorm) / delta + 2;
  } else {
    hue = (rNorm - gNorm) / delta + 4;
  }
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  const sat = max === 0 ? 0 : delta / max;
  // Hue within red spectrum (0-15 deg or 345-360 deg) with moderate saturation
  return (hue <= 15 || hue >= 345) && sat > 0.4;
}

function collectStrings(obj: unknown): string[] {
  const strings: string[] = [];
  function recurse(val: unknown) {
    if (typeof val === 'string') {
      strings.push(val);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        recurse(item);
      }
    } else if (val !== null && typeof val === 'object') {
      for (const key of Object.keys(val)) {
        recurse((val as Record<string, unknown>)[key]);
      }
    }
  }
  recurse(obj);
  return strings;
}

export function validateAllContent(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Validate skills count and schema
  if (SKILLS_LIST.length !== 12) {
    errors.push(`Expected 12 skills, found ${SKILLS_LIST.length}`);
  }
  for (const skill of SKILLS_LIST) {
    const res = SkillSchema.safeParse(skill);
    if (!res.success) {
      errors.push(`Skill schema error on ${skill.key}: ${res.error.message}`);
    }
  }

  // 2. Validate situation levels count and schema
  if (SITUATION_LEVELS_LIST.length !== 5) {
    errors.push(`Expected 5 situation levels, found ${SITUATION_LEVELS_LIST.length}`);
  }
  for (const level of SITUATION_LEVELS_LIST) {
    const res = SituationLevelSchema.safeParse(level);
    if (!res.success) {
      errors.push(`Level schema error on ${level.level}: ${res.error.message}`);
    }
  }

  // 3. Validate personas count and schema
  if (PERSONAS_LIST.length !== 6) {
    errors.push(`Expected 6 personas, found ${PERSONAS_LIST.length}`);
  }
  for (const persona of PERSONAS_LIST) {
    const res = PersonaSchema.safeParse(persona);
    if (!res.success) {
      errors.push(`Persona schema error on ${persona.id}: ${res.error.message}`);
    }

    // Palette check - NEVER RED!
    if (isRedHue(persona.palette.primary)) {
      errors.push(`Persona ${persona.id} primary palette color ${persona.palette.primary} is red, which is forbidden`);
    }
    if (isRedHue(persona.palette.secondary)) {
      errors.push(`Persona ${persona.id} secondary palette color ${persona.palette.secondary} is red, which is forbidden`);
    }

    if (persona.fallbackLines.length < 12) {
      errors.push(`Persona ${persona.id} has ${persona.fallbackLines.length} fallback lines, expected at least 12`);
    }
  }

  // 4. Validate sessions count and schema
  if (SESSIONS.length !== 16) {
    errors.push(`Expected 16 sessions, found ${SESSIONS.length}`);
  }
  const unit1 = SESSIONS.filter((s) => s.unit === 1);
  const unit2 = SESSIONS.filter((s) => s.unit === 2);
  if (unit1.length !== 8) {
    errors.push(`Expected 8 sessions in Unit 1, found ${unit1.length}`);
  }
  if (unit2.length !== 8) {
    errors.push(`Expected 8 sessions in Unit 2, found ${unit2.length}`);
  }

  for (const session of SESSIONS) {
    const res = SessionRecordSchema.safeParse(session);
    if (!res.success) {
      errors.push(`Session schema error on ${session.id}: ${res.error.message}`);
    }

    if (session.watch.targetLineIndex >= session.watch.dialogue.length) {
      errors.push(`Session ${session.id} targetLineIndex ${session.watch.targetLineIndex} is out of bounds`);
    }

    if (session.read.trueIndex < 0 || session.read.trueIndex > 2) {
      errors.push(`Session ${session.id} read trueIndex ${session.read.trueIndex} is invalid`);
    }
  }

  // 5. Scan all string text for banned words and excluded topics
  const allData = {
    skills: SKILLS_LIST,
    levels: SITUATION_LEVELS_LIST,
    personas: PERSONAS_LIST,
    sessions: SESSIONS,
  };
  const strings = collectStrings(allData);

  for (const str of strings) {
    const bannedMatch = str.match(BANNED_CLINICAL_REGEX);
    if (bannedMatch) {
      errors.push(`Banned clinical word "${bannedMatch[0]}" found in text: "${str.substring(0, 80)}"`);
    }

    const topicMatch = str.match(EXCLUDED_TOPICS_REGEX);
    if (topicMatch) {
      errors.push(`Excluded topic word "${topicMatch[0]}" found in text: "${str.substring(0, 80)}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// CLI execution
if (process.argv[1]?.endsWith('validate.ts') || process.argv[1]?.endsWith('validate.js')) {
  console.log('Running @yikes/content validation...');
  const result = validateAllContent();

  if (!result.valid) {
    console.error('Validation FAILED with errors:');
    for (const err of result.errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log('Validation PASSED cleanly:');
  console.log(`- 12 skills validated`);
  console.log(`- 5 situation levels validated`);
  console.log(`- 6 personas validated (non-red palettes, >=12 fallback lines)`);
  console.log(`- 16 sessions validated (8 Unit 1, 8 Unit 2)`);
  console.log(`- Zero banned clinical words found`);
  console.log(`- Zero excluded topics found`);
  process.exit(0);
}
