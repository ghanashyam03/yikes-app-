import { z } from 'zod';
import type { CoachFeedback } from '@yikes/ai-prompts/coach-feedback';
import type { SkillStage, CoachToneVariant } from '@yikes/ai-prompts/types';

export type { CoachToneVariant };

export const CoachFeedbackRequestSchema = z.object({
  attemptId: z.string().min(1),
  skillKey: z.string().optional(),
  toneVariant: z.enum(['gentle', 'straight', 'funny']).optional(),
});

export type CoachFeedbackRequest = z.infer<typeof CoachFeedbackRequestSchema>;

export interface SkillStageUpdateResult {
  skill: string;
  previousStage: SkillStage;
  newStage: SkillStage;
  changed: boolean;
  historyLength: number;
}

export interface CoachFeedbackResponse {
  id: string;
  attemptId: string;
  feedback: CoachFeedback;
  verified: boolean;
  model: string;
  promptVersion: string;
  stageUpdate?: SkillStageUpdateResult | undefined;
  createdAt: string;
}

export const RewindRequestSchema = z.object({
  attemptId: z.string().min(1),
  fromTurn: z.number().int().min(1),
});

export type RewindRequest = z.infer<typeof RewindRequestSchema>;

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

export const CompareRequestSchema = z.object({
  attemptId1: z.string().min(1),
  attemptId2: z.string().min(1),
});

export type CompareRequest = z.infer<typeof CompareRequestSchema>;

export interface ComparePathDifference {
  turnIdx: number;
  originalText: string;
  newPathText: string;
  takeaway: string;
}

export interface CompareResponse {
  attemptId1: string;
  attemptId2: string;
  summary: string;
  differences: ComparePathDifference[];
  partnerShift: string;
}

export const AiFeedbackRequestSchema = z.object({
  targetKind: z.string().min(1),
  targetId: z.string().min(1),
  rating: z.number().int(),
});

export type AiFeedbackRequest = z.infer<typeof AiFeedbackRequestSchema>;

export interface AiFeedbackResponse {
  success: boolean;
  id?: string | undefined;
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
