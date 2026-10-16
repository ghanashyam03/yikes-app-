import { config } from 'dotenv';
import { resolve } from 'node:path';
import { loadEnv } from '../config/env.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import { PartnerEngine } from './engine.js';
import { DEFAULT_MAYA_PERSONA } from './fallbackLines.js';

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') });

async function runLive6TurnSmoke() {
  console.log('Starting Live 6-Turn Practice Partner Smoke Verification with NVIDIA API...');
  const env = loadEnv();
  const provider = new NvidiaProvider(env);
  const engine = new PartnerEngine({
    env,
    provider,
  });

  const testUserId = 'live_smoke_user_001';
  const startRes = await engine.startAttempt(testUserId, {
    scenario: {
      title: 'Discussing scope overflow',
      setting: 'Office breakout area',
      userGoal: 'Push back politely on extra scope before sprint ends',
    },
    persona: DEFAULT_MAYA_PERSONA,
    mode: 'try',
  });

  console.log(`Session Started! Attempt ID: ${startRes.attemptId}`);
  console.log(`Opening Turn (${startRes.openingTurn.role}): "${startRes.openingTurn.text}"`);

  const userMessages = [
    'Hey Maya, thanks for meeting. I wanted to talk about the two extra tickets assigned to me yesterday.',
    'Given our current commitments and QA testing cycle, taking both would push our release date back.',
    'I recommend we focus entirely on the auth refactor first, and move the reporting tickets to next sprint.',
    'I can write up a quick risk summary for the stakeholders so everyone is on the same page.',
    'Great, I will also let Alex know during tomorrow morning standup.',
    'Sounds like a solid plan. Thanks for working through this with me, Maya!',
  ];

  const latencyTable: Array<{
    turn: number;
    userMessage: string;
    partnerReply: string;
    mood: string;
    wantsToEnd: boolean;
    latencyMs: number;
    degraded: boolean;
  }> = [];

  for (let i = 0; i < userMessages.length; i++) {
    const userText = userMessages[i]!;
    const startMs = Date.now();
    console.log(`\n--- Executing Turn ${i + 1} of 6 ---`);
    console.log(`User: "${userText}"`);

    const turnRes = await engine.executeTurn(testUserId, startRes.attemptId, userText);
    const latencyMs = Date.now() - startMs;

    console.log(`Partner: "${turnRes.reply}"`);
    console.log(`Latency: ${latencyMs}ms | Mood: engagement=${turnRes.mood?.engagement}, rapport=${turnRes.mood?.rapport} | wantsToEnd=${turnRes.wantsToEnd}`);

    latencyTable.push({
      turn: i + 1,
      userMessage: userText.slice(0, 35) + '...',
      partnerReply: (turnRes.reply ?? '').slice(0, 45) + '...',
      mood: `eng:${turnRes.mood?.engagement} rap:${turnRes.mood?.rapport}`,
      wantsToEnd: !!turnRes.wantsToEnd,
      latencyMs,
      degraded: !!turnRes.degraded,
    });
  }

  // End attempt
  const endRes = await engine.endAttempt(testUserId, startRes.attemptId, 'turn_cap');
  console.log(`\nAttempt ended successfully with ${endRes.turnsCount} turns. Total revealed inner thoughts: ${endRes.thoughts.length}`);

  console.log('\n======================================================');
  console.log('   LIVE 6-TURN CHAT LATENCY & CONVERSATION TABLE');
  console.log('======================================================');
  console.table(latencyTable);

  const avgLatency = Math.round(
    latencyTable.reduce((acc, row) => acc + row.latencyMs, 0) / latencyTable.length
  );
  console.log(`Average turn latency: ${avgLatency}ms`);
}

runLive6TurnSmoke().catch((err) => {
  console.error('Live smoke test encountered an error:', err);
  process.exit(1);
});
