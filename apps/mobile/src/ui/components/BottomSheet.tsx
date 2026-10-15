import React, { useEffect } from 'react';
import {
  GestureResponderEvent,
  Modal,
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
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { CloseIcon } from '../icons/CloseIcon';
import { componentsCopy } from '../../copy/components';

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  accessibilityLabel?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function BottomSheet({
  visible,
  onDismiss,
  title,
  accessibilityLabel,
  children,
  style,
  testID = 'bottom-sheet'
}: BottomSheetProps): React.JSX.Element | null {
  const { colors, radii, motion, reducedMotion } = useTheme();

  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);

  const dragStartY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (reducedMotion) {
        translateY.value = 0;
        backdropOpacity.value = 1;
      } else {
        backdropOpacity.value = withTiming(1, { duration: motion.durations.transition });
        translateY.value = withSpring(0, motion.springs.playful);
      }
    } else {
      if (reducedMotion) {
        translateY.value = 400;
        backdropOpacity.value = 0;
      } else {
        backdropOpacity.value = withTiming(0, { duration: motion.durations.tap });
        translateY.value = withSpring(400, motion.springs.calm);
      }
    }
  }, [visible, reducedMotion, motion.durations, motion.springs, translateY, backdropOpacity]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  // Handle pan responder for drag to dismiss
  const handleTouchStart = (evt: GestureResponderEvent) => {
    dragStartY.value = evt.nativeEvent.pageY;
  };

  const handleTouchMove = (evt: GestureResponderEvent) => {
    const diff = evt.nativeEvent.pageY - dragStartY.value;
    if (diff > 0) {
      translateY.value = diff;
    }
  };

  const handleTouchEnd = (evt: GestureResponderEvent) => {
    const diff = evt.nativeEvent.pageY - dragStartY.value;
    if (diff > 100) {
      // Dismiss
      if (reducedMotion) {
        translateY.value = 400;
        onDismiss();
      } else {
        translateY.value = withSpring(400, motion.springs.calm, () => {
          runOnJS(onDismiss)();
        });
      }
    } else {
      // Spring back to 0
      translateY.value = withSpring(0, motion.springs.playful);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View
        testID={testID}
        style={styles.overlayContainer}
        accessible={true}
        accessibilityLabel={accessibilityLabel ?? title ?? componentsCopy.bottomSheet.dragHandleLabel}
        accessibilityViewIsModal={true}
      >
        {/* Glass backdrop */}
        <Animated.View
          testID={`${testID}-backdrop`}
          style={[
            styles.backdrop,
            { backgroundColor: colors.glass.background },
            animatedBackdropStyle
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={componentsCopy.bottomSheet.closeAction}
          />
        </Animated.View>

        {/* Sheet surface */}
        <Animated.View
          testID={`${testID}-surface`}
          style={[
            styles.sheetSurface,
            {
              backgroundColor: colors.surface1,
              borderTopLeftRadius: radii.sheet,
              borderTopRightRadius: radii.sheet,
              borderColor: colors.line
            },
            animatedSheetStyle,
            style
          ]}
        >
          {/* Top-left inner highlight line */}
          <View
            style={[
              styles.innerHighlight,
              { borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet }
            ]}
          />

          {/* Drag Handle touch area */}
          <View
            testID={`${testID}-drag-handle`}
            style={styles.handleHitbox}
            accessible={true}
            accessibilityRole="adjustable"
            accessibilityLabel={componentsCopy.bottomSheet.dragHandleLabel}
            accessibilityHint={componentsCopy.bottomSheet.accessibilityHint}
            onStartShouldSetResponder={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
          >
            <View
              style={[
                styles.handleBar,
                { backgroundColor: colors.muted, borderRadius: radii.pill }
              ]}
            />
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            {title ? (
              <Text role="titleMedium" style={{ color: colors.ink }}>
                {title}
              </Text>
            ) : (
              <View style={styles.flexSpacer} />
            )}
            <Pressable
              testID={`${testID}-close`}
              style={styles.closeButton}
              onPress={onDismiss}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={componentsCopy.bottomSheet.closeAction}
            >
              <CloseIcon size={20} color={colors.ink} />
            </Pressable>
          </View>

          {/* Sheet Body Content */}
          <View style={styles.contentContainer}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  sheetSurface: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 32,
    position: 'relative',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  handleHitbox: {
    height: 36,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  handleBar: {
    width: 44,
    height: 5
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12
  },
  flexSpacer: {
    flex: 1
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16
  }
});
