import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAchievements } from '../../src/hooks/useAchievements';
import { ACHIEVEMENTS } from '../../src/constants/achievements';
import type { CheckIn } from '../../src/types';

const REST_DAYS_KEY = 'momenta-rest-days';

function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month, day, hour, 0).getTime();
}

function makeCheckIn(timestamp: number, sportType = 'running'): CheckIn {
  return {
    id: `checkin-${timestamp}-${sportType}`,
    sportType,
    timestamp,
    createdAt: timestamp,
  };
}

function findProgress(
  list: ReturnType<typeof useAchievements>,
  id: string,
) {
  const item = list.find((p) => p.achievement.id === id);
  if (!item) throw new Error(`achievement ${id} not found`);
  return item;
}

describe('ACHIEVEMENTS 常量', () => {
  it('包含至少7个预设成就', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(7);
  });

  it('每个成就包含必需字段(id/name/description/icon/condition)', () => {
    for (const a of ACHIEVEMENTS) {
      expect(typeof a.id).toBe('string');
      expect(a.id.length).toBeGreaterThan(0);
      expect(typeof a.name).toBe('string');
      expect(a.name.length).toBeGreaterThan(0);
      expect(typeof a.description).toBe('string');
      expect(a.description.length).toBeGreaterThan(0);
      expect(typeof a.icon).toBe('string');
      expect(a.icon.length).toBeGreaterThan(0);
      expect(a).toHaveProperty('condition');
    }
  });

  it('所有成就id唯一', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('包含PRD要求的7种成就', () => {
    const requiredIds = [
      'first-checkin',
      'three-day-streak',
      'seven-day-streak',
      'monthly-20',
      'basketball-master',
      'fitness-fanatic',
      'sport-explorer',
    ];
    const ids = ACHIEVEMENTS.map((a) => a.id);
    for (const id of requiredIds) {
      expect(ids).toContain(id);
    }
  });

  it('condition type 为4种之一', () => {
    const validTypes = [
      'total_count',
      'streak_days',
      'monthly_count',
      'sport_variety',
    ];
    for (const a of ACHIEVEMENTS) {
      expect(validTypes).toContain(a.condition.type);
    }
  });
});

