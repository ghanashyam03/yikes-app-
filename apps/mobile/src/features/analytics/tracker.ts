import {
  type AllowedEventName,
  type EventPropertiesMap,
  validateEvent,
} from './events';

export interface PostHogClient {
  capture(event: string, properties?: Record<string, unknown> | undefined): void | Promise<void>;
  identify(distinctId: string): void;
  reset(): void;
  optIn(): void;
  optOut(): void;
  isOptedOut?(): boolean;
}

/**
 * Memory fallback PostHog client for environments without native SDK configured or tests.
 */
export class MemoryPostHogClient implements PostHogClient {
  public capturedEvents: Array<{ event: string; properties?: Record<string, unknown> | undefined }> = [];
  public currentDistinctId: string | null = null;
  public optedOut = true;

  capture(event: string, properties?: Record<string, unknown> | undefined): void {
    if (this.optedOut) {
      return;
    }
    this.capturedEvents.push({ event, properties });
  }

  identify(distinctId: string): void {
    if (this.optedOut) {
      return;
    }
    this.currentDistinctId = distinctId;
  }

  reset(): void {
    this.currentDistinctId = null;
    this.capturedEvents = [];
  }

  optIn(): void {
    this.optedOut = false;
  }

  optOut(): void {
    this.optedOut = true;
  }

  isOptedOut(): boolean {
    return this.optedOut;
  }

  clear(): void {
    this.capturedEvents = [];
  }
}

export interface TrackerOptions {
  client?: PostHogClient;
  initialConsent?: boolean;
}

export class AnalyticsTracker {
  private client: PostHogClient;
  private consentGranted: boolean;

  constructor(options: TrackerOptions = {}) {
    this.client = options.client ?? new MemoryPostHogClient();
    this.consentGranted = options.initialConsent ?? false;

    if (this.consentGranted) {
      this.client.optIn();
    } else {
      this.client.optOut();
    }
  }

  /**
   * Set or update analytics consent.
   * If false or withdrawn, immediately opts out the underlying client.
   */
  public setConsent(granted: boolean): void {
    this.consentGranted = Boolean(granted);
    if (this.consentGranted) {
      this.client.optIn();
    } else {
      this.client.optOut();
    }
  }

  /**
   * Withdraw analytics consent completely.
   */
  public withdrawConsent(): void {
    this.setConsent(false);
  }

  /**
   * Check whether analytics consent is currently granted.
   */
  public hasConsent(): boolean {
    return this.consentGranted;
  }

  /**
   * Replace or initialize the underlying PostHog client.
   */
  public setClient(client: PostHogClient): void {
    this.client = client;
    if (this.consentGranted) {
      this.client.optIn();
    } else {
      this.client.optOut();
    }
  }

  public getClient(): PostHogClient {
    return this.client;
  }

  /**
   * Identify an anonymous user identifier.
   * Silently dropped if analytics consent is not granted.
   */
  public identify(distinctId: string): void {
    if (!this.consentGranted) {
      return;
    }
    this.client.identify(distinctId);
  }

  /**
   * Reset user identity and clear client state.
   */
  public reset(): void {
    this.client.reset();
  }

  /**
   * Track an event.
   *
   * 1. Validates the event name and properties against strict Zod schemas.
   *    If unknown event or free-text property is present, THROWS an error.
   * 2. Checks consent: If consent is off or withdrawn, drops event completely
   *    and sends nothing.
   */
  public async track<E extends AllowedEventName>(
    event: E | string,
    properties?: EventPropertiesMap[E] | Record<string, unknown>
  ): Promise<boolean> {
    // 1. Strict schema validation (must pass or reject)
    const validated = validateEvent(event, properties);

    // 2. Strict consent check: if consent is false or withdrawn, drop event completely!
    if (!this.consentGranted) {
      return false;
    }

    // 3. Emit through PostHog client
    await this.client.capture(validated.event, validated.properties as Record<string, unknown>);
    return true;
  }
}

// Global default singleton instance
export const tracker = new AnalyticsTracker();

export const track = tracker.track.bind(tracker);
export const setAnalyticsConsent = tracker.setConsent.bind(tracker);
export const withdrawAnalyticsConsent = tracker.withdrawConsent.bind(tracker);
export const isAnalyticsConsentGranted = tracker.hasConsent.bind(tracker);
export const resetTracker = tracker.reset.bind(tracker);
