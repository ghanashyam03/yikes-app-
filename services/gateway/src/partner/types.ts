import { z } from 'zod';
import { PersonaCardSchema } from '@yikes/ai-prompts/persona-card';
import type { MoodState, PlaybookSummary, ScenarioInfo } from '@yikes/ai-prompts/types';

export class CapReachedError extends Error {
  readonly code = 'CAP_REACHED';
  readonly statusCode = 429;
  constructor(message = 'Daily turn limit reached') {
    super(message);
    this.name = 'CapReachedError';
  }
}

export const MoodSchema = z.object({
  engagement: z.number().min(0).max(1),
  rapport: z.number().min(0).max(1),
  patience: z.number().min(0).max(1),
  exitPressure: z.number().min(0).max(1),
});

export const PartnerModeSchema = z.enum(['try', 'warmup', 'free', 'rehearsal']);
export type PartnerMode = z.infer<typeof PartnerModeSchema>;

export const ScenarioInfoSchema = z.object({
  title: z.string().min(1),
  setting: z.string().min(1),
  userGoal: z.string().min(1),
  partnerGoal: z.string().optional(),
  background: z.string().optional(),
  difficulty: z.union([z.string(), z.number()]).optional(),
});

export const PlaybookSummarySchema = z.object({
  pace: z.string().optional(),
  batteryProfile: z.string().optional(),
  hardestPlaces: z.array(z.string()).optional(),
  firstSteps: z.array(z.string()).optional(),
  coachTone: z.enum(['gentle', 'straight', 'funny']).optional(),
  weeklyGoal: z.number().optional(),
  window: z.string().optional(),
  anchor: z.string().optional(),
  startDifficulty: z.union([z.string(), z.number()]).optional(),
  pathOrder: z.array(z.string()).optional(),
  scenarioWorld: z.string().optional(),
  communicationStyle: z.string().optional(),
});

export const PartnerStartRequestSchema = z.object({
  scenario: ScenarioInfoSchema,
  personaId: z.string().optional(),
  persona: PersonaCardSchema.optional(),
  mode: PartnerModeSchema.default('try'),
  sessionId: z.string().optional(),
  playbookSummary: PlaybookSummarySchema.optional(),
  openingText: z.string().optional(),
});
export type PartnerStartRequest = z.infer<typeof PartnerStartRequestSchema>;

export interface PartnerStartResponse {
  attemptId: string;
  openingTurn: {
    role: 'partner';
    text: string;
  };
  initialMood: MoodState;
  mode: PartnerMode;
  turnCap: number;
}

export const PartnerTurnRequestSchema = z.object({
  attemptId: z.string().min(1),
  userText: z.string().min(1),
  stream: z.boolean().optional().default(false),
});
export type PartnerTurnRequest = z.infer<typeof PartnerTurnRequestSchema>;

export interface PartnerTurnResponse {
  crisis?: boolean | undefined;
  reply?: string | undefined;
  mood?: MoodState | undefined;
  wantsToEnd?: boolean | undefined;
  cue?: number | undefined;
  degraded?: boolean | undefined;
  turnIdx?: number | undefined;
  turnsCount?: number | undefined;
}

export const PartnerSuggestRequestSchema = z.object({
  attemptId: z.string().min(1),
});
export type PartnerSuggestRequest = z.infer<typeof PartnerSuggestRequestSchema>;

export interface PartnerSuggestResponse {
  suggestions: string[];
}

export const PartnerHintRequestSchema = z.object({
  attemptId: z.string().min(1),
});
export type PartnerHintRequest = z.infer<typeof PartnerHintRequestSchema>;

export interface PartnerHintResponse {
  hint: string;
}

export const PartnerEndRequestSchema = z.object({
  attemptId: z.string().min(1),
  endedReason: z
    .enum(['user_finished', 'turn_cap', 'partner_ended', 'crisis', 'abandoned'])
    .optional()
    .default('user_finished'),
});
export type PartnerEndRequest = z.infer<typeof PartnerEndRequestSchema>;

export interface RevealedThought {
  turnIdx: number;
  role: string;
  thought: string;
}

export interface PartnerEndResponse {
  attemptId: string;
  endedAt: string;
  turnsCount: number;
  endedReason: string;
  thoughts: RevealedThought[];
}

export interface AttemptRecord {
  id: string;
  userId: string;
  sessionId?: string | null | undefined;
  personaId?: string | null | undefined;
  mode: PartnerMode;
  persona: import('@yikes/ai-prompts/persona-card').PersonaCard;
  scenario: ScenarioInfo;
  playbookSummary: PlaybookSummary;
  currentMood: MoodState;
  turnsCount: number;
  endedAt?: string | null | undefined;
  endedReason?: string | null | undefined;
  degraded?: boolean | undefined;
  createdAt: string;
}

export interface TurnRecord {
  id: string;
  attemptId: string;
  idx: number;
  role: 'user' | 'partner' | 'coach' | 'system';
  text: string;
  thought?: string | null | undefined;
  mood?: MoodState | null | undefined;
  createdAt: string;
}
