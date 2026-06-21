import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';
import {
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  formatDateTime,
  getDayKey,
  isSameDay,
  getDaysBetween,
} from '../../src/utils/dateUtils';

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

describe('getWeekStart', () => {
  it('返回本周一0时的时间戳', () => {
    const wed = new Date(2026, 5, 17, 14, 30).getTime();
    const expected = startOfWeek(wed, WEEK_OPTIONS).getTime();
    expect(getWeekStart(wed)).toBe(expected);
  });

  it('以周一为起始而非周日', () => {
    const sunday = new Date(2026, 5, 21, 10, 0).getTime();
    const start = getWeekStart(sunday);
    expect(new Date(start).getDay()).toBe(1);
    expect(new Date(start).getDate()).toBe(15);
  });

  it('周一本身就是周起始', () => {
    const monday = new Date(2026, 5, 15, 9, 0).getTime();
    const expected = startOfWeek(monday, WEEK_OPTIONS).getTime();
    expect(getWeekStart(monday)).toBe(expected);
  });

  it('周日属于下一周时返回下周一', () => {
    const sunday = new Date(2026, 5, 21, 10, 0).getTime();
    const start = getWeekStart(sunday);
    const expected = startOfWeek(sunday, WEEK_OPTIONS).getTime();
    expect(start).toBe(expected);
  });
});

describe('getWeekEnd', () => {
  it('返回本周日23:59:59.999的时间戳', () => {
    const wed = new Date(2026, 5, 17, 14, 30).getTime();
    const expected = endOfWeek(wed, WEEK_OPTIONS).getTime();
    expect(getWeekEnd(wed)).toBe(expected);
  });

  it('以周日为结束', () => {
    const monday = new Date(2026, 5, 15, 9, 0).getTime();
    const end = getWeekEnd(monday);
    expect(new Date(end).getDay()).toBe(0);
  });

  it('结束时间精确到23:59:59.999', () => {
    const wed = new Date(2026, 5, 17, 14, 30).getTime();
    const end = new Date(getWeekEnd(wed));
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });
});

describe('getMonthStart', () => {
  it('返回本月1日0时', () => {
    const midJune = new Date(2026, 5, 17, 14, 30).getTime();
    const expected = startOfMonth(midJune).getTime();
    expect(getMonthStart(midJune)).toBe(expected);
  });

  it('1日当天返回自身0时', () => {
    const june1 = new Date(2026, 5, 1, 15, 30).getTime();
    const start = getMonthStart(june1);
    expect(new Date(start).getDate()).toBe(1);
    expect(new Date(start).getHours()).toBe(0);
    expect(new Date(start).getMinutes()).toBe(0);
  });
});

describe('getMonthEnd', () => {
  it('返回月末23:59:59.999', () => {
    const midJune = new Date(2026, 5, 17, 14, 30).getTime();
    const expected = endOfMonth(midJune).getTime();
    expect(getMonthEnd(midJune)).toBe(expected);
  });

  it('6月末为30日23:59:59.999', () => {
    const midJune = new Date(2026, 5, 17, 14, 30).getTime();
    const end = new Date(getMonthEnd(midJune));
    expect(end.getMonth()).toBe(5);
    expect(end.getDate()).toBe(30);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
  });

  it('2月闰年返回29日23:59:59.999', () => {
    const feb2024 = new Date(2024, 1, 15, 12, 0).getTime();
    const end = new Date(getMonthEnd(feb2024));
    expect(end.getDate()).toBe(29);
    expect(end.getHours()).toBe(23);
  });

  it('2月平年返回28日23:59:59.999', () => {
    const feb2026 = new Date(2026, 1, 15, 12, 0).getTime();
    const end = new Date(getMonthEnd(feb2026));
    expect(end.getDate()).toBe(28);
  });
});

