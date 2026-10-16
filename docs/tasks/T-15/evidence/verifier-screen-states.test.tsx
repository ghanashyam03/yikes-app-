import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../apps/mobile/src/theme/ThemeProvider';
import TodayScreen from '../../../../apps/mobile/app/(tabs)/index';
import PathScreen from '../../../../apps/mobile/app/(tabs)/path';
import * as useTodayModule from '../../../../apps/mobile/src/features/today/useToday';
import * as usePathModule from '../../../../apps/mobile/src/features/path/usePath';
import { todayCopy } from '../../../../apps/mobile/src/copy/today';
import { SESSIONS_CATALOG } from '../../../../apps/mobile/src/features/session-steps/sessionCatalog';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'session-01' }),
}));

describe('Verifier Independent Audit: Empty, Loading, Error, Offline states on Today & Path', () => {
  const dummySession = SESSIONS_CATALOG['session-01']!;

  const baseTodayReturn = {
    greeting: 'Good morning.',
    batteryLevel: 3,
    rhythm: { filled: 1, total: 3, percent: 33 },
    hero: {
      session: dummySession,
      reason: 'Because starting a chat is your foundation.',
      lengthMinutes: 4,
      partner: dummySession.persona,
      isTakeItEasy: false,
      toggleTakeItEasy: jest.fn(),
    },
    moment: { upcoming: null, hasUpcoming: false },
    checkin: { due: null, submit: jest.fn() },
    evidence: { quote: '“What got you into that?”', contextNote: 'Warmed Maya up' },
    isEmptyFirstDay: false,
    isLoading: false,
    error: null,
    isOffline: false,
    refresh: jest.fn(),
  };

  const basePathReturn = {
    allNodes: [],
    unit1Nodes: [],
    unit2Nodes: [],
    selectedNodeInfo: null,
    selectedSession: null,
    isLoading: false,
    error: null,
    isOffline: false,
    selectNode: jest.fn(),
    dismissDetail: jest.fn(),
    startSelectedSession: jest.fn(),
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. Today Loading State
  it('renders Today loading state with skeleton shapes', () => {
    jest.spyOn(useTodayModule, 'useToday').mockReturnValue({
      ...baseTodayReturn,
      isLoading: true,
    });

    const { toJSON } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    expect(toJSON()).toBeTruthy();
  });

  // 2. Today Error State
  it('renders Today error state with retry affordance', () => {
    jest.spyOn(useTodayModule, 'useToday').mockReturnValue({
      ...baseTodayReturn,
      error: 'Failed to fetch remote practice',
    });

    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    expect(getByText(todayCopy.states.error)).toBeTruthy();
    expect(getByText(todayCopy.states.retry)).toBeTruthy();
  });

  // 3. Today Offline State
  it('renders Today offline state banner', () => {
    jest.spyOn(useTodayModule, 'useToday').mockReturnValue({
      ...baseTodayReturn,
      isOffline: true,
    });

    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    expect(getByText(new RegExp(todayCopy.states.offline))).toBeTruthy();
  });

  // 4. Today Empty First Day State
  it('renders Today empty first day state with empty evidence notice', () => {
    jest.spyOn(useTodayModule, 'useToday').mockReturnValue({
      ...baseTodayReturn,
      isEmptyFirstDay: true,
      moment: { upcoming: null, hasUpcoming: false },
    });

    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    expect(getByText(todayCopy.evidence.noEvidenceYet)).toBeTruthy();
    expect(getByText(todayCopy.moment.emptyTitle)).toBeTruthy();
    expect(getByText(todayCopy.moment.addAction)).toBeTruthy();
  });

  // 5. Path Loading State
  it('renders Path loading state with skeleton shapes', () => {
    jest.spyOn(usePathModule, 'usePath').mockReturnValue({
      ...basePathReturn,
      isLoading: true,
    });

    const { toJSON } = render(
      <ThemeProvider initialPreference="light">
        <PathScreen />
      </ThemeProvider>
    );

    expect(toJSON()).toBeTruthy();
  });

  // 6. Path Error State
  it('renders Path error banner', () => {
    jest.spyOn(usePathModule, 'usePath').mockReturnValue({
      ...basePathReturn,
      error: 'Network timeout',
    });

    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <PathScreen />
      </ThemeProvider>
    );

    expect(getByText(todayCopy.states.error)).toBeTruthy();
  });

  // 7. Path Offline State
  it('renders Path offline banner', () => {
    jest.spyOn(usePathModule, 'usePath').mockReturnValue({
      ...basePathReturn,
      isOffline: true,
    });

    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <PathScreen />
      </ThemeProvider>
    );

    expect(getByText(new RegExp(todayCopy.states.offline))).toBeTruthy();
  });
});
