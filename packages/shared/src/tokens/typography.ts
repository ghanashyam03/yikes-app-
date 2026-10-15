export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontFamily: 'display' | 'heading' | 'body';
  fontWeight: '400' | '500' | '600' | '700';
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
}

export const fontFamilies = {
  display: 'Instrument Serif Italic',
  heading: 'Bricolage Grotesque',
  body: 'Plus Jakarta Sans'
} as const;

export const fontFallbacks = {
  display: "'Instrument Serif', Georgia, serif",
  heading: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
};

export type TypeRole =
  | 'displayLarge'
  | 'displayMedium'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall';

export const typeRoles: Record<TypeRole, TypeStyle> = {
  displayLarge: {
    fontSize: 42,
    lineHeight: 48,
    fontFamily: 'display',
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: 0
  },
  displayMedium: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: 'display',
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: 0
  },
  titleLarge: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'heading',
    fontWeight: '700',
    fontStyle: 'normal',
    letterSpacing: 0
  },
  titleMedium: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'heading',
    fontWeight: '600',
    fontStyle: 'normal',
    letterSpacing: 0
  },
  titleSmall: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'heading',
    fontWeight: '600',
    fontStyle: 'normal',
    letterSpacing: 0
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'body',
    fontWeight: '400',
    fontStyle: 'normal',
    letterSpacing: 0
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'body',
    fontWeight: '400',
    fontStyle: 'normal',
    letterSpacing: 0
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'body',
    fontWeight: '400',
    fontStyle: 'normal',
    letterSpacing: 0
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'body',
    fontWeight: '600',
    fontStyle: 'normal',
    letterSpacing: 0.5
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'body',
    fontWeight: '600',
    fontStyle: 'normal',
    letterSpacing: 0.5
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'body',
    fontWeight: '700',
    fontStyle: 'normal',
    letterSpacing: 1.0
  }
};
