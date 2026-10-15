import React, { useCallback, useRef } from 'react';
import {
  AccessibilityActionEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { componentsCopy } from '../../copy/components';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type BatteryEnergyLevel = 'high' | 'mid' | 'low';

export interface BatteryColorPair {
  pop: string;
  tint: string;
  level: BatteryEnergyLevel;
}

/**
 * Pure color mapping function:
 * > 60%: Mint
 * 30% - 60%: Honey
 * < 30%: Ember
 * NEVER RED.
 */
export function getBatteryColor(
  value: number,
  accents: {
    mint: { pop: string; tint: string };
    honey: { pop: string; tint: string };
    ember: { pop: string; tint: string };
  }
): BatteryColorPair {
  const clamped = Math.max(0, Math.min(100, value));
  if (clamped > 60) {
    return { pop: accents.mint.pop, tint: accents.mint.tint, level: 'high' };
  }
  if (clamped >= 30) {
    return { pop: accents.honey.pop, tint: accents.honey.tint, level: 'mid' };
  }
  return { pop: accents.ember.pop, tint: accents.ember.tint, level: 'low' };
}

export interface BatteryGaugeProps {
  value: number; // 0 to 100
  onChange?: (val: number) => void;
  mode?: 'display' | 'drag';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function BatteryGauge({
  value,
  onChange,
  mode = 'display',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID = 'battery-gauge'
}: BatteryGaugeProps): React.JSX.Element {
  const { colors, accents, radii, reducedMotion } = useTheme();
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));
  const { pop: fillColor, level } = getBatteryColor(clampedValue, accents);

  const heightRef = useRef<number>(size === 'lg' ? 140 : size === 'md' ? 96 : 56);
  const topYRef = useRef<number>(0);
  const lastHapticStepRef = useRef<number>(Math.floor(clampedValue / 10));

  // Surface wave animation phase
  const wavePhase = useSharedValue(0);

  React.useEffect(() => {
    if (reducedMotion) {
      wavePhase.value = 0;
    } else {
      wavePhase.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1600 }),
          withTiming(0, { duration: 1600 })
        ),
        -1,
        true
      );
    }
  }, [reducedMotion, wavePhase]);

  const triggerStepHaptic = useCallback((pct: number) => {
    const step = Math.floor(pct / 10);
    if (lastHapticStepRef.current !== step) {
      lastHapticStepRef.current = step;
      try {
        void Haptics.selectionAsync();
      } catch {
        // Fallback
      }
    }
  }, []);

  const calculatePctFromY = useCallback(
    (pageY: number) => {
      const h = heightRef.current;
      if (h <= 0) return clampedValue;
      // Dragging up increases percentage (bottom is 0%, top is 100%)
      const relativeY = pageY - topYRef.current;
      const invertedFraction = 1 - Math.max(0, Math.min(relativeY / h, 1));
      const newPct = Math.round(invertedFraction * 100);
      return Math.max(0, Math.min(100, newPct));
    },
    [clampedValue]
  );

  const handleTouchStart = (evt: GestureResponderEvent) => {
    if (mode !== 'drag' || disabled || loading || !onChange) return;
    const newPct = calculatePctFromY(evt.nativeEvent.pageY);
    triggerStepHaptic(newPct);
    onChange(newPct);
  };

  const handleTouchMove = (evt: GestureResponderEvent) => {
    if (mode !== 'drag' || disabled || loading || !onChange) return;
    const newPct = calculatePctFromY(evt.nativeEvent.pageY);
    triggerStepHaptic(newPct);
    onChange(newPct);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    heightRef.current = event.nativeEvent.layout.height;
  };

  const handleMeasure = (view: View | null) => {
    if (view && typeof view.measure === 'function') {
      view.measure((_x, _y, _width, height, _pageX, pageY) => {
        heightRef.current = height;
        topYRef.current = pageY;
      });
    }
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (mode !== 'drag' || disabled || loading || !onChange) return;
    if (event.nativeEvent.actionName === 'increment') {
      const next = Math.min(100, clampedValue + 10);
      triggerStepHaptic(next);
      onChange(next);
    } else if (event.nativeEvent.actionName === 'decrement') {
      const prev = Math.max(0, clampedValue - 10);
      triggerStepHaptic(prev);
      onChange(prev);
    }
  };

  const animatedWaveProps = useAnimatedProps(() => {
    const waveOffset = reducedMotion ? 0 : Math.sin(wavePhase.value * Math.PI * 2) * 4;
    return {
      d: `M 0,8 Q 20,${8 + waveOffset} 40,8 T 80,${8 - waveOffset} T 120,8 L 120,20 L 0,20 Z`
    };
  });

  // Dimensions based on size
  const width = size === 'lg' ? 76 : size === 'md' ? 52 : 36;
  const height = size === 'lg' ? 140 : size === 'md' ? 96 : 56;
  const fillHeight = (clampedValue / 100) * (height - 12);

  const levelText =
    level === 'high'
      ? componentsCopy.batteryGauge.highEnergyLabel
      : level === 'mid'
        ? componentsCopy.batteryGauge.midEnergyLabel
        : componentsCopy.batteryGauge.lowEnergyLabel;

  return (
    <View
      testID={testID}
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole={mode === 'drag' ? 'adjustable' : 'progressbar'}
      accessibilityLabel={
        accessibilityLabel ?? `${componentsCopy.batteryGauge.accessibilityLabel}: ${clampedValue}%, ${levelText}`
      }
      accessibilityHint={mode === 'drag' ? (accessibilityHint ?? componentsCopy.batteryGauge.dragHint) : undefined}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedValue,
        text: componentsCopy.batteryGauge.levelLabel(clampedValue)
      }}
      accessibilityActions={
        mode === 'drag'
          ? [
              { name: 'increment', label: 'Increase battery level by 10%' },
              { name: 'decrement', label: 'Decrease battery level by 10%' }
            ]
          : undefined
      }
      onAccessibilityAction={handleAccessibilityAction}
    >
      <View
        ref={handleMeasure}
        onLayout={handleLayout}
        style={[
          styles.batteryBody,
          {
            width,
            height,
            backgroundColor: colors.surface2,
            borderColor: colors.line,
            borderRadius: radii.card
          },
          disabled && styles.disabled
        ]}
        onStartShouldSetResponder={() => mode === 'drag' && !disabled && !loading}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
      >
        {/* Battery terminal pip at top */}
        <View
          style={[
            styles.terminalPip,
            {
              backgroundColor: colors.line,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3
            }
          ]}
        />

        {/* Liquid Fill Area */}
        <View style={styles.fillClip}>
          <View
            testID={`${testID}-fill`}
            style={[
              styles.liquidFill,
              {
                height: fillHeight,
                backgroundColor: fillColor
              }
            ]}
          >
            {/* Wave crest */}
            <View style={styles.waveSvgContainer}>
              <Svg width={width} height={12} viewBox="0 0 80 16">
                <AnimatedPath
                  fill={fillColor}
                  animatedProps={animatedWaveProps}
                />
              </Svg>
            </View>
          </View>
        </View>

        {/* Center Percentage Display */}
        <View style={styles.percentageCenter} pointerEvents="none">
          <Text
            role={size === 'sm' ? 'labelSmall' : 'titleSmall'}
            style={[styles.percentageText, { color: colors.ink }]}
          >
            {`${clampedValue}%`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    padding: 4
  },
  batteryBody: {
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  terminalPip: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 5,
    zIndex: 2
  },
  fillClip: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  liquidFill: {
    width: '100%',
    position: 'relative'
  },
  waveSvgContainer: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 12
  },
  percentageCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
  },
  percentageText: {
    fontWeight: '700'
  },
  disabled: {
    opacity: 0.4
  }
});
