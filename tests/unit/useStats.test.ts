import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStats } from '../../src/hooks/useStats';
import type { CheckIn } from '../../src/types';

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

describe('useStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('返回 weekCount, monthCount, totalCount, typeDistribution', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { result } = renderHook(() => useStats([]));
    expect(result.current).toHaveProperty('weekCount');
    expect(result.current).toHaveProperty('monthCount');
    expect(result.current).toHaveProperty('totalCount');
    expect(result.current).toHaveProperty('typeDistribution');
    expect(typeof result.current.weekCount).toBe('number');
    expect(typeof result.current.monthCount).toBe('number');
    expect(typeof result.current.totalCount).toBe('number');
    expect(typeof result.current.typeDistribution).toBe('object');
  });

  it('空数组所有统计为 0，typeDistribution 为空对象', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { result } = renderHook(() => useStats([]));
    expect(result.current.weekCount).toBe(0);
    expect(result.current.monthCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.typeDistribution).toEqual({});
  });

  it('本周打卡记录 weekCount 正确（周一为起始）', () => {
    // 2026-06-17 周三，本周一为 2026-06-15
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 17)),
    ];
    const { result } = renderHook(() => useStats(checkIns));
    expect(result.current.weekCount).toBe(3);
  });

  it('本月打卡记录 monthCount 正确（自然月）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 1)),
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 30)),
    ];
    const { result } = renderHook(() => useStats(checkIns));
    expect(result.current.monthCount).toBe(3);
  });

  it('全部记录 totalCount 正确', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 4, 15)),
      makeCheckIn(ts(2026, 3, 10)),
    ];
    const { result } = renderHook(() => useStats(checkIns));
    expect(result.current.totalCount).toBe(3);
  });

  it('typeDistribution 按运动类型聚合', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17), 'fitness'),
      makeCheckIn(ts(2026, 5, 16), 'fitness'),
      makeCheckIn(ts(2026, 5, 15), 'fitness'),
      makeCheckIn(ts(2026, 5, 14), 'basketball'),
      makeCheckIn(ts(2026, 5, 13), 'basketball'),
    ];
    const { result } = renderHook(() => useStats(checkIns));
    expect(result.current.typeDistribution).toEqual({ fitness: 3, basketball: 2 });
  });

  it('跨周记录只计入对应周期', () => {
    // 2026-06-17 周三，本周一 2026-06-15
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 14)),
    ];
    const { result } = renderHook(() => useStats(checkIns));
    expect(result.current.weekCount).toBe(1);
    expect(result.current.totalCount).toBe(2);
  });

  it('跨月记录只计入对应周期', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 4, 30)),
    ];
    const { result } = renderHook(() => useStats(checkIns));
    expect(result.current.monthCount).toBe(1);
    expect(result.current.totalCount).toBe(2);
  });

  it('使用 useMemo 缓存结果（相同输入返回相同对象引用）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    const { result, rerender } = renderHook(() => useStats(checkIns));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
