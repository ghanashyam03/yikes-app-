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
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { componentsCopy } from '../../copy/components';

export type SkeletonShape = 'text' | 'bubble' | 'card' | 'avatar' | 'pill';

export interface SkeletonProps {
  shape?: SkeletonShape;
  width?: number | `${number}%`;
  height?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Skeleton({
  shape = 'text',
  width,
  height,
  accessibilityLabel,
  style,
  testID = 'skeleton'
}: SkeletonProps): React.JSX.Element {
  const { colors, radii, reducedMotion } = useTheme();

  // Shimmer opacity cycle driver on UI thread
  const shimmerOpacity = useSharedValue(0.45);

  useEffect(() => {
    if (reducedMotion) {
      shimmerOpacity.value = 0.55;
      return;
    }

    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 750 }),
        withTiming(0.35, { duration: 750 })
      ),
      -1,
      true
    );
  }, [reducedMotion, shimmerOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value
  }));

  // Resolve shape dimensions and corner radius
  let resolvedRadius: number = radii.pill;
  let defaultWidth: number | `${number}%` = '100%';
  let defaultHeight: number = 18;

  switch (shape) {
    case 'bubble':
    case 'card':
      resolvedRadius = radii.card;
      defaultHeight = 90;
      break;
    case 'avatar':
      resolvedRadius = 9999;
      defaultWidth = 48;
      defaultHeight = 48;
      break;
    case 'pill':
      resolvedRadius = radii.pill;
      defaultHeight = 32;
      defaultWidth = 110;
      break;
    case 'text':
    default:
      resolvedRadius = radii.pill;
      defaultHeight = 16;
      break;
  }

  const finalWidth = width ?? defaultWidth;
  const finalHeight = height ?? defaultHeight;

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel ?? componentsCopy.skeleton.accessibilityLabel}
      accessibilityState={{ busy: true }}
      style={[
        styles.base,
        {
          width: finalWidth,
          height: finalHeight,
          borderRadius: resolvedRadius,
          backgroundColor: colors.surface2
        },
        style
      ]}
    >
      <Animated.View
        testID={`${testID}-shimmer`}
        style={[
          styles.shimmerFill,
          {
            backgroundColor: colors.surface1,
            borderRadius: resolvedRadius
          },
          animatedStyle
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4
  },
  shimmerFill: {
    ...StyleSheet.absoluteFillObject
  }
});
