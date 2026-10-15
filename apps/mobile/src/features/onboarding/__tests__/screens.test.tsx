import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import OnboardingIntroScreen from '../../../../app/(onboarding)/intro';
import QuizStepScreen from '../../../../app/(onboarding)/quiz/[step]';
import DeeperProfileScreen from '../../../../app/(onboarding)/deeper';
import PlaybookRevealScreen from '../../../../app/(onboarding)/playbook';
import { useOnboardingStore } from '../store';
import { ThemeProvider } from '../../../theme/ThemeProvider';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({ step: '1' }))
}));

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('Onboarding Screens', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
      replace: jest.fn(),
      back: jest.fn()
    });
    useOnboardingStore.getState().reset();
  });

  describe('Intro Screen (A3)', () => {
    it('renders headline, preview tiles, and navigation actions', () => {
      const { getByText, getByRole } = renderWithTheme(<OnboardingIntroScreen />);

      expect(getByText(/Let's build your/i)).toBeTruthy();
      expect(getByText('YOUR PACE')).toBeTruthy();
      expect(getByText('YOUR FIRST STEPS')).toBeTruthy();
      expect(getByText('YOUR COACH')).toBeTruthy();
      expect(getByText('PRIVATE BY DEFAULT')).toBeTruthy();

      const beginButton = getByRole('button', { name: 'Begin' });
      fireEvent.press(beginButton);
      expect(pushMock).toHaveBeenCalledWith('/(onboarding)/quiz/1');

      const skipButton = getByRole('button', { name: 'Skip, use defaults' });
      fireEvent.press(skipButton);
      expect(pushMock).toHaveBeenCalledWith('/(onboarding)/playbook');
    });
  });

  describe('Quiz Step Screen (A4)', () => {
    it('renders question 1, disables Next until option is selected, and allows Skip', () => {
      const { getByText, getByRole } = renderWithTheme(<QuizStepScreen />);

      expect(getByText('What do you most want to get better at?')).toBeTruthy();
      expect(getByText('Pick up to 3')).toBeTruthy();

      const nextButton = getByRole('button', { name: 'Next' });
      expect(nextButton.props.accessibilityState?.disabled).toBe(true);

      // Select Meetings chip
      const meetingsChip = getByText('Meetings');
      fireEvent.press(meetingsChip);

      expect(nextButton.props.accessibilityState?.disabled).toBe(false);

      fireEvent.press(nextButton);
      expect(pushMock).toHaveBeenCalledWith('/(onboarding)/quiz/2');
    });

    it('renders slider question with null initial value and enables Next upon touch', () => {
      const mockParams = jest.requireMock('expo-router').useLocalSearchParams;
      mockParams.mockReturnValue({ step: '5' });

      const { getByText, getByRole } = renderWithTheme(<QuizStepScreen />);

      expect(getByText('After an hour of socialising I feel...')).toBeTruthy();
      expect(getByText('Charged')).toBeTruthy();
      expect(getByText('Need a day alone')).toBeTruthy();

      const nextButton = getByRole('button', { name: 'Next' });
      expect(nextButton.props.accessibilityState?.disabled).toBe(true);

      // Touch/increment slider
      const slider = getByRole('adjustable');
      fireEvent(slider, 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' }
      });

      expect(nextButton.props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('Deeper Profile Screen (A5)', () => {
    it('renders statement, 5 score options, and continues to next statement or completes', () => {
      const { getByText, getByRole } = renderWithTheme(<DeeperProfileScreen />);

      expect(getByText(/Want to go a little/i)).toBeTruthy();
      expect(getByText(/I feel energised after time with a group/i)).toBeTruthy();

      // Tap score 4
      const score4Button = getByRole('radio', { name: 'Score 4 of 5' });
      fireEvent.press(score4Button);

      const continueButton = getByRole('button', { name: 'Continue' });
      fireEvent.press(continueButton);

      // Advance to statement 2
      expect(getByText(/I prefer one-to-one conversations/i)).toBeTruthy();

      // Skip navigates to playbook
      const skipButton = getByRole('button', { name: 'Skip for now' });
      fireEvent.press(skipButton);
      expect(pushMock).toHaveBeenCalledWith('/(onboarding)/playbook');
    });
  });

  describe('Playbook Reveal Screen (A8)', () => {
    it('renders all 5 playbook tiles with edit buttons and Save button', () => {
      useOnboardingStore.getState().updateDerivedPlaybook();

      const { getByText, getByRole } = renderWithTheme(<PlaybookRevealScreen />);

      expect(getByText('Your Playbook')).toBeTruthy();
      expect(getByText('YOUR PACE')).toBeTruthy();
      expect(getByText('YOUR BATTERY')).toBeTruthy();
      expect(getByText('HARDEST PLACES')).toBeTruthy();
      expect(getByText('FIRST STEPS')).toBeTruthy();
      expect(getByText('YOUR COACH')).toBeTruthy();

      const editPaceBtn = getByRole('button', { name: 'Edit YOUR PACE' });
      expect(editPaceBtn).toBeTruthy();

      const saveButton = getByRole('button', { name: 'Save my Playbook' });
      fireEvent.press(saveButton);
      expect(pushMock).toHaveBeenCalledWith('/(auth)/sign-in');
    });
  });
});
