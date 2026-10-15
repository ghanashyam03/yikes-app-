export interface DeeperStatement {
  id: string;
  number: number;
  text: string;
}

export type DeeperAnswers = Record<string, number | null>;

export const DEEPER_STATEMENTS: readonly DeeperStatement[] = [
  { id: 'd1', number: 1, text: 'I feel energised after time with a group' },
  { id: 'd2', number: 2, text: 'I prefer one-to-one conversations' },
  { id: 'd3', number: 3, text: 'I start conversations easily' },
  { id: 'd4', number: 4, text: 'I think before I speak' },
  { id: 'd5', number: 5, text: 'I feel nervous before meetings' },
  { id: 'd6', number: 6, text: 'I recover quickly after an awkward moment' },
  { id: 'd7', number: 7, text: 'I enjoy meeting new people' },
  { id: 'd8', number: 8, text: 'I need time alone to recharge' }
];

export const DEEPER_SCALE_MIN = 1;
export const DEEPER_SCALE_MAX = 5;
export const DEEPER_SCALE_STEP = 1;
