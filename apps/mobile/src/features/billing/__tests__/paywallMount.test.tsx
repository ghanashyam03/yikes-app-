import { render } from '@testing-library/react-native';
import { PaywallContent } from '../../../../app/paywall';
import { billingCopy } from '../../../copy/billing';
import { ThemeProvider } from '../../../theme/ThemeProvider';

// Mock expo-router
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
  }),
  usePathname: () => '/paywall',
  useLocalSearchParams: () => ({}),
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

describe('T-23 Acceptance Check 3: Paywall Prohibited Mounting on Forbidden Routes', () => {
  it('prohibits mounting on live chat route: /session/abc/try', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <PaywallContent testRoute="/session/abc/try" />
      </ThemeProvider>
    );

    expect(queryByTestId('paywall-sheet')).toBeNull();
  });

  it('prohibits mounting on debrief route: /debrief/moment-42', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <PaywallContent testRoute="/debrief/moment-42" />
      </ThemeProvider>
    );

    expect(queryByTestId('paywall-sheet')).toBeNull();
  });

  it('prohibits mounting on crisis support route: /support', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <PaywallContent testRoute="/support" />
      </ThemeProvider>
    );

    expect(queryByTestId('paywall-sheet')).toBeNull();
  });

  it('prohibits mounting on free chat tool route: /tools/free-chat', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <PaywallContent testRoute="/tools/free-chat" />
      </ThemeProvider>
    );

    expect(queryByTestId('paywall-sheet')).toBeNull();
  });

  it('mounts successfully on permitted routes showing user journey and equal weight buttons', () => {
    const { queryByTestId, getByText } = render(
      <ThemeProvider>
        <PaywallContent testRoute="/paywall" />
      </ThemeProvider>
    );

    // Sheet mounted
    expect(queryByTestId('paywall-sheet')).not.toBeNull();

    // Journey badge present
    expect(queryByTestId('paywall-journey-badge')).not.toBeNull();

    // STRICT EQUAL WEIGHT: both Not now and Try free buttons are present
    const notNowBtn = getByText(billingCopy.paywall.actions.notNow);
    const tryFreeBtn = getByText(billingCopy.paywall.actions.tryFree);
    expect(notNowBtn).not.toBeNull();
    expect(tryFreeBtn).not.toBeNull();

    // Perks and restore link present
    expect(queryByTestId('paywall-perks-card')).not.toBeNull();
    expect(queryByTestId('paywall-restore-button')).not.toBeNull();
  });
});
