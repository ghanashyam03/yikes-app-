import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { type IconProps } from './HomeIcon';

export function CheckIcon({
  size = 24,
  color,
  active = false,
  accentColor,
  strokeWidth = 2.5,
  accessibilityLabel = 'Check'
}: IconProps): React.JSX.Element {
  const { colors, accents } = useTheme();
  const strokeColor = color ?? colors.ink;
  const dotColor = accentColor ?? accents.mint.base;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Path
        d="M20 6L9 17L4 12"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {active && <Circle cx="20" cy="6" r="2.2" fill={dotColor} />}
    </Svg>
  );
}
