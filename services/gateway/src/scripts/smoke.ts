import { loadEnv } from '../config/env.js';
import { runSmokeTest } from './smoke-runner.js';

async function main(): Promise<void> {
  console.log('Running AI Gateway model smoke test...');
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    console.error('Failed to load environment for smoke test:', err);
    process.exit(1);
  }

  console.log(`Provider: ${env.AI_PROVIDER}`);
  console.log(`Base URL: ${env.NVIDIA_BASE_URL}`);

  const results = await runSmokeTest(env);

  console.log('\n--- MODEL SMOKE TEST RESULTS ---');
  console.table(
    results.map((r) => ({
      Model: r.model,
      Status: r.status,
      'Latency (ms)': r.latencyMs,
      Output: r.output ?? (r.error ? `ERROR: ${r.error.slice(0, 40)}` : 'N/A'),
    }))
  );

  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.length - passedCount;
  console.log(`\nSummary: ${passedCount} passed, ${failedCount} failed (${results.length} total)`);

  if (failedCount > 0) {
    console.warn('\nWarning: Some configured models failed the smoke test.');
  }
}

main().catch((err) => {
  console.error('Smoke CLI script error:', err);
  process.exit(1);
});
