/**
 * NotificationPermissionModal.tsx — Just-in-time permission flow modal
 * 
 * PRODUCT RULE: Preceded by a sample-notification preview before requesting system permission.
 */

import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { NOTIFICATIONS_COPY } from '../../copy/notifications';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/primitives/Button';
import { Text } from '../../ui/primitives/Text';
import { NotificationPreviewCard } from './NotificationPreviewCard';

export interface NotificationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDismiss: () => void;
  sampleBody?: string;
}

export function NotificationPermissionModal({
  visible,
  onAllow,
  onDismiss,
  sampleBody = NOTIFICATIONS_COPY.rhythmNudge.morning,
}: NotificationPermissionModalProps): React.JSX.Element {
  const { colors, radii, spacing } = useTheme();
  const copy = NOTIFICATIONS_COPY.permissionModal;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        testID="notification-permission-modal"
        style={styles.backdrop}
        accessibilityRole="alert"
        accessibilityLabel={copy.headline}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface1,
              borderRadius: radii.sheet ?? 28,
              padding: spacing[6],
            },
          ]}
        >
          {/* Header Tag */}
          <Text
            role="labelSmall"
            muted
            style={styles.tagText}
          >
            {copy.tag}
          </Text>

          {/* Title */}
          <Text
            role="titleLarge"
            style={[styles.headline, { color: colors.ink }]}
          >
            {copy.headline}
          </Text>

          {/* Explanation */}
          <Text
            role="bodyMedium"
            style={[styles.body, { color: colors.muted }]}
          >
            {copy.body}
          </Text>

          {/* Sample Notification Preview */}
          <View style={styles.previewContainer}>
            <NotificationPreviewCard
              title="yikes!"
              body={sampleBody}
              timestamp={copy.sampleTimestamp}
              badge="Preview"
            />
          </View>

          {/* Action buttons */}
          <View style={styles.buttonStack}>
            <Button
              variant="primary"
              label={copy.allowButton}
              onPress={onAllow}
              accessibilityLabel={copy.allowButton}
            />
            <Button
              variant="ghost"
              label={copy.dismissButton}
              onPress={onDismiss}
              accessibilityLabel={copy.dismissButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  tagText: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 6,
  },
  headline: {
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    lineHeight: 20,
    marginBottom: 16,
  },
  previewContainer: {
    marginVertical: 12,
  },
  buttonStack: {
    marginTop: 16,
    gap: 10,
  },
});
