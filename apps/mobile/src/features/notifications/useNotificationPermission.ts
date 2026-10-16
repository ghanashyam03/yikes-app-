/**
 * useNotificationPermission.ts — Just-in-time permission flow hook
 * 
 * PRODUCT RULE: Preceded by a sample-notification preview before requesting system permission.
 */

import { useCallback, useEffect } from 'react';
import {
  getNotificationPermissionStatus,
  getPushTokenAsync,
  requestNotificationPermissions,
} from './scheduler';
import { useNotificationsStore } from './notificationsStore';

export function useNotificationPermission() {
  const permissionStatus = useNotificationsStore((state) => state.permissionStatus);
  const showPreviewModal = useNotificationsStore((state) => state.showPreviewModal);
  const setPermissionStatus = useNotificationsStore((state) => state.setPermissionStatus);
  const setPushToken = useNotificationsStore((state) => state.setPushToken);
  const openPreviewModal = useNotificationsStore((state) => state.openPreviewModal);
  const closePreviewModal = useNotificationsStore((state) => state.closePreviewModal);

  // Sync initial permission status on mount
  useEffect(() => {
    let isMounted = true;
    void getNotificationPermissionStatus().then((status) => {
      if (isMounted) {
        setPermissionStatus(status);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setPermissionStatus]);

  /**
   * Request permission flow:
   * If permission is already granted, resolves true immediately.
   * Otherwise, opens the sample preview modal first.
   */
  const requestPermissionWithPreview = useCallback(async (): Promise<boolean> => {
    const current = await getNotificationPermissionStatus();
    setPermissionStatus(current);

    if (current === 'granted') {
      return true;
    }

    // Always show preview first before prompting system alert
    openPreviewModal();
    return false;
  }, [openPreviewModal, setPermissionStatus]);

  /**
   * Called when user confirms the in-app preview:
   * Requests actual system permission and retrieves push token if granted.
   */
  const confirmPermission = useCallback(async (): Promise<boolean> => {
    closePreviewModal();

    const granted = await requestNotificationPermissions();
    const newStatus = granted ? 'granted' : 'denied';
    setPermissionStatus(newStatus);

    if (granted) {
      const token = await getPushTokenAsync();
      if (token) {
        setPushToken(token);
      }
    }

    return granted;
  }, [closePreviewModal, setPermissionStatus, setPushToken]);

  /**
   * Called when user dismisses or skips the preview:
   * Closes preview without triggering system permission.
   */
  const dismissPreview = useCallback(() => {
    closePreviewModal();
  }, [closePreviewModal]);

  return {
    permissionStatus,
    showPreviewModal,
    requestPermissionWithPreview,
    confirmPermission,
    dismissPreview,
  };
}