describe('useAchievements', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('返回所有 7 个预设成就的进度', () => {
    const { result } = renderHook(() => useAchievements([]));
    expect(result.current).toHaveLength(7);
    const ids = result.current.map((p) => p.achievement.id);
    expect(ids).toContain('first-checkin');
    expect(ids).toContain('three-day-streak');
    expect(ids).toContain('seven-day-streak');
    expect(ids).toContain('monthly-20');
    expect(ids).toContain('basketball-master');
    expect(ids).toContain('fitness-fanatic');
    expect(ids).toContain('sport-explorer');
  });

  it('每个 AchievementProgress 包含必需字段', () => {
    const { result } = renderHook(() => useAchievements([]));
    for (const p of result.current) {
      expect(p).toHaveProperty('achievement');
      expect(p).toHaveProperty('unlocked');
      expect(p).toHaveProperty('currentCount');
      expect(p).toHaveProperty('targetCount');
      expect(p).toHaveProperty('progress');
      expect(typeof p.unlocked).toBe('boolean');
      expect(typeof p.currentCount).toBe('number');
      expect(typeof p.targetCount).toBe('number');
      expect(typeof p.progress).toBe('number');
    }
  });

  it('空 checkIns 所有成就未解锁, progress=0, unlockedAt 未定义', () => {
    const { result } = renderHook(() => useAchievements([]));
    for (const p of result.current) {
      expect(p.unlocked).toBe(false);
      expect(p.progress).toBe(0);
      expect(p.unlockedAt).toBeUndefined();
    }
  });

  it('total_count: 1次打卡解锁 first-checkin', () => {
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    const { result } = renderHook(() => useAchievements(checkIns));
    const first = findProgress(result.current, 'first-checkin');
    expect(first.unlocked).toBe(true);
    expect(first.currentCount).toBe(1);
    expect(first.targetCount).toBe(1);
    expect(first.progress).toBe(1);
    expect(first.unlockedAt).toBeDefined();
  });

  it('total_count with sportType: 累计篮球10次解锁 basketball-master', () => {
    const checkIns: CheckIn[] = [];
    for (let i = 0; i < 10; i++) {
      checkIns.push(makeCheckIn(ts(2026, 5, 1) + i * 1000, 'basketball'));
    }
    for (let i = 0; i < 5; i++) {
      checkIns.push(makeCheckIn(ts(2026, 5, 2) + i * 1000, 'running'));
    }
    const { result } = renderHook(() => useAchievements(checkIns));
    const bb = findProgress(result.current, 'basketball-master');
    expect(bb.unlocked).toBe(true);
    expect(bb.currentCount).toBe(10);
    expect(bb.targetCount).toBe(10);
    expect(bb.progress).toBe(1);

    const fitness = findProgress(result.current, 'fitness-fanatic');
    expect(fitness.unlocked).toBe(false);
    expect(fitness.currentCount).toBe(0);
    expect(fitness.targetCount).toBe(30);
  });

  it('total_count with sportType: 累计健身30次解锁 fitness-fanatic', () => {
    const checkIns: CheckIn[] = [];
    for (let i = 0; i < 30; i++) {
      checkIns.push(makeCheckIn(ts(2026, 5, 1) + i * 1000, 'fitness'));
    }
    const { result } = renderHook(() => useAchievements(checkIns));
    const fitness = findProgress(result.current, 'fitness-fanatic');
    expect(fitness.unlocked).toBe(true);
    expect(fitness.currentCount).toBe(30);
    expect(fitness.targetCount).toBe(30);
    expect(fitness.progress).toBe(1);
  });

  it('total_count: 不指定 sportType 统计全部打卡', () => {
    const checkIns: CheckIn[] = [];
    for (let i = 0; i < 3; i++) {
      checkIns.push(makeCheckIn(ts(2026, 5, 1) + i * 1000, 'running'));
    }
    for (let i = 0; i < 2; i++) {
      checkIns.push(makeCheckIn(ts(2026, 5, 2) + i * 1000, 'fitness'));
    }
    const { result } = renderHook(() => useAchievements(checkIns));
    const first = findProgress(result.current, 'first-checkin');
    expect(first.currentCount).toBe(5);
    expect(first.unlocked).toBe(true);
  });

  it('streak_days: 连续打卡3天解锁 three-day-streak', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 17)),
    ];
    const { result } = renderHook(() => useAchievements(checkIns));
    const three = findProgress(result.current, 'three-day-streak');
    expect(three.unlocked).toBe(true);
    expect(three.currentCount).toBe(3);
    expect(three.targetCount).toBe(3);
    expect(three.progress).toBe(1);

    const seven = findProgress(result.current, 'seven-day-streak');
    expect(seven.unlocked).toBe(false);
    expect(seven.currentCount).toBe(3);
    expect(seven.targetCount).toBe(7);
    expect(seven.progress).toBeCloseTo(3 / 7);
  });

  it('streak_days: 连续打卡7天解锁 seven-day-streak', () => {
    const checkIns: CheckIn[] = [];
    for (let d = 11; d <= 17; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    const { result } = renderHook(() => useAchievements(checkIns));
    const seven = findProgress(result.current, 'seven-day-streak');
    expect(seven.unlocked).toBe(true);
    expect(seven.currentCount).toBe(7);
    expect(seven.targetCount).toBe(7);
    expect(seven.progress).toBe(1);

    const three = findProgress(result.current, 'three-day-streak');
    expect(three.unlocked).toBe(true);
  });

  it('streak_days: 中断后 maxStreak 取历史最高', () => {
    // 5 consecutive days (10-14) then gap then 1 day (17)
    const checkIns: CheckIn[] = [];
    for (let d = 10; d <= 14; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    checkIns.push(makeCheckIn(ts(2026, 5, 17)));
    const { result } = renderHook(() => useAchievements(checkIns));
    const seven = findProgress(result.current, 'seven-day-streak');
    expect(seven.currentCount).toBe(5);
    expect(seven.unlocked).toBe(false);
    expect(seven.progress).toBeCloseTo(5 / 7);
  });

  it('monthly_count: 当月打卡20次解锁 monthly-20', () => {
    const checkIns: CheckIn[] = [];
    for (let d = 1; d <= 20; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    const { result } = renderHook(() => useAchievements(checkIns));
    const monthly = findProgress(result.current, 'monthly-20');
    expect(monthly.unlocked).toBe(true);
    expect(monthly.currentCount).toBe(20);
    expect(monthly.targetCount).toBe(20);
    expect(monthly.progress).toBe(1);
  });

  it('monthly_count: 跨月记录只计入当月', () => {
    const checkIns: CheckIn[] = [];
    for (let d = 1; d <= 20; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    for (let d = 1; d <= 5; d++) {
      checkIns.push(makeCheckIn(ts(2026, 4, d)));
    }
    const { result } = renderHook(() => useAchievements(checkIns));
    const monthly = findProgress(result.current, 'monthly-20');
    expect(monthly.currentCount).toBe(20);
    expect(monthly.unlocked).toBe(true);
  });

  it('monthly_count: 当月不足20次不解锁', () => {
    const checkIns: CheckIn[] = [];
    for (let d = 1; d <= 10; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    const { result } = renderHook(() => useAchievements(checkIns));
    const monthly = findProgress(result.current, 'monthly-20');
    expect(monthly.unlocked).toBe(false);
    expect(monthly.currentCount).toBe(10);
    expect(monthly.targetCount).toBe(20);
    expect(monthly.progress).toBeCloseTo(10 / 20);
  });

  it('sport_variety: 体验5种不同运动解锁 sport-explorer', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 1), 'running'),
      makeCheckIn(ts(2026, 5, 2), 'fitness'),
      makeCheckIn(ts(2026, 5, 3), 'basketball'),
      makeCheckIn(ts(2026, 5, 4), 'swimming'),
      makeCheckIn(ts(2026, 5, 5), 'yoga'),
    ];
    const { result } = renderHook(() => useAchievements(checkIns));
    const explorer = findProgress(result.current, 'sport-explorer');
    expect(explorer.unlocked).toBe(true);
    expect(explorer.currentCount).toBe(5);
    expect(explorer.targetCount).toBe(5);
    expect(explorer.progress).toBe(1);
  });

  it('sport_variety: 不足5种不解锁', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 1), 'running'),
      makeCheckIn(ts(2026, 5, 2), 'fitness'),
      makeCheckIn(ts(2026, 5, 3), 'basketball'),
      makeCheckIn(ts(2026, 5, 4), 'swimming'),
    ];
    const { result } = renderHook(() => useAchievements(checkIns));
    const explorer = findProgress(result.current, 'sport-explorer');
    expect(explorer.unlocked).toBe(false);
    expect(explorer.currentCount).toBe(4);
    expect(explorer.targetCount).toBe(5);
    expect(explorer.progress).toBeCloseTo(4 / 5);
  });

  it('unlockedAt: 已解锁为当前时间戳, 未解锁无值', () => {
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    const { result } = renderHook(() => useAchievements(checkIns));
    const first = findProgress(result.current, 'first-checkin');
    expect(first.unlocked).toBe(true);
    expect(typeof first.unlockedAt).toBe('number');
    expect(first.unlockedAt).toBe(Date.now());

    const bb = findProgress(result.current, 'basketball-master');
    expect(bb.unlocked).toBe(false);
    expect(bb.unlockedAt).toBeUndefined();
  });

  it('progress 限制在 [0, 1]', () => {
    const checkIns: CheckIn[] = [];
    for (let i = 0; i < 50; i++) {
      checkIns.push(makeCheckIn(ts(2026, 5, 1) + i * 1000));
    }
    const { result } = renderHook(() => useAchievements(checkIns));
    for (const p of result.current) {
      expect(p.progress).toBeGreaterThanOrEqual(0);
      expect(p.progress).toBeLessThanOrEqual(1);
    }
  });

  it('使用 useMemo 缓存结果（相同输入返回相同引用）', () => {
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    const { result, rerender } = renderHook(() => useAchievements(checkIns));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('从 localStorage 读取 restDays 影响 streak_days 计算', () => {
    // Jun 19 (Fri) 与 Jun 21 (Sun)，中间 Jun 20 (Sat=6) 为休息日
    localStorage.setItem(REST_DAYS_KEY, JSON.stringify([6]));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 21)),
    ];
    const { result } = renderHook(() => useAchievements(checkIns));
    const three = findProgress(result.current, 'three-day-streak');
    expect(three.currentCount).toBe(2);
    expect(three.unlocked).toBe(false);
  });
});
