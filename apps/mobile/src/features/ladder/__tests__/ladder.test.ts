import { reorderRungs, useLadder } from '../useLadder';
import type { LadderRung } from '../types';

describe('T-18 Quiet Ladder pure reorder and store operations', () => {
  const sampleRungs: LadderRung[] = [
    { id: '1', title: 'Rung 1', sortOrder: 1, completed: false, createdAt: '2026-10-01' },
    { id: '2', title: 'Rung 2', sortOrder: 2, completed: false, createdAt: '2026-10-01' },
    { id: '3', title: 'Rung 3', sortOrder: 3, completed: false, createdAt: '2026-10-01' },
  ];

  it('pure reorderRungs moves rung up and updates sortOrder', () => {
    const moved = reorderRungs(sampleRungs, 1, 'up');
    expect(moved[0]!.id).toBe('2');
    expect(moved[0]!.sortOrder).toBe(1);
    expect(moved[1]!.id).toBe('1');
    expect(moved[1]!.sortOrder).toBe(2);
    expect(moved[2]!.id).toBe('3');
    expect(moved[2]!.sortOrder).toBe(3);
  });

  it('pure reorderRungs moves rung down and updates sortOrder', () => {
    const moved = reorderRungs(sampleRungs, 1, 'down');
    expect(moved[0]!.id).toBe('1');
    expect(moved[0]!.sortOrder).toBe(1);
    expect(moved[1]!.id).toBe('3');
    expect(moved[1]!.sortOrder).toBe(2);
    expect(moved[2]!.id).toBe('2');
    expect(moved[2]!.sortOrder).toBe(3);
  });

  it('pure reorderRungs handles top and bottom boundaries safely', () => {
    // Cannot move top rung further up
    const topUp = reorderRungs(sampleRungs, 0, 'up');
    expect(topUp).toEqual(sampleRungs);

    // Cannot move bottom rung further down
    const bottomDown = reorderRungs(sampleRungs, 2, 'down');
    expect(bottomDown).toEqual(sampleRungs);
  });

  it('seeds 8 rungs by default', () => {
    useLadder.getState().resetStore();
    useLadder.getState().seedLadder();

    const rungs = useLadder.getState().rungs;
    expect(rungs).toHaveLength(8);
    expect(rungs[0]!.sortOrder).toBe(1);
    expect(rungs[7]!.sortOrder).toBe(8);
  });

  it('adds, edits, and toggles completion of rungs', async () => {
    useLadder.getState().resetStore();

    const added = await useLadder.getState().addRung(
      'Say hi to barista',
      'Look them in the eye and say thanks',
      'Easy opener'
    );

    expect(added.title).toBe('Say hi to barista');
    expect(useLadder.getState().rungs).toHaveLength(1);
    expect(useLadder.getState().rungs[0]!.completed).toBe(false);

    // Toggle complete
    await useLadder.getState().toggleDone(added.id);
    expect(useLadder.getState().rungs[0]!.completed).toBe(true);
    expect(useLadder.getState().rungs[0]!.completedAt).toBeTruthy();

    // Toggle back
    await useLadder.getState().toggleDone(added.id);
    expect(useLadder.getState().rungs[0]!.completed).toBe(false);
    expect(useLadder.getState().rungs[0]!.completedAt).toBeNull();

    // Edit title
    await useLadder.getState().editRung(added.id, 'Rewritten title in own words');
    expect(useLadder.getState().rungs[0]!.title).toBe('Rewritten title in own words');
  });
});
