import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStreak } from '../../src/hooks/useStreak';
import type { CheckIn } from '../../src/types';

const REST_DAYS_KEY = 'momenta-rest-days';

function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month, day, hour, 0).getTime();
}

function makeCheckIn(timestamp: number, sportType = 'running'): CheckIn {
  return {
    id: `checkin-${timestamp}`,
    sportType,
    timestamp,
    createdAt: timestamp,
  };
}

describe('useStreak', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('返回 currentStreak, maxStreak, isStreakActive 三个字段', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { result } = renderHook(() => useStreak([]));
    expect(result.current).toHaveProperty('currentStreak');
    expect(result.current).toHaveProperty('maxStreak');
    expect(result.current).toHaveProperty('isStreakActive');
    expect(typeof result.current.currentStreak).toBe('number');
    expect(typeof result.current.maxStreak).toBe('number');
    expect(typeof result.current.isStreakActive).toBe('boolean');
  });

  it('空数组返回 currentStreak=0, maxStreak=0, isStreakActive=false', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { result } = renderHook(() => useStreak([]));
    expect(result.current.currentStreak).toBe(0);
    expect(result.current.maxStreak).toBe(0);
    expect(result.current.isStreakActive).toBe(false);
  });

  it('连续打卡记录 currentStreak 正确', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    const { result } = renderHook(() => useStreak(checkIns));
    expect(result.current.currentStreak).toBe(3);
    expect(result.current.isStreakActive).toBe(true);
  });

  it('历史记录 maxStreak 正确', () => {
    vi.setSystemTime(new Date(2026, 5, 25, 14, 0));
    const checkIns: CheckIn[] = [];
    for (let d = 10; d <= 14; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    checkIns.push(makeCheckIn(ts(2026, 5, 25)));
    const { result } = renderHook(() => useStreak(checkIns));
    expect(result.current.maxStreak).toBe(5);
  });

  it('未设置 restDays 时按空数组处理（中断视为中断）', () => {
    vi.setSystemTime(new Date(2026, 5, 21, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 21)),
    ];
    const { result } = renderHook(() => useStreak(checkIns));
    expect(result.current.currentStreak).toBe(1);
  });

  it('从 localStorage 读取 restDays 跨休息日继续 streak', () => {
    vi.setSystemTime(new Date(2026, 5, 21, 14, 0));
    localStorage.setItem(REST_DAYS_KEY, JSON.stringify([6]));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 21)),
    ];
    const { result } = renderHook(() => useStreak(checkIns));
    expect(result.current.currentStreak).toBe(2);
  });

  it('使用 useMemo 缓存结果（相同输入返回相同对象引用）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
    ];
    const { result, rerender } = renderHook(() => useStreak(checkIns));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
