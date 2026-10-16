import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import TodayScreen from '../../../../app/(tabs)/index';
import { useGuestProgressStore } from '../guestProgress';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'session-01' }),
}));

describe('TodayScreen UI States', () => {
  beforeEach(() => {
    useGuestProgressStore.getState().resetProgress();
  });

  afterEach(() => {
    useGuestProgressStore.getState().resetProgress();
  });

  it('renders Today screen in Daylight theme with greeting, hero card and rhythm ring', () => {
    const { getByText, getByLabelText } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    // Hero card elements
    expect(getByText(/The Opening Line|Starting a chat/)).toBeTruthy();
    expect(getByLabelText(/Start Starting a chat/)).toBeTruthy();
    expect(getByText('Take it easy')).toBeTruthy();
  });

  it('renders Today screen in Midnight theme without crashing', () => {
    const { getByLabelText } = render(
      <ThemeProvider initialPreference="dark">
        <TodayScreen />
      </ThemeProvider>
    );

    expect(getByLabelText(/Start/)).toBeTruthy();
  });

  it('toggles Take it easy mode from 4 min to 2 min version', () => {
    const { getByText, queryByText } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    expect(getByText('4 min')).toBeTruthy();

    // Tap Take it easy
    fireEvent.press(getByText('Take it easy'));

    // Should now show 2 min and option to switch back
    expect(getByText('2 min')).toBeTruthy();
    expect(getByText('Switch to full session')).toBeTruthy();

    // Toggle back
    fireEvent.press(getByText('Switch to full session'));
    expect(queryByText('2 min')).toBeNull();
    expect(getByText('4 min')).toBeTruthy();
  });

  it('renders check-in tile when a micro-rep checkin is due and resolves on tap', async () => {
    // Seed a pending micro-rep
    useGuestProgressStore.getState().addMicroRep({
      prompt: 'asking that question',
      forecastDrain: 2,
      forecastWarmth: 4,
    });

    const { getByText, getByLabelText } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    expect(getByText(/How did "asking that question" go\?/)).toBeTruthy();

    // Tap Warm option
    fireEvent.press(getByLabelText('Warm'));

    // Replaces with thank you note
    await waitFor(() => {
      expect(getByText(/Check-in saved/)).toBeTruthy();
    });
  });

  it('renders empty Moment state with invitation to add one', () => {
    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <TodayScreen />
      </ThemeProvider>
    );

    expect(getByText('Nothing coming up')).toBeTruthy();
    expect(getByText('Add one?')).toBeTruthy();
  });
});
