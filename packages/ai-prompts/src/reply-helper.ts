import { z } from 'zod';
import type { ChatMessage, PlaybookSummary } from './types.js';
import { REPLY_HELPER_VERSION } from './versions.js';

export const ReplyHelperRepliesSchema = z.object({
  warm: z.string().min(1),
  direct: z.string().min(1),
  light: z.string().min(1),
});

export const ReplyHelperSchema = z.object({
  readings: z.tuple([z.string().min(1), z.string().min(1)]),
  disclaimer: z.literal("I can't know what they meant"),
  replies: ReplyHelperRepliesSchema,
});

export type ReplyHelperOutput = z.infer<typeof ReplyHelperSchema>;

export interface ReplyHelperInput {
  receivedMessage: string;
  context?: string | undefined;
  playbook: PlaybookSummary;
}

export function buildReplyHelperPrompt(input: ReplyHelperInput): ChatMessage[] {
  const { receivedMessage, context, playbook } = input;

  const systemContent = `### ROLE
You are Reply Helper in yikes!, helping a user interpret a potentially ambiguous message and draft natural replies in their own voice.

### CONTEXT
Message received by the user:
"${receivedMessage}"
${context ? `Context / Relationship: ${context}` : ''}
${playbook.communicationStyle ? `User speaking voice: ${playbook.communicationStyle}` : ''}
${playbook.scenarioWorld ? `User world context: ${playbook.scenarioWorld}` : ''}

### RULES
1. Offer exactly TWO different plausible interpretations ("readings") of what the sender might mean. One should be a benign, neutral/busy interpretation.
2. The disclaimer field MUST be verbatim: "I can't know what they meant" (this mandatory sentence acknowledges AI limitations).
3. Draft THREE reply options written in the user's authentic personal voice:
   - "warm": Kind, empathetic, approachable.
   - "direct": Clear, concise, getting straight to the point without fuss.
   - "light": Breezy, casual, low-stakes.
4. Keep replies natural and concise; avoid robotic formality or excessive exclamation marks.
5. No labels, no diagnosis, no mind-reading claims.
6. Output ONLY valid JSON matching the schema.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "readings": [
    string, // reading 1
    string  // reading 2
  ],
  "disclaimer": "I can't know what they meant",
  "replies": {
    "warm": string,
    "direct": string,
    "light": string
  }
}

### EXAMPLES
Example Received Message: "k"
Example Output:
{
  "readings": [
    "They were rushing between tasks or typing on the go and acknowledged receipt quickly.",
    "They didn't feel any further discussion was required on the item."
  ],
  "disclaimer": "I can't know what they meant",
  "replies": {
    "warm": "Sounds good! Hope your afternoon goes well.",
    "direct": "Great, I'll proceed with that plan.",
    "light": "All set then. Talk soon!"
  }
}`;

  const userContent = `Help me interpret this message and suggest 3 replies in my voice:
"${receivedMessage}"
Return JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const REPLY_HELPER_PROMPT_VERSION = REPLY_HELPER_VERSION;
