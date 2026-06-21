import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  isSameDay as dfnsIsSameDay,
  subDays,
  getDay,
  differenceInCalendarDays,
} from 'date-fns';

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getWeekStart(timestamp: number): number {
  return startOfWeek(timestamp, WEEK_OPTIONS).getTime();
}

export function getWeekEnd(timestamp: number): number {
  return endOfWeek(timestamp, WEEK_OPTIONS).getTime();
}

export function getMonthStart(timestamp: number): number {
  return startOfMonth(timestamp).getTime();
}

export function getMonthEnd(timestamp: number): number {
  return endOfMonth(timestamp).getTime();
}

export function formatDateTime(timestamp: number): string {
  const now = Date.now();
  const time = format(timestamp, 'HH:mm');

  if (dfnsIsSameDay(timestamp, now)) {
    return `今天 ${time}`;
  }

  if (dfnsIsSameDay(timestamp, subDays(now, 1))) {
    return `昨天 ${time}`;
  }

  if (getWeekStart(timestamp) === getWeekStart(now)) {
    return `${WEEKDAY_CN[getDay(timestamp)]} ${time}`;
  }

  return format(timestamp, 'yyyy-MM-dd HH:mm');
}

export function getDayKey(timestamp: number): string {
  return format(timestamp, 'yyyy-MM-dd');
}

export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  return dfnsIsSameDay(timestamp1, timestamp2);
}

export function getDaysBetween(start: number, end: number): number {
  return differenceInCalendarDays(end, start);
}
