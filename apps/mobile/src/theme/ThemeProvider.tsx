import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import {
  daylightColors,
  midnightColors,
  accents,
  focusRing,
  type ThemeColors,
  type FocusRingRecipe
} from '@yikes/shared/tokens/colors';
import { spacing } from '@yikes/shared/tokens/spacing';
import { radii } from '@yikes/shared/tokens/radii';
import { motion } from '@yikes/shared/tokens/motion';
import { hapticMap } from '@yikes/shared/tokens/haptics';
import { lightShadows, darkGlows } from '@yikes/shared/tokens/shadows';
import { useSoftPopFonts } from './fonts';

export type ThemePreference = 'light' | 'dark' | 'auto';
export type ResolvedThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  preference: ThemePreference;
  mode: ResolvedThemeMode;
  setPreference: (pref: ThemePreference) => void;
  colors: ThemeColors;
  accents: typeof accents;
  focusRing: FocusRingRecipe;
  spacing: typeof spacing;
  radii: typeof radii;
  motion: typeof motion;
  haptics: typeof hapticMap;
  shadows: typeof lightShadows | typeof darkGlows;
  reducedMotion: boolean;
  setReducedMotionOverride: (val: boolean | null) => void;
  fontsLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialPreference?: ThemePreference;
}

export function ThemeProvider({
  children,
  initialPreference = 'auto'
}: ThemeProviderProps): React.JSX.Element {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const [reducedMotionSystem, setReducedMotionSystem] = useState(false);
  const [reducedMotionOverride, setReducedMotionOverride] = useState<boolean | null>(null);

  const { loaded: fontsLoaded } = useSoftPopFonts();

  // Reduced motion system listener
  useEffect(() => {
    let isMounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (isMounted) setReducedMotionSystem(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        if (isMounted) setReducedMotionSystem(enabled);
      }
    );

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);

  const reducedMotion = reducedMotionOverride ?? reducedMotionSystem;

  // Resolve light vs dark mode
  const resolvedMode: ResolvedThemeMode = useMemo(() => {
    if (preference === 'auto') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  // 300 ms crossfade animation driver
  const crossfadeOpacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      crossfadeOpacity.value = 1;
      return;
    }
    // Animate a quick dip and fade-in to crossfade over 300ms
    crossfadeOpacity.value = 0.75;
    crossfadeOpacity.value = withTiming(1, { duration: motion.durations.crossfade });
  }, [resolvedMode, reducedMotion, crossfadeOpacity]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: crossfadeOpacity.value
    };
  });

  const colors = resolvedMode === 'dark' ? midnightColors : daylightColors;
  const shadows = resolvedMode === 'dark' ? darkGlows : lightShadows;

  const contextValue = useMemo<ThemeContextValue>(() => {
    return {
      preference,
      mode: resolvedMode,
      setPreference,
      colors,
      accents,
      focusRing,
      spacing,
      radii,
      motion,
      haptics: hapticMap,
      shadows,
      reducedMotion,
      setReducedMotionOverride,
      fontsLoaded
    };
  }, [preference, resolvedMode, colors, shadows, reducedMotion, fontsLoaded]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: colors.base },
          animatedContainerStyle
        ]}
      >
        <View style={styles.container}>{children}</View>
      </Animated.View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
