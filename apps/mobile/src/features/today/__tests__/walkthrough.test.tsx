import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import WarmupScreen from '../../../../app/(onboarding)/warmup';
import CoachReadScreen from '../../../../app/(onboarding)/coach-read';
import PlaybookRevealScreen from '../../../../app/(onboarding)/playbook';
import TodayScreen from '../../../../app/(tabs)/index';
import SessionOutThereScreen from '../../../../app/session/[id]/out-there';
import SessionCompleteScreen from '../../../../app/session/[id]/complete';
import { useGuestProgressStore } from '../guestProgress';
import { useOnboardingStore } from '../../onboarding/store';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'session-01' }),
}));

describe('Automated First-Run Walkthrough: Warmup -> Coach read -> Playbook -> Today -> Session -> Complete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGuestProgressStore.getState().resetProgress();
    useOnboardingStore.getState().reset();
  });

  afterEach(() => {
    useGuestProgressStore.getState().resetProgress();
  });

  it('completes the full journey from warm-up to session completion', async () => {
    // -------------------------------------------------------------
    // 1. A6 Warm-up Chat with Priya
    // -------------------------------------------------------------
    const { getByText: getByWarmupText, getByLabelText: getByWarmupLabel } = render(
      <ThemeProvider initialPreference="light">
        <WarmupScreen />
      </ThemeProvider>
    );

    // Reassurance notice visible
    expect(getByWarmupText(/There are no wrong answers/)).toBeTruthy();

    // Suggested replies present
    const firstSuggestion = getByWarmupLabel(/Pretty steady/);
    expect(firstSuggestion).toBeTruthy();

    // Tap suggested response
    fireEvent.press(firstSuggestion);

    // -------------------------------------------------------------
    // 2. A7 Coach's First Read
    // -------------------------------------------------------------
    const { getByText: getByCoachText, getByLabelText: getByCoachLabel } = render(
      <ThemeProvider initialPreference="light">
        <CoachReadScreen />
      </ThemeProvider>
    );

    // Verify 3 bento tiles
    expect(getByCoachText('FIRST IMPRESSION')).toBeTruthy();
    expect(getByCoachText('WHAT I NOTICED')).toBeTruthy();
    expect(getByCoachText('ONE THING TO TRY')).toBeTruthy();

    // Verify baseline votes were recorded to progress store
    const progressAfterCoach = useGuestProgressStore.getState().skillsProgress;
    expect(progressAfterCoach.starting_chat?.stage).toBe('starting');
    expect(progressAfterCoach.asking_followups?.stage).toBe('starting');

    // Tap Continue to Playbook
    fireEvent.press(getByCoachLabel('See my Playbook'));
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/playbook');

    // -------------------------------------------------------------
    // 3. A8 Playbook Reveal
    // -------------------------------------------------------------
    const { getByText: getByPlaybookText, getByLabelText: getByPlaybookLabel } = render(
      <ThemeProvider initialPreference="light">
        <PlaybookRevealScreen />
      </ThemeProvider>
    );

    expect(getByPlaybookText('YOUR PACE')).toBeTruthy();
    expect(getByPlaybookText('YOUR BATTERY')).toBeTruthy();
    expect(getByPlaybookText('HARDEST PLACES')).toBeTruthy();

    // Tap Save my Playbook
    fireEvent.press(getByPlaybookLabel('Save my Playbook'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');

    // -------------------------------------------------------------
    // 4. B1 Today (Home)
    // -------------------------------------------------------------
    const { getByText: getByTodayText, getByLabelText: getByTodayLabel } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    // Hero card is Session 1
    expect(getByTodayText(/Starting a chat/)).toBeTruthy();
    expect(getByTodayText('Because starting a chat is your foundation.')).toBeTruthy();

    // Tap Start Session
    fireEvent.press(getByTodayLabel(/Start Starting a chat/));
    expect(mockPush).toHaveBeenCalledWith('/session/session-01/idea');

    // -------------------------------------------------------------
    // 5. B11 Out There & Forecast
    // -------------------------------------------------------------
    const {
      getByText: getByOutThereText,
      getByLabelText: getByOutThereLabel,
    } = render(
      <ThemeProvider initialPreference="light">
        <SessionOutThereScreen />
      </ThemeProvider>
    );

    expect(getByOutThereText(/OUT THERE/)).toBeTruthy();

    // Pick first micro-rep
    const firstRepOption = getByOutThereLabel('Ask one follow-up question in your next conversation.');
    fireEvent.press(firstRepOption);

    // Forecast sliders should now appear
    expect(getByOutThereText('Forecast')).toBeTruthy();
    expect(getByOutThereText('How draining do you expect it to be?')).toBeTruthy();
    expect(getByOutThereText('How warm do you expect them to be?')).toBeTruthy();

    // Tap Commit
    fireEvent.press(getByOutThereLabel('Commit to micro-rep'));
    expect(mockReplace).toHaveBeenCalledWith('/session/session-01/complete');

    // Verify micro_rep was saved
    const microReps = useGuestProgressStore.getState().microReps;
    expect(microReps.length).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // 6. B12 Session Complete
    // -------------------------------------------------------------
    const { getByText: getByCompleteText, getByLabelText: getByCompleteLabel } = render(
      <ThemeProvider initialPreference="light">
        <SessionCompleteScreen />
      </ThemeProvider>
    );

    expect(getByCompleteText('Session complete')).toBeTruthy();
    expect(getByCompleteText('One real move practiced.')).toBeTruthy();
    expect(getByCompleteText(/No streaks, no points/)).toBeTruthy();

    // Tap Done
    fireEvent.press(getByCompleteLabel('Done'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');

    // Verify session completion was logged
    const logs = useGuestProgressStore.getState().sessionsLog;
    expect(logs.some((l) => l.sessionId === 'session-01')).toBe(true);
  });
});
