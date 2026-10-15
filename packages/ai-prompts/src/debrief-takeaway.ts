import { z } from 'zod';
import type { ChatMessage, PlaybookSummary } from './types.js';
import { DEBRIEF_TAKEAWAY_VERSION } from './versions.js';

export const DebriefTakeawaySchema = z.object({
  takeaway: z.string().min(1),
  coreEssence: z.string().min(1),
  oneNextFocus: z.string().min(1),
});

export type DebriefTakeaway = z.infer<typeof DebriefTakeawaySchema>;

export interface DebriefTakeawayInput {
  moment: {
    title: string;
    description: string;
  };
  qaPairs: Array<{ question: string; answer: string }>;
  playbook: PlaybookSummary;
}

export function buildDebriefTakeawayPrompt(input: DebriefTakeawayInput): ChatMessage[] {
  const { moment, qaPairs, playbook } = input;

  const answersFormatted = qaPairs
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  const systemContent = `### ROLE
You are the Debrief Synthesizer in yikes!, turning reflection answers into a concise, grounded takeaway card.

### CONTEXT
Event: "${moment.title}"
Context: ${moment.description}
${playbook.communicationStyle ? `User style: ${playbook.communicationStyle}` : ''}

User Debrief Answers:
${answersFormatted}

### RULES
1. Summarize the user's reflection into an honest takeaway.
2. Provide a "coreEssence": a short, punchy 1-sentence editable takeaway that captures what the user actually learned (e.g., "Pauses felt long to me, but Alex didn't rush away").
3. Provide "oneNextFocus": one realistic micro-step for the next similar event.
4. Keep the wording grounded in the user's own thoughts; no generic platitudes.
5. Avoid clinical labels (never diagnose or call anyone shy/anxious).
6. Output ONLY valid JSON matching the schema.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "takeaway": string,
  "coreEssence": string,
  "oneNextFocus": string
}

### EXAMPLES
Example Reflection:
Q: How did it go?
A: I was nervous before the coffee chat, but asking about their dog broke the ice and they talked for 10 minutes.
Example Output:
{
  "takeaway": "You found an easy shared hook early on, which took the pressure off carrying the entire conversation alone.",
  "coreEssence": "A simple curiosity question about their life did the heavy lifting.",
  "oneNextFocus": "Next time, let their answer lead to one natural follow-up before checking your watch."
}`;

  const userContent = `Synthesize a takeaway card from the user's debrief. Return JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const DEBRIEF_TAKEAWAY_PROMPT_VERSION = DEBRIEF_TAKEAWAY_VERSION;
