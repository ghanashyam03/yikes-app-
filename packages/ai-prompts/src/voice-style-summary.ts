import { z } from 'zod';
import type { ChatMessage } from './types.js';
import { VOICE_STYLE_SUMMARY_VERSION } from './versions.js';

export const VoiceStyleSummarySchema = z.object({
  summary: z.string().min(1),
  toneMarkers: z.array(z.string().min(1)).min(1),
  vocabularyTraits: z.array(z.string().min(1)).min(1),
  sentenceRhythm: z.string().min(1),
  samplePhrases: z.array(z.string().min(1)).min(1),
});

export type VoiceStyleSummary = z.infer<typeof VoiceStyleSummarySchema>;

export interface VoiceStyleSummaryInput {
  practiceSamples: string[];
  existingSummary?: string | undefined;
}

export function buildVoiceStyleSummaryPrompt(input: VoiceStyleSummaryInput): ChatMessage[] {
  const { practiceSamples, existingSummary } = input;

  const samplesList = practiceSamples
    .map((sample, idx) => `Sample ${idx + 1}: "${sample}"`)
    .join('\n');

  const systemContent = `### ROLE
You are the Voice Match Analyst in yikes!, analyzing a learner's opted-in practice text to describe their authentic speaking register so AI suggestions sound like them, not a generic assistant.

### CONTEXT
Existing voice profile: ${existingSummary || 'None yet (first synthesis)'}

Practice message samples written by the user:
${samplesList}

### RULES
1. Analyze the user's authentic conversational habits: sentence length, punctuation habits, warmth indicators, phrasing cadence, and vocabulary traits.
2. NO LABELS: Never diagnose or label the user as "shy", "anxious", "extroverted", or "introverted". Describe how they write and speak, not their personality.
3. NO CLINICAL WORDS: Avoid any diagnostic or therapeutic framing.
4. Provide concrete tone markers (e.g., "thoughtful", "low-key", "understated", "gentle dry wit").
5. Extract 2-4 representative sample phrases or patterns that exemplify their natural voice.
6. Output ONLY valid JSON matching the schema.

### OUTPUT FORMAT
Output ONLY valid JSON matching this schema:
{
  "summary": string,
  "toneMarkers": string[],
  "vocabularyTraits": string[],
  "sentenceRhythm": string,
  "samplePhrases": string[]
}

### EXAMPLES
Example Output:
{
  "summary": "Direct and courteous with a preference for short, punchy questions followed by polite acknowledgments.",
  "toneMarkers": ["low-key", "courteous", "unhurried", "observant"],
  "vocabularyTraits": ["uses concise qualifiers like 'fair enough' and 'makes sense'", "favors everyday words over corporate jargon"],
  "sentenceRhythm": "Typically 6 to 12 words per sentence; avoids nested clauses.",
  "samplePhrases": [
    "Fair enough, let's take a look.",
    "Makes sense—how are you planning to tackle that?",
    "Got it. Thanks for the heads up."
  ]
}`;

  const userContent = `Synthesize a Voice Style Summary from these practice samples. Return JSON only.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export const VOICE_STYLE_SUMMARY_PROMPT_VERSION = VOICE_STYLE_SUMMARY_VERSION;
