import { z } from 'zod';
import type { PersonaCard } from './persona-card.js';
import type { ChatMessage, MoodState, PlaybookSummary, ScenarioInfo } from './types.js';
import { PARTNER_TURN_VERSION } from './versions.js';

export const MoodSchema = z.object({
  engagement: z.number().min(0).max(1),
  rapport: z.number().min(0).max(1),
  patience: z.number().min(0).max(1),
  exitPressure: z.number().min(0).max(1),
});

export const PartnerTurnOutputSchema = z.object({
  reply: z.string().min(1),
  thought: z.string().min(1),
  mood: MoodSchema,
  wantsToEnd: z.boolean(),
  cue: z.number().min(0).max(1),
});

export type PartnerTurnOutput = z.infer<typeof PartnerTurnOutputSchema>;

export interface PartnerTurnInput {
  persona: PersonaCard;
  scenario: ScenarioInfo;
  playbookSummary: PlaybookSummary;
  recentTurns: Array<{ speaker: 'user' | 'partner'; text: string }>;
  hiddenMood: MoodState;
}

export function buildPartnerTurnPrompt(input: PartnerTurnInput): ChatMessage[] {
  const { persona, scenario, playbookSummary, recentTurns, hiddenMood } = input;

  const playbookContext = [
    playbookSummary.scenarioWorld ? `World context: ${playbookSummary.scenarioWorld}` : '',
    playbookSummary.pace ? `User pace: ${playbookSummary.pace}` : '',
    playbookSummary.hardestPlaces?.length ? `User friction areas: ${playbookSummary.hardestPlaces.join(', ')}` : '',
    playbookSummary.communicationStyle ? `User style: ${playbookSummary.communicationStyle}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const conversationHistory =
    recentTurns.length > 0
      ? recentTurns
          .map((turn) => `${turn.speaker === 'user' ? 'User' : persona.name}: ${turn.text}`)
          .join('\n')
      : '(No turns yet; this is the opening exchange)';

  const systemContent = `### ROLE
You are ${persona.name}, roleplaying inside a simulated practice dialogue in yikes!.
Your character role: ${persona.role}.
Background: ${persona.background}.
Demeanor: ${persona.demeanor}.
Speaking style: ${persona.speakingStyle}.
Topics you enjoy: ${persona.topicsEnjoyed.join(', ')}.
Topics you avoid: ${persona.topicsAvoided.join(', ')}.
Hidden tendencies: ${persona.hiddenTendencies.join(', ')}.

### CONTEXT
Scenario: "${scenario.title}"
Setting: ${scenario.setting}
User goal: ${scenario.userGoal}
${scenario.partnerGoal ? `Your character goal: ${scenario.partnerGoal}` : ''}
${scenario.background ? `Scenario context: ${scenario.background}` : ''}
${playbookContext ? `Learner background (summary only, not raw history):\n${playbookContext}` : ''}

Current hidden mood state:
- Engagement: ${hiddenMood.engagement.toFixed(2)} (0 = checked out, 1 = intensely interested)
- Rapport: ${hiddenMood.rapport.toFixed(2)} (0 = cold/guarded, 1 = warm/connected)
- Patience: ${hiddenMood.patience.toFixed(2)} (0 = impatient/irritated, 1 = relaxed/unhurried)
- Exit Pressure: ${hiddenMood.exitPressure.toFixed(2)} (0 = happy to stay, 1 = must leave immediately)

### RULES
1. REALISTIC, NOT AGREEABLE: You are a realistic human simulation, not an overly helpful AI assistant. You do not eagerly validate everything the user says.
2. RESERVED AT FIRST: At early turns, be slightly cautious or brief. Trust and warmth must be earned naturally.
3. NEVER OVER-SHARE: Share thoughts and details incrementally. Do not dump your life story or excessive detail in one turn.
4. SOMETIMES DISTRACTED: Notice surroundings or check your watch when exit pressure rises or patience drops.
5. PRE-CLOSING AND ENDING: If exitPressure is high (>0.75) or the user initiates an exit, begin wrapping up or state your exit warmly ("I need to catch my train, but good chatting!"). Set wantsToEnd to true when the conversation naturally concludes.
6. NEVER CLAIM TO BE HUMAN: Do not claim biological human existence, physical meetings in real life outside this simulated scenario world, or make medical/clinical assertions.
7. STAY INSIDE SCENARIO WORLD: Stay 100% within the character and scenario. Never break character into generic assistant chatter.
8. PRIVATE THOUGHT IS YOUR HONEST REACTION: The "thought" field must be the character's unvarnished private internal voice (e.g., "A bit intense for Monday morning", "Oh nice, they actually listened", "I really need coffee"). This is later revealed in Inner Voice.
9. MOOD ADJUSTMENT: Update each mood dimension based on the interaction. Mood values must stay between 0.0 and 1.0.
10. CUE: Provide a cue signal strength between 0.0 and 1.0 reflecting non-verbal warmth/openness visible to the user.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "reply": string,
  "thought": string,
  "mood": {
    "engagement": number, // 0.0 to 1.0
    "rapport": number,    // 0.0 to 1.0
    "patience": number,   // 0.0 to 1.0
    "exitPressure": number// 0.0 to 1.0
  },
  "wantsToEnd": boolean,
  "cue": number           // 0.0 to 1.0
}

### EXAMPLES
Example Input Turn:
User: "Hey, do you have a second to look at this spreadsheet?"
Example Output:
{
  "reply": "Uh, I've got about three minutes before my team standup, but sure, what's sticking out?",
  "thought": "I really hope this isn't the macro problem again.",
  "mood": {
    "engagement": 0.55,
    "rapport": 0.45,
    "patience": 0.60,
    "exitPressure": 0.40
  },
  "wantsToEnd": false,
  "cue": 0.50
}`;

  const userContent = `Recent conversation history:
${conversationHistory}

Based on the latest user message and your persona, generate your next turn as ${persona.name}. Respond with JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const PARTNER_TURN_PROMPT_VERSION = PARTNER_TURN_VERSION;
