import { systemCopy } from '../../copy/system';
import { type WincePose } from '../../ui/components/WinceMascot';

export type EmptyStateKey = 'moments' | 'journal' | 'gap' | 'ladder' | 'history';

export interface EmptyStateDefinition {
  key: EmptyStateKey;
  pose: WincePose;
  title: string;
  description: string;
  actionLabel: string;
}

export const emptyStatesRegistry: Record<EmptyStateKey, EmptyStateDefinition> = {
  moments: {
    key: 'moments',
    pose: 'curious',
    title: systemCopy.emptyStates.moments.title,
    description: systemCopy.emptyStates.moments.description,
    actionLabel: systemCopy.emptyStates.moments.actionLabel,
  },
  journal: {
    key: 'journal',
    pose: 'thinking',
    title: systemCopy.emptyStates.journal.title,
    description: systemCopy.emptyStates.journal.description,
    actionLabel: systemCopy.emptyStates.journal.actionLabel,
  },
  gap: {
    key: 'gap',
    pose: 'thinking',
    title: systemCopy.emptyStates.gap.title,
    description: systemCopy.emptyStates.gap.description,
    actionLabel: systemCopy.emptyStates.gap.actionLabel,
  },
  ladder: {
    key: 'ladder',
    pose: 'proud',
    title: systemCopy.emptyStates.ladder.title,
    description: systemCopy.emptyStates.ladder.description,
    actionLabel: systemCopy.emptyStates.ladder.actionLabel,
  },
  history: {
    key: 'history',
    pose: 'sleepy',
    title: systemCopy.emptyStates.history.title,
    description: systemCopy.emptyStates.history.description,
    actionLabel: systemCopy.emptyStates.history.actionLabel,
  },
};
