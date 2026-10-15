import { describe, expect, it } from 'vitest';
import { AI_PROMPTS_SKELETON } from './placeholder.js';

describe('ai-prompts skeleton', () => {
  it('is defined', () => {
    expect(AI_PROMPTS_SKELETON).toBe(true);
  });
});
