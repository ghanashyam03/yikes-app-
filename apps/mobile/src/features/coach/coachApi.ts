export interface WorkedItem {
  quote: string;
  why: string;
}

export interface PivotItem {
  quote: string;
  whatHappened: string;
  rewrite: string;
}

export interface SkillVote {
  skill: string;
  stage: 'starting' | 'practicing' | 'growing' | 'natural';
  reason: string;
}

export interface CoachFeedbackPayload {
  intro: string;
  worked: WorkedItem[];
  pivot: PivotItem | null;
  tryNext: string;
  skillVotes: SkillVote[];
  partnerArc: string;
}

export interface SkillStageUpdate {
  skill: string;
  previousStage: string;
  newStage: string;
  changed: boolean;
  historyLength: number;
}

export interface CoachFeedbackResponse {
  id: string;
  attemptId: string;
  feedback: CoachFeedbackPayload;
  verified: boolean;
  model: string;
  promptVersion: string;
  stageUpdate?: SkillStageUpdate | undefined;
  createdAt: string;
}

export interface ThoughtItem {
  turnIndex: number;
  role: string;
  thought: string;
}

export interface ThoughtsResponse {
  attemptId: string;
  thoughts: ThoughtItem[];
}

export interface RewoundTurn {
  id: string;
  idx: number;
  role: 'user' | 'partner' | 'coach' | 'system';
  text: string;
  thought?: string | undefined;
  mood?: unknown | undefined;
}

export interface RewindResponse {
  newAttemptId: string;
  parentAttemptId: string;
  turns: RewoundTurn[];
}

export interface CompareResponse {
  attemptId1: string;
  attemptId2: string;
  summary: string;
  differences: Array<{
    turnIdx: number;
    originalText: string;
    newPathText: string;
    takeaway: string;
  }>;
  partnerShift: string;
}

export function getGatewayUrl(): string {
  return process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
}

export class CoachApiError extends Error {
  readonly code?: string | undefined;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'CoachApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Fetch Coach feedback for a completed practice attempt.
 */
export async function fetchCoachFeedback(
  token: string | null | undefined,
  attemptId: string,
  skillKey?: string,
  toneVariant?: 'gentle' | 'straight' | 'funny'
): Promise<CoachFeedbackResponse> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/coach/feedback`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attemptId, skillKey, toneVariant }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new CoachApiError(
      errorBody.error || `Coach feedback failed with HTTP ${res.status}`,
      res.status,
      errorBody.code
    );
  }

  return (await res.json()) as CoachFeedbackResponse;
}

/**
 * Fetch revealed thoughts after an attempt has ended.
 * Returns 403 Forbidden if attempt is still active.
 */
export async function fetchAttemptThoughts(
  token: string | null | undefined,
  attemptId: string
): Promise<ThoughtsResponse> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/attempts/${attemptId}/thoughts`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new CoachApiError(
      errorBody.error || `Thoughts retrieval failed with HTTP ${res.status}`,
      res.status,
      errorBody.code
    );
  }

  return (await res.json()) as ThoughtsResponse;
}

/**
 * Rewind conversation to start a new branch attempt from fromTurn.
 */
export async function rewindAttempt(
  token: string | null | undefined,
  attemptId: string,
  fromTurn: number
): Promise<RewindResponse> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/partner/rewind`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attemptId, fromTurn }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new CoachApiError(
      errorBody.error || `Rewind failed with HTTP ${res.status}`,
      res.status,
      errorBody.code
    );
  }

  return (await res.json()) as RewindResponse;
}

/**
 * Compare two paths side by side after rewind and retry.
 */
export async function compareAttemptPaths(
  token: string | null | undefined,
  attemptId1: string,
  attemptId2: string
): Promise<CompareResponse> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/coach/compare`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attemptId1, attemptId2 }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new CoachApiError(
      errorBody.error || `Compare failed with HTTP ${res.status}`,
      res.status,
      errorBody.code
    );
  }

  return (await res.json()) as CompareResponse;
}

/**
 * Submit fairness thumbs rating (up: 1, down: -1) to ai_feedback table.
 */
export async function submitAiFeedback(
  token: string | null | undefined,
  targetKind: string,
  targetId: string,
  rating: number
): Promise<void> {
  const gatewayUrl = getGatewayUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${gatewayUrl}/v1/ai/feedback`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetKind, targetId, rating }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new CoachApiError(
      errorBody.error || `AI feedback failed with HTTP ${res.status}`,
      res.status,
      errorBody.code
    );
  }
}
