export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export const motion = {
  springs: {
    playful: {
      stiffness: 300,
      damping: 26,
      mass: 1
    },
    calm: {
      stiffness: 300,
      damping: 30,
      mass: 1
    }
  },
  durations: {
    tap: 180,
    transition: 280,
    crossfade: 300,
    reveal: 420
  },
  squishScale: 0.94
} as const;

export type SpringPreset = keyof typeof motion.springs;
export type DurationPreset = keyof typeof motion.durations;
