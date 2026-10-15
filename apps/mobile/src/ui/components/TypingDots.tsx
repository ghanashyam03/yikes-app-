import React, { useEffect } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { componentsCopy } from '../../copy/components';

export interface TypingDotsProps {
  color?: string;
  dotSize?: number;
  partnerName?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function TypingDots({
  color,
  dotSize = 7,
  partnerName,
  accessibilityLabel,
  style,
  testID = 'typing-dots'
}: TypingDotsProps): React.JSX.Element {
  const { accents, colors, reducedMotion } = useTheme();
  const dotColor = color ?? accents.lilac.pop;

  // 3 independent UI-thread animated values for staggered wobble
  const dot1Offset = useSharedValue(0);
  const dot2Offset = useSharedValue(0);
  const dot3Offset = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      dot1Offset.value = 0;
      dot2Offset.value = 0;
      dot3Offset.value = 0;
      return;
    }

    const duration = 360;
    const wobbleDistance = -6;

    // Zero setInterval/setTimeout: pure UI-thread declarative sequences with delay
    dot1Offset.value = withRepeat(
      withSequence(
        withTiming(wobbleDistance, { duration }),
        withTiming(0, { duration })
      ),
      -1,
      true
    );

    dot2Offset.value = withDelay(
      140,
      withRepeat(
        withSequence(
          withTiming(wobbleDistance, { duration }),
          withTiming(0, { duration })
        ),
        -1,
        true
      )
    );

    dot3Offset.value = withDelay(
      280,
      withRepeat(
        withSequence(
          withTiming(wobbleDistance, { duration }),
          withTiming(0, { duration })
        ),
        -1,
        true
      )
    );
  }, [reducedMotion, dot1Offset, dot2Offset, dot3Offset]);

  const styleDot1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1Offset.value }]
  }));

  const styleDot2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2Offset.value }]
  }));

  const styleDot3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3Offset.value }]
  }));

  const a11yLabel =
    accessibilityLabel ?? componentsCopy.typingDots.accessibilityLabel(partnerName);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface1,
          borderColor: colors.line
        },
        style
      ]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={a11yLabel}
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        testID={`${testID}-dot-1`}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor
          },
          styleDot1
        ]}
      />
      <Animated.View
        testID={`${testID}-dot-2`}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor
          },
          styleDot2
        ]}
      />
      <Animated.View
        testID={`${testID}-dot-3`}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor
          },
          styleDot3
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 48,
    minWidth: 56,
    gap: 6
  },
  dot: {
    marginHorizontal: 1
  }
});
