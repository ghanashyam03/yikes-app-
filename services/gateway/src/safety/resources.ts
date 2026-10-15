import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface CrisisHelpline {
  name: string;
  phone?: string | undefined;
  alternatePhone?: string | undefined;
  sms?: string | undefined;
  website?: string | undefined;
  verification?: string | undefined;
  hours?: string | undefined;
}

export interface CrisisRegion {
  region: string;
  helplines: CrisisHelpline[];
}

export interface CrisisDirectory {
  regions: CrisisRegion[];
  allHelplines: CrisisHelpline[];
}

/**
 * Finds the default crisis resources markdown file across project structure.
 */
export function getDefaultResourcePath(): string {
  const candidates = [
    resolve(process.cwd(), 'docs/spec/crisis-resources.md'),
    resolve(process.cwd(), '../../docs/spec/crisis-resources.md'),
    resolve(process.cwd(), '../../../docs/spec/crisis-resources.md'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to absolute standard relative from cwd
  return resolve(process.cwd(), 'docs/spec/crisis-resources.md');
}

/**
 * Loads and parses crisis resources from the markdown specification.
 * STOPS and throws an error if:
 * 1. The file is missing.
 * 2. ANY entry in the file is marked UNVERIFIED.
 * Never invents a helpline number.
 */
export function loadCrisisResources(customFilePath?: string): CrisisDirectory {
  const filePath = customFilePath ?? getDefaultResourcePath();

  if (!existsSync(filePath)) {
    throw new Error(`Crisis resources file not found at: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');

  // Hard requirement: Refuse any file with UNVERIFIED entries
  if (/\bUNVERIFIED\b/i.test(content)) {
    throw new Error(
      `Refusing to load crisis resources: Unverified entries detected in ${filePath}. All crisis resources must be 100% verified.`
    );
  }

  const lines = content.split('\n');
  const regions: CrisisRegion[] = [];
  let currentRegion: CrisisRegion | null = null;
  let currentHelpline: Partial<CrisisHelpline> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const line = rawLine.trim();

    // Section header (Region / Country)
    if (line.startsWith('## ')) {
      if (currentHelpline && currentHelpline.name && currentRegion) {
        currentRegion.helplines.push(currentHelpline as CrisisHelpline);
        currentHelpline = null;
      }
      const regionName = line.replace(/^##\s+/, '').trim();
      currentRegion = { region: regionName, helplines: [] };
      regions.push(currentRegion);
      continue;
    }

    if (!currentRegion) continue;

    // Check if line is indented or sub-bullet
    const isIndented = /^\s+/.test(rawLine);
    const isSubBullet =
      isIndented ||
      line.startsWith('- **Phone') ||
      line.startsWith('- **Alternate Phone') ||
      line.startsWith('- **Website') ||
      line.startsWith('- **Hours') ||
      line.startsWith('- **SMS') ||
      line.startsWith('- **Chat') ||
      line.startsWith('- **Verification');

    // Detail lines under current helpline
    if (currentHelpline && isSubBullet) {
      if (
        line.startsWith('- **Phone**:') ||
        line.startsWith('- **Phone / WhatsApp**:') ||
        line.startsWith('- **Phone & Text**:')
      ) {
        const val = line.split(':').slice(1).join(':').trim();
        currentHelpline.phone = val;
      } else if (line.startsWith('- **Alternate Phone**:')) {
        const val = line.split(':').slice(1).join(':').trim();
        currentHelpline.alternatePhone = val;
      } else if (line.startsWith('- **SMS**:')) {
        const val = line.split(':').slice(1).join(':').trim();
        currentHelpline.sms = val;
      } else if (line.startsWith('- **Website**:') || line.startsWith('- **Chat**:')) {
        const val = line.split(':').slice(1).join(':').trim();
        currentHelpline.website = val;
      } else if (line.startsWith('- **Hours**:')) {
        const val = line.split(':').slice(1).join(':').trim();
        currentHelpline.hours = val;
      } else if (line.startsWith('- **Verification**:')) {
        const val = line.split(':').slice(1).join(':').trim();
        currentHelpline.verification = val;
      }
      continue;
    }

    // Top-level helpline (must NOT have leading whitespace, strictly matches ^-\s+\*\*)
    if (!isIndented && /^-\s+\*\*/.test(rawLine) && !isSubBullet) {
      if (currentHelpline && currentHelpline.name) {
        currentRegion.helplines.push(currentHelpline as CrisisHelpline);
        currentHelpline = null;
      }

      // Check for inline website links like "- **Befrienders Worldwide**: https://..."
      const inlineMatch = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(https?:\/\/\S+)/i);
      if (inlineMatch && inlineMatch[1] && inlineMatch[2]) {
        currentRegion.helplines.push({
          name: inlineMatch[1].trim(),
          website: inlineMatch[2].trim(),
        });
        currentHelpline = null;
        continue;
      }

      const nameMatch = line.match(/^-\s+\*\*([^*]+)\*\*/);
      if (nameMatch && nameMatch[1]) {
        currentHelpline = {
          name: nameMatch[1].trim(),
        };
      }
      continue;
    }
  }

  // Push last pending helpline
  if (currentHelpline && currentHelpline.name && currentRegion) {
    currentRegion.helplines.push(currentHelpline as CrisisHelpline);
  }

  const allHelplines = regions.flatMap((r) => r.helplines);

  return {
    regions,
    allHelplines,
  };
}
