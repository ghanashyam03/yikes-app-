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
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { commonCopy } from '../../copy/common';
import { Text } from './Text';

export type ChipTint = 'lilac' | 'mint' | 'honey' | 'sky' | 'bubblegum' | 'ember' | 'neutral';

export interface ChipProps {
  label: string;
  tint?: ChipTint;
  selected?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  focused?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export function Chip({
  label,
  tint = 'lilac',
  selected = false,
  onPress,
  disabled = false,
  loading = false,
  focused = false,
  accessibilityLabel,
  style,
  icon
}: ChipProps): React.JSX.Element {
  const { colors, accents, radii, spacing, motion, focusRing, reducedMotion } = useTheme();
  const [internalFocused, setInternalFocused] = useState(false);

  // Pop on tap animation
  const scale = useSharedValue(1);

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled || loading) return;

    if (!reducedMotion) {
      // Pop on tap
      scale.value = withSequence(
        withSpring(1.08, motion.springs.playful),
        withSpring(1.0, motion.springs.calm)
      );
    }

    onPress?.(event);
  };

  const handlePressIn = () => {
    if (disabled || loading) return;
    if (!reducedMotion) {
      scale.value = withSpring(motion.squishScale, motion.springs.playful);
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    if (!reducedMotion) {
      scale.value = withSpring(1.0, motion.springs.playful);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const isFocused = focused || internalFocused;
  const isInteractive = !disabled && !loading;

  // Resolve tint colors
  let tintBg = colors.surface1;
  let tintBorder = colors.line;
  let textColor = colors.ink;

  if (tint !== 'neutral' && accents[tint]) {
    const accent = accents[tint];
    tintBg = selected ? accent.tint : colors.surface1;
    tintBorder = selected ? accent.base : colors.line;
  } else if (selected) {
    tintBg = accents.lilac.tint;
    tintBorder = accents.lilac.base;
  }

  if (disabled) {
    tintBg = colors.surface2;
    tintBorder = colors.line;
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
          accessibilityRole="checkbox"
          accessibilityLabel={
            accessibilityLabel ?? `${label}, ${selected ? commonCopy.accessibility.selected : commonCopy.accessibility.unselected}`
          }
          accessibilityState={{
            checked: selected,
            disabled,
            busy: loading
          }}
          disabled={!isInteractive}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onFocus={() => setInternalFocused(true)}
          onBlur={() => setInternalFocused(false)}
          style={[
            styles.baseChip,
            {
              backgroundColor: tintBg,
              borderColor: tintBorder,
              borderRadius: radii.pill,
              borderWidth: selected ? 1.5 : 1,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[2]
            },
            disabled && styles.disabledDashed,
            style
          ]}
        >
          {icon && <View style={styles.iconMargin}>{icon}</View>}
          <Text
            role="labelMedium"
            style={[styles.chipText, { color: textColor }]}
          >
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  focusRingContainer: {
    alignSelf: 'flex-start',
    borderColor: 'transparent',
    borderWidth: 0
  },
  baseChip: {
    minHeight: 48,
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipText: {
    textAlign: 'center'
  },
  iconMargin: {
    marginRight: 6
  },
  disabledDashed: {
    borderStyle: 'dashed'
  }
});
