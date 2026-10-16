import {
  SESSION_BEATS,
  SessionMachineStateSchema,
  type SessionBeat,
  type SessionMachineState,
  type SessionStatus,
} from './types.js';

export type SessionMachineEvent =
  | { type: 'NEXT' }
  | { type: 'SKIP' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'GOTO'; beat: SessionBeat }
  | { type: 'UPDATE_STEP_DATA'; data: Record<string, unknown> };

export const BEAT_ORDER: readonly SessionBeat[] = SESSION_BEATS;

export function getBeatIndex(beat: SessionBeat): number {
  return BEAT_ORDER.indexOf(beat);
}

export function getNextBeat(current: SessionBeat): SessionBeat | null {
  const index = getBeatIndex(current);
  if (index === -1 || index >= BEAT_ORDER.length - 1) {
    return null;
  }
  return BEAT_ORDER[index + 1]!;
}

export function getPreviousBeat(current: SessionBeat): SessionBeat | null {
  const index = getBeatIndex(current);
  if (index <= 0) {
    return null;
  }
  return BEAT_ORDER[index - 1]!;
}

export function createSessionMachine(
  sessionId: string,
  initialBeat: SessionBeat = 'idea'
): SessionMachineState {
  const now = new Date().toISOString();
  return {
    sessionId,
    currentBeat: initialBeat,
    status: initialBeat === 'complete' ? 'completed' : 'in_progress',
    history: [initialBeat],
    startedAt: now,
    updatedAt: now,
  };
}

export function transitionSession(
  state: SessionMachineState,
  event: SessionMachineEvent
): SessionMachineState {
  const now = new Date().toISOString();

  switch (event.type) {
    case 'PAUSE': {
      if (state.status === 'completed') {
        return state;
      }
      return {
        ...state,
        status: 'paused',
        updatedAt: now,
      };
    }

    case 'RESUME': {
      if (state.status !== 'paused') {
        return state;
      }
      return {
        ...state,
        status: 'in_progress',
        updatedAt: now,
      };
    }

    case 'NEXT':
    case 'SKIP': {
      const nextBeat = getNextBeat(state.currentBeat);
      if (!nextBeat) {
        return {
          ...state,
          status: 'completed',
          updatedAt: now,
        };
      }

      const nextStatus: SessionStatus = nextBeat === 'complete' ? 'completed' : 'in_progress';
      return {
        ...state,
        currentBeat: nextBeat,
        status: nextStatus,
        history: [...state.history, nextBeat],
        updatedAt: now,
      };
    }

    case 'GOTO': {
      if (state.currentBeat === event.beat) {
        return state;
      }
      const nextStatus: SessionStatus = event.beat === 'complete' ? 'completed' : 'in_progress';
      return {
        ...state,
        currentBeat: event.beat,
        status: nextStatus,
        history: [...state.history, event.beat],
        updatedAt: now,
      };
    }

    case 'UPDATE_STEP_DATA': {
      return {
        ...state,
        stepData: {
          ...(state.stepData ?? {}),
          ...event.data,
        },
        updatedAt: now,
      };
    }

    default:
      return state;
  }
}

export function serializeSessionState(state: SessionMachineState): string {
  // Validate before serializing
  const parsed = SessionMachineStateSchema.parse(state);
  return JSON.stringify(parsed);
}

export function deserializeSessionState(raw: string): SessionMachineState {
  const json = JSON.parse(raw);
  return SessionMachineStateSchema.parse(json);
}
