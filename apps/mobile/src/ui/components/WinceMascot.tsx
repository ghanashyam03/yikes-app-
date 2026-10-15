import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { componentsCopy } from '../../copy/components';

export type WincePose =
  | 'curious'
  | 'sleepy'
  | 'thinking'
  | 'proud'
  | 'peeking'
  | 'offline';

export interface WinceMascotProps {
  pose?: WincePose;
  size?: number; // default 64
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function WinceMascot({
  pose = 'curious',
  size = 64,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  testID = 'wince-mascot'
}: WinceMascotProps): React.JSX.Element {
  const { accents, colors, motion, reducedMotion } = useTheme();

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading || !onPress) return;
    if (reducedMotion) {
      scale.value = motion.squishScale;
    } else {
      scale.value = withSpring(motion.squishScale, motion.springs.playful);
    }
  };

  const handlePressOut = () => {
    if (disabled || loading || !onPress) return;
    if (reducedMotion) {
      scale.value = 1;
    } else {
      scale.value = withSpring(1, motion.springs.playful);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const blobFill = accents.lilac.tint;
  const strokeColor = accents.lilac.pop;
  const inkEye = colors.ink;

  const renderPoseSvg = () => {
    switch (pose) {
      case 'sleepy':
        return (
          <G testID={`${testID}-pose-sleepy`}>
            {/* Droopy relaxed blob */}
            <Path
              d="M20 70 C20 40 35 30 50 30 C65 30 80 40 80 70 C80 82 70 85 50 85 C30 85 20 82 20 70 Z"
              fill={blobFill}
              stroke={strokeColor}
              strokeWidth="3"
            />
            {/* Closed sleepy eyes */}
            <Path d="M35 55 Q40 58 45 55" stroke={inkEye} strokeWidth="3" strokeLinecap="round" fill="none" />
            <Path d="M55 55 Q60 58 65 55" stroke={inkEye} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Gentle z letter */}
            <Path d="M72 25 L80 25 L72 35 L80 35" stroke={accents.honey.pop} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </G>
        );

      case 'thinking':
        return (
          <G testID={`${testID}-pose-thinking`}>
            {/* Blob tilted thoughtfully */}
            <Path
              d="M22 68 C22 36 34 22 52 22 C70 22 80 38 78 68 C76 82 66 84 48 84 C30 84 22 80 22 68 Z"
              fill={blobFill}
              stroke={strokeColor}
              strokeWidth="3"
            />
            {/* Thinking squint: one eye looking up, one tiny squint */}
            <Circle cx="40" cy="45" r="4.5" fill={inkEye} />
            <Path d="M56 42 L66 47 L56 52" stroke={inkEye} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Little bump hand on chin */}
            <Ellipse cx="44" cy="74" rx="8" ry="5" fill={strokeColor} opacity="0.3" />
          </G>
        );

      case 'proud':
        return (
          <G testID={`${testID}-pose-proud`}>
            {/* Puffed up taller proud blob */}
            <Path
              d="M20 62 C18 32 32 18 50 18 C68 18 82 32 80 62 C78 80 68 85 50 85 C32 85 22 80 20 62 Z"
              fill={blobFill}
              stroke={strokeColor}
              strokeWidth="3"
            />
            {/* Happy arched squint eyes */}
            <Path d="M33 46 Q39 39 45 46" stroke={inkEye} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <Path d="M55 46 Q61 39 67 46" stroke={inkEye} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Proud smile */}
            <Path d="M42 60 Q50 67 58 60" stroke={inkEye} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Chest sparkle */}
            <Path d="M50 70 L52 74 L56 75 L52 76 L50 80 L48 76 L44 75 L48 74 Z" fill={accents.honey.pop} />
          </G>
        );

      case 'peeking':
        return (
          <G testID={`${testID}-pose-peeking`}>
            {/* Corner peek wall/edge */}
            <Rect x="0" y="20" width="36" height="70" fill={colors.surface2} rx="6" />
            {/* Peeking blob peeking out from behind wall */}
            <Path
              d="M32 75 C32 40 44 32 60 32 C74 32 82 45 80 75 C78 85 68 85 55 85 C40 85 32 85 32 75 Z"
              fill={blobFill}
              stroke={strokeColor}
              strokeWidth="3"
            />
            {/* One shy, wide peeking eye with tiny squint next to it */}
            <Circle cx="52" cy="52" r="5" fill={inkEye} />
            <Circle cx="54" cy="50" r="1.5" fill="#FFFFFF" />
            <Path d="M66 50 L73 53 L66 56" stroke={inkEye} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </G>
        );

      case 'offline':
        return (
          <G testID={`${testID}-pose-offline`}>
            {/* Flat resting puddle blob */}
            <Ellipse cx="50" cy="72" rx="35" ry="14" fill={blobFill} stroke={strokeColor} strokeWidth="3" />
            {/* Peaceful sleeping line eyes */}
            <Path d="M38 70 L46 70" stroke={inkEye} strokeWidth="3" strokeLinecap="round" />
            <Path d="M54 70 L62 70" stroke={inkEye} strokeWidth="3" strokeLinecap="round" />
            {/* Subtle floating cloud disconnect dot */}
            <Circle cx="68" cy="46" r="3" fill={colors.muted} />
            <Circle cx="76" cy="38" r="4.5" fill={colors.muted} />
          </G>
        );

      case 'curious':
      default:
        return (
          <G testID={`${testID}-pose-curious`}>
            {/* Blob with slight curious tilt and tiny head bump */}
            <Path
              d="M24 66 C22 38 32 24 48 22 C52 16 56 16 58 22 C72 25 80 40 78 66 C76 82 66 84 50 84 C34 84 26 80 24 66 Z"
              fill={blobFill}
              stroke={strokeColor}
              strokeWidth="3"
            />
            {/* One wide curious eye, one tiny trademark squint */}
            <Circle cx="40" cy="48" r="5" fill={inkEye} />
            <Circle cx="42" cy="46" r="1.5" fill="#FFFFFF" />
            <Path d="M56 45 L66 50 L56 55" stroke={inkEye} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Gentle curious mouth */}
            <Circle cx="49" cy="65" r="2.5" fill={inkEye} />
          </G>
        );
    }
  };

  const poseLabel = componentsCopy.winceMascot.poses[pose] ?? pose;
  const a11yLabel =
    accessibilityLabel ?? componentsCopy.winceMascot.accessibilityLabel(poseLabel);

  const mascotSvg = (
    <Animated.View
      style={[
        styles.mascotWrapper,
        { width: size, height: size },
        disabled && styles.disabled,
        animatedStyle
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {renderPoseSvg()}
      </Svg>
    </Animated.View>
  );

  return (
    <View style={[styles.container, style]}>
      {onPress ? (
        <Pressable
          testID={testID}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityState={{ disabled, busy: loading }}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={styles.touchArea}
        >
          {mascotSvg}
        </Pressable>
      ) : (
        <View
          testID={testID}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel={a11yLabel}
          accessibilityState={{ disabled, busy: loading }}
          style={styles.touchArea}
        >
          {mascotSvg}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  touchArea: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabled: {
    opacity: 0.4
  }
});
