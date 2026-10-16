/* eslint-env node */
import fs from 'fs';
import path from 'path';

const flowsDir = path.resolve('e2e');
const files = fs.readdirSync(flowsDir).filter(f => f.endsWith('.yaml'));

console.log(`Found ${files.length} Maestro flow files.`);
if (files.length < 7) {
  console.error('Error: Expected at least 7 Maestro flow files.');
  process.exit(1);
}

for (const file of files) {
  const content = fs.readFileSync(path.join(flowsDir, file), 'utf8');
  if (!content.includes('appId:') || !content.includes('---')) {
    console.error(`Error: Flow ${file} lacks valid header.`);
    process.exit(1);
  }
  console.log(`✓ Flow ${file} validated successfully.`);
}

console.log('All Maestro flows verified successfully!');
