import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import WeeklyLetterScreen from '../../../../app/letter/[id]';
import { letterCopy } from '../../../copy/letter';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { fetchLetterById } from '../letterApi';
import { useWeeklyLetter } from '../useWeeklyLetter';
import type { WeeklyLetter } from '../types';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ id: 'letter-test-123' }),
}));

// Mock API
jest.mock('../letterApi', () => ({
  fetchLatestLetter: jest.fn().mockResolvedValue(null),
  fetchLetterById: jest.fn().mockResolvedValue(null),
  updateLetterOptOut: jest.fn().mockResolvedValue(true),
  requestVoiceMatchSynthesis: jest.fn(),
}));

// Mock auth session
jest.mock('../../auth/useSession', () => {
  const mockState = {
    session: {
      user: { id: 'test-user-id' },
      accessToken: 'fake-jwt-token',
    },
  };
  return {
    useSession: () => mockState,
    useSessionStore: {
      getState: () => mockState,
    },
  };
});

// Mock supabaseClient
jest.mock('../../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

describe('Screen C14: Weekly Letter', () => {
  const sampleLetter: WeeklyLetter = {
    id: 'letter-test-123',
    userId: 'test-user-id',
    weekStart: '2026-10-18',
    content:
      'You logged three sessions this week, and the biggest shift was how you handled exits. You stepped away cleanly without lingering. Pauses still feel long in the moment, but nobody else is timing them. Next week, keep that same breezy exit in your pocket.',
    metadata: {
      wordCount: 45,
      patternNoticed: 'You initiate exits with clearer intent once the primary question has been addressed.',
      nextFocus: 'Try using your clean exit line in one real-world end-of-meeting moment.',
      plan: 'plus',
      optedOut: false,
    },
    createdAt: '2026-10-18T18:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useWeeklyLetter.getState().resetStore();
    });
  });

  it('renders loading state when fetching letter', () => {
    act(() => {
      useWeeklyLetter.setState({ isLoading: true, letter: null, error: null });
    });

    const { getByText } = render(
      <ThemeProvider>
        <WeeklyLetterScreen />
      </ThemeProvider>
    );

    expect(getByText(letterCopy.states.loading)).toBeTruthy();
  });

  it('renders empty state when no letter is available', async () => {
    act(() => {
      useWeeklyLetter.setState({ isLoading: false, letter: null, error: null });
    });

    const { getByText } = render(
      <ThemeProvider>
        <WeeklyLetterScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText(letterCopy.states.emptyTitle)).toBeTruthy();
      expect(getByText(letterCopy.states.emptyMessage)).toBeTruthy();
    });
  });

  it('renders error state with retry button when error occurs', async () => {
    (fetchLetterById as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'));

    act(() => {
      useWeeklyLetter.setState({
        isLoading: false,
        letter: null,
        error: 'Network timeout',
      });
    });

    const { getByText } = render(
      <ThemeProvider>
        <WeeklyLetterScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText(letterCopy.states.errorTitle)).toBeTruthy();
      expect(getByText(letterCopy.states.errorMessage)).toBeTruthy();
      expect(getByText(letterCopy.states.retryButton)).toBeTruthy();
    });
  });

  it('renders serif letter content, noticed pattern, focus next, and Plan it button', () => {
    act(() => {
      useWeeklyLetter.setState({
        isLoading: false,
        letter: sampleLetter,
        error: null,
        optedOut: false,
      });
    });

    const { getByText } = render(
      <ThemeProvider>
        <WeeklyLetterScreen />
      </ThemeProvider>
    );

    // Letter body
    expect(getByText(sampleLetter.content)).toBeTruthy();

    // Pattern noticed section
    expect(getByText(letterCopy.sections.patternNoticedTitle.toUpperCase())).toBeTruthy();
    expect(getByText(sampleLetter.metadata.patternNoticed)).toBeTruthy();

    // Focus next section & Plan it button
    expect(getByText(letterCopy.sections.focusNextTitle.toUpperCase())).toBeTruthy();
    expect(getByText(sampleLetter.metadata.nextFocus)).toBeTruthy();

    const planButton = getByText(letterCopy.sections.planButtonLabel);
    expect(planButton).toBeTruthy();

    // Tapping Plan it navigates to moments
    fireEvent.press(planButton);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/moments');
  });

  it('renders offline banner when isOffline is true with cached letter', () => {
    act(() => {
      useWeeklyLetter.setState({
        isLoading: false,
        letter: sampleLetter,
        isOffline: true,
        error: null,
      });
    });

    const { getByText } = render(
      <ThemeProvider>
        <WeeklyLetterScreen />
      </ThemeProvider>
    );

    expect(getByText(letterCopy.states.offlineBanner)).toBeTruthy();
    expect(getByText(sampleLetter.content)).toBeTruthy();
  });

  it('toggles opt-out switch properly', () => {
    act(() => {
      useWeeklyLetter.setState({
        isLoading: false,
        letter: sampleLetter,
        optedOut: false,
      });
    });

    const { getByLabelText } = render(
      <ThemeProvider>
        <WeeklyLetterScreen />
      </ThemeProvider>
    );

    const toggle = getByLabelText(letterCopy.optOut.toggleLabel);
    expect(toggle).toBeTruthy();

    act(() => {
      fireEvent(toggle, 'valueChange', true);
    });

    expect(useWeeklyLetter.getState().optedOut).toBe(true);
  });

  // =========================================================================
  // Non-negotiable product rules audit
  // =========================================================================
  describe('Product rules and copy honesty audit', () => {
    it('proves zero clinical words exist in letter copy strings', () => {
      const copyString = JSON.stringify(letterCopy).toLowerCase();
      expect(copyString).not.toMatch(/\btreat(?:s|ing|ed|ment)?\b/);
      expect(copyString).not.toMatch(/\bcure(?:s|ing|ed)?\b/);
      expect(copyString).not.toMatch(/\btherap(?:y|ies|ist|eutic)\b/);
      expect(copyString).not.toMatch(/\bdiagnos(?:e|es|ing|is)\b/);
    });

    it('proves zero personality labels exist in letter copy strings', () => {
      const copyString = JSON.stringify(letterCopy).toLowerCase();
      expect(copyString).not.toMatch(/\bshy(?:ness)?\b/);
      expect(copyString).not.toMatch(/\banxious(?:ness)?\b/);
      expect(copyString).not.toMatch(/\bintrovert(?:ed|sion)?\b/);
      expect(copyString).not.toMatch(/\bextrovert(?:ed|sion)?\b/);
    });
  });
});
