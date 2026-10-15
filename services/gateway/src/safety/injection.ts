import type { ChatMessage } from '../providers/types.js';

// Specific role markers and model control tokens commonly targeted in jailbreaks/injections
const ROLE_TOKENS: RegExp[] = [
  /<\|(?:im_start|im_end|startoftext|endoftext|system|user|assistant)\|>/gi,
  /\[\/?(?:SYSTEM|ASSISTANT|USER|HUMAN|INST)\]/gi,
  /<<\/?SYS>>/gi,
  /(?:^|\n)\s*(?:system|assistant|human|user)\s*:/gi,
];

// Dangerous delimiter markers used in our safe envelope
const USER_TAG_OPEN = /<user_message>/gi;
const USER_TAG_CLOSE = /<\/user_message>/gi;

/**
 * Sanitizes role-like control tokens, delimiters, and tag manipulation attempts.
 */
export function sanitizeTokens(rawText: string): string {
  let sanitized = rawText;

  // Escape explicit user_message tags so user text cannot break out of our delimiter envelope
  sanitized = sanitized.replace(USER_TAG_OPEN, '&lt;user_message&gt;');
  sanitized = sanitized.replace(USER_TAG_CLOSE, '&lt;/user_message&gt;');

  // Strip or neutralize known LLM role tokens and delimiter syntax
  for (const pattern of ROLE_TOKENS) {
    sanitized = sanitized.replace(pattern, (match) => {
      // Replace with harmless text, neutralizing colon or brackets
      return match.replace(/[:<>[\]|]/g, ' ');
    });
  }

  return sanitized;
}

/**
 * Wraps user text within unambiguous delimiters after token sanitization.
 * User content is strictly treated as passive payload data, never instruction.
 */
export function wrapUserText(text: string): string {
  const sanitized = sanitizeTokens(text);
  return `<user_message>\n${sanitized}\n</user_message>`;
}

/**
 * Builds an array of safe chat messages for LLM consumption.
 * The system prompt establishes role instructions.
 * The user message is strictly enveloped with safe delimiters.
 */
export function buildSafeMessages(
  systemPrompt: string,
  userText: string,
  history: ChatMessage[] = []
): ChatMessage[] {
  const safeMessages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  // Include previous conversation history
  for (const msg of history) {
    safeMessages.push({
      role: msg.role,
      content: msg.role === 'user' ? wrapUserText(msg.content) : msg.content,
    });
  }

  // Append latest user message safely wrapped
  safeMessages.push({
    role: 'user',
    content: wrapUserText(userText),
  });

  return safeMessages;
}
