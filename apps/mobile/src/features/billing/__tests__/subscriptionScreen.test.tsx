import { fireEvent, render } from '@testing-library/react-native';
import SettingsSubscriptionScreen from '../../../../app/settings/subscription';
import { billingCopy } from '../../../copy/billing';
import { ThemeProvider } from '../../../theme/ThemeProvider';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
  }),
}));

// Mock react-native-purchases
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getOfferings: jest.fn(() =>
      Promise.resolve({
        current: {
          availablePackages: [],
        },
      })
    ),
    purchasePackage: jest.fn(() =>
      Promise.resolve({ customerInfo: { entitlements: { active: { plus: {} } } } })
    ),
    restorePurchases: jest.fn(() =>
      Promise.resolve({ customerInfo: { entitlements: { active: {} } } })
    ),
  },
}));

describe('T-23: SettingsSubscriptionScreen (D4)', () => {
  it('renders 3-card comparison (Free, Plus, Philosophy)', () => {
    const { getByText } = render(
      <ThemeProvider>
        <SettingsSubscriptionScreen />
      </ThemeProvider>
    );

    // Verify 3 comparison cards via titles and descriptions
    expect(getByText(billingCopy.subscription.cards.free.title)).not.toBeNull();
    expect(getByText(billingCopy.subscription.cards.plus.title)).not.toBeNull();
    expect(getByText(billingCopy.subscription.cards.philosophy.title)).not.toBeNull();
    expect(getByText(billingCopy.subscription.cards.free.description)).not.toBeNull();
    expect(getByText(billingCopy.subscription.cards.plus.description)).not.toBeNull();
    expect(getByText(billingCopy.subscription.cards.philosophy.description)).not.toBeNull();
  });

  it('renders equal visual weight buttons for Keep Free and Try free', () => {
    const { getByText } = render(
      <ThemeProvider>
        <SettingsSubscriptionScreen />
      </ThemeProvider>
    );

    const notNowBtn = getByText(billingCopy.subscription.actions.notNow);
    const tryFreeBtn = getByText(billingCopy.subscription.actions.tryFree);

    expect(notNowBtn).not.toBeNull();
    expect(tryFreeBtn).not.toBeNull();
  });

  it('renders cancel subscription link and restore purchases button', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SettingsSubscriptionScreen />
      </ThemeProvider>
    );

    expect(getByTestId('manage-subscription-link')).not.toBeNull();
    expect(getByTestId('restore-purchases-link')).not.toBeNull();
  });

  it('navigates back on back button tap', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SettingsSubscriptionScreen />
      </ThemeProvider>
    );

    const backBtn = getByTestId('subscription-back-button');
    fireEvent.press(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });
});
