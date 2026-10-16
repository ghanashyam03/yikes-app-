import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import MomentPocketCardScreen from '../../../../app/moments/[id]/pocket';
import { momentsCopy } from '../../../copy/moments';
import { useMoments } from '../useMoments';
import type { Moment } from '../types';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ id: 'moment_offline_test_1' }),
}));

describe('Acceptance Check 4: Pocket card renders offline from cached prep', () => {
  const cachedMoment: Moment = {
    id: 'moment_offline_test_1',
    title: 'Executive Sync with Alex',
    status: 'upcoming',
    prepPayload: {
      openerOptions: [
        'Hey Alex, thanks for making time today. Glad we could sync up.',
        'Hi Alex, how has your week been shaping up?',
      ],
      questions: [
        'What is your top priority for the engineering roadmap this quarter?',
        'Are there any blockers you would like our team to jump on first?',
      ],
      exitLine: 'I want to be respectful of your hard stop—great chatting today!',
      quietBreak: 'Take 2 minutes in the lobby or step outside before your next call.',
      recoveryPlan: 'Protect 20 minutes without screens afterwards.',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useMoments.getState().resetStore();

    // 1. Mock network as completely OFFLINE
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('Network error: Device is currently OFFLINE'));
    });

    // 2. Pre-populate local cached store with prep
    useMoments.setState({
      moments: [cachedMoment],
      isLoading: false,
      error: null,
      selectedFilter: 'upcoming',
    });
  });

  afterEach(() => {
    useMoments.getState().resetStore();
  });

  it('renders Pocket card in dark mode with zero network requests when device is offline', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="dark">
        <MomentPocketCardScreen />
      </ThemeProvider>
    );

    // Verify screen mounts successfully
    expect(getByTestId('pocket-card-screen')).toBeTruthy();

    // Verify Title & Badge
    expect(getByText('Executive Sync with Alex')).toBeTruthy();
    expect(getByText(/OFFLINE READY/)).toBeTruthy();

    // Verify Opener (displayed in large text)
    expect(
      getByText('"Hey Alex, thanks for making time today. Glad we could sync up."')
    ).toBeTruthy();

    // Verify Questions
    expect(
      getByText('"What is your top priority for the engineering roadmap this quarter?"')
    ).toBeTruthy();
    expect(
      getByText('"Are there any blockers you would like our team to jump on first?"')
    ).toBeTruthy();

    // Verify Exit Line
    expect(
      getByText('"I want to be respectful of your hard stop—great chatting today!"')
    ).toBeTruthy();

    // Verify Quiet Break
    expect(
      getByText('Take 2 minutes in the lobby or step outside before your next call.')
    ).toBeTruthy();

    // Verify Action button "Done, how drained?"
    const doneBtn = getByText(momentsCopy.pocket.doneButton);
    expect(doneBtn).toBeTruthy();

    // Verify ZERO network requests were attempted
    expect(global.fetch).not.toHaveBeenCalled();

    // Verify tapping "Done, how drained?" navigates to /energy
    fireEvent.press(doneBtn);
    expect(mockPush).toHaveBeenCalledWith('/energy');
  });

  it('navigates back to moments when Back button is tapped', () => {
    const { getByTestId } = render(
      <ThemeProvider initialPreference="dark">
        <MomentPocketCardScreen />
      </ThemeProvider>
    );

    const backBtn = getByTestId('pocket-back-btn');
    fireEvent.press(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });
});
