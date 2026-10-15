import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { type IconProps } from './HomeIcon';

export function PersonIcon({
  size = 24,
  color,
  active = false,
  accentColor,
  strokeWidth = 2.5,
  accessibilityLabel = 'Person'
}: IconProps): React.JSX.Element {
  const { colors, accents } = useTheme();
  const strokeColor = color ?? colors.ink;
  const dotColor = accentColor ?? accents.lilac.base;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Circle
        cx="12"
        cy="7"
        r="4"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={active ? dotColor : 'none'}
      />
      <Path
        d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
