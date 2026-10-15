import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { componentsCopy } from '../../copy/components';

export type CharacterExpression = 'neutral' | 'warm' | 'distracted' | 'wrapping_up';

export type CharacterPreset =
  | 'maya'
  | 'priya'
  | 'sam'
  | 'alex'
  | 'elena'
  | 'marcus'
  | 'coach';

export interface CharacterPalette {
  base: string;
  accent: string;
  skin: string;
  hair: string;
}

export interface CharacterAvatarProps {
  character?: CharacterPreset;
  palette?: CharacterPalette;
  expression?: CharacterExpression;
  size?: 'sm' | 'md' | 'lg' | number;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CharacterAvatar({
  character = 'maya',
  palette,
  expression = 'neutral',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  testID = 'character-avatar'
}: CharacterAvatarProps): React.JSX.Element {
  const { accents, motion, reducedMotion } = useTheme();

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

  // Resolve palette
  const characterPalettes: Record<CharacterPreset, CharacterPalette> = {
    maya: {
      base: accents.lilac.tint,
      accent: accents.lilac.pop,
      skin: '#F5D0C5',
      hair: '#3D2645'
    },
    priya: {
      base: accents.mint.tint,
      accent: accents.mint.pop,
      skin: '#DDB180',
      hair: '#2B211B'
    },
    sam: {
      base: accents.sky.tint,
      accent: accents.sky.pop,
      skin: '#F7D6BF',
      hair: '#4A3B32'
    },
    alex: {
      base: accents.honey.tint,
      accent: accents.honey.pop,
      skin: '#E8C39E',
      hair: '#1F2421'
    },
    elena: {
      base: accents.bubblegum.tint,
      accent: accents.bubblegum.pop,
      skin: '#EAC8AF',
      hair: '#5C3D2E'
    },
    marcus: {
      base: accents.ember.tint,
      accent: accents.ember.pop,
      skin: '#8D5B4C',
      hair: '#1B1B1B'
    },
    coach: {
      base: accents.lilac.tint,
      accent: accents.lilac.pop,
      skin: '#ECD2B8',
      hair: '#2E294E'
    }
  };

  const activePalette = palette ?? characterPalettes[character] ?? characterPalettes.maya;

  const dimension =
    typeof size === 'number'
      ? size
      : size === 'lg'
        ? 64
        : size === 'md'
          ? 48
          : 36;

  // Expression features in SVG 100x100 viewBox
  const renderExpressionFeatures = () => {
    switch (expression) {
      case 'warm':
        return (
          <G testID={`${testID}-expression-warm`}>
            {/* Smiling curved eyes */}
            <Path
              d="M32 44 Q38 37 44 44"
              stroke={activePalette.hair}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M56 44 Q62 37 68 44"
              stroke={activePalette.hair}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Rosy warm cheeks */}
            <Circle cx="30" cy="53" r="5" fill={accents.bubblegum.pop} opacity="0.4" />
            <Circle cx="70" cy="53" r="5" fill={accents.bubblegum.pop} opacity="0.4" />
            {/* Warm open smile */}
            <Path
              d="M38 60 Q50 72 62 60"
              stroke={activePalette.hair}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'distracted':
        return (
          <G testID={`${testID}-expression-distracted`}>
            {/* Eyes looking up and away */}
            <Circle cx="40" cy="40" r="4.5" fill={activePalette.hair} />
            <Circle cx="64" cy="40" r="4.5" fill={activePalette.hair} />
            {/* Wondering small mouth */}
            <Path
              d="M45 64 Q50 62 55 64"
              stroke={activePalette.hair}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'wrapping_up':
        return (
          <G testID={`${testID}-expression-wrapping_up`}>
            {/* Polite glance eyes */}
            <Circle cx="37" cy="43" r="4" fill={activePalette.hair} />
            <Circle cx="61" cy="43" r="4" fill={activePalette.hair} />
            {/* Polite closed smile / parting nod */}
            <Path
              d="M42 62 Q50 67 58 62"
              stroke={activePalette.hair}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'neutral':
      default:
        return (
          <G testID={`${testID}-expression-neutral`}>
            {/* Calm forward eyes */}
            <Circle cx="36" cy="43" r="4.5" fill={activePalette.hair} />
            <Circle cx="64" cy="43" r="4.5" fill={activePalette.hair} />
            {/* Gentle neutral line mouth */}
            <Path
              d="M42 62 L58 62"
              stroke={activePalette.hair}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );
    }
  };

  const expressionText =
    componentsCopy.characterAvatar.expressions[expression] ?? expression;
  const a11yLabel =
    accessibilityLabel ??
    componentsCopy.characterAvatar.defaultLabel(
      character.charAt(0).toUpperCase() + character.slice(1),
      expressionText
    );

  const avatarSvg = (
    <Animated.View
      style={[
        styles.avatarWrapper,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: activePalette.base,
          borderColor: activePalette.accent
        },
        disabled && styles.disabled,
        animatedStyle
      ]}
    >
      <Svg width={dimension} height={dimension} viewBox="0 0 100 100">
        {/* Hair silhouette backdrop */}
        <Path
          d="M20 50 C20 22 80 22 80 50 C80 58 75 75 75 75 L25 75 C25 75 20 58 20 50 Z"
          fill={activePalette.hair}
        />
        {/* Face oval */}
        <Ellipse cx="50" cy="50" rx="30" ry="28" fill={activePalette.skin} />
        {/* Hair front strands */}
        <Path
          d="M26 38 C32 26 68 26 74 38 C68 32 58 32 50 36 C42 32 32 32 26 38 Z"
          fill={activePalette.hair}
        />
        {/* Expression Features */}
        {renderExpressionFeatures()}
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
          {avatarSvg}
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
          {avatarSvg}
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
  avatarWrapper: {
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabled: {
    opacity: 0.4
  }
});
