import React, { useEffect } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { componentsCopy } from '../../copy/components';

export interface RhythmRingProps {
  totalSegments?: number;
  filledSegments: number;
  size?: number;
  strokeWidth?: number;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function RhythmRing({
  totalSegments = 5,
  filledSegments,
  size = 88,
  strokeWidth = 9,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  testID = 'rhythm-ring'
}: RhythmRingProps): React.JSX.Element {
  const { colors, accents, motion, reducedMotion } = useTheme();

  const clampedTotal = Math.max(1, totalSegments);
  const clampedFilled = Math.max(0, Math.min(clampedTotal, filledSegments));

  // Shared values for bulge and sparkle
  const bulgeScale = useSharedValue(1);
  const sparklePulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      bulgeScale.value = 1;
      sparklePulse.value = 1;
      return;
    }

    // Bulge animation on segment change
    bulgeScale.value = 1.15;
    bulgeScale.value = withSpring(1, motion.springs.playful);

    // Sparkle continuous gentle pulse
    sparklePulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 900 }),
        withTiming(0.85, { duration: 900 })
      ),
      -1,
      true
    );
  }, [clampedFilled, reducedMotion, motion.springs.playful, bulgeScale, sparklePulse]);

  const animatedBulgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: bulgeScale.value }]
    };
  });

  const animatedSparkleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: sparklePulse.value }],
      opacity: sparklePulse.value > 1.1 ? 1 : 0.75
    };
  });

  // Calculate segment arcs
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gapSize = 4; // gap in degrees
  const segmentAngle = (360 - clampedTotal * gapSize) / clampedTotal;
  const segmentLength = (segmentAngle / 360) * circumference;
  const gapLength = (gapSize / 360) * circumference;

  // Calculate tip angle for the sparkle particle (in radians, starting from -90 deg / top)
  const lastFilledIndex = clampedFilled - 1;
  const tipAngleDeg =
    clampedFilled > 0
      ? -90 + lastFilledIndex * (segmentAngle + gapSize) + segmentAngle
      : -90;
  const tipAngleRad = (tipAngleDeg * Math.PI) / 180;
  const sparkleX = center + radius * Math.cos(tipAngleRad);
  const sparkleY = center + radius * Math.sin(tipAngleRad);

  return (
    <View
      testID={testID}
      style={[styles.container, { width: size, height: size }, style]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={
        accessibilityLabel ??
        componentsCopy.rhythmRing.accessibilityLabel(clampedFilled, clampedTotal)
      }
      accessibilityValue={{
        min: 0,
        max: clampedTotal,
        now: clampedFilled,
        text: `${clampedFilled} of ${clampedTotal} sessions`
      }}
      accessibilityState={{ disabled, busy: loading }}
    >
      <Animated.View style={[{ width: size, height: size }, animatedBulgeStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {Array.from({ length: clampedTotal }).map((_, index) => {
              const isFilled = index < clampedFilled;
              const isCurrentLeading = index === lastFilledIndex;
              const strokeColor = isFilled
                ? accents.mint.pop
                : colors.surface2;

              // Stroke dash offset calculation
              const strokeDashoffset = -index * (segmentLength + gapLength);

              return (
                <Circle
                  key={`segment-${index}`}
                  testID={`${testID}-segment-${index}`}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={strokeColor}
                  strokeWidth={isCurrentLeading ? strokeWidth + 1.5 : strokeWidth}
                  strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  opacity={disabled ? 0.4 : 1}
                />
              );
            })}
          </G>
        </Svg>
      </Animated.View>

      {/* Center count display */}
      <View style={styles.centerText} pointerEvents="none">
        <Text role="titleSmall" style={{ color: colors.ink }}>
          {`${clampedFilled}/${clampedTotal}`}
        </Text>
      </View>

      {/* Sparkle particle on leading filled edge */}
      {clampedFilled > 0 && !disabled && (
        <Animated.View
          testID={`${testID}-sparkle`}
          style={[
            styles.sparkleContainer,
            {
              left: sparkleX - 9,
              top: sparkleY - 9
            },
            animatedSparkleStyle
          ]}
          pointerEvents="none"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
              fill={accents.honey.pop}
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    position: 'relative'
  },
  centerText: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sparkleContainer: {
    position: 'absolute',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
