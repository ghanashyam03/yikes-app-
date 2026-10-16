/**
 * types.ts — Types for Gateway push notification jobs and push sender interface
 */

export interface PushNotificationPayload {
  to: string; // Device push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushSendResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface PushSender {
  send(payload: PushNotificationPayload): Promise<PushSendResult>;
}

export class MockPushSender implements PushSender {
  public sentPushes: PushNotificationPayload[] = [];

  async send(payload: PushNotificationPayload): Promise<PushSendResult> {
    this.sentPushes.push(payload);
    return {
      success: true,
      id: `mock-push-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  clear(): void {
    this.sentPushes = [];
  }
}
