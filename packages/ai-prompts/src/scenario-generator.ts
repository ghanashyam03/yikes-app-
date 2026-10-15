import { z } from 'zod';
import { PersonaCardSchema } from './persona-card.js';
import type { ChatMessage, PlaybookSummary } from './types.js';
import { SCENARIO_GENERATOR_VERSION } from './versions.js';

export const ScenarioGeneratorSchema = z.object({
  title: z.string().min(1),
  setting: z.string().min(1),
  situation: z.string().min(1),
  userGoal: z.string().min(1),
  partnerPersona: PersonaCardSchema,
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'high-stakes']),
  openingLine: z.string().min(1),
});

export type GeneratedScenario = z.infer<typeof ScenarioGeneratorSchema>;

export interface ScenarioGeneratorInput {
  playbook: PlaybookSummary;
  targetSkill: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'high-stakes' | undefined;
  worldPreference?: string | undefined;
}

export function buildScenarioGeneratorPrompt(input: ScenarioGeneratorInput): ChatMessage[] {
  const { playbook, targetSkill, difficulty = 'intermediate', worldPreference } = input;

  const contextItems = [
    playbook.scenarioWorld ? `Playbook Scenario World: ${playbook.scenarioWorld}` : '',
    worldPreference ? `World Preference: ${worldPreference}` : '',
    playbook.hardestPlaces?.length ? `Hardest situations: ${playbook.hardestPlaces.join(', ')}` : '',
    playbook.communicationStyle ? `User style: ${playbook.communicationStyle}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const systemContent = `### ROLE
You are the Scenario Designer in yikes!, creating realistic, culturally grounded conversation scenarios tailored to the user's personal Playbook.

### CONTEXT
Target skill: "${targetSkill}"
Target difficulty: "${difficulty}"
${contextItems}

### RULES
1. Ground the scenario in the user's specific world (e.g. tech office, design studio, neighborhood, academic, remote).
2. STABLE REALISM: The partner character must have realistic motivations, clear boundaries, and authentic conversational habits.
3. EXCLUDED TOPICS: Strictly NEVER generate scenarios involving abuse, bereavement, confronting someone who harmed you, harassment reporting, or medical/health bad news.
4. Partner persona must include complete PersonaCard details: id, name, role, background, demeanor, speakingStyle, topicsEnjoyed, topicsAvoided, hiddenTendencies, fallbackLines, baseMood.
5. Opening line must be an authentic, natural start from the partner.
6. Output ONLY valid JSON matching the schema.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "title": string,
  "setting": string,
  "situation": string,
  "userGoal": string,
  "partnerPersona": {
    "id": string,
    "name": string,
    "role": string,
    "background": string,
    "demeanor": string,
    "speakingStyle": string,
    "topicsEnjoyed": string[],
    "topicsAvoided": string[],
    "hiddenTendencies": string[],
    "fallbackLines": string[],
    "baseMood": {
      "engagement": number, // 0.0 to 1.0
      "rapport": number,    // 0.0 to 1.0
      "patience": number,   // 0.0 to 1.0
      "exitPressure": number// 0.0 to 1.0
    }
  },
  "difficulty": "beginner" | "intermediate" | "advanced" | "high-stakes",
  "openingLine": string
}

### EXAMPLES
Example Output:
{
  "title": "Kitchen Island Check-in",
  "setting": "Office kitchen while waiting for the kettle to boil",
  "situation": "You ran into Sam, a senior product lead from another team whose project you reviewed yesterday.",
  "userGoal": "Start a low-pressure conversation and acknowledge their recent launch without feeling intrusive.",
  "partnerPersona": {
    "id": "sam-pm-lead",
    "name": "Sam",
    "role": "Lead Product Manager",
    "background": "Busy, thoughtful, values people who get to the point but appreciates genuine curiosity.",
    "demeanor": "Slightly preoccupied with morning notifications, but friendly when engaged.",
    "speakingStyle": "Brisk, warm, uses short sentences and occasional dry humor.",
    "topicsEnjoyed": ["user research findings", "coffee brewing", "cycling routes"],
    "topicsAvoided": ["office politics", "vague budget gossip"],
    "hiddenTendencies": ["tends to check smart watch if a conversation drifts without a clear point"],
    "fallbackLines": ["Sorry, lost my train of thought for a sec. What did you think of the demo?", "Yeah, it's been quite a week."],
    "baseMood": {
      "engagement": 0.5,
      "rapport": 0.4,
      "patience": 0.7,
      "exitPressure": 0.4
    }
  },
  "difficulty": "intermediate",
  "openingLine": "Hey there. Just waiting for this kettle to finally boil—how's your morning going?"
}`;

  const userContent = `Generate a personalized scenario practicing "${targetSkill}" at "${difficulty}" difficulty. Return JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const SCENARIO_GENERATOR_PROMPT_VERSION = SCENARIO_GENERATOR_VERSION;
