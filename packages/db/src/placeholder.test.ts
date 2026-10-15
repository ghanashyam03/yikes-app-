import { describe, expect, it } from 'vitest';
import { DB_SKELETON } from './placeholder.js';

describe('db skeleton', () => {
  it('is defined', () => {
    expect(DB_SKELETON).toBe(true);
  });
});
