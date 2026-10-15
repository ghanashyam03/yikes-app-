import React from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
  View
} from 'react-native';
import { typeRoles, type TypeRole } from '@yikes/shared/tokens/typography';
import { useTheme } from '../../theme/useTheme';
import { resolveFontFamily } from '../../theme/fonts';

export interface TextProps extends Omit<RNTextProps, 'role'> {
  role?: TypeRole;
  color?: string;
  muted?: boolean;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function Text({
  role = 'bodyMedium',
  color,
  muted = false,
  align = 'left',
  style,
  children,
  maxFontSizeMultiplier = 2.0,
  ...rest
}: TextProps): React.JSX.Element {
  const { colors } = useTheme();
  const tokenStyle = typeRoles[role];
  const { fontFamily, fontStyle: resolvedFallbackStyle } = resolveFontFamily(tokenStyle.fontFamily);

  const resolvedColor = color ?? (muted ? colors.muted : colors.ink);
  const resolvedFontStyle = tokenStyle.fontStyle ?? resolvedFallbackStyle;

  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        {
          fontSize: tokenStyle.fontSize,
          lineHeight: tokenStyle.lineHeight,
          fontFamily,
          fontStyle: resolvedFontStyle,
          fontWeight: tokenStyle.fontWeight,
          letterSpacing: tokenStyle.letterSpacing,
          color: resolvedColor,
          textAlign: align
        },
        style
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export interface HighlighterSwipeProps {
  children: React.ReactNode;
  tint?: string;
  tiltDegrees?: number;
}

/**
 * Hand-drawn style highlighter swipe behind a key word in a headline
 */
export function HighlighterSwipe({
  children,
  tint,
  tiltDegrees = -1.5
}: HighlighterSwipeProps): React.JSX.Element {
  const { accents } = useTheme();
  const swipeTint = tint ?? accents.honey.tint;

  return (
    <View style={styles.highlightWrapper}>
      <View
        style={[
          styles.highlightBar,
          {
            backgroundColor: swipeTint,
            transform: [{ rotate: `${tiltDegrees}deg` }]
          }
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  highlightWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignSelf: 'flex-start'
  },
  highlightBar: {
    position: 'absolute',
    left: -4,
    right: -4,
    bottom: 2,
    height: '45%',
    borderRadius: 4,
    zIndex: -1
  }
});
