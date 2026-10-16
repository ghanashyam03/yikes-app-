export type BatteryTagId = 'people' | 'noise' | 'length' | 'who' | string;

export interface BatteryTag {
  id: BatteryTagId;
  label: string;
}

export interface EnergyLog {
  id: string;
  userId?: string | undefined;
  batteryLevel: number; // 0 to 100
  tags: string[];
  createdAt: string;
}

export type EnergyCheckin = EnergyLog;
