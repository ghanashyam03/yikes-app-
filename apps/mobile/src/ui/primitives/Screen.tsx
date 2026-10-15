import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';

export interface ScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  hideBackdrop?: boolean;
}

export function Screen({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  contentStyle,
  hideBackdrop = false
}: ScreenProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.screenRoot,
        { backgroundColor: colors.base },
        style
      ]}
      testID="screen-container"
    >
      {!hideBackdrop && <AmbientBubbleBackdrop />}
      <SafeAreaView edges={edges} style={[styles.safeArea, contentStyle]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

export interface AmbientBubbleBackdropProps {
  forceReducedMotion?: boolean;
}

/**
 * Checks whether the ambient drifting animation is active given the reduced motion preference.
 */
export function isAmbientDriftActive(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

/**
 * Ambient drifting bubble backdrop.
 * In accordance with the spec:
 * Halts and stops all animation when Reduced Motion is enabled.
 */
export function AmbientBubbleBackdrop({
  forceReducedMotion
}: AmbientBubbleBackdropProps = {}): React.JSX.Element {
  const { accents, reducedMotion: themeReducedMotion, mode } = useTheme();
  const isReducedMotion = forceReducedMotion ?? themeReducedMotion;
  const isDrifting = isAmbientDriftActive(isReducedMotion);

  // Shared values for bubble coordinates
  const bubble1X = useSharedValue(0);
  const bubble1Y = useSharedValue(0);
  const bubble2X = useSharedValue(0);
  const bubble2Y = useSharedValue(0);

  useEffect(() => {
    if (!isDrifting) {
      // Immediately cancel and reset any animations
      cancelAnimation(bubble1X);
      cancelAnimation(bubble1Y);
      cancelAnimation(bubble2X);
      cancelAnimation(bubble2Y);
      bubble1X.value = 0;
      bubble1Y.value = 0;
      bubble2X.value = 0;
      bubble2Y.value = 0;
      return;
    }

    // Drifting float physics with smooth sinusoidal ease
    bubble1X.value = withRepeat(
      withSequence(
        withTiming(28, { duration: 4200, easing: Easing.inOut(Easing.quad) }),
        withTiming(-20, { duration: 4800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    bubble1Y.value = withRepeat(
      withSequence(
        withTiming(32, { duration: 5200, easing: Easing.inOut(Easing.quad) }),
        withTiming(-16, { duration: 4600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    bubble2X.value = withRepeat(
      withSequence(
        withTiming(-24, { duration: 4600, easing: Easing.inOut(Easing.quad) }),
        withTiming(18, { duration: 5400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    bubble2Y.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
        withTiming(22, { duration: 4400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(bubble1X);
      cancelAnimation(bubble1Y);
      cancelAnimation(bubble2X);
      cancelAnimation(bubble2Y);
    };
  }, [isDrifting, bubble1X, bubble1Y, bubble2X, bubble2Y]);

  const bubble1AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bubble1X.value }, { translateY: bubble1Y.value }]
  }));

  const bubble2AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bubble2X.value }, { translateY: bubble2Y.value }]
  }));

  const bubble1Color =
    mode === 'dark' ? accents.ember.dark : accents.ember.tint;
  const bubble2Color =
    mode === 'dark' ? accents.lilac.base : accents.lilac.tint;
  const opacity = mode === 'dark' ? 0.18 : 0.45;

  return (
    <View
      pointerEvents="none"
      style={styles.backdropContainer}
      testID="ambient-bubble-backdrop"
    >
      <View
        testID={isDrifting ? 'ambient-drift-running' : 'ambient-drift-stopped'}
      />
      <Animated.View
        testID="ambient-bubble-1"
        style={[
          styles.bubble,
          styles.bubble1,
          { backgroundColor: bubble1Color, opacity },
          bubble1AnimStyle
        ]}
      />
      <Animated.View
        testID="ambient-bubble-2"
        style={[
          styles.bubble,
          styles.bubble2,
          { backgroundColor: bubble2Color, opacity: opacity * 0.8 },
          bubble2AnimStyle
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative'
  },
  safeArea: {
    flex: 1
  },
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0
  },
  bubble: {
    position: 'absolute',
    borderRadius: 9999
  },
  bubble1: {
    width: 240,
    height: 240,
    top: -50,
    right: -40
  },
  bubble2: {
    width: 200,
    height: 200,
    bottom: 80,
    left: -50
  }
});
