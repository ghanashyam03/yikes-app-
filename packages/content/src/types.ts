import { z } from 'zod';

export const SKILL_KEYS = [
  'starting_chat',
  'asking_followups',
  'acknowledging',
  'pacing_sharing',
  'reading_engagement',
  'keeping_balance',
  'handling_silence',
  'graceful_exits',
  'bridging_small_talk',
  'groups',
  'polite_disagreement',
  'following_up',
] as const;

export const SkillKeySchema = z.enum(SKILL_KEYS);
export type SkillKey = z.infer<typeof SkillKeySchema>;

export const LEVEL_KEYS = [
  'friendly_one_to_one',
  'colleague',
  'senior_busy',
  'groups',
  'high_stakes',
] as const;

export const SituationLevelKeySchema = z.enum(LEVEL_KEYS);
export type SituationLevelKey = z.infer<typeof SituationLevelKeySchema>;

export const ARCHETYPES = [
  'warm talker',
  'brisk professional',
  'the quiet one',
  'distracted senior',
  'enthusiastic newcomer',
  'sceptical colleague',
] as const;

export const ArchetypeSchema = z.enum(ARCHETYPES);
export type Archetype = z.infer<typeof ArchetypeSchema>;

export const SkillSchema = z.object({
  key: SkillKeySchema,
  name: z.string().min(1),
  description: z.string().min(1),
  coachRubric: z.object({
    worked: z.string().min(1),
    notYet: z.string().min(1),
  }),
});
export type Skill = z.infer<typeof SkillSchema>;

export const SituationLevelSchema = z.object({
  level: SituationLevelKeySchema,
  name: z.string().min(1),
  description: z.string().min(1),
});
export type SituationLevel = z.infer<typeof SituationLevelSchema>;

export const PersonaCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  background: z.string().min(1),
  demeanor: z.string().min(1),
  speakingStyle: z.string().min(1),
  topicsEnjoyed: z.array(z.string().min(1)),
  topicsAvoided: z.array(z.string().min(1)),
  hiddenTendencies: z.array(z.string().min(1)),
  fallbackLines: z.array(z.string().min(1)).min(12),
  baseMood: z
    .object({
      engagement: z.number().min(0).max(1),
      rapport: z.number().min(0).max(1),
      patience: z.number().min(0).max(1),
      exitPressure: z.number().min(0).max(1),
    })
    .optional(),
});
export type PersonaCard = z.infer<typeof PersonaCardSchema>;

export const PersonaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  archetype: ArchetypeSchema,
  card: PersonaCardSchema,
  palette: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  fallbackLines: z.array(z.string().min(1)).min(12),
});
export type Persona = z.infer<typeof PersonaSchema>;

export const SessionIdeaSchema = z.object({
  rule: z.string().min(1),
  example: z.array(
    z.object({
      speaker: z.string().min(1),
      text: z.string().min(1),
    })
  ).min(2),
  whyWorks: z.string().min(1),
});
export type SessionIdea = z.infer<typeof SessionIdeaSchema>;

export const SessionWatchSchema = z.object({
  title: z.string().min(1),
  dialogue: z.array(
    z.object({
      speaker: z.string().min(1),
      text: z.string().min(1),
      demonstratesSkill: z.boolean().optional(),
    })
  ).min(3),
  targetLineIndex: z.number().int().min(0),
  explanation: z.string().min(1),
});
export type SessionWatch = z.infer<typeof SessionWatchSchema>;

export const SessionReadSchema = z.object({
  scene: z.string().min(1),
  dialogue: z.array(
    z.object({
      speaker: z.string().min(1),
      text: z.string().min(1),
    })
  ).min(2),
  candidateThoughts: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
  trueIndex: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  cueNote: z.string().min(1),
});
export type SessionRead = z.infer<typeof SessionReadSchema>;

export const SessionTrySchema = z.object({
  personaId: z.string().min(1),
  scenarioBrief: z.string().min(1),
  hiddenMoodStart: z.object({
    engagement: z.number().min(0).max(1),
    rapport: z.number().min(0).max(1),
    patience: z.number().min(0).max(1),
    exitPressure: z.number().min(0).max(1),
  }),
  turnLimit: z.number().int().min(3).max(8),
});
export type SessionTry = z.infer<typeof SessionTrySchema>;

export const SessionCoachRubricSchema = z.object({
  worked: z.string().min(1),
  notYet: z.string().min(1),
  sampleChats: z.array(
    z.object({
      chat: z.array(
        z.object({
          speaker: z.string().min(1),
          text: z.string().min(1),
        })
      ),
      expectedFeedback: z.string().min(1),
    })
  ).min(2),
});
export type SessionCoachRubric = z.infer<typeof SessionCoachRubricSchema>;

export const SessionOutThereSchema = z.tuple([
  z.string().min(1),
  z.string().min(1),
  z.string().min(1),
]);
export type SessionOutThere = z.infer<typeof SessionOutThereSchema>;

export const SessionRecordSchema = z.object({
  id: z.string().min(1),
  unit: z.union([z.literal(1), z.literal(2)]),
  sessionNumber: z.number().int().min(1).max(16),
  title: z.string().min(1),
  skill: SkillKeySchema,
  level: SituationLevelKeySchema,
  idea: SessionIdeaSchema,
  watch: SessionWatchSchema,
  read: SessionReadSchema,
  try: SessionTrySchema,
  coachRubric: SessionCoachRubricSchema,
  outThere: SessionOutThereSchema,
});
export type SessionRecord = z.infer<typeof SessionRecordSchema>;

export const SESSION_BEATS = [
  'idea',
  'watch',
  'read',
  'try',
  'coach',
  'out_there',
  'complete',
] as const;

export const SessionBeatSchema = z.enum(SESSION_BEATS);
export type SessionBeat = z.infer<typeof SessionBeatSchema>;

export const SessionStatusSchema = z.enum(['in_progress', 'paused', 'completed']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const SessionMachineStateSchema = z.object({
  sessionId: z.string().min(1),
  currentBeat: SessionBeatSchema,
  status: SessionStatusSchema,
  history: z.array(SessionBeatSchema),
  startedAt: z.string().min(1),
  updatedAt: z.string().min(1),
  stepData: z.record(z.unknown()).optional(),
});
export type SessionMachineState = z.infer<typeof SessionMachineStateSchema>;
