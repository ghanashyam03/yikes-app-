import { describe, expect, it } from 'vitest';
import {
  createSessionMachine,
  deserializeSessionState,
  getNextBeat,
  getPreviousBeat,
  serializeSessionState,
  transitionSession,
} from '../sessionMachine.js';
import type { SessionMachineState } from '../types.js';

describe('sessionMachine', () => {
  it('initializes with idea beat and in_progress status', () => {
    const state = createSessionMachine('session-01');
    expect(state.sessionId).toBe('session-01');
    expect(state.currentBeat).toBe('idea');
    expect(state.status).toBe('in_progress');
    expect(state.history).toEqual(['idea']);
    expect(state.startedAt).toBeDefined();
    expect(state.updatedAt).toBeDefined();
  });

  it('progresses sequentially through all beats to completion', () => {
    let state = createSessionMachine('session-01');

    // idea -> watch
    state = transitionSession(state, { type: 'NEXT' });
    expect(state.currentBeat).toBe('watch');
    expect(state.status).toBe('in_progress');

    // watch -> read
    state = transitionSession(state, { type: 'NEXT' });
    expect(state.currentBeat).toBe('read');
    expect(state.status).toBe('in_progress');

    // read -> try
    state = transitionSession(state, { type: 'NEXT' });
    expect(state.currentBeat).toBe('try');
    expect(state.status).toBe('in_progress');

    // try -> coach
    state = transitionSession(state, { type: 'NEXT' });
    expect(state.currentBeat).toBe('coach');
    expect(state.status).toBe('in_progress');

    // coach -> out_there
    state = transitionSession(state, { type: 'NEXT' });
    expect(state.currentBeat).toBe('out_there');
    expect(state.status).toBe('in_progress');

    // out_there -> complete
    state = transitionSession(state, { type: 'NEXT' });
    expect(state.currentBeat).toBe('complete');
    expect(state.status).toBe('completed');
    expect(state.history).toEqual([
      'idea',
      'watch',
      'read',
      'try',
      'coach',
      'out_there',
      'complete',
    ]);
  });

  it('supports skipping beats', () => {
    let state = createSessionMachine('session-02');
    // Skip idea -> goes directly to watch
    state = transitionSession(state, { type: 'SKIP' });
    expect(state.currentBeat).toBe('watch');

    // Skip watch -> goes directly to read
    state = transitionSession(state, { type: 'SKIP' });
    expect(state.currentBeat).toBe('read');
  });

  it('supports pausing and resuming', () => {
    let state = createSessionMachine('session-03');
    state = transitionSession(state, { type: 'PAUSE' });
    expect(state.status).toBe('paused');

    // Cannot pause already paused state
    const pausedAgain = transitionSession(state, { type: 'PAUSE' });
    expect(pausedAgain.status).toBe('paused');

    // Resume back to in_progress
    state = transitionSession(state, { type: 'RESUME' });
    expect(state.status).toBe('in_progress');
  });

  it('supports GOTO navigation to specific beat', () => {
    let state = createSessionMachine('session-04');
    state = transitionSession(state, { type: 'GOTO', beat: 'coach' });
    expect(state.currentBeat).toBe('coach');
    expect(state.status).toBe('in_progress');
    expect(state.history).toEqual(['idea', 'coach']);
  });

  it('handles stepData updates cleanly', () => {
    let state = createSessionMachine('session-05');
    state = transitionSession(state, {
      type: 'UPDATE_STEP_DATA',
      data: { selectedLine: 2, passed: true },
    });
    expect(state.stepData).toEqual({ selectedLine: 2, passed: true });

    state = transitionSession(state, {
      type: 'UPDATE_STEP_DATA',
      data: { readChoice: 1 },
    });
    expect(state.stepData).toEqual({
      selectedLine: 2,
      passed: true,
      readChoice: 1,
    });
  });

  it('serializes to JSON and restores cleanly, continuing transitions', () => {
    let state = createSessionMachine('session-06');
    state = transitionSession(state, { type: 'NEXT' }); // to watch
    state = transitionSession(state, {
      type: 'UPDATE_STEP_DATA',
      data: { watched: true },
    });

    const serialized = serializeSessionState(state);
    expect(typeof serialized).toBe('string');

    const restored: SessionMachineState = deserializeSessionState(serialized);
    expect(restored.sessionId).toBe('session-06');
    expect(restored.currentBeat).toBe('watch');
    expect(restored.status).toBe('in_progress');
    expect(restored.stepData).toEqual({ watched: true });

    // Transition from restored state continues smoothly
    const nextState = transitionSession(restored, { type: 'NEXT' });
    expect(nextState.currentBeat).toBe('read');
  });

  it('calculates next and previous beats accurately', () => {
    expect(getNextBeat('idea')).toBe('watch');
    expect(getNextBeat('complete')).toBeNull();
    expect(getPreviousBeat('idea')).toBeNull();
    expect(getPreviousBeat('complete')).toBe('out_there');
  });
});
