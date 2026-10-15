export const radii = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
  card: 28,
  sheet: 36,
  pill: 9999
} as const;

export type RadiiKey = keyof typeof radii;
