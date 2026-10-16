import { Linking, Share } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SupportModal from '../../../../app/support';
import { systemCopy } from '../../../copy/system';
import { ErrorBoundary } from '../ErrorBoundary';
import { ConnectivityProvider, ReconnectCard } from '../ConnectivityProvider';
import { BusyCard } from '../BusyCard';
import { DailyLimitCard } from '../DailyLimitCard';
import { WelcomeBackModal } from '../WelcomeBackModal';
import { EmptyStateCard } from '../EmptyStateCard';
import { emptyStatesRegistry } from '../emptyStatesRegistry';
import { ThemeProvider } from '../../../theme/ThemeProvider';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Spy on Linking and Share
jest.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

describe('T-22: System States & Support Safety Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Acceptance Check 1 & 2: Support Screen Safety Guarantees', () => {
    it('proves the Support screen contains no model-generated text and has fixed human copy', () => {
      const { getByTestId, getByText, queryByText } = render(
        <ThemeProvider>
          <SupportModal />
        </ThemeProvider>
      );

      // Verify human-authored title and subtitle
      expect(getByTestId('support-screen')).toBeTruthy();
      expect(getByText(systemCopy.support.title)).toBeTruthy();
      expect(getByText(systemCopy.support.subtitle)).toBeTruthy();

      // Verify strictly NO clinical claims rendered on screen
      expect(queryByText(/diagnose/i)).toBeNull();
      expect(queryByText(/psychotherapy/i)).toBeNull();
      expect(queryByText(/cure/i)).toBeNull();
    });

    it('proves phone and text links use the correct schemes (tel: and sms:)', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <SupportModal />
        </ThemeProvider>
      );

      // Default country is India (Primary launch market) -> Tele-MANAS 14416
      const callBtn = getByText(systemCopy.support.primaryCallButton('Tele-MANAS', '14416'));
      fireEvent.press(callBtn);
      expect(Linking.openURL).toHaveBeenCalledWith('tel:14416');

      // Switch to United States
      const usChip = getByText('US');
      fireEvent.press(usChip);

      // Primary call in US is 988
      const usCallBtn = getByText(systemCopy.support.primaryCallButton('988 Suicide & Crisis Lifeline', '988'));
      fireEvent.press(usCallBtn);
      expect(Linking.openURL).toHaveBeenCalledWith('tel:988');

      // Primary text in US is 988 or sms:741741
      const usTextBtn = getByText(systemCopy.support.primaryTextButton('988 Suicide & Crisis Lifeline', 'Text 988'));
      fireEvent.press(usTextBtn);
      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringMatching(/^sms:/));
    });

    it('proves Contact someone you trust invokes Share.share with grounding copy', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <SupportModal />
        </ThemeProvider>
      );

      const trustedBtn = getByText(systemCopy.support.contactTrustedButton);
      fireEvent.press(trustedBtn);

      expect(Share.share).toHaveBeenCalledWith({
        message: systemCopy.support.shareSheetMessage,
      });
    });

    it('proves Back to practice button quietly navigates back', () => {
      const { getByText } = render(
        <ThemeProvider>
          <SupportModal />
        </ThemeProvider>
      );

      const backBtn = getByText(systemCopy.support.backToPracticeButton);
      fireEvent.press(backBtn);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Acceptance Check 4: ErrorBoundary Plain Words & Single Action', () => {
    function BuggyComponent(): React.JSX.Element {
      throw new Error('Database transaction deadlocked at offset 0x4B3');
    }

    const originalConsoleError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalConsoleError;
    });

    it('catches thrown error, renders plain words, and never shows stack traces', () => {
      const onResetMock = jest.fn();

      const { queryByText, getByText } = render(
        <ThemeProvider>
          <ErrorBoundary onReset={onResetMock}>
            <BuggyComponent />
          </ErrorBoundary>
        </ThemeProvider>
      );

      // Assert plain words are shown
      expect(getByText("Couldn't save that. Try again.")).toBeTruthy();
      expect(
        getByText("Something didn't go quite right on our side. We didn't lose your progress.")
      ).toBeTruthy();

      // Assert technical stack trace or technical error is NEVER shown
      expect(queryByText(/Database transaction deadlocked/i)).toBeNull();
      expect(queryByText(/0x4B3/i)).toBeNull();

      // Test single retry action
      const retryBtn = getByText(systemCopy.errorBoundary.retryAction);
      expect(retryBtn).toBeTruthy();
      fireEvent.press(retryBtn);
      expect(onResetMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connectivity & Offline States', () => {
    it('renders OfflineBanner when disconnected', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ConnectivityProvider initialConnected={false}>
            <></>
          </ConnectivityProvider>
        </ThemeProvider>
      );

      expect(getByTestId('offline-banner')).toBeTruthy();
    });

    it('renders ReconnectCard with retry action', async () => {
      const onRetry = jest.fn();
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <ReconnectCard onRetry={onRetry} />
        </ThemeProvider>
      );

      expect(getByTestId('reconnect-card')).toBeTruthy();
      expect(getByText(systemCopy.offline.cardTitle)).toBeTruthy();

      const retryBtn = getByText(systemCopy.offline.retryAction);
      fireEvent.press(retryBtn);

      await waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('BusyCard, DailyLimitCard & WelcomeBackModal', () => {
    it('renders BusyCard and reveals backup/scripted actions after timeout', async () => {
      const onRetryBackup = jest.fn();
      const onSwitchScripted = jest.fn();

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <BusyCard
            timeoutMs={0} // instant timeout for test
            onRetryBackup={onRetryBackup}
            onSwitchScripted={onSwitchScripted}
          />
        </ThemeProvider>
      );

      expect(getByTestId('busy-card')).toBeTruthy();
      expect(getByTestId('busy-card-fallback-actions')).toBeTruthy();

      fireEvent.press(getByText(systemCopy.busy.retryBackupAction));
      expect(onRetryBackup).toHaveBeenCalledTimes(1);

      fireEvent.press(getByText(systemCopy.busy.switchScriptedAction));
      expect(onSwitchScripted).toHaveBeenCalledTimes(1);
    });

    it('renders DailyLimitCard with calm honey styling and scripted action', () => {
      const onSwitchScripted = jest.fn();
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <DailyLimitCard onSwitchScripted={onSwitchScripted} />
        </ThemeProvider>
      );

      expect(getByTestId('daily-limit-card')).toBeTruthy();
      expect(getByText(systemCopy.dailyLimit.title)).toBeTruthy();

      fireEvent.press(getByText(systemCopy.dailyLimit.switchScriptedAction));
      expect(onSwitchScripted).toHaveBeenCalledTimes(1);
    });

    it('renders WelcomeBackModal with zero guilt copy', () => {
      const onStartWarmup = jest.fn();
      const onDismiss = jest.fn();

      const { getByTestId, getByText, queryByText } = render(
        <ThemeProvider>
          <WelcomeBackModal
            visible={true}
            onStartWarmup={onStartWarmup}
            onDismiss={onDismiss}
          />
        </ThemeProvider>
      );

      expect(getByTestId('welcome-back-modal')).toBeTruthy();
      expect(getByText(systemCopy.welcomeBack.title)).toBeTruthy();
      expect(getByText(systemCopy.welcomeBack.subtitle)).toBeTruthy();

      // Zero guilt copy assertion: never shame user for missing days or lost streak
      expect(queryByText(/missed/i)).toBeNull();
      expect(queryByText(/lost streak/i)).toBeNull();
      expect(queryByText(/days absent/i)).toBeNull();

      fireEvent.press(getByText(systemCopy.welcomeBack.startWarmupAction));
      expect(onStartWarmup).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyStateCard Registry', () => {
    it('renders all registry states (Moments, Journal, Gap, Ladder, History)', () => {
      const keys = ['moments', 'journal', 'gap', 'ladder', 'history'] as const;

      for (const key of keys) {
        const onAction = jest.fn();
        const { getByTestId, getByText, unmount } = render(
          <ThemeProvider>
            <EmptyStateCard stateKey={key} onAction={onAction} />
          </ThemeProvider>
        );

        const def = emptyStatesRegistry[key];
        expect(getByTestId(`empty-state-${key}`)).toBeTruthy();
        expect(getByText(def.title)).toBeTruthy();
        expect(getByText(def.actionLabel)).toBeTruthy();

        unmount();
      }
    });
  });

  describe('Dual Mode Rendering (Light & Dark)', () => {
    it('renders Support screen cleanly in Light and Dark mode', () => {
      const { getByTestId, rerender } = render(
        <ThemeProvider initialPreference="light">
          <SupportModal />
        </ThemeProvider>
      );
      expect(getByTestId('support-screen')).toBeTruthy();

      rerender(
        <ThemeProvider initialPreference="dark">
          <SupportModal />
        </ThemeProvider>
      );
      expect(getByTestId('support-screen')).toBeTruthy();
    });
  });
});
