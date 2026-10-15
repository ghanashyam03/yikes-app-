import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const specDir = path.join(rootDir, 'docs', 'spec');
const specFullPath = path.join(specDir, 'SPEC_FULL.md');
const indexMdPath = path.join(specDir, 'INDEX.md');

const fileMapping = [
  { file: '01-product.md', expectedSections: [1, 2, 6, 7] },
  { file: '02-auth-onboarding.md', expectedSections: [3, 4] },
  { file: '03-ai-system.md', expectedSections: [5, 14] },
  { file: '04-design-system.md', expectedSections: [8] },
  { file: '05-screens-launch-quiz.md', expectedSections: [9] },
  { file: '05-screens-core.md', expectedSections: [10] },
  { file: '05-screens-realworld-ai-progress.md', expectedSections: [11] },
  { file: '05-screens-settings-system.md', expectedSections: [12] },
  { file: '06-data-safety.md', expectedSections: [13, 16] },
  { file: '07-content.md', expectedSections: [15] },
  { file: '08-acceptance.md', expectedSections: [17] }
];

console.log('=== Checking Spec Split Integrity ===\n');

if (!fs.existsSync(specFullPath)) {
  console.error(`ERROR: SPEC_FULL.md not found at ${specFullPath}`);
  process.exit(1);
}

const originalSpec = fs.readFileSync(specFullPath, 'utf8');

// 1. Check file existence and headers
const sectionLocations = new Map();
const extractedSections = {};

for (const { file, expectedSections } of fileMapping) {
  const filePath = path.join(specDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Split file missing: ${file}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(filePath, 'utf8');
  const lines = rawContent.split(/\r?\n/);
  const headerLine = lines[0];

  // Verify header exists
  if (!/^<!-- Source sections: .* -->$/.test(headerLine.trim())) {
    console.error(`ERROR: File ${file} missing valid one-line header: "${headerLine}"`);
    process.exit(1);
  }

  // Strip header line
  const contentWithoutHeader = rawContent.replace(/^<!--[^\n]*-->\r?\n/, '');

  // Find sections in this file
  const fLines = contentWithoutHeader.split('\r\n');
  const fHeadings = [];
  fLines.forEach((l, idx) => {
    const m = l.match(/^## (\d+)\. (.*)/);
    if (m) {
      fHeadings.push({ num: parseInt(m[1], 10), title: m[2], line: idx });
    }
  });

  const foundNums = fHeadings.map(h => h.num);
  for (const sNum of foundNums) {
    if (sectionLocations.has(sNum)) {
      console.error(`ERROR: Section ${sNum} found in both ${sectionLocations.get(sNum)} and ${file}`);
      process.exit(1);
    }
    sectionLocations.set(sNum, file);
  }

  // Extract text per section in this file
  fHeadings.forEach((h, idx) => {
    const start = (h.num === 1) ? 0 : h.line;
    const end = (idx < fHeadings.length - 1) ? fHeadings[idx + 1].line : fLines.length;
    extractedSections[h.num] = fLines.slice(start, end).join('\r\n');
  });

  // Verify expected sections match found sections
  const sortedFound = [...foundNums].sort((a, b) => a - b);
  const sortedExpected = [...expectedSections].sort((a, b) => a - b);
  if (JSON.stringify(sortedFound) !== JSON.stringify(sortedExpected)) {
    console.error(`ERROR: In ${file}: expected sections [${sortedExpected.join(', ')}], found [${sortedFound.join(', ')}]`);
    process.exit(1);
  }
}

// 2. Acceptance Check (2): Every spec section 1 to 17 appears in exactly one file
console.log('--- Acceptance Check 2: Section 1 to 17 Distribution ---');
let check2Pass = true;
for (let i = 1; i <= 17; i++) {
  const file = sectionLocations.get(i);
  if (!file) {
    console.error(`FAIL: Section ${i} is missing from all split files!`);
    check2Pass = false;
  } else {
    console.log(`  Section ${String(i).padStart(2, ' ')} -> ${file}`);
  }
}

if (!check2Pass || sectionLocations.size !== 17) {
  console.error(`FAIL: Acceptance Check 2 failed: expected exactly 17 sections, found ${sectionLocations.size}`);
  process.exit(1);
}
console.log('PASS: Every spec section 1 to 17 appears in exactly one file.\n');

// 3. Acceptance Check (1): Reassembled content matches SPEC_FULL.md identically
console.log('--- Acceptance Check 1: Content Comparison with SPEC_FULL.md ---');
const reassembled = Array.from({ length: 17 }, (_, i) => extractedSections[i + 1]).join('\r\n');

if (reassembled === originalSpec) {
  console.log(`PASS: Content is 100% IDENTICAL (${reassembled.length} bytes match byte-for-byte).\n`);
} else {
  console.error(`FAIL: Content mismatch! Reassembled length: ${reassembled.length}, SPEC_FULL length: ${originalSpec.length}`);
  // Find first difference
  for (let i = 0; i < Math.max(reassembled.length, originalSpec.length); i++) {
    if (reassembled[i] !== originalSpec[i]) {
      console.error(`First mismatch at byte ${i}: reassembled code ${reassembled.charCodeAt(i)} (${JSON.stringify(reassembled.slice(i, i + 30))}) vs original code ${originalSpec.charCodeAt(i)} (${JSON.stringify(originalSpec.slice(i, i + 30))})`);
      break;
    }
  }
  process.exit(1);
}

// 4. Acceptance Check (3): INDEX.md links resolve
console.log('--- Acceptance Check 3: INDEX.md Link Resolution ---');
if (!fs.existsSync(indexMdPath)) {
  console.error(`FAIL: ${indexMdPath} does not exist`);
  process.exit(1);
}

const indexContent = fs.readFileSync(indexMdPath, 'utf8');
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
let match;
const links = [];

while ((match = linkRegex.exec(indexContent)) !== null) {
  const linkText = match[1];
  const target = match[2];
  links.push({ linkText, target });
}

console.log(`Found ${links.length} links in INDEX.md:`);
let check3Pass = true;

for (const { linkText, target } of links) {
  // Strip anchor if present
  const [filePath] = target.split('#');
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    console.log(`  [OK] External link: ${linkText} -> ${target}`);
    continue;
  }
  const resolved = path.resolve(specDir, filePath);
  if (fs.existsSync(resolved)) {
    console.log(`  [OK] ${linkText} -> ${target} (resolved to ${path.relative(rootDir, resolved)})`);
  } else {
    console.error(`  [FAIL] ${linkText} -> ${target} (CANNOT RESOLVE: ${resolved})`);
    check3Pass = false;
  }
}

if (!check3Pass) {
  console.error('\nFAIL: Acceptance Check 3 failed: one or more links in INDEX.md do not resolve.');
  process.exit(1);
}
console.log('PASS: All INDEX.md links resolve successfully.\n');

console.log('========================================');
console.log('ALL ACCEPTANCE CHECKS PASSED CLEANLY');
console.log('========================================');
