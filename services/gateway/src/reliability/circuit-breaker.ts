export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface ModelBreaker {
  state: CircuitState;
  failures: number[];
  openedAt: number | null;
}

export class CircuitBreakerRegistry {
  private breakers: Map<string, ModelBreaker> = new Map();
  private readonly failureThreshold: number;
  private readonly windowMs: number;
  private readonly halfOpenDelayMs: number;

  constructor(
    failureThreshold = 5,
    windowMs = 60_000,
    halfOpenDelayMs = 30_000
  ) {
    this.failureThreshold = failureThreshold;
    this.windowMs = windowMs;
    this.halfOpenDelayMs = halfOpenDelayMs;
  }

  private getBreaker(model: string): ModelBreaker {
    let breaker = this.breakers.get(model);
    if (!breaker) {
      breaker = {
        state: 'CLOSED',
        failures: [],
        openedAt: null,
      };
      this.breakers.set(model, breaker);
    }
    return breaker;
  }

  getState(model: string, now = Date.now()): CircuitState {
    const breaker = this.getBreaker(model);
    if (breaker.state === 'OPEN' && breaker.openedAt !== null) {
      if (now - breaker.openedAt >= this.halfOpenDelayMs) {
        breaker.state = 'HALF_OPEN';
      }
    }
    return breaker.state;
  }

  canAttempt(model: string, now = Date.now()): boolean {
    const state = this.getState(model, now);
    return state === 'CLOSED' || state === 'HALF_OPEN';
  }

  recordSuccess(model: string): void {
    const breaker = this.getBreaker(model);
    breaker.state = 'CLOSED';
    breaker.failures = [];
    breaker.openedAt = null;
  }

  recordFailure(model: string, now = Date.now()): void {
    const breaker = this.getBreaker(model);

    if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'OPEN';
      breaker.openedAt = now;
      return;
    }

    const cutoff = now - this.windowMs;
    breaker.failures = breaker.failures.filter((t) => t >= cutoff);
    breaker.failures.push(now);

    if (breaker.failures.length >= this.failureThreshold) {
      breaker.state = 'OPEN';
      breaker.openedAt = now;
    }
  }

  reset(model?: string): void {
    if (model) {
      this.breakers.delete(model);
    } else {
      this.breakers.clear();
    }
  }
}

export const defaultCircuitBreaker = new CircuitBreakerRegistry();
