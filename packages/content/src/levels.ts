import type { SituationLevel } from './types.js';

export const SITUATION_LEVELS: Record<string, SituationLevel> = {
  friendly_one_to_one: {
    level: 'friendly_one_to_one',
    name: 'Friendly one-to-one',
    description: 'Casual, low-stakes chat with an approachable acquaintance or peer in a relaxed setting.',
  },
  colleague: {
    level: 'colleague',
    name: 'Colleague',
    description: 'Day-to-day workplace interaction with someone you collaborate with regularly.',
  },
  senior_busy: {
    level: 'senior_busy',
    name: 'Senior or busy person',
    description: 'Interacting with a director, manager, or stakeholder whose time and attention are limited.',
  },
  groups: {
    level: 'groups',
    name: 'Groups',
    description: 'Conversations with three or more people where pacing, eye contact, and entry timing matter.',
  },
  high_stakes: {
    level: 'high_stakes',
    name: 'High stakes',
    description: 'Crucial moments such as performance check-ins, negotiation, or addressing disagreements.',
  },
};

export const SITUATION_LEVELS_LIST: SituationLevel[] = Object.values(SITUATION_LEVELS);
