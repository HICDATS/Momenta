import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStats } from '../../src/hooks/useStats';
import {
  filterCheckInsByTimeRange,
  aggregateBarData,
  computePieData,
} from '../../src/components/StatsChart/StatsChart';
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

describe('filterCheckInsByTimeRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('timeRange=week 只返回本周记录（周一起始）', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 14)),
      makeCheckIn(ts(2026, 5, 17)),
    ];
    const filtered = filterCheckInsByTimeRange(checkIns, 'week');
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.id)).toEqual(
      expect.arrayContaining([`checkin-${ts(2026, 5, 15)}`, `checkin-${ts(2026, 5, 17)}`]),
    );
  });

  it('timeRange=month 只返回本月记录', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 1)),
      makeCheckIn(ts(2026, 4, 30)),
      makeCheckIn(ts(2026, 5, 17)),
    ];
    const filtered = filterCheckInsByTimeRange(checkIns, 'month');
    expect(filtered).toHaveLength(2);
  });

  it('timeRange=last30days 只返回最近30天记录', () => {
    const now = Date.now();
    const checkIns = [
      makeCheckIn(now),
      makeCheckIn(now - 29 * 86400000),
      makeCheckIn(now - 31 * 86400000),
    ];
    const filtered = filterCheckInsByTimeRange(checkIns, 'last30days');
    expect(filtered).toHaveLength(2);
  });

  it('timeRange=last30days 29天前的记录被包含（与桶范围对齐边界）', () => {
    const now = Date.now();
    const filtered = filterCheckInsByTimeRange([makeCheckIn(now - 29 * 86400000)], 'last30days');
    expect(filtered).toHaveLength(1);
  });

  it('timeRange=last30days 30天前的记录被排除（边界）', () => {
    const now = Date.now();
    const filtered = filterCheckInsByTimeRange([makeCheckIn(now - 30 * 86400000)], 'last30days');
    expect(filtered).toHaveLength(0);
  });

  it('timeRange=all 返回全部记录', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2025, 0, 1)),
      makeCheckIn(ts(2024, 11, 31)),
    ];
    const filtered = filterCheckInsByTimeRange(checkIns, 'all');
    expect(filtered).toHaveLength(3);
  });

  it('空数组返回空数组', () => {
    expect(filterCheckInsByTimeRange([], 'week')).toEqual([]);
    expect(filterCheckInsByTimeRange([], 'all')).toEqual([]);
  });
});

describe('aggregateBarData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('timeRange=week 返回本周7天条目，按日聚合', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 17)),
    ];
    const data = aggregateBarData(checkIns, 'week');
    expect(data).toHaveLength(7);
    const monday = data.find((d) => d.label === '周一');
    expect(monday?.count).toBe(2);
    const wednesday = data.find((d) => d.label === '周三');
    expect(wednesday?.count).toBe(1);
  });

  it('timeRange=week 空数组返回7个零计数条目', () => {
    const data = aggregateBarData([], 'week');
    expect(data).toHaveLength(7);
    expect(data.every((d) => d.count === 0)).toBe(true);
  });

  it('timeRange=month 返回本月各天条目', () => {
    const data = aggregateBarData([], 'month');
    expect(data).toHaveLength(30);
    expect(data[0].label).toBe('06-01');
    expect(data[29].label).toBe('06-30');
  });

  it('timeRange=last30days 返回30天条目', () => {
    const data = aggregateBarData([], 'last30days');
    expect(data).toHaveLength(30);
  });

  it('timeRange=last30days 29天前的打卡出现在图表数据中', () => {
    const now = Date.now();
    const data = aggregateBarData([makeCheckIn(now - 29 * 86400000)], 'last30days');
    expect(data).toHaveLength(30);
    const total = data.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(1);
  });

  it('timeRange=last30days 30天前的打卡不出现在图表数据中（边界）', () => {
    const now = Date.now();
    const data = aggregateBarData([makeCheckIn(now - 30 * 86400000)], 'last30days');
    expect(data).toHaveLength(30);
    const total = data.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(0);
  });

  it('timeRange=all 按月聚合，只返回有数据的月份', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 4, 10)),
      makeCheckIn(ts(2025, 11, 1)),
    ];
    const data = aggregateBarData(checkIns, 'all');
    expect(data).toHaveLength(3);
    const june = data.find((d) => d.label === '2026-06');
    expect(june?.count).toBe(2);
    const may = data.find((d) => d.label === '2026-05');
    expect(may?.count).toBe(1);
    const dec = data.find((d) => d.label === '2025-12');
    expect(dec?.count).toBe(1);
  });

  it('timeRange=all 空数组返回空数组', () => {
    expect(aggregateBarData([], 'all')).toEqual([]);
  });

  it('过滤掉时间范围外的打卡记录后再聚合', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 4, 17)),
    ];
    const data = aggregateBarData(checkIns, 'week');
    expect(data).toHaveLength(7);
    const total = data.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(1);
  });
});

describe('computePieData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('按运动类型聚合，返回 {name, value, color}', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17), 'running'),
      makeCheckIn(ts(2026, 5, 16), 'running'),
      makeCheckIn(ts(2026, 5, 15), 'fitness'),
    ];
    const data = computePieData(checkIns);
    expect(data).toHaveLength(2);
    const running = data.find((d) => d.name === '跑步');
    expect(running?.value).toBe(2);
    expect(running?.color).toBe('#00B894');
    const fitness = data.find((d) => d.name === '健身');
    expect(fitness?.value).toBe(1);
    expect(fitness?.color).toBe('#FF6B6B');
  });

  it('空数组返回空数组', () => {
    expect(computePieData([])).toEqual([]);
  });

  it('未注册的运动类型使用默认颜色', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17), 'unknown_sport'),
    ];
    const data = computePieData(checkIns);
    expect(data).toHaveLength(1);
    expect(data[0].value).toBe(1);
    expect(data[0].color).not.toBe('');
  });

  it('结果按 value 降序排列', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17), 'fitness'),
      makeCheckIn(ts(2026, 5, 16), 'fitness'),
      makeCheckIn(ts(2026, 5, 15), 'fitness'),
      makeCheckIn(ts(2026, 5, 14), 'running'),
      makeCheckIn(ts(2026, 5, 13), 'running'),
    ];
    const data = computePieData(checkIns);
    expect(data[0].value).toBe(3);
    expect(data[1].value).toBe(2);
  });
});
