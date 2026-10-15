import { describe, expect, it, vi } from 'vitest';
import { checkCrisisRules } from '../../../../packages/shared/src/safety/crisis-terms.js';
import { checkText } from '../../../../services/gateway/src/safety/checker.js';
import { wrapUserText, sanitizeTokens, buildSafeMessages } from '../../../../services/gateway/src/safety/injection.js';
import { guardOutput } from '../../../../services/gateway/src/safety/output-guard.js';
import { validateScenario } from '../../../../services/gateway/src/safety/scenarios.js';
import { loadCrisisResources } from '../../../../services/gateway/src/safety/resources.js';
import { logSafetyEvent } from '../../../../services/gateway/src/routes/safety.js';
import { createRedactedLogger } from '../../../../services/gateway/src/telemetry/logger.js';
import { Writable } from 'node:stream';
import { writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FakeProvider } from '../../../../services/gateway/src/providers/fake.js';

describe('Verifier Independent Audit Suite for T-09', () => {
  // 10 novel crisis phrases (English and Hinglish)
  const NOVEL_CRISIS_PHRASES = [
    { text: 'I genuinely want to die right now', lang: 'English' },
    { text: 'I don\'t want to wake up anymore', lang: 'English' },
    { text: 'thinking about killing myself tonight', lang: 'English' },
    { text: 'I\'m going to take my own life tomorrow', lang: 'English' },
    { text: 'planning my suicide note', lang: 'English' },
    { text: 'apni jaan lena chahta hu', lang: 'Hinglish' },
    { text: 'ab jeena nahi chahti mai', lang: 'Hinglish' },
    { text: 'zeher kha lungi agar fail ho gaya', lang: 'Hinglish' },
    { text: 'khud ko marna chahta hu', lang: 'Hinglish' },
    { text: 'phaasi laga raha hu', lang: 'Hinglish' },
  ];

  // Ordinary awkward-conversation phrases
  const AWKWARD_CONVERSATION_PHRASES = [
    'I died of embarrassment during my toast',
    'this presentation is killing me',
    'I want to disappear from this party',
    'my shoes are killing me',
    'I was dead tired after the workshop',
    'bringing that up was total social suicide',
    'I wanted to sink into the floor when I dropped my plate',
    'I just wanted to crawl into a hole and hide',
    'I died laughing when he forgot his lines',
    'just killing time before my interview starts',
  ];

  it('audits novel crisis phrases recall in checkCrisisRules and checkText', async () => {
    const results = [];
    for (const item of NOVEL_CRISIS_PHRASES) {
      const ruleResult = checkCrisisRules(item.text);
      const checkResult = await checkText(item.text, 'input', { skipModel: true });
      results.push({
        text: item.text,
        lang: item.lang,
        ruleFlagged: ruleResult.isCrisis,
        checkTextVerdict: checkResult.verdict,
      });
    }

    const missed = results.filter((r) => !r.ruleFlagged || r.checkTextVerdict !== 'crisis');
    // Notice: "apni jaan lena chahta hu" is missed because the regex requires "apni jaan le lena"
    expect(missed.map((m) => m.text)).toEqual(['apni jaan lena chahta hu']);
  });

  it('Verifies false-positive rate is 0% on ordinary awkward-conversation text', async () => {
    for (const phrase of AWKWARD_CONVERSATION_PHRASES) {
      const ruleResult = checkCrisisRules(phrase);
      expect(ruleResult.isCrisis, `Rule false positive on: "${phrase}"`).toBe(false);

      const checkResult = await checkText(phrase, 'input', { skipModel: true });
      expect(checkResult.verdict, `checkText false positive on: "${phrase}"`).toBe('allow');
    }
  });

  it('Verifies output guard rejects human claims and banned clinical terms', () => {
    // Identity claims
    const humanClaims = [
      'I am a real human, not an algorithm',
      'As a human being, I get it',
      'I am a real person listening to you',
      'I am not an AI model, I am a live person',
      'I have flesh and blood feelings',
    ];
    for (const claim of humanClaims) {
      const result = guardOutput(claim, 'partner');
      expect(result.ok, `Should reject human claim: "${claim}"`).toBe(false);
      expect(result.violations?.some((v) => v.includes('Identity violation'))).toBe(true);
    }

    // Clinical terms in coach copy
    const clinicalSentences = [
      'Let us treat your social anxiety with this technique.',
      'This exercise will cure your shyness completely.',
      'Welcome to therapy session number two.',
      'I can diagnose what is happening when you speak.',
      'Regular exposure treatments will help your symptoms.',
      'As your therapist, here is the diagnosis.',
    ];
    for (const clinical of clinicalSentences) {
      const result = guardOutput(clinical, 'coach');
      expect(result.ok, `Should reject clinical term: "${clinical}"`).toBe(false);
      expect(result.violations?.some((v) => v.includes('Clinical word violation'))).toBe(true);
    }

    // Clean coaching feedback must pass
    const cleanCoaching = 'You acknowledged their point and followed up with an open question. That kept the dialogue flowing naturally.';
    expect(guardOutput(cleanCoaching, 'coach').ok).toBe(true);
  });

  it('Audits crisis resources parser behavior on sub-bullets and verified data integrity', () => {
    const dir = loadCrisisResources();

    // Check what helpline names exist
    const names = dir.allHelplines.map((h) => h.name);

    // Look for corrupted sub-bullet names
    const corruptedHelplines = names.filter((n) =>
      ['Alternate Phone', 'Website', 'Verification', 'Chat'].includes(n)
    );

    // This documents the bug: corruptedHelplines contains sub-bullets parsed as separate helplines!
    expect(corruptedHelplines.length).toBeGreaterThan(0);

    // Check Tele-MANAS
    const telemanas = dir.allHelplines.find((h) => h.name.includes('Tele-MANAS'));
    expect(telemanas).toBeDefined();
    // Because of the bug, telemanas.alternatePhone and telemanas.website were not attached to Tele-MANAS!
    expect(telemanas?.alternatePhone).toBeUndefined();
    expect(telemanas?.website).toBeUndefined();
  });

  it('Verifies crisis resources loader rejects unverified and missing files', () => {
    // Reject unverified file
    const tempFile = resolve(process.cwd(), 'docs/tasks/T-09/evidence/temp-test-unverified.md');
    try {
      writeFileSync(tempFile, '# Directory\nStatus: UNVERIFIED\n## Test\n- **Sample Helpline**\n  - **Phone**: 123\n');
      expect(() => loadCrisisResources(tempFile)).toThrow(/Unverified entries detected/);
    } finally {
      try { unlinkSync(tempFile); } catch {}
    }

    // Reject missing file
    expect(() => loadCrisisResources('non-existent-path-to-file.md')).toThrow(/not found/);
  });

  it('Verifies degraded mode fails safe when safety model is down', async () => {
    const failingProvider = {
      complete: vi.fn().mockRejectedValue(new Error('503 Service Unavailable')),
    } as unknown as FakeProvider;

    // Crisis must still be flagged
    const crisisResult = await checkText('I want to kill myself', 'input', { provider: failingProvider });
    expect(crisisResult.verdict).toBe('crisis');

    // Benign must pass with degraded: true
    const benignResult = await checkText('I was nervous before my presentation', 'input', { provider: failingProvider });
    expect(benignResult.verdict).toBe('allow');
    expect(benignResult.degraded).toBe(true);
  });

  it('Verifies zero message text in safety_events database inserts and log streams', async () => {
    const sensitivePayloadText = 'CONFIDENTIAL_PERSONAL_CRISIS_TEXT_SHOULD_NEVER_BE_LOGGED';

    // 1. safety_events insertion inspection
    let dbPayload: any = null;
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockImplementation((payload: any) => {
          dbPayload = payload;
          return Promise.resolve({ error: null });
        }),
      }),
    } as unknown as SupabaseClient;

    await logSafetyEvent(mockSupabase, 'crisis', 'input');
    expect(dbPayload).toEqual({ kind: 'crisis', source: 'input' });
    expect(JSON.stringify(dbPayload)).not.toContain(sensitivePayloadText);

    // 2. Logger redaction
    let logStreamOutput = '';
    const dest = new Writable({
      write(chunk, _encoding, cb) {
        logStreamOutput += chunk.toString();
        cb();
      },
    });

    const redactedLog = createRedactedLogger({ level: 'info' }, dest);
    redactedLog.info({ text: sensitivePayloadText, content: sensitivePayloadText, rawText: sensitivePayloadText }, 'User check');

    expect(logStreamOutput).not.toContain(sensitivePayloadText);
    expect(logStreamOutput).toContain('[REDACTED]');
  });
});
