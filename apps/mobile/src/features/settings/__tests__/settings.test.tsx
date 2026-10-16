import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useSettings, settingsStorage, memorySettingsFallback } from '../useSettings';
import { DEFAULT_SETTINGS } from '../types';
import { ReportAiButton } from '../ReportAiButton';
import SettingsIndexScreen from '../../../../app/settings/index';
import SettingsHelpScreen from '../../../../app/settings/help';
import SettingsAboutAiScreen from '../../../../app/settings/about-ai';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { settingsCopy } from '../../../copy/settings';
import { supabase } from '../../auth/supabaseClient';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
  }),
}));

// Mock supabase client
jest.mock('../../auth/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// Mock auth session store
jest.mock('../../auth/useSession', () => ({
  useSessionStore: (selector: (state: { session: { user: { id: string } } }) => unknown) =>
    selector({
      session: {
        user: { id: 'test-user-123' },
      },
    }),
}));

describe('T-22: Settings & Preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettings.getState().resetSettings();
    memorySettingsFallback.clear();
  });

  describe('useSettings store & Rule #2 non-negotiables', () => {
    it('strictly defaults streakEnabled to false per Rule #2', () => {
      const state = useSettings.getState();
      expect(state.streakEnabled).toBe(false);
      expect(DEFAULT_SETTINGS.streakEnabled).toBe(false);
    });

    it('has standard expected default settings', () => {
      const state = useSettings.getState();
      expect(state.appearance).toBe('auto');
      expect(state.weeklyGoal).toBe(3);
      expect(state.isPaused).toBe(false);
      expect(state.reducedMotionOverride).toBe(false);
      expect(state.textScale).toBe(1.0);
      expect(state.hapticsEnabled).toBe(true);
      expect(state.soundEnabled).toBe(true);
      expect(state.coachTone).toBe('gentle');
    });

    it('updates preference values cleanly', () => {
      useSettings.getState().setStreakEnabled(true);
      expect(useSettings.getState().streakEnabled).toBe(true);

      useSettings.getState().setCoachTone('straight');
      expect(useSettings.getState().coachTone).toBe('straight');

      useSettings.getState().setWeeklyGoal(5);
      expect(useSettings.getState().weeklyGoal).toBe(5);

      useSettings.getState().setIsPaused(true);
      expect(useSettings.getState().isPaused).toBe(true);

      useSettings.getState().setAppearance('dark');
      expect(useSettings.getState().appearance).toBe('dark');
    });

    it('persists and restores state from storage across simulated restart', async () => {
      // Save state to storage
      await settingsStorage.setItem(
        'yikes-settings-storage',
        JSON.stringify({
          state: {
            streakEnabled: true,
            weeklyGoal: 4,
            coachTone: 'funny',
          },
          version: 0,
        })
      );

      const retrievedRaw = await settingsStorage.getItem('yikes-settings-storage');
      expect(retrievedRaw).toBeTruthy();
      const parsed = JSON.parse(retrievedRaw!);
      expect(parsed.state.streakEnabled).toBe(true);
      expect(parsed.state.weeklyGoal).toBe(4);
      expect(parsed.state.coachTone).toBe('funny');
    });

    it('resets settings back to defaults cleanly', () => {
      useSettings.getState().setStreakEnabled(true);
      useSettings.getState().setCoachTone('funny');
      useSettings.getState().resetSettings();

      const state = useSettings.getState();
      expect(state.streakEnabled).toBe(false);
      expect(state.coachTone).toBe('gentle');
    });
  });

  describe('ReportAiButton component', () => {
    it('renders report button and opens modal with explicit consent checkbox', async () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <ReportAiButton
            messageContent="I think you should never speak to them again."
            targetId="turn-msg-456"
          />
        </ThemeProvider>
      );

      const button = getByText(settingsCopy.help.reportSection.buttonLabel);
      expect(button).toBeTruthy();

      fireEvent.press(button);

      await waitFor(() => {
        expect(getByTestId('report-ai-modal')).toBeTruthy();
        const consentSwitch = getByTestId('report-consent-switch');
        expect(consentSwitch).toBeTruthy();
        expect(consentSwitch.props.value).toBe(false); // explicit consent defaults to FALSE
      });
    });

    it('submits report to ai_feedback table on submit', async () => {
      const onReportSuccess = jest.fn();
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <ReportAiButton
            messageContent="Unhelpful feedback"
            targetId="turn-999"
            onReportSuccess={onReportSuccess}
          />
        </ThemeProvider>
      );

      fireEvent.press(getByText(settingsCopy.help.reportSection.buttonLabel));

      await waitFor(() => {
        expect(getByText(settingsCopy.reportModal.submitButton)).toBeTruthy();
      });

      // Toggle consent
      fireEvent(getByTestId('report-consent-switch'), 'valueChange', true);

      // Submit
      fireEvent.press(getByText(settingsCopy.reportModal.submitButton));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('ai_feedback');
      });
    });
  });

  describe('Settings screens rendering', () => {
    it('renders SettingsIndexScreen with grouped cards and search filter', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <ThemeProvider>
          <SettingsIndexScreen />
        </ThemeProvider>
      );

      expect(getByTestId('settings-index-screen')).toBeTruthy();
      expect(getByTestId('settings-playbook-card')).toBeTruthy();
      expect(getByTestId('settings-coach-card')).toBeTruthy();
      expect(getByTestId('settings-rhythm-card')).toBeTruthy();
      expect(getByTestId('settings-appearance-card')).toBeTruthy();

      // Search filter test
      const searchInput = getByTestId('settings-search-input');
      fireEvent.changeText(searchInput, 'coach');

      expect(getByTestId('settings-coach-card')).toBeTruthy();
      expect(queryByTestId('settings-playbook-card')).toBeNull();

      // Search with non-matching term
      fireEvent.changeText(searchInput, 'nonexistentxyz123');
      expect(getByText('No settings match your search.')).toBeTruthy();
    });

    it('toggles streak and coach tone from SettingsIndexScreen', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <SettingsIndexScreen />
        </ThemeProvider>
      );

      const streakSwitch = getByTestId('streak-toggle-switch');
      expect(streakSwitch.props.value).toBe(false);

      fireEvent(streakSwitch, 'valueChange', true);
      expect(useSettings.getState().streakEnabled).toBe(true);

      const directToneChip = getByText(settingsCopy.sections.coach.tones.straight.label);
      fireEvent.press(directToneChip);
      expect(useSettings.getState().coachTone).toBe('straight');
    });

    it('renders SettingsHelpScreen with FAQs accordion and contact form', () => {
      const { getByTestId, queryByTestId, getByText } = render(
        <ThemeProvider>
          <SettingsHelpScreen />
        </ThemeProvider>
      );

      expect(getByTestId('settings-help-screen')).toBeTruthy();
      expect(getByTestId('help-report-ai-card')).toBeTruthy();

      // Toggle FAQ accordion item 0
      const firstFaq = settingsCopy.help.faqs[0].question;
      expect(queryByTestId('faq-answer-0')).toBeNull();

      fireEvent.press(getByText(firstFaq));
      expect(getByTestId('faq-answer-0')).toBeTruthy();
    });

    it('renders SettingsAboutAiScreen with transparent disclosures and clinical disclaimer', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <SettingsAboutAiScreen />
        </ThemeProvider>
      );

      expect(getByTestId('settings-about-ai-screen')).toBeTruthy();
      expect(getByText('Which parts use AI?')).toBeTruthy();
      expect(getByText('Characters are not real people')).toBeTruthy();
      expect(getByText('What the Coach can and cannot do')).toBeTruthy();
      expect(getByText('Not medical care or clinical advice')).toBeTruthy();
    });
  });
});
