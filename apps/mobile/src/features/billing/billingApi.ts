import { type EntitlementsResponse } from './types';

const DEFAULT_GATEWAY_URL =
  process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

export const DEFAULT_FREE_ENTITLEMENTS: EntitlementsResponse = {
  userId: 'guest',
  plan: 'free',
  isActive: true,
  expiresAt: null,
  limits: {
    chatTurnsDaily: 40,
    replyHelperWeekly: 3,
    prepWeekly: 1,
  },
  features: {
    unlimitedChat: false,
    unlimitedReplyHelper: false,
    unlimitedPrep: false,
    weeklyLetter: false,
    voiceMatch: false,
    batteryInsights: false,
  },
};

export async function fetchEntitlements(
  token?: string | null,
  gatewayUrl = DEFAULT_GATEWAY_URL
): Promise<EntitlementsResponse> {
  if (!token) {
    return DEFAULT_FREE_ENTITLEMENTS;
  }

  try {
    const res = await fetch(`${gatewayUrl}/v1/billing/entitlements`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return DEFAULT_FREE_ENTITLEMENTS;
    }

    const data = (await res.json()) as EntitlementsResponse;
    return data;
  } catch {
    return DEFAULT_FREE_ENTITLEMENTS;
  }
}
