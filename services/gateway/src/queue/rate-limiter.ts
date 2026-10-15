import { GatewayBusyError } from '../errors/ai-errors.js';

export type QueuePriority = 'chat' | 'coach' | 'background';

const PRIORITY_WEIGHTS: Record<QueuePriority, number> = {
  chat: 1, // highest priority
  coach: 2,
  background: 3, // lowest priority
};

interface QueuedItem {
  id: number;
  priority: QueuePriority;
  enqueuedAt: number;
  maxWaitMs: number;
  resolve: () => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout | null;
}

export class RateLimiterQueue {
  private readonly rpmLimit: number;
  private tokens: number;
  private lastRefill: number;
  private queue: QueuedItem[] = [];
  private nextItemId = 0;
  private refillInterval: NodeJS.Timeout | null = null;

  constructor(rpmLimit = 35) {
    this.rpmLimit = rpmLimit;
    this.tokens = rpmLimit;
    this.lastRefill = Date.now();
  }

  private refill(now = Date.now()): void {
    const elapsedMs = now - this.lastRefill;
    if (elapsedMs <= 0) return;

    const tokensToAdd = (elapsedMs * this.rpmLimit) / 60_000;
    this.tokens = Math.min(this.rpmLimit, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  addTokens(count: number): void {
    this.tokens = Math.min(this.rpmLimit, this.tokens + count);
    this.drain();
  }

  private drain(): void {
    this.refill();

    while (this.tokens >= 1 && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      if (item.timer) {
        clearTimeout(item.timer);
        item.timer = null;
      }

      this.tokens -= 1;
      item.resolve();
    }

    if (this.queue.length > 0 && !this.refillInterval) {
      const msPerToken = Math.ceil(60_000 / this.rpmLimit);
      this.refillInterval = setInterval(() => {
        this.drain();
        if (this.queue.length === 0 && this.refillInterval) {
          clearInterval(this.refillInterval);
          this.refillInterval = null;
        }
      }, Math.min(msPerToken, 100));
    } else if (this.queue.length === 0 && this.refillInterval) {
      clearInterval(this.refillInterval);
      this.refillInterval = null;
    }
  }

  async acquire(priority: QueuePriority, maxWaitMs = 6000): Promise<void> {
    this.refill();

    if (this.tokens >= 1 && this.queue.length === 0) {
      this.tokens -= 1;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const item: QueuedItem = {
        id: ++this.nextItemId,
        priority,
        enqueuedAt: Date.now(),
        maxWaitMs,
        resolve,
        reject,
        timer: null,
      };

      item.timer = setTimeout(() => {
        const index = this.queue.findIndex((q) => q.id === item.id);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new GatewayBusyError(`Gateway request queue timeout after ${maxWaitMs}ms`));
      }, maxWaitMs);

      // Insert into sorted queue by priority, FIFO within same priority
      const weight = PRIORITY_WEIGHTS[priority];
      const insertIndex = this.queue.findIndex(
        (existing) => PRIORITY_WEIGHTS[existing.priority] > weight
      );

      if (insertIndex === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(insertIndex, 0, item);
      }

      this.drain();
    });
  }

  reset(): void {
    if (this.refillInterval) {
      clearInterval(this.refillInterval);
      this.refillInterval = null;
    }
    for (const item of this.queue) {
      if (item.timer) clearTimeout(item.timer);
    }
    this.queue = [];
    this.tokens = this.rpmLimit;
    this.lastRefill = Date.now();
  }
}
