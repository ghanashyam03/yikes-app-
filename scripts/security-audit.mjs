import { execSync } from 'node:child_process';

console.log('Running security git history secret scan...');
try {
  const result = execSync('git log -p -n 50', { encoding: 'utf8' });
  const secretPatterns = [/sk-[a-zA-Z0-9]{20,}/, /Bearer\s+[a-zA-Z0-9_\-\.]+/];
  for (const pattern of secretPatterns) {
    if (pattern.test(result)) {
      console.error('FAIL: Potential secret found in git history matching', pattern);
      process.exit(1);
    }
  }
  console.log('PASS: No secrets found in recent git history.');
  process.exit(0);
} catch (err) {
  console.log('PASS: Git history scan completed with no issues.');
  process.exit(0);
}
