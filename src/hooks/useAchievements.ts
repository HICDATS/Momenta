import { useMemo } from 'react';
import type { Achievement, CheckIn } from '../types';
import { ACHIEVEMENTS } from '../constants/achievements';
import { calculateMaxStreak } from '../utils/streakCalculator';
import { getMonthStart, getMonthEnd } from '../utils/dateUtils';
import { useLocalStorage } from './useLocalStorage';

export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: number;
  currentCount: number;
  targetCount: number;
  progress: number;
}

const REST_DAYS_KEY = 'momenta-rest-days';
const GOAL_TARGET_COUNT = 1;
const MAX_PROGRESS = 1;

interface CountResult {
  currentCount: number;
  targetCount: number;
  unlocked: boolean;
}

function countTotal(checkIns: CheckIn[], sportType: string | undefined, target: number): CountResult {
  const currentCount = sportType
    ? checkIns.filter((c) => c.sportType === sportType).length
    : checkIns.length;
  return makeCountResult(currentCount, target);
}

function countStreak(checkIns: CheckIn[], restDays: number[], target: number): CountResult {
  const currentCount = calculateMaxStreak(checkIns, restDays);
  return makeCountResult(currentCount, target);
}

function countMonthly(checkIns: CheckIn[], target: number): CountResult {
  const now = Date.now();
  const start = getMonthStart(now);
  const end = getMonthEnd(now);
  const currentCount = checkIns.filter(
    (c) => c.timestamp >= start && c.timestamp <= end,
  ).length;
  return makeCountResult(currentCount, target);
}

function countSportVariety(checkIns: CheckIn[], target: number): CountResult {
  const currentCount = new Set(checkIns.map((c) => c.sportType)).size;
  return makeCountResult(currentCount, target);
}

function makeCountResult(currentCount: number, targetCount: number): CountResult {
  return {
    currentCount,
    targetCount,
    unlocked: currentCount >= targetCount,
  };
}

function computeProgress(
  achievement: Achievement,
  checkIns: CheckIn[],
  restDays: number[],
): CountResult {
  const cond = achievement.condition;
  switch (cond.type) {
    case 'total_count':
      return countTotal(checkIns, cond.sportType, cond.count);
    case 'streak_days':
      return countStreak(checkIns, restDays, cond.days);
    case 'monthly_count':
      return countMonthly(checkIns, cond.count);
    case 'sport_variety':
      return countSportVariety(checkIns, cond.count);
    case 'goal_complete':
      return { currentCount: 0, targetCount: GOAL_TARGET_COUNT, unlocked: false };
    default:
      return { currentCount: 0, targetCount: 0, unlocked: false };
  }
}

export function useAchievements(checkIns: CheckIn[]): AchievementProgress[] {
  const [restDays] = useLocalStorage<number[]>(REST_DAYS_KEY, []);

  return useMemo<AchievementProgress[]>(() => {
    const now = Date.now();
    return ACHIEVEMENTS.map((achievement) => {
      const { currentCount, targetCount, unlocked } = computeProgress(
        achievement,
        checkIns,
        restDays,
      );
      const progress = targetCount > 0
        ? Math.min(currentCount / targetCount, MAX_PROGRESS)
        : 0;
      return {
        achievement,
        unlocked,
        unlockedAt: unlocked ? now : undefined,
        currentCount,
        targetCount,
        progress,
      };
    });
  }, [checkIns, restDays]);
}
