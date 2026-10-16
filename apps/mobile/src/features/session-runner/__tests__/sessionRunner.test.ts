jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'session-01' }),
}));

import {
  NORMAL_BEATS,
  TAKE_IT_EASY_BEATS,
  getBeatRoutePath,
} from '../useSessionRunner';
import {
  clearSessionRunnerState,
  loadSessionRunnerState,
  saveSessionRunnerState,
  type SavedRunnerState,
} from '../runnerStorage';

describe('Session Runner Beat Flow and Persistence', () => {
  beforeEach(async () => {
    await clearSessionRunnerState();
  });

  afterEach(async () => {
    await clearSessionRunnerState();
  });

  it('Normal mode defines exactly 7 sequential beats', () => {
    expect(NORMAL_BEATS).toEqual([
      'idea',
      'watch',
      'read',
      'try',
      'coach',
      'out_there',
      'complete',
    ]);
  });

  it('Take it easy mode defines streamlined 4-beat sequence', () => {
    expect(TAKE_IT_EASY_BEATS).toEqual([
      'idea',
      'try',
      'coach',
      'complete',
    ]);
  });

  it('generates correct route paths for all beats', () => {
    expect(getBeatRoutePath('session-01', 'idea')).toBe('/session/session-01/idea');
    expect(getBeatRoutePath('session-01', 'watch')).toBe('/session/session-01/watch');
    expect(getBeatRoutePath('session-01', 'read')).toBe('/session/session-01/read');
    expect(getBeatRoutePath('session-01', 'try')).toBe('/session/session-01/try');
    expect(getBeatRoutePath('session-01', 'coach')).toBe('/session/session-01/coach');
    expect(getBeatRoutePath('session-01', 'out_there')).toBe('/session/session-01/out-there');
    expect(getBeatRoutePath('session-01', 'complete')).toBe('/session/session-01/complete');

    // With Take it easy query
    expect(getBeatRoutePath('session-02', 'try', true)).toBe('/session/session-02/try?easy=true');
  });

  it('saves and resumes from a mid-session state seamlessly', async () => {
    const initialState: SavedRunnerState = {
      sessionId: 'session-03',
      currentBeat: 'read',
      isTakeItEasy: false,
      status: 'in_progress',
      history: ['idea', 'watch', 'read'],
      startedAt: '2026-10-16T08:00:00Z',
      updatedAt: '2026-10-16T08:02:00Z',
      stepData: {
        selectedWatchLine: 1,
        watchFeedback: 'correct',
      },
    };

    // Autosave mid-session
    await saveSessionRunnerState(initialState);

    // Reopen/resume session
    const resumed = await loadSessionRunnerState();

    expect(resumed).not.toBeNull();
    expect(resumed?.sessionId).toBe('session-03');
    expect(resumed?.currentBeat).toBe('read');
    expect(resumed?.history).toEqual(['idea', 'watch', 'read']);
    expect(resumed?.stepData?.selectedWatchLine).toBe(1);
    expect(resumed?.stepData?.watchFeedback).toBe('correct');

    // Clean up
    await clearSessionRunnerState();
    const afterClear = await loadSessionRunnerState();
    expect(afterClear).toBeNull();
  });
});
