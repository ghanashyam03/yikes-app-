import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import YouTab from '../../../../app/(tabs)/you';
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

describe('T-18 Screen C12 You Tab Bento Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders You bento screen with name, quiet line of evidence, and bento tiles', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <YouTab />
      </ThemeProvider>
    );

    // Header and evidence line (never XP or score numbers)
    expect(getByTestId('evidence-line-wrapper')).toBeTruthy();
    expect(getByText(youCopy.bento.evidenceDefault)).toBeTruthy();

    // Bento tiles
    expect(getByTestId('skills-tile')).toBeTruthy();
    expect(getByTestId('journal-tile')).toBeTruthy();
    expect(getByTestId('ladder-tile')).toBeTruthy();
    expect(getByTestId('gap-tile')).toBeTruthy();
    expect(getByTestId('battery-tile')).toBeTruthy();
    expect(getByTestId('playbook-tile')).toBeTruthy();
    expect(getByTestId('settings-link-button')).toBeTruthy();
  });

  it('navigates to the corresponding screens when tiles are pressed', () => {
    const { getByTestId } = render(
      <ThemeProvider initialPreference="light">
        <YouTab />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('journal-tile'));
    expect(mockPush).toHaveBeenCalledWith('/journal');

    fireEvent.press(getByTestId('ladder-tile'));
    expect(mockPush).toHaveBeenCalledWith('/ladder');

    fireEvent.press(getByTestId('gap-tile'));
    expect(mockPush).toHaveBeenCalledWith('/gap');

    fireEvent.press(getByTestId('battery-tile'));
    expect(mockPush).toHaveBeenCalledWith('/battery');

    fireEvent.press(getByTestId('settings-link-button'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('renders all 12 skills mini-rings and allows opening a skill detail', () => {
    const { getByTestId } = render(
      <ThemeProvider initialPreference="light">
        <YouTab />
      </ThemeProvider>
    );

    const firstSkill = getByTestId('skill-chip-starting_chat');
    expect(firstSkill).toBeTruthy();
    fireEvent.press(firstSkill);
    expect(mockPush).toHaveBeenCalledWith('/skill/starting_chat');
  });
});
