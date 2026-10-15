import { z } from 'zod';
import type { ChatMessage, PlaybookSummary } from './types.js';
import { PREP_CARD_VERSION } from './versions.js';

export const PrepCardSchema = z.object({
  openers: z.array(z.string().min(1)).min(2),
  questions: z.tuple([z.string().min(1), z.string().min(1)]),
  exitLine: z.string().min(1),
  recoverySuggestion: z.string().min(1),
  quietBreakIdea: z.string().min(1),
});

export type PrepCard = z.infer<typeof PrepCardSchema>;

export interface PrepCardInput {
  moment: {
    title: string;
    context: string;
    formality?: string | undefined;
    audience?: string | undefined;
    concerns?: string | undefined;
  };
  playbook: PlaybookSummary;
}

export function buildPrepCardPrompt(input: PrepCardInput): ChatMessage[] {
  const { moment, playbook } = input;

  const systemContent = `### ROLE
You are the Prep companion in yikes!, helping a user prepare for an upcoming real-life conversation or event.

### CONTEXT
Event Details:
- Title: "${moment.title}"
- Situation: ${moment.context}
${moment.formality ? `- Formality: ${moment.formality}` : ''}
${moment.audience ? `- Audience/People: ${moment.audience}` : ''}
${moment.concerns ? `- Specific user worries: ${moment.concerns}` : ''}

User Playbook:
${playbook.communicationStyle ? `- Style: ${playbook.communicationStyle}` : ''}
${playbook.scenarioWorld ? `- Background: ${playbook.scenarioWorld}` : ''}

### RULES
1. Provide practical, low-pressure conversational moves that match the user's natural voice.
2. Provide at least two natural opener options (e.g. low-key, context-aware).
3. Provide EXACTLY two curious, open follow-up questions tailored to the event.
4. Provide one clean, graceful exit line that leaves warmth without awkwardness.
5. Provide one actionable recovery suggestion if the conversation stalls or feels awkward.
6. Provide one low-key quiet-break idea to recharge social battery during the event.
7. Avoid overly enthusiastic, aggressive, or robotic networking clichés.
8. Output ONLY valid JSON matching the schema.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "openers": [string, string],
  "questions": [string, string],
  "exitLine": string,
  "recoverySuggestion": string,
  "quietBreakIdea": string
}

### EXAMPLES
Example Event: "Team offsite lunch"
Example Output:
{
  "openers": [
    "Hey Alex, how are you finding the sessions so far today?",
    "Mind if I grab a seat here? That morning workshop had a lot to take in."
  ],
  "questions": [
    "What part of the roadmap are you most curious about?",
    "Have you worked with this team before, or is this your first offsite together?"
  ],
  "exitLine": "I'm going to grab a fresh glass of water before the keynote starts—great catching up!",
  "recoverySuggestion": "If a lull happens, take a slow sip of your drink; pauses are normal and don't need emergency filler.",
  "quietBreakIdea": "Step outside onto the terrace or step into the hallway for 3 minutes between talks to reset your battery."
}`;

  const userContent = `Build a pocket Prep card for this upcoming event: "${moment.title}". Return JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const PREP_CARD_PROMPT_VERSION = PREP_CARD_VERSION;
