import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { type IconProps } from './HomeIcon';

export function CalendarIcon({
  size = 24,
  color,
  active = false,
  accentColor,
  strokeWidth = 2.5,
  accessibilityLabel = 'Calendar'
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
      <Rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="4"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M3 10H21"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M8 3V7M16 3V7"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {active ? (
        <Circle cx="12" cy="15" r="2.5" fill={dotColor} />
      ) : (
        <Circle cx="12" cy="15" r="1.5" fill={strokeColor} />
      )}
    </Svg>
  );
}
