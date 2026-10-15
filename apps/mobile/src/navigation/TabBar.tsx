import React, { useEffect, useState } from 'react';
import {
  AccessibilityState,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightShadows, darkGlows } from '@yikes/shared/tokens/shadows';
import { useTheme } from '../theme/useTheme';
import { navigationCopy } from '../copy/navigation';
import { Icon, type IconName } from '../ui/icons/Icon';
import { Text } from '../ui/primitives/Text';

export type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

interface TabDef {
  routeName: string;
  label: string;
  iconName: IconName;
  accessibilityLabel: string;
}

const TAB_DEFS: [TabDef, TabDef, TabDef, TabDef] = [
  {
    routeName: 'index',
    label: navigationCopy.tabs.today.label,
    iconName: 'home',
    accessibilityLabel: navigationCopy.tabs.today.accessibilityLabel
  },
  {
    routeName: 'path',
    label: navigationCopy.tabs.path.label,
    iconName: 'path',
    accessibilityLabel: navigationCopy.tabs.path.accessibilityLabel
  },
  {
    routeName: 'moments',
    label: navigationCopy.tabs.moments.label,
    iconName: 'calendar',
    accessibilityLabel: navigationCopy.tabs.moments.accessibilityLabel
  },
  {
    routeName: 'you',
    label: navigationCopy.tabs.you.label,
    iconName: 'person',
    accessibilityLabel: navigationCopy.tabs.you.accessibilityLabel
  }
];

export function TabBar({ state, navigation }: TabBarProps): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, accents, radii, spacing, motion, reducedMotion, mode } = useTheme();

  const [tabLayouts, setTabLayouts] = useState<Record<number, { x: number; width: number }>>({});

  const blobLeft = useSharedValue(0);
  const blobWidth = useSharedValue(0);
  const blobScaleX = useSharedValue(1);
  const blobOpacity = useSharedValue(0);

  const activeIndex = state.index;

  useEffect(() => {
    const layout = tabLayouts[activeIndex];
    if (!layout) return;

    if (blobOpacity.value === 0) {
      blobLeft.value = layout.x;
      blobWidth.value = layout.width;
      blobOpacity.value = 1;
      return;
    }

    if (reducedMotion) {
      blobLeft.value = layout.x;
      blobWidth.value = layout.width;
      blobScaleX.value = 1;
    } else {
      blobScaleX.value = withSequence(
        withTiming(1.18, { duration: 110 }),
        withSpring(1.0, motion.springs.playful)
      );
      blobLeft.value = withSpring(layout.x, motion.springs.playful);
      blobWidth.value = withSpring(layout.width, motion.springs.playful);
    }
  }, [activeIndex, tabLayouts, reducedMotion, motion.springs.playful, blobLeft, blobWidth, blobScaleX, blobOpacity]);

  const animatedBlobStyle = useAnimatedStyle(() => ({
    left: blobLeft.value,
    width: blobWidth.value,
    opacity: blobOpacity.value,
    transform: [{ scaleX: blobScaleX.value }]
  }));

  const handlePracticePress = () => {
    try {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // Haptic fallback
    }
    router.push('/practice');
  };

  const renderTabItem = (tabDef: TabDef, tabIndex: number) => {
    const isFocused = activeIndex === tabIndex;
    const route = state.routes[tabIndex];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route?.key ?? tabDef.routeName,
        canPreventDefault: true
      });

      if (!isFocused && !event.defaultPrevented) {
        try {
          if (Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch {
          // Haptic fallback
        }
        navigation.navigate(tabDef.routeName);
      }
    };

    const onLayout = (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      setTabLayouts((prev) => ({
        ...prev,
        [tabIndex]: { x, width }
      }));
    };

    return (
      <TabItemButton
        key={tabDef.routeName}
        tabDef={tabDef}
        isFocused={isFocused}
        onPress={onPress}
        onLayout={onLayout}
        reducedMotion={reducedMotion}
        springConfig={motion.springs.playful}
        activeColor={colors.ink}
        inactiveColor={colors.muted}
      />
    );
  };

  const [todayTab, pathTab, momentsTab, youTab] = TAB_DEFS;
  const bottomPadding = Math.max(insets.bottom, 12);
  const shadowStyle = mode === 'light' ? lightShadows.floating : darkGlows.soft;
  const innerHighlight = mode === 'light' ? lightShadows.innerHighlight : darkGlows.innerHighlight;

  return (
    <View
      style={[
        styles.floatingWrapper,
        {
          bottom: bottomPadding
        }
      ]}
      pointerEvents="box-none"
    >
      <View
        testID="floating-tab-bar"
        accessibilityRole="tablist"
        style={[
          styles.container,
          {
            backgroundColor: colors.glass.background,
            borderColor: colors.glass.border,
            borderRadius: radii.pill,
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1]
          },
          shadowStyle
        ]}
      >
        {/* Top-left inner gloss highlight */}
        <View
          style={[
            styles.innerHighlight,
            {
              borderColor: innerHighlight.borderColor,
              borderTopColor: innerHighlight.borderTopColor,
              borderLeftColor: innerHighlight.borderLeftColor,
              borderWidth: innerHighlight.borderWidth,
              borderRadius: radii.pill
            }
          ]}
          pointerEvents="none"
        />

        {/* Liquid Selection Blob */}
        <Animated.View
          style={[
            styles.selectionBlob,
            {
              backgroundColor: mode === 'light' ? 'rgba(216, 212, 239, 0.55)' : 'rgba(84, 82, 110, 0.40)',
              borderRadius: radii.pill
            },
            animatedBlobStyle
          ]}
          pointerEvents="none"
        />

        {/* 4 Tabs + Centered Practice Button */}
        <View style={styles.tabsRow}>
          {renderTabItem(todayTab, 0)}
          {renderTabItem(pathTab, 1)}

          <PracticeCenterButton
            onPress={handlePracticePress}
            reducedMotion={reducedMotion}
            springConfig={motion.springs.playful}
            emberStart={accents.ember.gradient.start}
            emberEnd={accents.ember.gradient.end}
          />

          {renderTabItem(momentsTab, 2)}
          {renderTabItem(youTab, 3)}
        </View>
      </View>
    </View>
  );
}

