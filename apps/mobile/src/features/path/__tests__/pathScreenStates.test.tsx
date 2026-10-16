import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import PathScreen from '../../../../app/(tabs)/path';
import { useGuestProgressStore } from '../../today/guestProgress';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'session-01' }),
}));

describe('PathScreen UI States and Bottom Sheet', () => {
  beforeEach(() => {
    useGuestProgressStore.getState().resetProgress();
  });

  afterEach(() => {
    useGuestProgressStore.getState().resetProgress();
  });

  it('renders Path screen with Unit 1 and Unit 2 in Daylight mode', () => {
    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <PathScreen />
      </ThemeProvider>
    );

    expect(getByText('Path')).toBeTruthy();
    expect(getByText('Unit 1: Foundations')).toBeTruthy();
    expect(getByText('Unit 2: Expanding Horizons')).toBeTruthy();
    expect(getByText('GAP TREND')).toBeTruthy();
  });

  it('renders Path screen in Midnight mode without crashing', () => {
    const { getByText } = render(
      <ThemeProvider initialPreference="dark">
        <PathScreen />
      </ThemeProvider>
    );

    expect(getByText('Path')).toBeTruthy();
  });

  it('opens bottom sheet when tapping an unlocked session and offers Start session', () => {
    const { getByLabelText, getByText } = render(
      <ThemeProvider initialPreference="light">
        <PathScreen />
      </ThemeProvider>
    );

    // Session 1 is unlocked
    const session1Node = getByLabelText(/The Opening Line/);
    fireEvent.press(session1Node);

    // Bottom sheet should now show session details
    expect(getByText('Starting a chat')).toBeTruthy();
    expect(getByText(/Start session/)).toBeTruthy();
  });

  it('opens bottom sheet when tapping a locked session and offers Try ahead', () => {
    const { getByLabelText, getByText } = render(
      <ThemeProvider initialPreference="light">
        <PathScreen />
      </ThemeProvider>
    );

    // Session 4 is locked since 1, 2, 3 not done
    const session4Node = getByLabelText(/The Warm Exit/);
    fireEvent.press(session4Node);

    // Bottom sheet should offer Try ahead
    expect(getByText('Graceful exits')).toBeTruthy();
    expect(getByText('Try ahead')).toBeTruthy();
  });
});
