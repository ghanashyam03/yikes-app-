export type HapticRole = 'choice' | 'lockIn' | 'reveal' | 'milestone' | 'warning';

export interface HapticDescriptor {
  role: HapticRole;
  description: string;
  type: 'selection' | 'impact' | 'notification' | 'pattern';
  intensity?: 'light' | 'medium' | 'heavy';
  pattern?: number[]; // delay in ms between impacts
}

export const hapticMap: Record<HapticRole, HapticDescriptor> = {
  choice: {
    role: 'choice',
    description: 'soft tick on choices',
    type: 'selection',
    intensity: 'light'
  },
  lockIn: {
    role: 'lockIn',
    description: 'medium thud on lock-in',
    type: 'impact',
    intensity: 'medium'
  },
  reveal: {
    role: 'reveal',
    description: 'rolling pulse on reveals',
    type: 'pattern',
    pattern: [0, 80, 160]
  },
  milestone: {
    role: 'milestone',
    description: 'gentle double tap on milestones',
    type: 'pattern',
    pattern: [0, 120]
  },
  warning: {
    role: 'warning',
    description: 'soft honey alert on invalid state',
    type: 'notification',
    intensity: 'medium'
  }
};
