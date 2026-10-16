import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import { systemCopy } from '../../copy/system';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/primitives/Button';
import { Text } from '../../ui/primitives/Text';
import { WinceMascot } from '../../ui/components/WinceMascot';

export interface WelcomeBackModalProps {
  visible: boolean;
  onStartWarmup: () => void;
  onDismiss: () => void;
  testID?: string;
}

export function WelcomeBackModal({
  visible,
  onStartWarmup,
  onDismiss,
  testID = 'welcome-back-modal',
}: WelcomeBackModalProps): React.JSX.Element {
  const { colors, spacing, radii } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID={testID}
    >
      <View style={[styles.backdrop, { backgroundColor: 'rgba(10, 12, 16, 0.75)' }]}>
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor: colors.surface1,
              borderColor: colors.line,
              borderRadius: radii.card,
              padding: spacing[6],
            },
          ]}
        >
          <View style={styles.mascotWrapper}>
            <WinceMascot pose="proud" size={96} />
          </View>

          <Text
            role="titleLarge"
            color={colors.ink}
            style={{ textAlign: 'center', marginBottom: spacing[2], fontWeight: '700' }}
          >
            {systemCopy.welcomeBack.title}
          </Text>

          <Text
            role="titleMedium"
            color={colors.muted}
            style={{ textAlign: 'center', marginBottom: spacing[1] }}
          >
            {systemCopy.welcomeBack.subtitle}
          </Text>

          <Text
            role="bodySmall"
            color={colors.muted}
            style={{ textAlign: 'center', marginBottom: spacing[6] }}
          >
            {systemCopy.welcomeBack.subtext}
          </Text>

          <Button
            label={systemCopy.welcomeBack.startWarmupAction}
            variant="primary"
            onPress={onStartWarmup}
            style={{ marginBottom: spacing[2], width: '100%' }}
          />

          <Button
            label={systemCopy.welcomeBack.maybeLaterAction}
            variant="ghost"
            onPress={onDismiss}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  contentCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  mascotWrapper: {
    marginBottom: 20,
  },
});
