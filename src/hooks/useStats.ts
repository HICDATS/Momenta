import { useMemo } from 'react';
import type { CheckIn } from '../types';
import {
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
} from '../utils/dateUtils';

export interface SportTypeDistribution {
  [sportType: string]: number;
}

export interface UseStatsResult {
  weekCount: number;
  monthCount: number;
  totalCount: number;
  typeDistribution: SportTypeDistribution;
}

export function useStats(checkIns: CheckIn[]): UseStatsResult {
  return useMemo<UseStatsResult>(() => {
    const now = Date.now();
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);
    const monthStart = getMonthStart(now);
    const monthEnd = getMonthEnd(now);

    let weekCount = 0;
    let monthCount = 0;
    const typeDistribution: SportTypeDistribution = {};

    for (const checkIn of checkIns) {
      if (checkIn.timestamp >= weekStart && checkIn.timestamp <= weekEnd) {
        weekCount++;
      }
      if (checkIn.timestamp >= monthStart && checkIn.timestamp <= monthEnd) {
        monthCount++;
      }
      typeDistribution[checkIn.sportType] =
        (typeDistribution[checkIn.sportType] ?? 0) + 1;
    }

    return {
      weekCount,
      monthCount,
      totalCount: checkIns.length,
      typeDistribution,
    };
  }, [checkIns]);
}
