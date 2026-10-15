import { z } from 'zod';
import type { ChatMessage, PlaybookSummary } from './types.js';
import { WEEKLY_LETTER_VERSION } from './versions.js';

export const WeeklyLetterSchema = z.object({
  letter: z.string().min(1).refine(
    (text) => text.trim().split(/\s+/).filter(Boolean).length <= 150,
    {
      message: 'Weekly letter must be 150 words or fewer',
    }
  ),
  wordCount: z.number().int().positive().max(150),
  patternNoticed: z.string().min(1),
  nextFocus: z.string().min(1),
});

export type WeeklyLetter = z.infer<typeof WeeklyLetterSchema>;

export interface WeeklyLetterInput {
  userName?: string | undefined;
  weekSummary: {
    sessionsCompleted: number;
    momentsLogged: number;
    skillsPracticed: string[];
    keyObservations: string[];
  };
  playbook: PlaybookSummary;
}

export function buildWeeklyLetterPrompt(input: WeeklyLetterInput): ChatMessage[] {
  const { userName, weekSummary, playbook } = input;

  const systemContent = `### ROLE
You are the author of the Sunday Weekly Letter in yikes!, writing a calm, personal note to celebrate quiet progress.

### CONTEXT
User: ${userName || 'Friend'}
Sessions completed this week: ${weekSummary.sessionsCompleted}
Moments logged: ${weekSummary.momentsLogged}
Skills practiced: ${weekSummary.skillsPracticed.join(', ') || 'General conversation'}
Observations from the week: ${weekSummary.keyObservations.join('; ') || 'Regular practice rhythm'}

Learner context:
${playbook.communicationStyle ? `Voice/Tone: ${playbook.communicationStyle}` : ''}
${playbook.scenarioWorld ? `World: ${playbook.scenarioWorld}` : ''}

### RULES
1. The letter must be 150 words or fewer (strictly enforced).
2. Cover: what changed this week, one subtle pattern noticed, and one gentle focus for the coming week.
3. NEVER use guilt, countdowns, streaks, or urgency ("you missed", "don't break your streak", "hurry").
4. Tone is that of a thoughtful, observant friend: warm, dry, grounded.
5. No labels (never call anyone shy, introverted, anxious).
6. No medical/clinical terms.
7. Output ONLY valid JSON matching the schema.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "letter": string,        // 150 words or fewer
  "wordCount": number,     // actual word count
  "patternNoticed": string,// 1 sentence
  "nextFocus": string      // 1 gentle focus
}

### EXAMPLES
Example Output:
{
  "letter": "You logged three sessions this week, and the biggest shift was how you handled exits. In your second practice, you didn't linger awkwardly after the topic wrapped up—you named your next stop and stepped away cleanly. The other person smiled and matched your pace. Pauses still feel long in the moment, but nobody else is timing them. Next week, keep that same breezy exit in your pocket when Friday afternoon meetings wind down.",
  "wordCount": 75,
  "patternNoticed": "You initiate exits with clearer intent once the primary question has been addressed.",
  "nextFocus": "Try using your clean exit line in one real-world end-of-meeting moment."
}`;

  const userContent = `Write this week's personal letter based on the week's practice. Return JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const WEEKLY_LETTER_PROMPT_VERSION = WEEKLY_LETTER_VERSION;
