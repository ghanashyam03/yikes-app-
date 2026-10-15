import React, { useEffect } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { CloseIcon } from '../icons/CloseIcon';
import { componentsCopy } from '../../copy/components';

export interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number; // default 3500ms
  position?: 'top' | 'bottom';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Toast({
  message,
  visible,
  onDismiss,
  duration = 3500,
  position = 'bottom',
  accessibilityLabel,
  style,
  testID = 'toast'
}: ToastProps): React.JSX.Element | null {
  const { colors, radii, motion, reducedMotion } = useTheme();

  const isBottom = position === 'bottom';
  const initialOffset = isBottom ? 100 : -100;

  const translateY = useSharedValue(initialOffset);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (visible) {
      if (reducedMotion) {
        translateY.value = 0;
        opacity.value = 1;
      } else {
        opacity.value = withTiming(1, { duration: motion.durations.tap });
        translateY.value = withSpring(0, motion.springs.playful);
      }

      if (duration > 0) {
        timer = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    } else {
      if (reducedMotion) {
        opacity.value = 0;
      } else {
        opacity.value = withTiming(0, { duration: motion.durations.tap });
        translateY.value = withSpring(initialOffset, motion.springs.calm);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, duration, reducedMotion, motion.durations, motion.springs, initialOffset]);

  const handleDismiss = () => {
    if (reducedMotion) {
      opacity.value = 0;
      onDismiss();
    } else {
      opacity.value = withTiming(0, { duration: motion.durations.tap });
      translateY.value = withSpring(initialOffset, motion.springs.calm, () => {
        runOnJS(onDismiss)();
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  if (!visible) return null;

  const a11yLabel =
    accessibilityLabel ?? componentsCopy.toast.accessibilityLabel(message);

  return (
    <Animated.View
      testID={testID}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={a11yLabel}
      style={[
        styles.toastContainer,
        isBottom ? styles.positionBottom : styles.positionTop,
        animatedStyle,
        style
      ]}
    >
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: colors.surface1,
            borderRadius: radii.pill,
            borderColor: colors.line
          }
        ]}
      >
        {/* Soft Pop bead highlight */}
        <View
          style={[
            styles.innerHighlight,
            { borderRadius: radii.pill }
          ]}
        />

        <Text role="bodyMedium" style={[styles.messageText, { color: colors.ink }]}>
          {message}
        </Text>

        <Pressable
          testID={`${testID}-dismiss`}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={componentsCopy.toast.dismissAction}
          onPress={handleDismiss}
          style={styles.closeHitbox}
        >
          <CloseIcon size={16} color={colors.ink} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center'
  },
  positionBottom: {
    bottom: 24
  },
  positionTop: {
    top: 24
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
    position: 'relative',
    maxWidth: 420,
    width: '100%'
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    pointerEvents: 'none'
  },
  messageText: {
    flex: 1,
    marginRight: 8
  },
  closeHitbox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
