import { runEvalHarness } from './harness.js';

function main() {
  console.log('='.repeat(95));
  console.log(' yikes! AI Prompts & Coach Feedback Eval Harness (10 Diverse Transcripts)');
  console.log('='.repeat(95));

  const summary = runEvalHarness();

  console.log(
    ['Fixture ID', 'Name'.padEnd(28), 'Tone'.padEnd(9), 'Schema', 'Quotes', 'Pivot', 'Honesty', 'Result'].join(' | ')
  );
  console.log('-'.repeat(95));

  for (const r of summary.results) {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    const schemaCol = r.schemaValid ? 'PASS' : 'FAIL';
    const quotesCol = r.quotesValid ? 'PASS' : 'FAIL';
    const pivotCol = r.pivotMatched ? 'PASS' : 'FAIL';
    const honestyCol = r.honestyPassed ? 'PASS' : 'FAIL';

    console.log(
      [
        r.fixtureId.padEnd(10),
        r.name.padEnd(28),
        r.toneVariant.padEnd(9),
        schemaCol.padEnd(6),
        quotesCol.padEnd(6),
        pivotCol.padEnd(5),
        honestyCol.padEnd(7),
        status,
      ].join(' | ')
    );

    if (!r.passed) {
      if (!r.quotesValid) {
        console.error(`  -> Invalid quotes: ${JSON.stringify(r.invalidQuotes)}`);
      }
      if (!r.pivotMatched) {
        console.error(`  -> Pivot mismatch: expected ${r.pivotExpected}, got ${r.pivotPresent}`);
      }
      if (!r.honestyPassed) {
        console.error(`  -> Honesty violations: ${JSON.stringify(r.honestyViolations)}`);
      }
    }
  }

  console.log('='.repeat(95));
  console.log(`Summary: ${summary.passed}/${summary.total} PASSED (${summary.failed} failed)`);
  console.log('='.repeat(95));

  if (summary.failed > 0) {
    process.exit(1);
  }
}

main();
