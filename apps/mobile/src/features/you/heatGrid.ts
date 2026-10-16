import type { EnergyLog } from '../energy/types';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface HeatGridCell {
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ... 6 = Sat
  timeSlot: TimeSlot;
  avgEnergy: number | null; // null if no entries
  count: number;
}

export interface TagStat {
  tag: string;
  count: number;
  avgImpact: number;
}

export interface AggregatedBatteryStats {
  dayTimeAverages: Array<{
    dayOfWeek: number;
    timeSlot: TimeSlot;
    avgEnergy: number;
    count: number;
  }>;
  gridCells: HeatGridCell[];
  topCostTags: TagStat[];
  topRechargeTags: TagStat[];
  overallAverage: number;
}

export function getTimeSlot(date: Date): TimeSlot {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

export function aggregateEnergyLogs(logs: EnergyLog[]): AggregatedBatteryStats {
  const cellsMap = new Map<string, { total: number; count: number }>();
  const tagAccumulator = new Map<string, { levels: number[]; count: number }>();

  let grandTotal = 0;
  let grandCount = 0;

  for (const log of logs) {
    const d = new Date(log.createdAt);
    if (isNaN(d.getTime())) continue;

    const day = d.getDay();
    const slot = getTimeSlot(d);
    const key = `${day}_${slot}`;

    const existing = cellsMap.get(key) || { total: 0, count: 0 };
    existing.total += log.batteryLevel;
    existing.count += 1;
    cellsMap.set(key, existing);

    grandTotal += log.batteryLevel;
    grandCount += 1;

    // Collect tags
    if (Array.isArray(log.tags)) {
      for (const t of log.tags) {
        if (!t || typeof t !== 'string') continue;
        const tagKey = t.trim();
        const tagData = tagAccumulator.get(tagKey) || { levels: [], count: 0 };
        tagData.levels.push(log.batteryLevel);
        tagData.count += 1;
        tagAccumulator.set(tagKey, tagData);
      }
    }
  }

  const overallAverage = grandCount > 0 ? Math.round(grandTotal / grandCount) : 50;

  // Build gridCells for 7 days * 3 slots
  const gridCells: HeatGridCell[] = [];
  const dayTimeAverages: AggregatedBatteryStats['dayTimeAverages'] = [];
  const timeSlots: TimeSlot[] = ['morning', 'afternoon', 'evening'];

  for (let day = 0; day < 7; day++) {
    for (const slot of timeSlots) {
      const key = `${day}_${slot}`;
      const entry = cellsMap.get(key);
      if (entry && entry.count > 0) {
        const avg = Math.round(entry.total / entry.count);
        gridCells.push({
          dayOfWeek: day,
          timeSlot: slot,
          avgEnergy: avg,
          count: entry.count,
        });
        dayTimeAverages.push({
          dayOfWeek: day,
          timeSlot: slot,
          avgEnergy: avg,
          count: entry.count,
        });
      } else {
        gridCells.push({
          dayOfWeek: day,
          timeSlot: slot,
          avgEnergy: null,
          count: 0,
        });
      }
    }
  }

  // Calculate tag stats relative to overall average
  const tagStats: TagStat[] = [];
  for (const [tag, data] of tagAccumulator.entries()) {
    const avg = data.levels.reduce((a, b) => a + b, 0) / data.count;
    const impact = Math.round(avg - overallAverage);
    tagStats.push({
      tag,
      count: data.count,
      avgImpact: impact,
    });
  }

  // Cost tags: negative impact (lower battery than average)
  const topCostTags = tagStats
    .filter((t) => t.avgImpact < 0)
    .sort((a, b) => a.avgImpact - b.avgImpact)
    .slice(0, 3);

  // Recharge tags: positive impact (higher battery than average)
  const topRechargeTags = tagStats
    .filter((t) => t.avgImpact > 0)
    .sort((a, b) => b.avgImpact - a.avgImpact)
    .slice(0, 3);

  return {
    dayTimeAverages,
    gridCells,
    topCostTags,
    topRechargeTags,
    overallAverage,
  };
}
