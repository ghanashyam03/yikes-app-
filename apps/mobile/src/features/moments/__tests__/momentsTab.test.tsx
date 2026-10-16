import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import MomentsTab from '../../../../app/(tabs)/moments';
import { momentsCopy } from '../../../copy/moments';
import { useMoments } from '../useMoments';
import type { Moment } from '../types';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Acceptance Check 5: Moments Tab & Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMoments.getState().resetStore();
  });

  afterEach(() => {
    useMoments.getState().resetStore();
  });

  it('displays empty state with exact prompt when no moments exist', () => {
    const { getByTestId, getByText, getByLabelText } = render(
      <ThemeProvider initialPreference="light">
        <MomentsTab />
      </ThemeProvider>
    );

    // Verify empty state container exists
    expect(getByTestId('moments-empty-state')).toBeTruthy();

    // Verify exact empty state title & body per specification
    expect(getByText('No upcoming moments')).toBeTruthy();
    expect(
      getByText("Add the next conversation you're nervous about. It takes 15 seconds.")
    ).toBeTruthy();

    // Verify Floating Add Moment button is present
    const addBtn = getByLabelText(momentsCopy.tab.floatingAddA11y);
    expect(addBtn).toBeTruthy();

    // Tap Add button and verify navigation to /moments/new
    fireEvent.press(addBtn);
    expect(mockPush).toHaveBeenCalledWith('/moments/new');
  });

  it('renders battery gauge and recovery tip on Moments tab header', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <MomentsTab />
      </ThemeProvider>
    );

    expect(getByTestId('moments-battery-gauge')).toBeTruthy();
    expect(getByText(/SOCIAL BATTERY/)).toBeTruthy();
  });

  it('renders timeline cards when moments are present', () => {
    const sampleMoment: Moment = {
      id: 'm_test_1',
      title: 'Quarterly Check-in with Sarah',
      eventDate: '2026-10-25T14:00:00Z',
      status: 'upcoming',
      attendees: 'Sarah',
      prepPayload: {
        openerOptions: ['Hey Sarah, good afternoon!', 'Hi Sarah!'],
        questions: ['How has Q3 been?', 'What is next?'],
        exitLine: 'Thanks Sarah, great chat!',
        quietBreak: '5 min walk',
        recoveryPlan: 'Tea afterwards',
      },
    };

    useMoments.setState({
      moments: [sampleMoment],
      isLoading: false,
      error: null,
      selectedFilter: 'upcoming',
    });

    const { getByTestId, getByText, queryByTestId } = render(
      <ThemeProvider initialPreference="light">
        <MomentsTab />
      </ThemeProvider>
    );

    // Empty state should NOT be visible
    expect(queryByTestId('moments-empty-state')).toBeNull();

    // Card should be rendered
    expect(getByTestId('moment-card-m_test_1')).toBeTruthy();
    expect(getByText('Quarterly Check-in with Sarah')).toBeTruthy();
    expect(getByText('Prep ready')).toBeTruthy();
    expect(getByText('~20% energy cost')).toBeTruthy();
  });

  it('switches to Past segment and displays past empty state when no past moments exist', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <MomentsTab />
      </ThemeProvider>
    );

    const pastTab = getByTestId('segment-past');
    fireEvent.press(pastTab);

    expect(getByText('No past moments yet')).toBeTruthy();
  });
});
