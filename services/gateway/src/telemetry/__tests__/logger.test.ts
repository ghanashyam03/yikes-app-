import { describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import { createRedactedLogger } from '../logger.js';

describe('Logger Redaction', () => {
  it('proves user message text, prompt, content, and authorization never reach logs', async () => {
    let loggedData = '';
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        loggedData += chunk.toString();
        callback();
      },
    });

    const testLogger = createRedactedLogger({}, destination);

    const sensitiveUserText = 'My deeply personal confidential conversation 98765';
    const sensitivePrompt = 'Prompt with user private backstory 54321';
    const sensitiveToken = 'bearer-token-secret-alpha-omega';

    testLogger.info(
      {
        userId: 'safe-user-id-123',
        model: 'configured-model',
        messages: [{ role: 'user', content: sensitiveUserText }],
        text: 'Sensitive model response text',
        prompt: sensitivePrompt,
        thought: 'Private character thought',
        body: {
          text: 'Sensitive body text',
          content: 'Sensitive body content',
        },
        authorization: sensitiveToken,
      },
      'AI completion completed'
    );

    // Give stream a tick to flush
    await new Promise((r) => setTimeout(r, 20));

    expect(loggedData).not.toContain(sensitiveUserText);
    expect(loggedData).not.toContain('Sensitive model response text');
    expect(loggedData).not.toContain(sensitivePrompt);
    expect(loggedData).not.toContain('Private character thought');
    expect(loggedData).not.toContain('Sensitive body text');
    expect(loggedData).not.toContain('Sensitive body content');
    expect(loggedData).not.toContain(sensitiveToken);

    // Metadata IS logged safely
    expect(loggedData).toContain('safe-user-id-123');
    expect(loggedData).toContain('configured-model');
    expect(loggedData).toContain('[REDACTED]');
  });
});
