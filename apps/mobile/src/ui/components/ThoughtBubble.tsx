import React, { useEffect, useState } from 'react';
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
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { componentsCopy } from '../../copy/components';

export interface ThoughtBubbleProps {
  thought: string;
  onPop?: () => void;
  accentColor?: string;
  popped?: boolean;
  disabled?: boolean;
  forceReducedMotion?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ThoughtBubble({
  thought,
  onPop,
  accentColor,
  popped = false,
  disabled = false,
  forceReducedMotion,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID = 'thought-bubble'
}: ThoughtBubbleProps): React.JSX.Element | null {
  const { accents, colors, radii, motion, reducedMotion } = useTheme();
  const [isPoppedInternal, setIsPoppedInternal] = useState(false);

  const isReduced = forceReducedMotion ?? reducedMotion;

  const bubbleScale = useSharedValue(1);
  const bubbleOpacity = useSharedValue(1);
  const floatOffsetY = useSharedValue(0);

  const isPopped = popped || isPoppedInternal;

  // Float & wobble animation on entry
  useEffect(() => {
    if (isReduced) {
      floatOffsetY.value = 0;
      return;
    }

    floatOffsetY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      true
    );
  }, [isReduced, floatOffsetY]);

  const handlePop = () => {
    if (disabled || isPopped) return;

    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }

    if (isReduced) {
      bubbleOpacity.value = 0;
      setIsPoppedInternal(true);
      onPop?.();
      return;
    }

    // Pop sequence: burst scale up, then quick fade out
    bubbleScale.value = withSequence(
      withSpring(1.18, motion.springs.playful),
      withTiming(0.4, { duration: motion.durations.tap })
    );

    bubbleOpacity.value = withTiming(0, { duration: motion.durations.tap }, () => {
      runOnJS(setIsPoppedInternal)(true);
      if (onPop) {
        runOnJS(onPop)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [
      { translateY: floatOffsetY.value },
      { scale: bubbleScale.value }
    ]
  }));

  if (isPopped) return null;

  const resolvedBorder = accentColor ?? accents.lilac.pop;
  const a11yLabel =
    accessibilityLabel ?? componentsCopy.thoughtBubble.accessibilityLabel(thought);
  const a11yHint =
    accessibilityHint ?? componentsCopy.thoughtBubble.accessibilityHint;

  return (
    <Animated.View
      testID={testID}
      style={[styles.container, animatedStyle, style]}
    >
      <Pressable
        testID={`${testID}-pressable`}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={a11yHint}
        onPress={handlePop}
        disabled={disabled}
        style={[
          styles.bubblePressable,
          {
            backgroundColor: colors.surface1,
            borderColor: resolvedBorder,
            borderRadius: radii.card
          },
          disabled && styles.disabled
        ]}
      >
        <Text role="bodyLarge" style={[styles.thoughtText, { color: colors.ink }]}>
          {thought}
        </Text>

        {/* Small floating thought tail circles */}
        <View
          style={[
            styles.tailCircle1,
            { backgroundColor: colors.surface1, borderColor: resolvedBorder }
          ]}
        />
        <View
          style={[
            styles.tailCircle2,
            { backgroundColor: colors.surface1, borderColor: resolvedBorder }
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignSelf: 'center',
    maxWidth: '90%'
  },
  bubblePressable: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative'
  },
  thoughtText: {
    fontStyle: 'italic',
    textAlign: 'center'
  },
  tailCircle1: {
    position: 'absolute',
    bottom: -8,
    left: 28,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed'
  },
  tailCircle2: {
    position: 'absolute',
    bottom: -16,
    left: 20,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderStyle: 'dashed'
  },
  disabled: {
    opacity: 0.4
  }
});
