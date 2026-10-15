import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsPrivacyScreen from '../../../../app/settings/privacy';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { privacyCopy } from '../../../copy/privacy';
import { usePrivacy } from '../usePrivacy';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

// Mock privacyApi
jest.mock('../privacyApi', () => ({
  requestDataExport: jest.fn().mockResolvedValue({
    downloadUrl: '/v1/privacy/export/export-123',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    exportId: 'export-123',
  }),
  fetchExportPayload: jest.fn().mockResolvedValue({ userId: 'test-user' }),
  requestDeleteText: jest.fn().mockResolvedValue({
    ok: true,
    deletedTurns: 4,
    clearedDebriefs: 1,
    clearedJournals: 1,
    message: 'Success',
  }),
  requestDeleteAccount: jest.fn().mockResolvedValue({
    ok: true,
    message: 'Account deleted',
  }),
  checkCanUseImprovement: jest.fn().mockResolvedValue(false),
}));

// Mock auth session
jest.mock('../../auth/useSession', () => {
  const mockState = {
    session: {
      user: { id: 'test-user-id', email: 'test@example.com' },
      accessToken: 'fake-token-jwt',
    },
  };
  return {
    useSession: () => mockState,
    useSessionStore: {
      getState: () => mockState,
    },
  };
});

// Mock consentManager
jest.mock('../../auth/consentManager', () => ({
  DEFAULT_CONSENTS: {
    required: true,
    analytics: false,
    improve_ai: false,
    marketing: false,
  },
  getConsents: jest.fn().mockResolvedValue({
    required: true,
    analytics: false,
    improve_ai: false,
    marketing: false,
  }),
  saveConsents: jest.fn().mockResolvedValue({ ok: true }),
}));

// Mock otpManager
jest.mock('../../auth/otpManager', () => ({
  requestOtp: jest.fn().mockResolvedValue({ ok: true }),
}));

describe('D3 Privacy Centre Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePrivacy.setState({
      consents: {
        required: true,
        analytics: false,
        improve_ai: false,
        marketing: false,
      },
      exportState: { status: 'idle' },
      deleteTextState: { status: 'idle' },
      deleteAccountState: { status: 'idle' },
      isConfirmTextModalOpen: false,
      isDeleteAccountModalOpen: false,
      otpCode: '',
    });
  });

  it('renders title, subtitle, and all 4 consent options with plain language', async () => {
    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <SettingsPrivacyScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText(privacyCopy.header.title)).toBeTruthy();
      expect(getByText(privacyCopy.header.subtitle)).toBeTruthy();
    });

    // 4 Consents
    expect(getByText(privacyCopy.consents.required.title)).toBeTruthy();
    expect(getByText(privacyCopy.consents.required.alwaysActiveBadge)).toBeTruthy();
    expect(getByText(privacyCopy.consents.analytics.title)).toBeTruthy();
    expect(getByText(privacyCopy.consents.improveAi.title)).toBeTruthy();
    expect(getByText(privacyCopy.consents.marketing.title)).toBeTruthy();
  });

  it('renders model training disclaimer explaining trained models cannot be untrained', () => {
    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <SettingsPrivacyScreen />
      </ThemeProvider>
    );

    expect(getByText(privacyCopy.disclaimer.title)).toBeTruthy();
    expect(getByText(privacyCopy.disclaimer.text)).toBeTruthy();
  });

  it('toggles consent when user switches Improve AI toggle', async () => {
    const { getByLabelText } = render(
      <ThemeProvider initialPreference="light">
        <SettingsPrivacyScreen />
      </ThemeProvider>
    );

    const toggle = getByLabelText(
      privacyCopy.consents.toggleAccessibility('Improve AI', false)
    );
    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => {
      expect(usePrivacy.getState().consents.improve_ai).toBe(true);
    });
  });

  it('handles "Download my data" request and shows 24h expiration link', async () => {
    const { getByLabelText, getByText } = render(
      <ThemeProvider initialPreference="light">
        <SettingsPrivacyScreen />
      </ThemeProvider>
    );

    const downloadBtn = getByLabelText(privacyCopy.export.buttonLabel);
    fireEvent.press(downloadBtn);

    await waitFor(() => {
      expect(usePrivacy.getState().exportState.status).toBe('ready');
      expect(getByText(privacyCopy.export.readyTitle)).toBeTruthy();
      expect(getByText(privacyCopy.export.expiresIn(24))).toBeTruthy();
    });
  });

  it('opens confirmation modal for Delete Practice Text emphasizing skills are kept', async () => {
    const { getByLabelText, getAllByText } = render(
      <ThemeProvider initialPreference="light">
        <SettingsPrivacyScreen />
      </ThemeProvider>
    );

    const deleteTextBtn = getByLabelText(privacyCopy.deleteText.buttonLabel);
    fireEvent.press(deleteTextBtn);

    await waitFor(() => {
      expect(usePrivacy.getState().isConfirmTextModalOpen).toBe(true);
      // Guarantee that progress is preserved is rendered in modal
      const keptGuarantees = getAllByText(privacyCopy.deleteText.keptGuarantee);
      expect(keptGuarantees.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens OTP modal for Delete Account with 30-day notice and handles confirmation', async () => {
    const { getByLabelText, getByPlaceholderText, getAllByText } = render(
      <ThemeProvider initialPreference="light">
        <SettingsPrivacyScreen />
      </ThemeProvider>
    );

    const deleteAccountBtn = getByLabelText(privacyCopy.deleteAccount.buttonLabel);
    fireEvent.press(deleteAccountBtn);

    await waitFor(() => {
      expect(usePrivacy.getState().isDeleteAccountModalOpen).toBe(true);
      const notices = getAllByText(privacyCopy.deleteAccount.notice30Days);
      expect(notices.length).toBeGreaterThanOrEqual(1);
    });

    // Enter 6-digit OTP
    const otpInput = getByPlaceholderText(privacyCopy.deleteAccount.otpPlaceholder);
    fireEvent.changeText(otpInput, '123456');

    // Confirm deletion
    const confirmBtn = getByLabelText(privacyCopy.deleteAccount.confirmButton);
    fireEvent.press(confirmBtn);

    await waitFor(() => {
      expect(usePrivacy.getState().deleteAccountState.status).toBe('success');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('back button navigates back to previous screen', () => {
    const { getByLabelText } = render(
      <ThemeProvider initialPreference="light">
        <SettingsPrivacyScreen />
      </ThemeProvider>
    );

    const backBtn = getByLabelText(privacyCopy.header.backLabel);
    fireEvent.press(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });
});
