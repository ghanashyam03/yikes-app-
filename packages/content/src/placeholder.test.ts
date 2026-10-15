import { describe, expect, it } from 'vitest';
import { CONTENT_SKELETON } from './placeholder.js';

describe('content skeleton', () => {
  it('is defined', () => {
    expect(CONTENT_SKELETON).toBe(true);
  });
});
