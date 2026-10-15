export interface BoxShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface InnerHighlightStyle {
  borderColor: string;
  borderWidth: number;
  borderTopColor?: string;
  borderLeftColor?: string;
}

export const lightShadows = {
  card: {
    shadowColor: '#30212A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3
  },
  floating: {
    shadowColor: '#30212A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6
  },
  innerHighlight: {
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.75)',
    borderLeftColor: 'rgba(255, 255, 255, 0.75)'
  }
} as const;

export const darkGlows = {
  soft: {
    shadowColor: '#DEA95C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 4
  },
  ember: {
    shadowColor: '#D67C62',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 5
  },
  lilac: {
    shadowColor: '#B9A8D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4
  },
  innerHighlight: {
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    borderLeftColor: 'rgba(255, 255, 255, 0.22)'
  }
} as const;
