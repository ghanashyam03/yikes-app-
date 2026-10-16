import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import MicroRepCheckinScreen from '../../../../app/checkin/[id]';
import { checkinsCopy } from '../../../copy/checkins';
import { useCheckin } from '../useCheckin';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'moment_mock_123' }),
}));

describe('Acceptance Check 5: Screen C8 Micro-Rep Check-in & Gap Reveal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCheckin.getState().resetFlow();
  });

  afterEach(() => {
    useCheckin.getState().resetFlow();
  });

  it('runs through full 4-step check-in flow from question to Gap reveal', async () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <MicroRepCheckinScreen />
      </ThemeProvider>
    );

    // Step 1: Did you ask the follow-up?
    expect(getByTestId('step-1-options')).toBeTruthy();
    expect(getByText(checkinsCopy.microRep.questionStep1)).toBeTruthy();

    const yesOption = getByTestId('option-step1-yes');
    fireEvent.press(yesOption);

    // Step 2: How did it land?
    expect(getByTestId('step-2-options')).toBeTruthy();
    expect(getByText(checkinsCopy.microRep.questionStep2)).toBeTruthy();

    const warmerOption = getByTestId('option-step2-warmer');
    fireEvent.press(warmerOption);

    // Step 3: Battery rating
    expect(getByTestId('step-3-battery')).toBeTruthy();
    expect(getByTestId('checkin-battery-gauge')).toBeTruthy();

    const finishBtn = getByText(checkinsCopy.microRep.finishButton);
    fireEvent.press(finishBtn);

    // Step 4: Gap reveal
    await waitFor(() => {
      expect(getByTestId('step-4-gap-reveal')).toBeTruthy();
    });

    expect(getByTestId('gap-reveal-headline')).toBeTruthy();
    expect(getByTestId('coach-reflection-card')).toBeTruthy();

    // Verify neutral language
    const headline = getByTestId('gap-reveal-headline').props.children;
    expect(headline).toMatch(/expected.*draining.*was/i);

    // Tap Done
    const doneBtn = getByText(checkinsCopy.gap.doneButton);
    fireEvent.press(doneBtn);
    expect(mockBack).toHaveBeenCalled();
  });
});
