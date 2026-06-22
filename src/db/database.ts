import Dexie, { type Table } from 'dexie';
import type { CheckIn } from '../types';

export class MomentaDB extends Dexie {
  checkIns!: Table<CheckIn, string>;

  constructor() {
    super('MomentaDB');
    this.version(1).stores({
      checkIns: 'id, sportType, timestamp, [sportType+timestamp]',
    });
  }
}

export const db = new MomentaDB();

export async function addCheckIn(
  checkIn: Omit<CheckIn, 'id' | 'createdAt'>,
): Promise<CheckIn> {
  try {
    const record: CheckIn = {
      id: crypto.randomUUID(),
      sportType: checkIn.sportType,
      timestamp: checkIn.timestamp,
      note: checkIn.note,
      createdAt: Date.now(),
    };
    await db.checkIns.add(record);
    return record;
  } catch (err) {
    throw new Error(`添加打卡记录失败: ${(err as Error).message}`);
  }
}

export async function getAllCheckIns(): Promise<CheckIn[]> {
  try {
    return await db.checkIns.orderBy('timestamp').reverse().toArray();
  } catch (err) {
    throw new Error(`查询所有打卡记录失败: ${(err as Error).message}`);
  }
}

export async function deleteCheckIn(id: string): Promise<void> {
  try {
    await db.checkIns.delete(id);
  } catch (err) {
    throw new Error(`删除打卡记录失败: ${(err as Error).message}`);
  }
}

export async function getCheckInsByDateRange(
  start: number,
  end: number,
): Promise<CheckIn[]> {
  try {
    return await db.checkIns
      .where('timestamp')
      .between(start, end, true, true)
      .reverse()
      .toArray();
  } catch (err) {
    throw new Error(`按日期范围查询失败: ${(err as Error).message}`);
  }
}

export async function getCheckInsBySportType(sportType: string): Promise<CheckIn[]> {
  try {
    const items = await db.checkIns.where('sportType').equals(sportType).toArray();
    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    throw new Error(`按运动类型查询失败: ${(err as Error).message}`);
  }
}

export async function clearAllCheckIns(): Promise<void> {
  try {
    await db.checkIns.clear();
  } catch (err) {
    throw new Error(`清空打卡记录失败: ${(err as Error).message}`);
  }
}
