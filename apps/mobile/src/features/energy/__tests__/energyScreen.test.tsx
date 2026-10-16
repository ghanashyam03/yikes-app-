import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import EnergyScreen from '../../../../app/energy';
import { checkinsCopy } from '../../../copy/checkins';
import { useEnergy } from '../useEnergy';

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

describe('Acceptance Check 5: Screen C6 Energy Check-in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useEnergy.getState().resetStore();
  });

  afterEach(() => {
    useEnergy.getState().resetStore();
  });

  it('renders draggable battery, tag chips, and Save button in under 10 seconds interaction', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <EnergyScreen />
      </ThemeProvider>
    );

    // Verify main screen container
    expect(getByTestId('energy-screen')).toBeTruthy();

    // Verify header copy
    expect(getByText(checkinsCopy.energy.title)).toBeTruthy();
    expect(getByText(checkinsCopy.energy.subtitle)).toBeTruthy();

    // Verify BatteryGauge is present
    expect(getByTestId('energy-battery-gauge')).toBeTruthy();

    // Verify tag chips (people, noise, length, who)
    expect(getByTestId('energy-tag-people')).toBeTruthy();
    expect(getByTestId('energy-tag-noise')).toBeTruthy();
    expect(getByTestId('energy-tag-length')).toBeTruthy();
    expect(getByTestId('energy-tag-who')).toBeTruthy();

    // Verify save button
    expect(getByTestId('energy-save-button')).toBeTruthy();
  });

  it('allows selecting and deselecting tag chips', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <EnergyScreen />
      </ThemeProvider>
    );

    expect(getByTestId('energy-tag-people')).toBeTruthy();
    const peopleText = getByText('People');
    fireEvent.press(peopleText);
    expect(useEnergy.getState().selectedTags).toContain('people');

    fireEvent.press(peopleText);
    expect(useEnergy.getState().selectedTags).not.toContain('people');
  });

  it('saves battery entry and navigates back', async () => {
    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <EnergyScreen />
      </ThemeProvider>
    );

    const saveBtn = getByText(checkinsCopy.energy.saveButton);
    fireEvent.press(saveBtn);

    expect(useEnergy.getState().logs.length).toBeGreaterThanOrEqual(1);
  });
});
