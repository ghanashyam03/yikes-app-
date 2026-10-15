import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { type IconProps } from './HomeIcon';

export function SendIcon({
  size = 24,
  color,
  active = false,
  accentColor,
  strokeWidth = 2.5,
  accessibilityLabel = 'Send'
}: IconProps): React.JSX.Element {
  const { colors, accents } = useTheme();
  const strokeColor = color ?? colors.ink;
  const dotColor = accentColor ?? accents.ember.base;

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
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {active && <Circle cx="11" cy="13" r="2.2" fill={dotColor} />}
    </Svg>
  );
}
