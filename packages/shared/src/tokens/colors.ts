export interface AccentColor {
  base: string;
  tint: string;
  pop: string;
}

export interface EmberAccent extends AccentColor {
  dark: string;
  gradient: {
    start: string;
    end: string;
  };
}

export interface GlassRecipe {
  background: string;
  border: string;
  blur: number;
}

export interface ThemeColors {
  base: string;
  surface1: string;
  surface2: string;
  glass: GlassRecipe;
  ink: string;
  muted: string;
  line: string;
}

export interface FocusRingRecipe {
  color: string;
  width: number;
  offset: number;
}

export const daylightColors: ThemeColors = {
  base: '#F7F1E9',
  surface1: '#FFFCF7',
  surface2: '#F1E9DF',
  glass: {
    background: 'rgba(255, 252, 247, 0.75)',
    border: 'rgba(229, 218, 206, 0.60)',
    blur: 16
  },
  ink: '#29232B',
  muted: '#776D72',
  line: '#E5DACE'
};

export const midnightColors: ThemeColors = {
  base: '#211B25',
  surface1: '#332A37',
  surface2: '#443749',
  glass: {
    background: 'rgba(51, 42, 55, 0.75)',
    border: 'rgba(68, 55, 73, 0.60)',
    blur: 16
  },
  ink: '#FFFCF7',
  muted: '#A69AA0',
  line: '#443749'
};

export const emberColor: EmberAccent = {
  base: '#C8664D',
  dark: '#A94E3A',
  tint: '#F2DCD4',
  pop: '#D67C62',
  gradient: {
    start: '#D67C62',
    end: '#B85842'
  }
};

export const lilacColor: AccentColor = {
  base: '#B9A8D9',
  tint: '#EDE6F5',
  pop: '#D4C6E9'
};

export const mintColor: AccentColor = {
  base: '#AFCDB8',
  tint: '#E6F0E7',
  pop: '#8FBA86'
};

export const honeyColor: AccentColor = {
  base: '#E6C278',
  tint: '#F7EED8',
  pop: '#F4D38D'
};

export const skyColor: AccentColor = {
  base: '#7BB3D6',
  tint: '#EBF3F8',
  pop: '#96C7E6'
};

export const bubblegumColor: AccentColor = {
  base: '#E598A8',
  tint: '#FCE8ED',
  pop: '#F2A7B8'
};

export const accents = {
  ember: emberColor,
  lilac: lilacColor,
  mint: mintColor,
  honey: honeyColor,
  sky: skyColor,
  bubblegum: bubblegumColor
} as const;

export const focusRing: FocusRingRecipe = {
  color: '#B9A8D9',
  width: 3,
  offset: 2
};
