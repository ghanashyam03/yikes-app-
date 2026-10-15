import { describe, expect, it } from 'vitest';
import { GatewayBusyError } from '../../errors/ai-errors.js';
import { RateLimiterQueue } from '../rate-limiter.js';

describe('RateLimiterQueue', () => {
  it('allows immediate acquisition when tokens are available', async () => {
    const queue = new RateLimiterQueue(10);
    expect(queue.getTokens()).toBe(10);

    await queue.acquire('chat');
    expect(queue.getTokens()).toBeCloseTo(9, 0);
  });

  it('orders waiting requests by priority: chat > coach > background', async () => {
    const limiter = new RateLimiterQueue(1);

    // Consume the initial token
    await limiter.acquire('chat');

    const executedOrder: string[] = [];

    // Enqueue requests in reverse priority order while bucket is empty
    const pBackground = limiter.acquire('background', 2000).then(() => {
      executedOrder.push('background');
    });

    const pCoach = limiter.acquire('coach', 2000).then(() => {
      executedOrder.push('coach');
    });

    const pChat = limiter.acquire('chat', 2000).then(() => {
      executedOrder.push('chat');
    });

    // Add 1 token at a time to let the highest priority request run
    limiter.addTokens(1);
    await new Promise((r) => setTimeout(r, 10));
    expect(executedOrder).toEqual(['chat']);

    limiter.addTokens(1);
    await new Promise((r) => setTimeout(r, 10));
    expect(executedOrder).toEqual(['chat', 'coach']);

    limiter.addTokens(1);
    await new Promise((r) => setTimeout(r, 10));
    expect(executedOrder).toEqual(['chat', 'coach', 'background']);

    await Promise.all([pBackground, pCoach, pChat]);
    limiter.reset();
  });

  it('rejects with typed BUSY error when queue wait timeout is reached', async () => {
    const limiter = new RateLimiterQueue(1);
    await limiter.acquire('chat'); // bucket empty

    // Request with short timeout of 50ms
    const acquirePromise = limiter.acquire('background', 50);

    await expect(acquirePromise).rejects.toThrow(GatewayBusyError);
    await expect(acquirePromise).rejects.toMatchObject({
      code: 'BUSY',
      statusCode: 429,
    });
  });
});