interface TabItemButtonProps {
  tabDef: TabDef;
  isFocused: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  reducedMotion: boolean;
  springConfig: { damping: number; stiffness: number };
  activeColor: string;
  inactiveColor: string;
}

function TabItemButton({
  tabDef,
  isFocused,
  onPress,
  onLayout,
  reducedMotion,
  springConfig,
  activeColor,
  inactiveColor
}: TabItemButtonProps): React.JSX.Element {
  const iconScale = useSharedValue(1);

  const handlePressIn = () => {
    if (reducedMotion) return;
    iconScale.value = withTiming(0.82, { duration: 90 });
  };

  const handlePressOut = () => {
    if (reducedMotion) return;
    iconScale.value = withSpring(1.0, springConfig);
  };

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }]
  }));

  const accessibilityState: AccessibilityState = { selected: isFocused };

  return (
    <Pressable
      testID={`tab-${tabDef.routeName}`}
      accessibilityRole="tab"
      accessibilityLabel={tabDef.accessibilityLabel}
      accessibilityState={accessibilityState}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={onLayout}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.iconWrapper, iconAnimatedStyle]}>
        <Icon
          name={tabDef.iconName}
          size={22}
          color={isFocused ? activeColor : inactiveColor}
        />
      </Animated.View>
      <Text
        role="labelSmall"
        style={[
          styles.tabLabel,
          {
            color: isFocused ? activeColor : inactiveColor,
            fontWeight: isFocused ? '700' : '500'
          }
        ]}
      >
        {tabDef.label}
      </Text>
    </Pressable>
  );
}

interface PracticeCenterButtonProps {
  onPress: () => void;
  reducedMotion: boolean;
  springConfig: { damping: number; stiffness: number };
  emberStart: string;
  emberEnd: string;
}

function PracticeCenterButton({
  onPress,
  reducedMotion,
  springConfig,
  emberStart,
  emberEnd
}: PracticeCenterButtonProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (reducedMotion) return;
    scale.value = withTiming(0.88, { duration: 100 });
  };

  const handlePressOut = () => {
    if (reducedMotion) return;
    scale.value = withSpring(1.0, springConfig);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[styles.practiceContainer, animatedStyle]}>
      <Pressable
        testID="practice-button"
        accessibilityRole="button"
        accessibilityLabel={navigationCopy.practiceButton.accessibilityLabel}
        accessibilityHint={navigationCopy.practiceButton.accessibilityHint}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.practicePressable}
      >
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="emberPracticeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={emberStart} />
              <Stop offset="1" stopColor={emberEnd} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={24} fill="url(#emberPracticeGrad)" />
        </Svg>
        <Icon name="plus" size={24} color="#12131A" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    opacity: 0.8
  },
  selectionBlob: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    height: 'auto'
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  tabButton: {
    flex: 1,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 2
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2
  },
  practiceContainer: {
    zIndex: 3,
    paddingHorizontal: 4
  },
  practicePressable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  }
});
