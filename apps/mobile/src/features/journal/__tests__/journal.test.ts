import { filterJournalEntries, useJournal } from '../useJournal';
import type { JournalEntry } from '../types';

describe('T-18 Journal feature tests', () => {
  const mockEntries: JournalEntry[] = [
    {
      id: 'entry-1',
      entryKind: 'win',
      title: 'First win',
      body: 'Shared a concise point in the sync',
      favorite: false,
      createdAt: '2026-10-15T10:00:00Z',
    },
    {
      id: 'entry-2',
      entryKind: 'letter',
      title: 'Sunday Letter',
      body: 'You asked more follow-ups in 1-on-1s',
      favorite: true,
      createdAt: '2026-10-14T10:00:00Z',
    },
    {
      id: 'entry-3',
      entryKind: 'debrief',
      title: 'Debrief: Coffee catchup',
      body: 'Leaving after 30 mins kept energy intact',
      favorite: false,
      createdAt: '2026-10-13T10:00:00Z',
    },
    {
      id: 'entry-4',
      entryKind: 'quote',
      title: 'Coach Quote',
      body: '"I liked how you paced your response."',
      favorite: false,
      createdAt: '2026-10-12T10:00:00Z',
    },
  ];

  it('filters entries correctly for all, wins, letters, debriefs', () => {
    expect(filterJournalEntries(mockEntries, 'all')).toHaveLength(4);

    const wins = filterJournalEntries(mockEntries, 'wins');
    expect(wins).toHaveLength(2); // entry-1 (win) and entry-4 (quote)
    expect(wins.map((w) => w.id)).toEqual(['entry-1', 'entry-4']);

    const letters = filterJournalEntries(mockEntries, 'letters');
    expect(letters).toHaveLength(1);
    expect(letters[0]!.id).toBe('entry-2');

    const debriefs = filterJournalEntries(mockEntries, 'debriefs');
    expect(debriefs).toHaveLength(1);
    expect(debriefs[0]!.id).toBe('entry-3');
  });

  it('toggles favorite status and deletes entries in store', async () => {
    useJournal.getState().resetStore();

    await useJournal.getState().addEntry({
      entryKind: 'win',
      title: 'Test Entry',
      body: 'A small victory',
      favorite: false,
    });

    const entries = useJournal.getState().entries;
    expect(entries).toHaveLength(1);
    const addedId = entries[0]!.id;
    expect(entries[0]!.favorite).toBe(false);

    // Toggle favorite
    await useJournal.getState().toggleFavorite(addedId);
    expect(useJournal.getState().entries[0]!.favorite).toBe(true);

    // Toggle back
    await useJournal.getState().toggleFavorite(addedId);
    expect(useJournal.getState().entries[0]!.favorite).toBe(false);

    // Delete
    await useJournal.getState().deleteEntry(addedId);
    expect(useJournal.getState().entries).toHaveLength(0);
  });
});
