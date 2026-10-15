export interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
  exportId: string;
}

export interface DeleteTextResponse {
  ok: boolean;
  deletedTurns: number;
  clearedDebriefs: number;
  clearedJournals: number;
  message: string;
}

export interface DeleteAccountResponse {
  ok: boolean;
  message: string;
}

export function getGatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
}

/**
 * Request full personal data export JSON from the gateway.
 * Returns download URL valid for 24 hours.
 */
export async function requestDataExport(token: string): Promise<ExportResponse> {
  const gatewayUrl = getGatewayUrl();
  const res = await fetch(`${gatewayUrl}/v1/privacy/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Export failed with status ${res.status}`);
  }

  return (await res.json()) as ExportResponse;
}

/**
 * Downloads the exported JSON file from the gateway.
 */
export async function fetchExportPayload(
  token: string,
  exportId: string
): Promise<Record<string, unknown>> {
  const gatewayUrl = getGatewayUrl();
  const res = await fetch(`${gatewayUrl}/v1/privacy/export/${exportId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Download failed with status ${res.status}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

/**
 * Deletes all dialogue turns and reflections, while preserving skills and progress.
 */
export async function requestDeleteText(token: string): Promise<DeleteTextResponse> {
  const gatewayUrl = getGatewayUrl();
  const res = await fetch(`${gatewayUrl}/v1/privacy/delete-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Text deletion failed with status ${res.status}`);
  }

  return (await res.json()) as DeleteTextResponse;
}

/**
 * Permanently deletes the user account using fresh OTP verification.
 */
export async function requestDeleteAccount(
  token: string,
  otpToken: string
): Promise<DeleteAccountResponse> {
  const gatewayUrl = getGatewayUrl();
  const res = await fetch(`${gatewayUrl}/v1/privacy/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otpToken }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Account deletion failed with status ${res.status}`);
  }

  return (await res.json()) as DeleteAccountResponse;
}

/**
 * Verifies whether user has active consent to use data for AI improvement.
 */
export async function checkCanUseImprovement(token: string): Promise<boolean> {
  const gatewayUrl = getGatewayUrl();
  const res = await fetch(`${gatewayUrl}/v1/privacy/can-use-improvement`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return false;
  }

  const data = await res.json().catch(() => ({ canUse: false }));
  return Boolean(data.canUse);
}
