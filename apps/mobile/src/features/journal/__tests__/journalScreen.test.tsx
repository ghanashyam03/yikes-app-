import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import JournalScreen from '../../../../app/journal';
import { useJournal } from '../useJournal';
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

describe('T-18 Screen C13 Growth Journal Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useJournal.getState().resetStore();
    });
  });

  afterEach(() => {
    act(() => {
      useJournal.getState().resetStore();
    });
  });

  it('renders designed empty state when journal has no entries', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <JournalScreen />
      </ThemeProvider>
    );

    expect(getByTestId('journal-empty-state')).toBeTruthy();
    expect(getByText(youCopy.journal.emptyState)).toBeTruthy();
  });

  it('renders journal entries, allows toggling favorites and switching filters', async () => {
    await act(async () => {
      await useJournal.getState().addEntry({
        entryKind: 'win',
        title: 'Meeting contribution',
        body: 'Spoke up with one concise question.',
        favorite: false,
      });

      await useJournal.getState().addEntry({
        entryKind: 'letter',
        title: 'Sunday Reflection Notes',
        body: 'You ask more questions in 1-on-1s.',
        favorite: true,
      });
    });

    const { getByTestId, getByText, queryByText } = render(
      <ThemeProvider initialPreference="light">
        <JournalScreen />
      </ThemeProvider>
    );

    // Both entries visible in 'all' filter
    expect(getByText('Meeting contribution')).toBeTruthy();
    expect(getByText('Sunday Reflection Notes')).toBeTruthy();

    // Toggle favorite
    const winEntryId = useJournal.getState().entries.find((e) => e.entryKind === 'win')?.id;
    expect(winEntryId).toBeTruthy();

    const favButton = getByTestId(`favorite-button-${winEntryId}`);
    await act(async () => {
      fireEvent.press(favButton);
    });

    expect(useJournal.getState().entries.find((e) => e.id === winEntryId)?.favorite).toBe(true);

    // Switch to 'wins' filter tab
    const winsTab = getByText('Wins');
    await act(async () => {
      fireEvent.press(winsTab);
    });

    expect(getByText('Meeting contribution')).toBeTruthy();
    expect(queryByText('Sunday Reflection Notes')).toBeNull();
  });

  it('navigates back when back button is pressed', () => {
    const { getByTestId } = render(
      <ThemeProvider initialPreference="light">
        <JournalScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('journal-back-button'));
    expect(mockBack).toHaveBeenCalled();
  });
});