describe('formatDateTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('今天显示为"今天 HH:mm"', () => {
    const t = new Date(2026, 5, 17, 19, 30).getTime();
    expect(formatDateTime(t)).toBe('今天 19:30');
  });

  it('昨天显示为"昨天 HH:mm"', () => {
    const t = new Date(2026, 5, 16, 19, 30).getTime();
    expect(formatDateTime(t)).toBe('昨天 19:30');
  });

  it('本周更早的日期显示为"周X HH:mm"', () => {
    const monday = new Date(2026, 5, 15, 19, 30).getTime();
    expect(formatDateTime(monday)).toBe('周一 19:30');
  });

  it('更早的日期显示为"yyyy-MM-dd HH:mm"', () => {
    const lastSunday = new Date(2026, 5, 14, 19, 30).getTime();
    expect(formatDateTime(lastSunday)).toBe('2026-06-14 19:30');
  });

  it('昨天的日期即使在上一周也显示"昨天"', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0));
    const yesterday = new Date(2026, 5, 14, 19, 30).getTime();
    expect(formatDateTime(yesterday)).toBe('昨天 19:30');
  });

  it('本周内各日使用正确的中文星期', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const monday = new Date(2026, 5, 15, 8, 0).getTime();
    expect(formatDateTime(monday)).toBe('周一 08:00');
  });

  it('跨周边界（周日属于本周，下周一属于下一周）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const thisSunday = new Date(2026, 5, 21, 10, 0).getTime();
    expect(formatDateTime(thisSunday)).toBe('周日 10:00');
  });

  it('跨年边界使用yyyy-MM-dd HH:mm', () => {
    vi.setSystemTime(new Date(2026, 0, 5, 12, 0));
    const lastYear = new Date(2025, 11, 31, 20, 0).getTime();
    expect(formatDateTime(lastYear)).toBe('2025-12-31 20:00');
  });

  it('零点时间格式化为"今天 00:00"', () => {
    const midnight = new Date(2026, 5, 17, 0, 0).getTime();
    expect(formatDateTime(midnight)).toBe('今天 00:00');
  });
});

describe('getDayKey', () => {
  it('返回yyyy-MM-dd格式', () => {
    const t = new Date(2026, 5, 17, 19, 30).getTime();
    expect(getDayKey(t)).toBe('2026-06-17');
  });

  it('同一天不同时间返回相同键', () => {
    const morning = new Date(2026, 5, 17, 0, 0).getTime();
    const night = new Date(2026, 5, 17, 23, 59).getTime();
    expect(getDayKey(morning)).toBe(getDayKey(night));
  });

  it('与date-fns format yyyy-MM-dd结果一致', () => {
    const t = new Date(2026, 5, 17, 19, 30).getTime();
    expect(getDayKey(t)).toBe(format(t, 'yyyy-MM-dd'));
  });
});

describe('isSameDay', () => {
  it('同一天不同时间返回true', () => {
    const morning = new Date(2026, 5, 17, 0, 0).getTime();
    const night = new Date(2026, 5, 17, 23, 59).getTime();
    expect(isSameDay(morning, night)).toBe(true);
  });

  it('不同天返回false', () => {
    const day1 = new Date(2026, 5, 17, 23, 59).getTime();
    const day2 = new Date(2026, 5, 18, 0, 0).getTime();
    expect(isSameDay(day1, day2)).toBe(false);
  });

  it('跨月交界返回false', () => {
    const june30 = new Date(2026, 5, 30, 23, 59).getTime();
    const july1 = new Date(2026, 6, 1, 0, 0).getTime();
    expect(isSameDay(june30, july1)).toBe(false);
  });

  it('跨年交界返回false', () => {
    const dec31 = new Date(2025, 11, 31, 23, 59).getTime();
    const jan1 = new Date(2026, 0, 1, 0, 0).getTime();
    expect(isSameDay(dec31, jan1)).toBe(false);
  });
});

describe('getDaysBetween', () => {
  it('同一天返回0', () => {
    const t = new Date(2026, 5, 17, 12, 0).getTime();
    expect(getDaysBetween(t, t)).toBe(0);
  });

  it('日历日相差1天返回1', () => {
    const start = new Date(2026, 5, 17, 23, 59).getTime();
    const end = new Date(2026, 5, 18, 0, 1).getTime();
    expect(getDaysBetween(start, end)).toBe(1);
  });

  it('日历日相差3天返回3', () => {
    const start = new Date(2026, 5, 17, 12, 0).getTime();
    const end = new Date(2026, 5, 20, 12, 0).getTime();
    expect(getDaysBetween(start, end)).toBe(3);
  });

  it('跨月计算天数差', () => {
    const start = new Date(2026, 5, 30, 12, 0).getTime();
    const end = new Date(2026, 6, 2, 12, 0).getTime();
    expect(getDaysBetween(start, end)).toBe(2);
  });

  it('跨年计算天数差', () => {
    const start = new Date(2025, 11, 31, 12, 0).getTime();
    const end = new Date(2026, 0, 2, 12, 0).getTime();
    expect(getDaysBetween(start, end)).toBe(2);
  });
});
