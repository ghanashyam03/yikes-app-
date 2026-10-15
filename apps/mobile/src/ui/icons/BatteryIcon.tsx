import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { type IconProps } from './HomeIcon';

export interface BatteryIconProps extends IconProps {
  level?: number | undefined; // 0 to 1
}

export function BatteryIcon({
  size = 24,
  color,
  active = false,
  accentColor,
  strokeWidth = 2.5,
  level = 0.7,
  accessibilityLabel = 'Battery'
}: BatteryIconProps): React.JSX.Element {
  const { colors, accents } = useTheme();
  const strokeColor = color ?? colors.ink;
  const fillColor = accentColor ?? (active ? accents.mint.base : strokeColor);

  const fillWidth = Math.max(2, Math.min(10, Math.round(10 * level)));

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel={`${accessibilityLabel} ${Math.round(level * 100)}%`}
    >
      {/* Outer battery body */}
      <Rect
        x="3"
        y="6"
        width="15"
        height="12"
        rx="3"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Positive terminal nub */}
      <Path
        d="M20 10V14"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Battery level fill */}
      <Rect
        x="5.5"
        y="8.5"
        width={fillWidth}
        height="7"
        rx="1.5"
        fill={fillColor}
      />
    </Svg>
  );
}
