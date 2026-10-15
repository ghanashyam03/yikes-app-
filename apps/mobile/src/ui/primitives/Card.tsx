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
  withSpring
} from 'react-native-reanimated';
import { lightShadows, darkGlows } from '@yikes/shared/tokens/shadows';
import { useTheme } from '../../theme/useTheme';
import { commonCopy } from '../../copy/common';

export type CardTint =
  | 'neutral'
  | 'ember'
  | 'lilac'
  | 'mint'
  | 'honey'
  | 'sky'
  | 'bubblegum';

export interface CardProps {
  tint?: CardTint;
  tilted?: boolean;
  tiltAngle?: number; // default 1.5 degrees
  onPress?: (event: GestureResponderEvent) => void;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  focused?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Card({
  tint = 'neutral',
  tilted = false,
  tiltAngle = 1.5,
  onPress,
  selected = false,
  disabled = false,
  loading = false,
  focused = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  children
}: CardProps): React.JSX.Element {
  const { colors, accents, radii, spacing, motion, focusRing, reducedMotion, mode } =
    useTheme();
  const [internalFocused, setInternalFocused] = useState(false);

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!onPress || disabled || loading) return;
    if (!reducedMotion) {
      scale.value = withSpring(0.97, motion.springs.playful);
    }
  };

  const handlePressOut = () => {
    if (!onPress || disabled || loading) return;
    if (!reducedMotion) {
      scale.value = withSpring(1.0, motion.springs.playful);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: tilted && !reducedMotion ? `${tiltAngle}deg` : '0deg' }
    ]
  }));

  const isFocused = focused || internalFocused;
  const isInteractive = Boolean(onPress) && !disabled && !loading;

  // Background and border resolution
  let cardBg = colors.surface1;
  let cardBorder = colors.line;

  if (tint !== 'neutral' && accents[tint]) {
    const accent = accents[tint];
    cardBg = accent.tint;
    cardBorder = accent.base;
  }

  if (selected) {
    cardBorder = accents.lilac.base;
  }

  if (disabled) {
    cardBg = colors.surface2;
    cardBorder = colors.line;
  }

  // Inner highlight colors for glossy bead effect
  const highlightColor =
    mode === 'dark'
      ? 'rgba(255, 255, 255, 0.14)'
      : 'rgba(255, 255, 255, 0.70)';

  const cardShadow = mode === 'dark' ? darkGlows.soft : lightShadows.card;

  return (
    <View
      style={[
        styles.focusRingContainer,
        isFocused && {
          borderColor: focusRing.color,
          borderWidth: focusRing.width,
          padding: focusRing.offset,
          borderRadius: radii.card + focusRing.offset
        }
      ]}
    >
      <Animated.View
        style={[
          styles.shadowContainer,
          cardShadow,
          animatedStyle
        ]}
      >
        <Pressable
          accessibilityRole={onPress ? 'button' : 'summary'}
          accessibilityLabel={
            accessibilityLabel ??
            (disabled ? commonCopy.accessibility.disabled : undefined)
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
            styles.cardBase,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radii.card,
              padding: spacing[5]
            },
            disabled && styles.disabledDashed,
            style
          ]}
        >
          {/* Glossy bead 1px top-left inner highlight */}
          <View
            pointerEvents="none"
            style={[
              styles.innerHighlight,
              {
                borderRadius: radii.card,
                borderTopColor: highlightColor,
                borderLeftColor: highlightColor
              }
            ]}
          />
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  focusRingContainer: {
    borderColor: 'transparent',
    borderWidth: 0
  },
  shadowContainer: {
    borderRadius: 28
  },
  cardBase: {
    position: 'relative',
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 48
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    zIndex: 1
  },
  disabledDashed: {
    borderStyle: 'dashed'
  }
});
