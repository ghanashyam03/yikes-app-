import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { Button } from '../primitives/Button';
import { WinceMascot, type WincePose } from './WinceMascot';
import { componentsCopy } from '../../copy/components';

export interface EmptyStateProps {
  pose?: WincePose;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({
  pose = 'curious',
  title,
  description,
  actionLabel,
  onAction,
  accessibilityLabel,
  style,
  testID = 'empty-state'
}: EmptyStateProps): React.JSX.Element {
  const { colors, radii } = useTheme();

  const finalTitle = title ?? componentsCopy.emptyState.defaultTitle;
  const finalDesc = description ?? componentsCopy.emptyState.defaultDescription;
  const finalActionLabel = actionLabel ?? componentsCopy.emptyState.defaultAction;

  const a11yLabel =
    accessibilityLabel ?? `${finalTitle}. ${finalDesc}`;

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={a11yLabel}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface1,
          borderRadius: radii.card,
          borderColor: colors.line
        },
        style
      ]}
    >
      {/* 1px top-left glossy inner highlight */}
      <View
        style={[
          styles.innerHighlight,
          { borderRadius: radii.card }
        ]}
      />

      {/* Mascot illustration */}
      <View style={styles.mascotWrapper}>
        <WinceMascot pose={pose} size={84} />
      </View>

      {/* Title */}
      <Text
        role="titleLarge"
        style={[styles.title, { color: colors.ink }]}
      >
        {finalTitle}
      </Text>

      {/* Description */}
      <Text
        role="bodyMedium"
        style={[styles.description, { color: colors.muted }]}
      >
        {finalDesc}
      </Text>

      {/* Action Button */}
      {onAction && (
        <View style={styles.actionContainer}>
          <Button
            label={finalActionLabel}
            onPress={onAction}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
    marginVertical: 12
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    pointerEvents: 'none'
  },
  mascotWrapper: {
    marginBottom: 16
  },
  title: {
    textAlign: 'center',
    marginBottom: 8
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 300,
    lineHeight: 22
  },
  actionContainer: {
    width: '100%',
    maxWidth: 240,
    minHeight: 48
  }
});
