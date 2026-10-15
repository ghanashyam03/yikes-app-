export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type SkillStage = 'starting' | 'practicing' | 'growing' | 'natural';

export type CoachToneVariant = 'gentle' | 'straight' | 'funny';

export interface PlaybookSummary {
  pace?: string | undefined;
  batteryProfile?: string | undefined;
  hardestPlaces?: string[] | undefined;
  firstSteps?: string[] | undefined;
  coachTone?: CoachToneVariant | undefined;
  weeklyGoal?: number | undefined;
  window?: string | undefined;
  anchor?: string | undefined;
  startDifficulty?: number | string | undefined;
  pathOrder?: string[] | undefined;
  scenarioWorld?: string | undefined;
  communicationStyle?: string | undefined;
}

export interface TranscriptTurn {
  role: 'user' | 'partner';
  text: string;
  thought?: string | undefined;
}

export interface MoodState {
  engagement: number;
  rapport: number;
  patience: number;
  exitPressure: number;
}

export interface ScenarioInfo {
  title: string;
  setting: string;
  userGoal: string;
  partnerGoal?: string | undefined;
  background?: string | undefined;
  difficulty?: string | number | undefined;
}

export interface SkillRubric {
  skill: string;
  description: string;
  targetBehaviors: string[];
  stageRubrics?: Record<SkillStage, string> | undefined;
}
