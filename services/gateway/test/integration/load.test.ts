import { describe, it } from 'vitest';
import { buildApp } from '../../src/app';

describe('Gateway Load Test', () => {
  it('simulates concurrent users against the rate limit queue', async () => {
    const app = buildApp();
    await app.ready();

    const totalRequests = 50;
    const promises = [];

    for (let i = 0; i < totalRequests; i++) {
      promises.push(
        app.inject({
          method: 'POST',
          url: '/v1/partner/turn',
          headers: {
            authorization: 'Bearer mock-jwt-token'
          },
          payload: {
            attemptId: 'test-attempt',
            userText: `Load test message ${i}`
          }
        })
      );
    }

    await Promise.all(promises);
    await app.close();
  });
});
