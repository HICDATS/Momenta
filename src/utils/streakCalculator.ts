import {
  startOfDay,
  subDays,
  getDay,
  addDays,
  differenceInCalendarDays,
} from 'date-fns';
import type { CheckIn } from '../types';
import { getDayKey } from './dateUtils';

const CONSECUTIVE_DAY_GAP = 1;
const FIRST_INDEX = 1;
const MIN_STREAK = 1;

function getUniqueDayKeys(checkIns: CheckIn[]): Set<string> {
  return new Set(checkIns.map((c) => getDayKey(c.timestamp)));
}

function isRestDay(dayOfWeek: number, restDays: number[]): boolean {
  return restDays.includes(dayOfWeek);
}

function parseDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function calculateStreak(checkIns: CheckIn[], restDays: number[]): number {
  if (checkIns.length === 0) return 0;

  const uniqueDays = getUniqueDayKeys(checkIns);
  const today = startOfDay(Date.now());
  const todayKey = getDayKey(today.getTime());
  const earliestTs = Math.min(...checkIns.map((c) => c.timestamp));
  const earliestDay = startOfDay(earliestTs);

  if (uniqueDays.has(todayKey)) {
    return countStreakBackward(today, earliestDay, uniqueDays, restDays);
  }

  const yesterday = subDays(today, 1);
  return countStreakBackward(yesterday, earliestDay, uniqueDays, restDays);
}

function countStreakBackward(
  startDay: Date,
  earliestDay: Date,
  uniqueDays: Set<string>,
  restDays: number[]
): number {
  let streak = 0;
  let currentDay = startDay;

  while (currentDay.getTime() >= earliestDay.getTime()) {
    const dayKey = getDayKey(currentDay.getTime());
    const dayOfWeek = getDay(currentDay);

    if (uniqueDays.has(dayKey)) {
      streak++;
      currentDay = subDays(currentDay, 1);
    } else if (isRestDay(dayOfWeek, restDays)) {
      currentDay = subDays(currentDay, 1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateMaxStreak(checkIns: CheckIn[], restDays: number[]): number {
  if (checkIns.length === 0) return 0;

  const uniqueKeys = Array.from(getUniqueDayKeys(checkIns)).sort();
  if (uniqueKeys.length === MIN_STREAK) return MIN_STREAK;

  let maxStreak = MIN_STREAK;
  let currentStreak = MIN_STREAK;

  for (let i = FIRST_INDEX; i < uniqueKeys.length; i++) {
    const prevDate = parseDayKey(uniqueKeys[i - 1]);
    const currDate = parseDayKey(uniqueKeys[i]);
    const gap = differenceInCalendarDays(currDate, prevDate);

    if (gap === CONSECUTIVE_DAY_GAP) {
      currentStreak++;
    } else if (gap > CONSECUTIVE_DAY_GAP && allIntermediateRestDays(prevDate, gap, restDays)) {
      currentStreak++;
    } else {
      currentStreak = MIN_STREAK;
    }

    maxStreak = Math.max(maxStreak, currentStreak);
  }

  return maxStreak;
}

function allIntermediateRestDays(
  prevDate: Date,
  gap: number,
  restDays: number[]
): boolean {
  for (let d = FIRST_INDEX; d < gap; d++) {
    const intermediateDate = addDays(prevDate, d);
    if (!isRestDay(getDay(intermediateDate), restDays)) {
      return false;
    }
  }
  return true;
}

export function isStreakActive(checkIns: CheckIn[], restDays: number[]): boolean {
  if (checkIns.length === 0) return false;

  const uniqueDays = getUniqueDayKeys(checkIns);
  const today = startOfDay(Date.now());

  if (uniqueDays.has(getDayKey(today.getTime()))) return true;

  const earliestTs = Math.min(...checkIns.map((c) => c.timestamp));
  const earliestDay = startOfDay(earliestTs);
  let checkDay = subDays(today, 1);

  while (checkDay.getTime() >= earliestDay.getTime()) {
    const dayKey = getDayKey(checkDay.getTime());
    if (uniqueDays.has(dayKey)) return true;
    if (!isRestDay(getDay(checkDay), restDays)) return false;
    checkDay = subDays(checkDay, 1);
  }

  return false;
}
