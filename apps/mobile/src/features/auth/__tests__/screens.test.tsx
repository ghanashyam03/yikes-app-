import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import WelcomeScreen from '../../../../app/(auth)/welcome';
import SignInScreen from '../../../../app/(auth)/sign-in';
import CodeScreen from '../../../../app/(auth)/code';
import ConsentScreen from '../../../../app/(auth)/consent';
import AgeScreen from '../../../../app/(auth)/age';
import { authCopy } from '../../../copy/auth';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true
  }),
  useLocalSearchParams: () => ({})
}));

describe('Auth Screens Rendering and Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WelcomeScreen (A2)', () => {
    it('renders wordmark, story cards, page dots, and accessibility elements', () => {
      const { getByText, getAllByRole } = render(
        <ThemeProvider initialPreference="light">
          <WelcomeScreen />
        </ThemeProvider>
      );

      expect(getByText('yikes!')).toBeTruthy();
      expect(getByText(authCopy.welcome.cards[0].title)).toBeTruthy();
      expect(getByText(authCopy.welcome.startQuiz)).toBeTruthy();
      expect(getByText(authCopy.welcome.alreadyHaveAccount)).toBeTruthy();

      const tabs = getAllByRole('tab');
      expect(tabs.length).toBe(3);
    });

    it('navigates to quiz intro on start quiz button press', () => {
      const { getByText } = render(
        <ThemeProvider initialPreference="light">
          <WelcomeScreen />
        </ThemeProvider>
      );

      fireEvent.press(getByText(authCopy.welcome.startQuiz));
      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/intro');
    });

    it('navigates to sign-in on returning account press', () => {
      const { getByText } = render(
        <ThemeProvider initialPreference="light">
          <WelcomeScreen />
        </ThemeProvider>
      );

      fireEvent.press(getByText(authCopy.welcome.alreadyHaveAccount));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(auth)/sign-in',
        params: { returning: 'true' }
      });
    });
  });

  describe('SignInScreen (A9, A16)', () => {
    it('renders provider buttons, privacy promise, and not now action', () => {
      const { getByText } = render(
        <ThemeProvider initialPreference="light">
          <SignInScreen />
        </ThemeProvider>
      );

      expect(getByText(authCopy.signIn.titleSavePlaybook)).toBeTruthy();
      expect(getByText(authCopy.signIn.apple)).toBeTruthy();
      expect(getByText(authCopy.signIn.google)).toBeTruthy();
      expect(getByText(authCopy.signIn.email)).toBeTruthy();
      expect(getByText(authCopy.signIn.phone)).toBeTruthy();
      expect(getByText(authCopy.signIn.passkey)).toBeTruthy();
      expect(getByText(authCopy.signIn.privacyPromise)).toBeTruthy();
      expect(getByText(authCopy.signIn.notNow)).toBeTruthy();
    });

    it('navigates to code entry on email button press', () => {
      const { getByText } = render(
        <ThemeProvider initialPreference="light">
          <SignInScreen />
        </ThemeProvider>
      );

      fireEvent.press(getByText(authCopy.signIn.email));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(auth)/code',
        params: { type: 'email' }
      });
    });
  });

  describe('CodeScreen (A10, A11)', () => {
    it('renders target entry field, send code button, and accessible back control', () => {
      const { getByText, getByPlaceholderText, getByLabelText } = render(
        <ThemeProvider initialPreference="light">
          <CodeScreen />
        </ThemeProvider>
      );

      expect(getByText(authCopy.code.emailPhonePrompt)).toBeTruthy();
      expect(getByPlaceholderText(authCopy.code.emailPlaceholder)).toBeTruthy();
      expect(getByText(authCopy.code.sendCode)).toBeTruthy();
      expect(getByLabelText(authCopy.code.backAction)).toBeTruthy();
    });
  });

  describe('ConsentScreen (A12)', () => {
    it('renders four glass cards with switch accessibility roles', () => {
      const { getByText, getAllByRole } = render(
        <ThemeProvider initialPreference="light">
          <ConsentScreen />
        </ThemeProvider>
      );

      expect(getByText(authCopy.consent.title)).toBeTruthy();
      expect(getByText(authCopy.consent.required.title)).toBeTruthy();
      expect(getByText(authCopy.consent.analytics.title)).toBeTruthy();
      expect(getByText(authCopy.consent.improveAi.title)).toBeTruthy();
      expect(getByText(authCopy.consent.marketing.title)).toBeTruthy();

      const switches = getAllByRole('switch');
      expect(switches.length).toBe(4);
      expect(getByText(authCopy.consent.continue)).toBeTruthy();
    });
  });

  describe('AgeScreen (A13)', () => {
    it('renders birth year scroll picker, zero-storage note, and confirm action', () => {
      const { getByText } = render(
        <ThemeProvider initialPreference="light">
          <AgeScreen />
        </ThemeProvider>
      );

      expect(getByText(authCopy.age.title)).toBeTruthy();
      expect(getByText(authCopy.age.privacyNote)).toBeTruthy();
      expect(getByText(authCopy.age.confirm)).toBeTruthy();
    });
  });
});
