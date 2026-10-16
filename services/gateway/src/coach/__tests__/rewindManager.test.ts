import { describe, expect, it, beforeEach } from 'vitest';
import {
  branchAttemptAtTurn,
  clearInMemoryRewindStore,
  seedInMemoryAttempt,
} from '../rewindManager.js';
import type { RewoundTurn } from '../types.js';

describe('T-13 Acceptance Check 4: Rewind Branching & Turn Filtering', () => {
  beforeEach(() => {
    clearInMemoryRewindStore();
  });

  it('proves the branched attempt keeps exactly the turns before fromTurn', async () => {
    const parentAttemptId = 'att_original_123';
    const userId = 'usr_tester_abc';

    const turns: RewoundTurn[] = [
      { id: 't0', idx: 0, role: 'partner', text: 'Opening turn from Maya' },
      { id: 't1', idx: 1, role: 'user', text: 'Hello Maya, do you have five minutes?' },
      { id: 't2', idx: 2, role: 'partner', text: 'Sure, what is up?' },
      { id: 't3', idx: 3, role: 'user', text: 'I wanted to ask about the launch delay.' },
      { id: 't4', idx: 4, role: 'partner', text: 'Oh, that is still in review.' },
      { id: 't5', idx: 5, role: 'user', text: 'Got it, let us revisit tomorrow.' },
    ];

    seedInMemoryAttempt(
      {
        id: parentAttemptId,
        userId,
        mode: 'try',
        state: { personaId: 'maya' },
        turnsCount: turns.length,
        createdAt: new Date().toISOString(),
      },
      turns
    );

    // Rewind from turn index 3 (branch point at user's second message)
    // Should keep turns 0, 1, 2 (strictly idx < 3)
    const result = await branchAttemptAtTurn(null, userId, parentAttemptId, 3);

    expect(result.newAttemptId).toBeDefined();
    expect(result.newAttemptId).not.toBe(parentAttemptId);
    expect(result.parentAttemptId).toBe(parentAttemptId);

    // Kept turns should be exactly length 3: idx 0, 1, 2
    expect(result.turns).toHaveLength(3);
    expect(result.turns.map((t) => t.idx)).toEqual([0, 1, 2]);

    // Check texts match original
    expect(result.turns[0]!.text).toBe('Opening turn from Maya');
    expect(result.turns[1]!.text).toBe('Hello Maya, do you have five minutes?');
    expect(result.turns[2]!.text).toBe('Sure, what is up?');

    // Ensure turns 3, 4, 5 are NOT present in the branch
    const hasTurn3OrLater = result.turns.some((t) => t.idx >= 3);
    expect(hasTurn3OrLater).toBe(false);
  });

  it('proves rewinding to turn 1 keeps only opening turn 0', async () => {
    const parentAttemptId = 'att_early_rewind';
    const userId = 'usr_early';

    const turns: RewoundTurn[] = [
      { id: 't0', idx: 0, role: 'partner', text: 'Opening turn' },
      { id: 't1', idx: 1, role: 'user', text: 'First user line' },
    ];

    seedInMemoryAttempt(
      {
        id: parentAttemptId,
        userId,
        mode: 'try',
        state: {},
        turnsCount: turns.length,
        createdAt: new Date().toISOString(),
      },
      turns
    );

    const result = await branchAttemptAtTurn(null, userId, parentAttemptId, 1);
    expect(result.turns).toHaveLength(1);
    expect(result.turns[0]!.idx).toBe(0);
    expect(result.turns[0]!.role).toBe('partner');
  });
});
