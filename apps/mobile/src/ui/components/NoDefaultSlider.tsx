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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { componentsCopy } from '../../copy/components';

export interface NoDefaultSliderProps {
  value: number | null;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function NoDefaultSlider({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID = 'no-default-slider'
}: NoDefaultSliderProps): React.JSX.Element {
  const { colors, accents, radii, motion, reducedMotion } = useTheme();
  const trackWidthRef = useRef<number>(0);
  const trackXRef = useRef<number>(0);
  const lastHapticValueRef = useRef<number | null>(null);

  // Animation values for thumb scale and press state
  const isTouched = value !== null;
  const thumbScale = useSharedValue(isTouched ? 1 : 0);

  // Update thumb scale when value transitions from null to non-null
  React.useEffect(() => {
    if (value !== null) {
      if (reducedMotion) {
        thumbScale.value = 1;
      } else {
        thumbScale.value = withSpring(1, motion.springs.playful);
      }
    } else {
      thumbScale.value = 0;
    }
  }, [value, reducedMotion, motion.springs.playful, thumbScale]);

  const triggerStepHaptic = useCallback(
    (stepVal: number) => {
      if (lastHapticValueRef.current !== stepVal) {
        lastHapticValueRef.current = stepVal;
        try {
          void Haptics.selectionAsync();
        } catch {
          // Graceful fallback when haptics are not supported
        }
      }
    },
    []
  );

  const calculateValueFromPosition = useCallback(
    (pageX: number) => {
      const width = trackWidthRef.current;
      if (width <= 0) return min;

      const relativeX = Math.max(0, Math.min(pageX - trackXRef.current, width));
      const percentage = relativeX / width;
      const rawValue = min + percentage * (max - min);

      // Snap to step
      const stepsCount = Math.round((rawValue - min) / step);
      const steppedValue = Math.min(max, Math.max(min, min + stepsCount * step));
      return steppedValue;
    },
    [min, max, step]
  );

  const handleTouchStart = (evt: GestureResponderEvent) => {
    if (disabled || loading) return;
    const newVal = calculateValueFromPosition(evt.nativeEvent.pageX);
    triggerStepHaptic(newVal);
    onChange(newVal);
  };

  const handleTouchMove = (evt: GestureResponderEvent) => {
    if (disabled || loading) return;
    const newVal = calculateValueFromPosition(evt.nativeEvent.pageX);
    triggerStepHaptic(newVal);
    onChange(newVal);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    trackWidthRef.current = width;
  };

  const handleMeasure = (view: View | null) => {
    if (view && typeof view.measure === 'function') {
      view.measure((_x, _y, width, _height, pageX) => {
        trackWidthRef.current = width;
        trackXRef.current = pageX;
      });
    }
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (disabled || loading) return;
    const current = value ?? min;
    if (event.nativeEvent.actionName === 'increment') {
      const next = Math.min(max, current + step);
      triggerStepHaptic(next);
      onChange(next);
    } else if (event.nativeEvent.actionName === 'decrement') {
      const prev = Math.max(min, current - step);
      triggerStepHaptic(prev);
      onChange(prev);
    }
  };

  const currentPercent = value !== null ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: thumbScale.value }]
    };
  });

  const a11yValueText =
    value !== null
      ? componentsCopy.slider.stepLabel(value)
      : componentsCopy.slider.unselectedAccessibilityValue;

  return (
    <View
      testID={testID}
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ?? componentsCopy.slider.unselectedText}
      accessibilityHint={accessibilityHint ?? componentsCopy.slider.accessibilityHint}
      accessibilityValue={{
        min,
        max,
        now: value ?? undefined,
        text: a11yValueText
      }}
      accessibilityActions={[
        { name: 'increment', label: componentsCopy.slider.actionIncrement },
        { name: 'decrement', label: componentsCopy.slider.actionDecrement }
      ]}
      onAccessibilityAction={handleAccessibilityAction}
    >
      <View
        ref={handleMeasure}
        style={[
          styles.touchTrackArea,
          disabled && styles.disabledTrackArea
        ]}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => !disabled && !loading}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
      >
        {/* Visual Track */}
        <View
          style={[
            styles.trackBackground,
            {
              backgroundColor: colors.surface2,
              borderRadius: radii.pill
            }
          ]}
        >
          {/* Active Fill (only visible once touched) */}
          {value !== null && (
            <View
              style={[
                styles.trackFill,
                {
                  width: `${currentPercent}%`,
                  backgroundColor: accents.ember.pop,
                  borderRadius: radii.pill
                }
              ]}
            />
          )}
        </View>

        {/* Thumb */}
        <Animated.View
          testID={`${testID}-thumb`}
          style={[
            styles.thumb,
            {
              left: `${currentPercent}%`,
              backgroundColor: accents.ember.pop,
              borderColor: colors.surface1,
              shadowColor: accents.ember.tint
            },
            animatedThumbStyle
          ]}
        />

        {/* Prompt line if null */}
        {value === null && (
          <View style={styles.promptOverlay} pointerEvents="none">
            <Text role="labelSmall" style={{ color: colors.muted }}>
              {componentsCopy.slider.unselectedText}
            </Text>
          </View>
        )}
      </View>

      {/* Range Labels */}
      <View style={styles.labelsRow}>
        <Text role="labelSmall" style={{ color: colors.muted }}>
          {min}
        </Text>
        <Text role="labelMedium" style={{ color: value !== null ? colors.ink : colors.muted }}>
          {value !== null ? componentsCopy.slider.stepLabel(value) : componentsCopy.slider.unselectedText}
        </Text>
        <Text role="labelSmall" style={{ color: colors.muted }}>
          {max}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8
  },
  touchTrackArea: {
    height: 48,
    justifyContent: 'center',
    width: '100%',
    position: 'relative'
  },
  disabledTrackArea: {
    opacity: 0.4
  },
  trackBackground: {
    height: 12,
    width: '100%',
    overflow: 'hidden'
  },
  trackFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0
  },
  thumb: {
    position: 'absolute',
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
    borderWidth: 3,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4
  },
  promptOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center'
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  }
});
