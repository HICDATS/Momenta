import type { CheckIn } from '../types';
import { isSameDay, getDaysBetween } from './dateUtils';
import { calculateStreak } from './streakCalculator';

export interface SmartReminderResult {
  shouldRemind: boolean;
  message: string;
  daysSinceLastCheckIn: number;
}

const NO_CHECK_IN_DAYS = -1;
const TODAY_CHECKED_IN_DAYS = 0;
const FIRST_CHECKIN_MESSAGE = '开始你的第一次打卡吧！';
const NO_REMINDER_MESSAGE = '';

function noReminder(daysSinceLastCheckIn: number): SmartReminderResult {
  return { shouldRemind: false, message: NO_REMINDER_MESSAGE, daysSinceLastCheckIn };
}

function computeDaysSinceLastCheckIn(checkIns: CheckIn[], currentTime: number): number {
  if (checkIns.length === 0) return NO_CHECK_IN_DAYS;
  const lastTimestamp = Math.max(...checkIns.map((c) => c.timestamp));
  return getDaysBetween(lastTimestamp, currentTime);
}

export function checkSmartReminder(
  checkIns: CheckIn[],
  threshold: number,
  enabled: boolean,
  todayTriggeredFixed: boolean,
  currentTime: number,
  restDays: number[],
): SmartReminderResult {
  if (!enabled) {
    return noReminder(NO_CHECK_IN_DAYS);
  }

  const hasTodayCheckIn = checkIns.some((c) => isSameDay(c.timestamp, currentTime));
  if (hasTodayCheckIn) {
    return noReminder(TODAY_CHECKED_IN_DAYS);
  }

  if (todayTriggeredFixed) {
    return noReminder(computeDaysSinceLastCheckIn(checkIns, currentTime));
  }

  if (checkIns.length === 0) {
    return {
      shouldRemind: true,
      message: FIRST_CHECKIN_MESSAGE,
      daysSinceLastCheckIn: NO_CHECK_IN_DAYS,
    };
  }

  const days = computeDaysSinceLastCheckIn(checkIns, currentTime);
  if (days > threshold) {
    const streak = calculateStreak(checkIns, restDays);
    if (streak > 0) {
      return {
        shouldRemind: true,
        message: `已经连续${streak}天了，今天继续保持！`,
        daysSinceLastCheckIn: days,
      };
    }
    return {
      shouldRemind: true,
      message: `已经${days}天没运动了，动起来！`,
      daysSinceLastCheckIn: days,
    };
  }

  return noReminder(days);
}
