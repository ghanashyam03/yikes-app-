import React, { useEffect } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { CloseIcon } from '../icons/CloseIcon';
import { componentsCopy } from '../../copy/components';

export interface ErrorBubbleProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  triggerShake?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ErrorBubble({
  message,
  title,
  onDismiss,
  onRetry,
  triggerShake = true,
  accessibilityLabel,
  style,
  testID = 'error-bubble'
}: ErrorBubbleProps): React.JSX.Element {
  const { accents, colors, radii, reducedMotion } = useTheme();

  // Horizontal shake offset on UI thread
  const shakeOffsetX = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      shakeOffsetX.value = 0;
      return;
    }

    if (triggerShake) {
      // Gentle shake sequence on appearance: -8, 8, -6, 6, -3, 3, 0
      shakeOffsetX.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-3, { duration: 60 }),
        withTiming(3, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
    }
  }, [triggerShake, reducedMotion, shakeOffsetX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffsetX.value }]
  }));

  const finalTitle = title ?? componentsCopy.errorBubble.defaultTitle;
  const a11yLabel =
    accessibilityLabel ?? componentsCopy.errorBubble.accessibilityLabel(`${finalTitle}: ${message}`);

  return (
    <Animated.View
      testID={testID}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={a11yLabel}
      style={[
        styles.container,
        {
          // STRICT RULE: Amber (Honey) background, NEVER RED!
          backgroundColor: accents.honey.tint,
          borderColor: accents.honey.pop,
          borderRadius: radii.card
        },
        animatedStyle,
        style
      ]}
    >
      <View style={styles.contentRow}>
        {/* Amber accent pill indicator */}
        <View style={[styles.amberIndicator, { backgroundColor: accents.honey.pop }]} />

        <View style={styles.textContainer}>
          <Text role="titleSmall" style={{ color: colors.ink, fontWeight: '700' }}>
            {finalTitle}
          </Text>
          <Text role="bodyMedium" style={{ color: colors.ink, marginTop: 2 }}>
            {message}
          </Text>
        </View>

        {/* Optional Retry button */}
        {onRetry && (
          <Pressable
            testID={`${testID}-retry`}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            onPress={onRetry}
            style={styles.dismissButton}
          >
            <Text role="labelSmall" style={{ color: colors.ink, fontWeight: '600' }}>
              Retry
            </Text>
          </Pressable>
        )}

        {/* Optional Dismiss button */}
        {onDismiss && (
          <Pressable
            testID={`${testID}-dismiss`}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={componentsCopy.errorBubble.dismissAction}
            onPress={onDismiss}
            style={styles.dismissButton}
          >
            <CloseIcon size={18} color={colors.ink} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1.5,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative'
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  amberIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  dismissButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  }
});
