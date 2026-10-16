import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import LadderScreen from '../../../../app/ladder';
import { useLadder } from '../useLadder';
import { youCopy } from '../../../copy/you';

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
}));

describe('T-18 Screen C18 Quiet Ladder Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useLadder.getState().resetStore();
    });
  });

  afterEach(() => {
    act(() => {
      useLadder.getState().resetStore();
    });
  });

  it('renders designed empty state when ladder has no rungs', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <LadderScreen />
      </ThemeProvider>
    );

    expect(getByTestId('ladder-empty-state')).toBeTruthy();
    expect(getByText(youCopy.ladder.emptyState)).toBeTruthy();
  });

  it('renders ladder rungs, highlights the current rung, and allows expanding details', async () => {
    await act(async () => {
      await useLadder.getState().addRung(
        'Step 1: Say hi to neighbour',
        'Give a friendly wave',
        'Simple low-pressure greeting'
      );
      await useLadder.getState().addRung(
        'Step 2: Ask about weekend',
        'Ask one question',
        'Connection move'
      );
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <LadderScreen />
      </ThemeProvider>
    );

    // Current rung badge on first uncompleted rung
    const firstRungId = useLadder.getState().rungs[0]!.id;
    expect(getByTestId(`current-rung-badge-${firstRungId}`)).toBeTruthy();

    // Tap rung to expand details
    const rungTitlePressable = getByText('Step 1: Say hi to neighbour');
    await act(async () => {
      fireEvent.press(rungTitlePressable);
    });

    // Verify micro-rep suggestion and Mark Done button appear
    expect(getByTestId(`rung-expanded-${firstRungId}`)).toBeTruthy();
    expect(getByText('Give a friendly wave')).toBeTruthy();

    // Press Mark Done
    const markDoneBtn = getByTestId(`toggle-done-button-${firstRungId}`);
    await act(async () => {
      fireEvent.press(markDoneBtn);
    });

    expect(useLadder.getState().rungs[0]!.completed).toBe(true);
    expect(getByTestId(`completed-rung-badge-${firstRungId}`)).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    const { getByTestId } = render(
      <ThemeProvider initialPreference="light">
        <LadderScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('ladder-back-button'));
    expect(mockBack).toHaveBeenCalled();
  });
});
