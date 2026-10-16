/* eslint-env node */
import fs from 'fs';
import path from 'path';

const evalDir = path.resolve('packages/ai-prompts/eval/fixtures');
if (!fs.existsSync(evalDir)) {
  fs.mkdirSync(evalDir, { recursive: true });
}

// Generate 30 fixtures (10 baseline, 20 draft)
for (let i = 1; i <= 10; i++) {
  const fixture = {
    id: `baseline-${i}`,
    label: 'BASELINE',
    transcript: [
      { role: 'user', text: 'Hi there, how are you feeling about the presentation?' },
      { role: 'partner', text: 'I guess it is fine, though I am a bit rushed.' }
    ],
    expectedSchemaValid: true,
    expectedQuotes: ['I guess it is fine']
  };
  fs.writeFileSync(path.join(evalDir, `baseline-${i}.json`), JSON.stringify(fixture, null, 2));
}

for (let i = 1; i <= 20; i++) {
  const fixture = {
    id: `draft-${i}`,
    label: 'DRAFT',
    transcript: [
      { role: 'user', text: `Draft test message ${i}` },
      { role: 'partner', text: `Draft partner reply ${i}` }
    ],
    expectedSchemaValid: true,
    expectedQuotes: [`Draft partner reply ${i}`]
  };
  fs.writeFileSync(path.join(evalDir, `draft-${i}.json`), JSON.stringify(fixture, null, 2));
}

console.log('Successfully created 30 evaluation fixtures (10 baseline, 20 draft).');
