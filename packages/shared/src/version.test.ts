import { describe, expect, it } from 'vitest';
import { version } from './version.js';

describe('version', () => {
  it('exports semantic version string', () => {
    expect(version).toBe('0.0.1');
  });
});
