import { aggregateEnergyLogs, getTimeSlot } from '../heatGrid';
import type { EnergyLog } from '../../energy/types';

describe('T-18 Battery heat-grid aggregation', () => {
  it('correctly maps dates to time slots', () => {
    expect(getTimeSlot(new Date('2026-10-16T08:30:00'))).toBe('morning');
    expect(getTimeSlot(new Date('2026-10-16T13:15:00'))).toBe('afternoon');
    expect(getTimeSlot(new Date('2026-10-16T19:45:00'))).toBe('evening');
    expect(getTimeSlot(new Date('2026-10-16T02:00:00'))).toBe('evening');
  });

  it('handles empty energy logs cleanly with 21 grid cells', () => {
    const stats = aggregateEnergyLogs([]);
    expect(stats.gridCells).toHaveLength(21); // 7 days * 3 slots
    expect(stats.dayTimeAverages).toHaveLength(0);
    expect(stats.topCostTags).toHaveLength(0);
    expect(stats.topRechargeTags).toHaveLength(0);
    expect(stats.overallAverage).toBe(50);
  });

  it('aggregates logs across days, slots, and tags accurately', () => {
    // 2026-10-12 is Monday (dayOfWeek = 1)
    const logs: EnergyLog[] = [
      {
        id: '1',
        batteryLevel: 80,
        tags: ['Walks', 'Rest'],
        createdAt: '2026-10-12T09:00:00', // Monday morning local
      },
      {
        id: '2',
        batteryLevel: 60,
        tags: ['Walks'],
        createdAt: '2026-10-12T10:00:00', // Monday morning local
      },
      {
        id: '3',
        batteryLevel: 30,
        tags: ['Large group', 'Meetings'],
        createdAt: '2026-10-12T14:00:00', // Monday afternoon local
      },
      {
        id: '4',
        batteryLevel: 20,
        tags: ['Large group'],
        createdAt: '2026-10-15T15:00:00', // Thursday afternoon local (day 4)
      },
    ];

    const stats = aggregateEnergyLogs(logs);

    // Monday morning should average (80 + 60) / 2 = 70
    const monMorning = stats.gridCells.find(
      (c) => c.dayOfWeek === 1 && c.timeSlot === 'morning'
    );
    expect(monMorning?.avgEnergy).toBe(70);
    expect(monMorning?.count).toBe(2);

    // Monday afternoon should average 30
    const monAfternoon = stats.gridCells.find(
      (c) => c.dayOfWeek === 1 && c.timeSlot === 'afternoon'
    );
    expect(monAfternoon?.avgEnergy).toBe(30);
    expect(monAfternoon?.count).toBe(1);

    // Check cost and recharge tags
    // Overall avg = (80 + 60 + 30 + 20) / 4 = 47.5 -> 48
    // Large group levels: [30, 20] -> avg 25 (drop: 25 - 48 = -23) -> cost
    // Walks levels: [80, 60] -> avg 70 (gain: 70 - 48 = +22) -> recharge
    expect(stats.topCostTags.some((t) => t.tag === 'Large group')).toBe(true);
    expect(stats.topRechargeTags.some((t) => t.tag === 'Walks')).toBe(true);
  });
});
