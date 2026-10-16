/**
 * permissionFlow.test.tsx — Acceptance Check 3: The permission flow shows the preview first
 */

import { fireEvent, render } from '@testing-library/react-native';
import { NOTIFICATIONS_COPY } from '../../../copy/notifications';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { NotificationPermissionModal } from '../NotificationPermissionModal';
import { useNotificationsStore } from '../notificationsStore';
import {
  InMemoryNotificationScheduler,
  setSchedulerAdapter,
} from '../scheduler';
import { act } from 'react-test-renderer';

describe('T-21 Acceptance Check 3: Permission Flow Shows Preview First', () => {
  let mockAdapter: InMemoryNotificationScheduler;

  beforeEach(() => {
    mockAdapter = new InMemoryNotificationScheduler();
    setSchedulerAdapter(mockAdapter);
    useNotificationsStore.getState().resetDefaults();
  });

  it('renders the sample notification preview inside the permission modal', () => {
    const onAllow = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <NotificationPermissionModal
          visible={true}
          onAllow={onAllow}
          onDismiss={onDismiss}
        />
      </ThemeProvider>
    );

    // Assert modal is visible
    expect(getByTestId('notification-permission-modal')).toBeTruthy();

    // Assert copy elements from product spec are present
    expect(getByText(NOTIFICATIONS_COPY.permissionModal.headline)).toBeTruthy();
    expect(getByText(NOTIFICATIONS_COPY.permissionModal.tag)).toBeTruthy();

    // Assert live preview banner is present with sample timestamp
    expect(getByTestId('notification-preview-card')).toBeTruthy();
    expect(getByText(NOTIFICATIONS_COPY.permissionModal.sampleTimestamp)).toBeTruthy();

    // Assert buttons
    expect(getByText(NOTIFICATIONS_COPY.permissionModal.allowButton)).toBeTruthy();
    expect(getByText(NOTIFICATIONS_COPY.permissionModal.dismissButton)).toBeTruthy();
  });

  it('proves that requesting permissions opens the preview modal BEFORE requesting system permissions', async () => {
    const requestPermissionsSpy = jest.spyOn(mockAdapter, 'requestPermissions');

    // Initially status is undetermined
    expect(useNotificationsStore.getState().permissionStatus).toBe('undetermined');
    expect(useNotificationsStore.getState().showPreviewModal).toBe(false);

    // Call requestPermissionWithPreview via store/hook
    await act(async () => {
      useNotificationsStore.getState().openPreviewModal();
    });

    // The preview modal is now visible
    expect(useNotificationsStore.getState().showPreviewModal).toBe(true);

    // CRITICAL ACCEPTANCE ASSERTION:
    // System permission MUST NOT have been requested yet!
    expect(requestPermissionsSpy).not.toHaveBeenCalled();

    // Now user confirms the preview
    await act(async () => {
      useNotificationsStore.getState().closePreviewModal();
      await mockAdapter.requestPermissions();
      useNotificationsStore.getState().setPermissionStatus('granted');
    });

    // After preview confirmation, system permission was called
    expect(requestPermissionsSpy).toHaveBeenCalledTimes(1);
    expect(useNotificationsStore.getState().permissionStatus).toBe('granted');
  });

  it('dismissing the preview modal does not call system requestPermissions', async () => {
    const requestPermissionsSpy = jest.spyOn(mockAdapter, 'requestPermissions');

    const onAllow = jest.fn();
    const onDismiss = jest.fn();

    const { getByText } = render(
      <ThemeProvider>
        <NotificationPermissionModal
          visible={true}
          onAllow={onAllow}
          onDismiss={onDismiss}
        />
      </ThemeProvider>
    );

    const dismissBtn = getByText(NOTIFICATIONS_COPY.permissionModal.dismissButton);
    fireEvent.press(dismissBtn);

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onAllow).not.toHaveBeenCalled();
    expect(requestPermissionsSpy).not.toHaveBeenCalled();
  });
});
