import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { commonCopy } from '../../copy/common';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  variant?: ButtonVariant;
  label?: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  focused?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  label,
  onPress,
  disabled = false,
  loading = false,
  selected = false,
  focused = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  children
}: ButtonProps): React.JSX.Element {
  const { colors, accents, radii, spacing, motion, focusRing, reducedMotion } = useTheme();
  const [internalFocused, setInternalFocused] = useState(false);

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading) return;
    if (reducedMotion) {
      scale.value = motion.squishScale;
    } else {
      scale.value = withSpring(motion.squishScale, motion.springs.playful);
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    if (reducedMotion) {
      scale.value = 1;
    } else {
      scale.value = withSpring(1, motion.springs.playful);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const isFocused = focused || internalFocused;
  const isInteractive = !disabled && !loading;

  // Determine colors based on variant
  let backgroundColor: string;
  let borderColor: string = 'transparent';
  let borderStyle: 'solid' | 'dashed' = 'solid';
  let borderWidth = 0;
  let textColor = colors.ink;

  if (variant === 'primary') {
    // Primary Ember action: per spec uses Ember gradient/pop with Ink text
    backgroundColor = accents.ember.pop;
    textColor = colors.ink; // Spec line 50: "primary Ember gradient with Ink text"
  } else if (variant === 'secondary') {
    backgroundColor = colors.surface1;
    borderColor = colors.line;
    borderWidth = 1.5;
    textColor = colors.ink;
  } else {
    // ghost
    backgroundColor = 'transparent';
    textColor = colors.ink;
  }

  if (selected) {
    backgroundColor = accents.lilac.tint;
    borderColor = accents.lilac.base;
    borderWidth = 1.5;
    textColor = colors.ink;
  }

  if (disabled) {
    backgroundColor = colors.surface2;
    borderColor = colors.line;
    borderStyle = 'dashed';
    borderWidth = 1.5;
    textColor = colors.muted;
  }

  return (
    <View
      style={[
        styles.focusRingContainer,
        isFocused && {
          borderColor: focusRing.color,
          borderWidth: focusRing.width,
          padding: focusRing.offset,
          borderRadius: radii.pill + focusRing.offset
        }
      ]}
    >
      <Animated.View style={[animatedStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            accessibilityLabel ??
            (typeof label === 'string' ? label : commonCopy.accessibility.disabled)
          }
          accessibilityHint={accessibilityHint}
          accessibilityState={{
            disabled,
            busy: loading,
            selected
          }}
          disabled={!isInteractive}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onFocus={() => setInternalFocused(true)}
          onBlur={() => setInternalFocused(false)}
          style={[
            styles.baseButton,
            {
              backgroundColor,
              borderRadius: radii.pill,
              borderColor,
              borderWidth,
              borderStyle,
              paddingHorizontal: spacing[5],
              paddingVertical: spacing[3]
            },
            variant === 'ghost' && styles.ghostPadding,
            style
          ]}
        >
          {loading ? (
            <LoadingDots color={textColor} reducedMotion={reducedMotion} />
          ) : children ? (
            children
          ) : (
            <Text
              role="labelLarge"
              style={[styles.buttonLabel, { color: textColor }]}
            >
              {label}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

interface LoadingDotsProps {
  color: string;
  reducedMotion: boolean;
}

function LoadingDots({ color, reducedMotion }: LoadingDotsProps): React.JSX.Element {
  const dot1 = useSharedValue(1);
  const dot2 = useSharedValue(1);
  const dot3 = useSharedValue(1);

  React.useEffect(() => {
    if (reducedMotion) return;

    dot1.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 250 }), withTiming(1, { duration: 250 })),
      -1,
      true
    );
    dot2.value = withDelay(
      120,
      withRepeat(
        withSequence(withTiming(0.4, { duration: 250 }), withTiming(1, { duration: 250 })),
        -1,
        true
      )
    );
    dot3.value = withDelay(
      240,
      withRepeat(
        withSequence(withTiming(0.4, { duration: 250 }), withTiming(1, { duration: 250 })),
        -1,
        true
      )
    );
  }, [reducedMotion, dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.loadingContainer} accessibilityLabel={commonCopy.accessibility.loading}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot1Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot2Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot3Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  focusRingContainer: {
    alignSelf: 'flex-start',
    borderColor: 'transparent',
    borderWidth: 0
  },
  baseButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  ghostPadding: {
    paddingHorizontal: 16
  },
  buttonLabel: {
    textAlign: 'center'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 20
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  }
});
