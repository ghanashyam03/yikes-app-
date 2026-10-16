import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import SessionIdeaScreen from '../../../../app/session/[id]/idea';
import SessionWatchScreen from '../../../../app/session/[id]/watch';
import SessionReadScreen from '../../../../app/session/[id]/read';

// Mock expo-router
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ id: 'session-01' }),
}));

describe('Session Steps Suite: Idea (B4), Watch (B5), Read (B6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Idea Screen (B4)', () => {
    it('renders glass card with rule, example bubbles, and collapsible why this works in Daylight mode', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <ThemeProvider initialPreference="light">
          <SessionIdeaScreen />
        </ThemeProvider>
      );

      // Verify rule text
      expect(getByTestId('idea-rule-text')).toBeTruthy();
      expect(getByText('EXAMPLE')).toBeTruthy();

      // Verify collapsible Why this works
      expect(queryByTestId('why-works-content')).toBeNull();
      fireEvent.press(getByTestId('why-works-toggle'));
      expect(getByTestId('why-works-content')).toBeTruthy();

      // Next button navigates to watch beat
      fireEvent.press(getByTestId('idea-next-button'));
      expect(mockReplace).toHaveBeenCalledWith('/session/session-01/watch');
    });

    it('renders cleanly in Midnight (dark) mode', () => {
      const { getByTestId } = render(
        <ThemeProvider initialPreference="dark">
          <SessionIdeaScreen />
        </ThemeProvider>
      );
      expect(getByTestId('session-idea-screen')).toBeTruthy();
    });
  });

  describe('Watch Screen (B5)', () => {
    it('handles interactive taps, wrong feedback, correct glow, and Show me button', async () => {
      const { getByTestId, findByText } = render(
        <ThemeProvider initialPreference="light">
          <SessionWatchScreen />
        </ThemeProvider>
      );

      // Tap wrong line (index 0)
      fireEvent.press(getByTestId('watch-line-0'));
      expect(await findByText('Close. Look at the question')).toBeTruthy();

      // Tap correct line (index 1 for session-01)
      fireEvent.press(getByTestId('watch-line-1'));
      expect(getByTestId('watch-correct-feedback')).toBeTruthy();
      expect(await findByText("That's it!")).toBeTruthy();

      // Next button navigates to read beat
      fireEvent.press(getByTestId('watch-next-button'));
      expect(mockReplace).toHaveBeenCalledWith('/session/session-01/read');
    });

    it('Show me reveals the target line directly when tapped', async () => {
      const { getByTestId, findByText } = render(
        <ThemeProvider initialPreference="light">
          <SessionWatchScreen />
        </ThemeProvider>
      );

      fireEvent.press(getByTestId('watch-show-me-button'));
      expect(getByTestId('watch-correct-feedback')).toBeTruthy();
      expect(await findByText("That's it!")).toBeTruthy();
    });

    it('renders cleanly with gateway provider down (fallback mode) and in Midnight mode', async () => {
      // Simulate network down
      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.reject(new Error('Network error'))
      );

      const { getByTestId, findByText } = render(
        <ThemeProvider initialPreference="dark">
          <SessionWatchScreen />
        </ThemeProvider>
      );

      expect(getByTestId('session-watch-screen')).toBeTruthy();
      expect(await findByText('Tap the line where the move happens')).toBeTruthy();
      fetchSpy.mockRestore();
    });
  });

  describe('Read Screen (B6)', () => {
    it('displays 3 candidate thoughts and reveals true thought, cue note, and disclaimer on selection', async () => {
      const { getByTestId, queryByTestId, findByText } = render(
        <ThemeProvider initialPreference="light">
          <SessionReadScreen />
        </ThemeProvider>
      );

      // Verify scene and 3 candidate thoughts
      expect(getByTestId('read-candidate-0')).toBeTruthy();
      expect(getByTestId('read-candidate-1')).toBeTruthy();
      expect(getByTestId('read-candidate-2')).toBeTruthy();

      // Reveal section is hidden before selection
      expect(queryByTestId('read-reveal-section')).toBeNull();

      // Select candidate 1
      fireEvent.press(getByTestId('read-candidate-1'));

      // Reveal section appears
      expect(getByTestId('read-reveal-section')).toBeTruthy();
      expect(getByTestId('read-disclaimer-note')).toBeTruthy();
      expect(await findByText('Different people, different signals')).toBeTruthy();
      expect(
        await findByText('This is one character’s thoughts, not a universal rule for everyone.')
      ).toBeTruthy();

      // Next button navigates to try beat
      fireEvent.press(getByTestId('read-next-button'));
      expect(mockReplace).toHaveBeenCalledWith('/session/session-01/try');
    });

    it('renders cleanly with gateway provider down (fallback mode) and in Midnight mode', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.reject(new Error('Network error'))
      );

      const { getByTestId, findByText } = render(
        <ThemeProvider initialPreference="dark">
          <SessionReadScreen />
        </ThemeProvider>
      );

      expect(getByTestId('session-read-screen')).toBeTruthy();
      expect(await findByText('SCENE')).toBeTruthy();
      fetchSpy.mockRestore();
    });
  });
});
