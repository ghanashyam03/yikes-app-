import { z } from 'zod';
import type { ChatMessage, PlaybookSummary } from './types.js';
import { WATCH_EXCHANGE_VERSION } from './versions.js';

export const WatchExchangeLineSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
  demonstratesSkill: z.boolean(),
});

export const WatchExchangeSchema = z.object({
  title: z.string().min(1),
  skillDemonstrated: z.string().min(1),
  dialogue: z.array(WatchExchangeLineSchema).min(3),
  targetLineIndex: z.number().int().min(0),
  explanation: z.string().min(1),
});

export type WatchExchange = z.infer<typeof WatchExchangeSchema>;

export interface WatchExchangeInput {
  skill: string;
  scenarioWorld?: string | undefined;
  playbook: PlaybookSummary;
}

export function buildWatchExchangePrompt(input: WatchExchangeInput): ChatMessage[] {
  const { skill, scenarioWorld, playbook } = input;

  const systemContent = `### ROLE
You are the Demonstration Writer in yikes!, building a 40-second modelled dialogue where a communication skill is demonstrated cleanly.

### CONTEXT
Target skill: "${skill}"
${scenarioWorld ? `World context: ${scenarioWorld}` : ''}
${playbook.scenarioWorld ? `Playbook world: ${playbook.scenarioWorld}` : ''}

### RULES
1. Write a short, crisp dialogue (3 to 5 lines total) between two characters.
2. In exactly ONE specific line, one speaker demonstrates the target skill clearly and effectively.
3. Mark "demonstratesSkill: true" on that line, and "targetLineIndex" must point to its 0-based index.
4. Keep all other lines natural and authentic.
5. Provide a brief explanation of why this specific line illustrates the skill in action.
6. Output ONLY valid JSON matching the schema.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "title": string,
  "skillDemonstrated": string,
  "dialogue": [
    {
      "speaker": string,
      "text": string,
      "demonstratesSkill": boolean
    }
  ],
  "targetLineIndex": number,
  "explanation": string
}

### EXAMPLES
Example Skill: "graceful exits"
Example Output:
{
  "title": "Leaving the coffee counter",
  "skillDemonstrated": "graceful exits",
  "dialogue": [
    {
      "speaker": "Elena",
      "text": "Yeah, the new deployment pipeline has been saving us at least two hours a week.",
      "demonstratesSkill": false
    },
    {
      "speaker": "Marcus",
      "text": "That's huge. Listen Elena, I've got to jump into my 2 o'clock standup, but let's grab coffee again next week.",
      "demonstratesSkill": true
    },
    {
      "speaker": "Elena",
      "text": "Definitely! Good luck with the standup.",
      "demonstratesSkill": false
    }
  ],
  "targetLineIndex": 1,
  "explanation": "Marcus acknowledged Elena's point, stated his reason for leaving with warmth, and bridged forward without lingering."
}`;

  const userContent = `Create a modelled Watch exchange demonstrating "${skill}". Return JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const WATCH_EXCHANGE_PROMPT_VERSION = WATCH_EXCHANGE_VERSION;
