import { useMemo } from 'react';
import type { CheckIn } from '../types';
import {
  calculateStreak,
  calculateMaxStreak,
  isStreakActive,
} from '../utils/streakCalculator';
import { useLocalStorage } from './useLocalStorage';

export interface UseStreakResult {
  currentStreak: number;
  maxStreak: number;
  isStreakActive: boolean;
}

const REST_DAYS_KEY = 'momenta-rest-days';

export function useStreak(checkIns: CheckIn[]): UseStreakResult {
  const [restDays] = useLocalStorage<number[]>(REST_DAYS_KEY, []);

  return useMemo<UseStreakResult>(
    () => ({
      currentStreak: calculateStreak(checkIns, restDays),
      maxStreak: calculateMaxStreak(checkIns, restDays),
      isStreakActive: isStreakActive(checkIns, restDays),
    }),
    [checkIns, restDays],
  );
}
