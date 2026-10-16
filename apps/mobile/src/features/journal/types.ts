export type JournalEntryKind = 'win' | 'letter' | 'debrief' | 'quote' | 'milestone';

export interface JournalEntry {
  id: string;
  userId?: string | undefined;
  entryKind: JournalEntryKind;
  title?: string | undefined;
  body: string;
  metadata?: Record<string, unknown> | undefined;
  favorite: boolean;
  createdAt: string;
}

export type JournalFilter = 'all' | 'wins' | 'letters' | 'debriefs';
