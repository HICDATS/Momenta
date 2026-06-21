import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { CheckIn } from '../../src/types';
import {
  calculateStreak,
  calculateMaxStreak,
  isStreakActive,
} from '../../src/utils/streakCalculator';

function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month, day, hour, 0).getTime();
}

function makeCheckIn(timestamp: number): CheckIn {
  return {
    id: `checkin-${timestamp}`,
    sportType: 'running',
    timestamp,
    createdAt: timestamp,
  };
}

describe('calculateStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('首次使用无记录返回0', () => {
    expect(calculateStreak([], [])).toBe(0);
  });

  it('连续3天打卡返回3', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    expect(calculateStreak(checkIns, [])).toBe(3);
  });

  it('连续3天后非休息日中断返回0', () => {
    vi.setSystemTime(new Date(2026, 5, 19, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    expect(calculateStreak(checkIns, [])).toBe(0);
  });

  it('连续3天后休息日中断再打卡继续Streak', () => {
    vi.setSystemTime(new Date(2026, 5, 21, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 18)),
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 21)),
    ];
    expect(calculateStreak(checkIns, [6])).toBe(4);
  });

  it('今天未打卡但昨天有保持Streak', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 14)),
    ];
    expect(calculateStreak(checkIns, [])).toBe(3);
  });

  it('同一天多次打卡只算一天', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17, 8)),
      makeCheckIn(ts(2026, 5, 17, 12)),
      makeCheckIn(ts(2026, 5, 17, 20)),
    ];
    expect(calculateStreak(checkIns, [])).toBe(1);
  });

  it('今天已打卡连续3天（今天+前2天）返回3', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    expect(calculateStreak(checkIns, [])).toBe(3);
  });

  it('跨周连续打卡（周日→周一）继续Streak', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 22)),
      makeCheckIn(ts(2026, 5, 21)),
      makeCheckIn(ts(2026, 5, 20)),
    ];
    expect(calculateStreak(checkIns, [])).toBe(3);
  });

  it('跨月连续打卡（月末→月初）继续Streak', () => {
    vi.setSystemTime(new Date(2026, 6, 1, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 6, 1)),
      makeCheckIn(ts(2026, 5, 30)),
      makeCheckIn(ts(2026, 5, 29)),
    ];
    expect(calculateStreak(checkIns, [])).toBe(3);
  });

  it('休息日为周六，连续5天打卡（周一到周五）返回5', () => {
    vi.setSystemTime(new Date(2026, 5, 19, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 18)),
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    expect(calculateStreak(checkIns, [6])).toBe(5);
  });

  it('休息日为周六，周五打卡+周六休息+周日打卡返回2', () => {
    vi.setSystemTime(new Date(2026, 5, 21, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 21)),
    ];
    expect(calculateStreak(checkIns, [6])).toBe(2);
  });

  it('多个休息日设置（周六和周日）继续Streak', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 22)),
    ];
    expect(calculateStreak(checkIns, [0, 6])).toBe(2);
  });

  it('休息日当天打卡仍计入Streak', () => {
    vi.setSystemTime(new Date(2026, 5, 20, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 20)),
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 18)),
    ];
    expect(calculateStreak(checkIns, [6])).toBe(3);
  });

  it('今天和昨天都未打卡且非休息日返回0', () => {
    vi.setSystemTime(new Date(2026, 5, 19, 14, 0));
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    expect(calculateStreak(checkIns, [])).toBe(0);
  });

  it('所有日子都设为休息日时不无限循环', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    expect(calculateStreak(checkIns, [0, 1, 2, 3, 4, 5, 6])).toBe(1);
  });
});

describe('calculateMaxStreak', () => {
  it('无记录返回0', () => {
    expect(calculateMaxStreak([], [])).toBe(0);
  });

  it('单条记录返回1', () => {
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    expect(calculateMaxStreak(checkIns, [])).toBe(1);
  });

  it('历史多次中断返回最高Streak', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 10)),
      makeCheckIn(ts(2026, 5, 11)),
      makeCheckIn(ts(2026, 5, 12)),
      makeCheckIn(ts(2026, 5, 14)),
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 18)),
      makeCheckIn(ts(2026, 5, 20)),
      makeCheckIn(ts(2026, 5, 21)),
    ];
    expect(calculateMaxStreak(checkIns, [])).toBe(5);
  });

  it('连续10天后中断再连续5天返回10', () => {
    const checkIns: CheckIn[] = [];
    for (let d = 1; d <= 10; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    for (let d = 12; d <= 16; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    expect(calculateMaxStreak(checkIns, [])).toBe(10);
  });

  it('休息日跨段不中断最高Streak', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 21)),
    ];
    expect(calculateMaxStreak(checkIns, [6])).toBe(2);
  });

  it('同一天多次打卡只算一天', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17, 8)),
      makeCheckIn(ts(2026, 5, 17, 12)),
      makeCheckIn(ts(2026, 5, 17, 20)),
    ];
    expect(calculateMaxStreak(checkIns, [])).toBe(1);
  });

  it('乱序记录正确计算最高Streak', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 14)),
      makeCheckIn(ts(2026, 5, 13)),
    ];
    expect(calculateMaxStreak(checkIns, [])).toBe(5);
  });
});

describe('isStreakActive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('今天已打卡且连续返回true', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    expect(isStreakActive(checkIns, [])).toBe(true);
  });

  it('今天未打卡但昨天有返回true', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    expect(isStreakActive(checkIns, [])).toBe(true);
  });

  it('中断后返回false', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [makeCheckIn(ts(2026, 5, 14))];
    expect(isStreakActive(checkIns, [])).toBe(false);
  });

  it('无记录返回false', () => {
    expect(isStreakActive([], [])).toBe(false);
  });

  it('仅今天单次打卡返回true', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    expect(isStreakActive(checkIns, [])).toBe(true);
  });
});
