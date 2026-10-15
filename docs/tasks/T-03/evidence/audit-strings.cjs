const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../../../../apps/mobile/src/ui/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && !f.includes('test'));

console.log('Auditing components for hardcoded strings...');
let foundCount = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    // Check for hardcoded string in accessibilityLabel="..."
    if (/accessibilityLabel="[^"]+"/.test(line)) {
      console.log(`[a11yLabel] ${file}:${i+1} -> ${line.trim()}`);
      foundCount++;
    }
    // Check for hardcoded string in accessibilityHint="..."
    if (/accessibilityHint="[^"]+"/.test(line)) {
      console.log(`[a11yHint] ${file}:${i+1} -> ${line.trim()}`);
      foundCount++;
    }
    // Check for raw literal inside <Text ...>literal</Text>
    const matchText = line.match(/<Text[^>]*>([^<{}]+)<\/Text>/);
    if (matchText && matchText[1].trim() && !/^\s*$/.test(matchText[1])) {
      console.log(`[rawText] ${file}:${i+1} -> ${line.trim()}`);
      foundCount++;
    }
  });
}

console.log(`Audit complete. Found ${foundCount} potential hardcoded string occurrences.`);
