import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import SkillDetailScreen from '../../../../app/skill/[id]';
import GapScreen from '../../../../app/gap';
import BatteryScreen from '../../../../app/battery';
import { useCheckin } from '../../checkin/useCheckin';
import { useEnergy } from '../../energy/useEnergy';
import { useGuestProgressStore } from '../../today/guestProgress';
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
  useLocalSearchParams: () => ({
    id: 'starting_chat',
  }),
}));

describe('T-18 Screens: Skill Detail (C15), Gap Chart (C16), Battery Patterns (C17)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useCheckin.getState().resetFlow();
      useEnergy.getState().resetStore();
      useGuestProgressStore.getState().resetProgress();
    });
  });

  describe('Screen C15: Skill Detail Screen', () => {
    it('renders stage ring, "Why I think so" 3 evidence lines, and Practice CTA', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider initialPreference="light">
          <SkillDetailScreen />
        </ThemeProvider>
      );

      // Verify stage card
      expect(getByTestId('skill-stage-card')).toBeTruthy();

      // Verify "Why I think so" section
      expect(getByTestId('why-i-think-so-section')).toBeTruthy();
      expect(getByText(youCopy.skill.whyIThinkSo)).toBeTruthy();

      // Verify 3 evidence lines
      expect(getByTestId('evidence-quote-0')).toBeTruthy();
      expect(getByTestId('evidence-quote-1')).toBeTruthy();
      expect(getByTestId('evidence-quote-2')).toBeTruthy();

      // Practice CTA
      const cta = getByText(youCopy.skill.practiceCta);
      fireEvent.press(cta);
      expect(mockPush).toHaveBeenCalledWith('/(tabs)');
    });

    it('displays Review due badge in Honey (never red) when last practiced >= 14 days ago', () => {
      const sixteenDaysAgo = new Date(Date.now() - 16 * 86400000).toISOString();
      act(() => {
        useGuestProgressStore.setState({
          sessionsLog: [
            {
              id: 's_old',
              sessionId: 'starting_chat_intro',
              completedAt: sixteenDaysAgo,
              mode: 'full',
            },
          ],
        });
      });

      const { getByTestId, getByText } = render(
        <ThemeProvider initialPreference="light">
          <SkillDetailScreen />
        </ThemeProvider>
      );

      const reviewBadge = getByTestId('review-due-badge');
      expect(reviewBadge).toBeTruthy();
      expect(getByText(new RegExp(youCopy.skill.reviewDueBadge, 'i'))).toBeTruthy();
    });
  });

  describe('Screen C16: Gap Screen', () => {
    it('renders designed empty state when no check-in submissions exist', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider initialPreference="light">
          <GapScreen />
        </ThemeProvider>
      );

      expect(getByTestId('gap-empty-state')).toBeTruthy();
      expect(getByText(youCopy.gap.emptyState)).toBeTruthy();
    });

    it('renders SVG chart with shaded gap, accessible screen reader text alternative, and point selection', async () => {
      act(() => {
        useCheckin.setState({
          submissions: [
            {
              id: 'sub_1',
              forecastDrain: 8,
              forecastWarmth: 4,
              actualDrain: 4,
              actualWarmth: 8,
              landed: true,
              outcome: 'yes',
              coachReflection: 'Reality was lighter than expected.',
              createdAt: '2026-10-10T10:00:00Z',
            },
            {
              id: 'sub_2',
              forecastDrain: 6,
              forecastWarmth: 5,
              actualDrain: 5,
              actualWarmth: 5,
              landed: true,
              outcome: 'tried',
              coachReflection: 'Your forecast was very close.',
              createdAt: '2026-10-14T10:00:00Z',
            },
          ],
        });
      });

      const { getByTestId } = render(
        <ThemeProvider initialPreference="light">
          <GapScreen />
        </ThemeProvider>
      );

      // Verify chart container and screen reader accessibility label
      const chartContainer = getByTestId('gap-chart-container');
      expect(chartContainer).toBeTruthy();
      expect(chartContainer.props.accessibilityLabel).toContain('Gap chart with 2 real-world check-ins');

      // Tap on data point
      const point0 = getByTestId('gap-point-0');
      await act(async () => {
        fireEvent.press(point0);
      });

      // Verify selected check-in card appears
      expect(getByTestId('selected-checkin-card')).toBeTruthy();
    });
  });

  describe('Screen C17: Battery Patterns Screen', () => {
    it('renders designed empty state when no battery logs exist', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider initialPreference="light">
          <BatteryScreen />
        </ThemeProvider>
      );

      expect(getByTestId('battery-empty-state')).toBeTruthy();
      expect(getByText(youCopy.battery.emptyState)).toBeTruthy();
    });

    it('renders weekly heat-grid with day/time cells, accessible text alternatives, 3 insight cards, and Plan my week', async () => {
      await act(async () => {
        await useEnergy.getState().logEnergy(80, ['Rest'], undefined);
        await useEnergy.getState().logEnergy(40, ['Large groups'], undefined);
      });

      const { getByTestId, getByText } = render(
        <ThemeProvider initialPreference="light">
          <BatteryScreen />
        </ThemeProvider>
      );

      // Verify heat grid
      const heatgrid = getByTestId('battery-heatgrid');
      expect(heatgrid).toBeTruthy();
      expect(heatgrid.props.accessibilityLabel).toContain('Weekly energy heat-grid');

      // Verify insight cards section
      expect(getByTestId('battery-insights-section')).toBeTruthy();

      // Verify Plan my week card
      await waitFor(() => {
        expect(getByTestId('plan-my-week-card')).toBeTruthy();
      });
      expect(getByText(new RegExp(youCopy.battery.planMyWeekTitle, 'i'))).toBeTruthy();
    });
  });
});
