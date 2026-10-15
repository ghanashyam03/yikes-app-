import { z } from 'zod';
import type { ChatMessage } from './types.js';
import { READ_SCENE_VERSION } from './versions.js';

export const ReadSceneLineSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
});

export const ReadSceneSchema = z.object({
  scene: z.string().min(1),
  dialogue: z.array(ReadSceneLineSchema).min(2),
  candidateThoughts: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
  trueIndex: z.number().int().min(0).max(2),
  cueNote: z.string().min(1),
});

export type ReadScene = z.infer<typeof ReadSceneSchema>;

export interface ReadSceneInput {
  skill: string;
  partnerName: string;
  setting: string;
}

export function buildReadScenePrompt(input: ReadSceneInput): ChatMessage[] {
  const { skill, partnerName, setting } = input;

  const systemContent = `### ROLE
You are the Read Exercise Author in yikes!, building a 60-second scenario where the user practices reading subtle conversational cues and guessing what a character is privately thinking.

### CONTEXT
Target skill: "${skill}"
Partner character: ${partnerName}
Setting: ${setting}

### RULES
1. Provide a brief setting description ("scene").
2. Provide a 2-to-4 line dialogue exchange ending on a turn by ${partnerName}.
3. Provide EXACTLY THREE candidate private thoughts that ${partnerName} might be having:
   - One is the true thought (realistic, grounded in the scene).
   - Two are plausible alternatives (one overly anxious/catastrophizing, one overly eager/misread).
4. "trueIndex" must be the 0-based index (0, 1, or 2) of the true thought in the candidateThoughts array.
5. "cueNote" must describe the visible/audible cue (e.g., tone of voice, brief pause, posture shift) that helps distinguish the true thought.
6. HONESTY: Remember that different people give different signals; the exercise reveals what THIS character was written to think, not a universal rule.
7. Output ONLY valid JSON matching the schema.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "scene": string,
  "dialogue": [
    {
      "speaker": string,
      "text": string
    }
  ],
  "candidateThoughts": [
    string, // option 0
    string, // option 1
    string  // option 2
  ],
  "trueIndex": number, // 0, 1, or 2
  "cueNote": string
}

### EXAMPLES
Example Output:
{
  "scene": "Hallway outside meeting room B after a client presentation",
  "dialogue": [
    {
      "speaker": "You",
      "text": "Did you think the pricing section made sense to them?"
    },
    {
      "speaker": "Maya",
      "text": "Yeah... mostly. They lingered on the onboarding timeline though."
    }
  ],
  "candidateThoughts": [
    "She thinks the entire presentation failed and blamed my slides.",
    "She's already thinking through how to adjust our sprint capacity for onboarding.",
    "She is completely unbothered and just wants to grab lunch."
  ],
  "trueIndex": 1,
  "cueNote": "Maya's hesitation before 'mostly' wasn't irritation—her eyes tracked up toward the timeline chart on her notepad."
}`;

  const userContent = `Create a Read scene for ${partnerName} in ${setting} highlighting "${skill}". Return JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const READ_SCENE_PROMPT_VERSION = READ_SCENE_VERSION;
