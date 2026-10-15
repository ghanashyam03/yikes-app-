const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, '../../../../apps/mobile/src/ui/components'),
  path.join(__dirname, '../../../../apps/mobile/src/copy'),
  path.join(__dirname, '../../../../apps/mobile/app/dev')
];

let found = [];

function scan(d) {
  for (const f of fs.readdirSync(d)) {
    const full = path.join(d, f);
    if (fs.statSync(full).isDirectory()) scan(full);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      if (full.includes('.test.')) continue;
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Red color codes like #FF0000, #F00, red hexes, or 'red'
        if (/(#[fF]00\b|#[fF]{2}0000|'red'|"red"|#[eE]53935|#[fF]{2}[0-4]{4})/i.test(line)) {
          found.push({ file: path.basename(full), line: idx + 1, content: line.trim() });
        }
      });
    }
  }
}

dirs.forEach(d => scan(d));
console.log('Zero red scan matches found in production code:', found.length);
if (found.length > 0) {
  console.log(JSON.stringify(found, null, 2));
}
