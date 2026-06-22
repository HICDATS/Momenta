import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { checkSmartReminder } from '../../src/utils/smartReminderChecker';
import { useSmartReminder } from '../../src/hooks/useSmartReminder';
import type { CheckIn } from '../../src/types';

const REST_DAYS_KEY = 'momenta-rest-days';
const ENABLED_KEY = 'momenta-smart-reminder-enabled';
const THRESHOLD_KEY = 'momenta-smart-reminder-threshold';

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

describe('checkSmartReminder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('enabled=false时不触发提醒，daysSinceLastCheckIn为-1', () => {
    const result = checkSmartReminder([], 2, false, false, ts(2026, 5, 22), []);
    expect(result.shouldRemind).toBe(false);
    expect(result.message).toBe('');
    expect(result.daysSinceLastCheckIn).toBe(-1);
  });

  it('今天已打卡不触发提醒', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [makeCheckIn(ts(2026, 5, 22, 8, 0))];
    const result = checkSmartReminder(checkIns, 2, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(false);
    expect(result.daysSinceLastCheckIn).toBe(0);
  });

  it('今天已触发固定提醒时不触发智能提醒', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [makeCheckIn(ts(2026, 5, 18))];
    const result = checkSmartReminder(checkIns, 2, true, true, currentTime, []);
    expect(result.shouldRemind).toBe(false);
  });

  it('无打卡记录时触发"开始你的第一次打卡吧！"', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const result = checkSmartReminder([], 2, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(true);
    expect(result.message).toBe('开始你的第一次打卡吧！');
    expect(result.daysSinceLastCheckIn).toBe(-1);
  });

  it('超期未打卡且streak=0触发"已经X天没运动了，动起来！"', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [makeCheckIn(ts(2026, 5, 18))];
    const result = checkSmartReminder(checkIns, 2, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(true);
    expect(result.message).toBe('已经4天没运动了，动起来！');
    expect(result.daysSinceLastCheckIn).toBe(4);
  });

  it('超期未打卡且streak>0触发"已经连续X天了，今天继续保持！"', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 18)),
      makeCheckIn(ts(2026, 5, 17)),
    ];
    const result = checkSmartReminder(checkIns, 2, true, false, currentTime, [0, 6]);
    expect(result.shouldRemind).toBe(true);
    expect(result.message).toBe('已经连续3天了，今天继续保持！');
    expect(result.daysSinceLastCheckIn).toBe(3);
  });

  it('未超期（days等于阈值）不触发提醒', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [makeCheckIn(ts(2026, 5, 20))];
    const result = checkSmartReminder(checkIns, 2, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(false);
    expect(result.daysSinceLastCheckIn).toBe(2);
  });

  it('未超期（days小于阈值）不触发提醒', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [makeCheckIn(ts(2026, 5, 21))];
    const result = checkSmartReminder(checkIns, 2, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(false);
    expect(result.daysSinceLastCheckIn).toBe(1);
  });

  it('刚好超过阈值（days=threshold+1）触发提醒', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [makeCheckIn(ts(2026, 5, 19))];
    const result = checkSmartReminder(checkIns, 2, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(true);
    expect(result.message).toBe('已经3天没运动了，动起来！');
  });

  it('阈值可配置：threshold=3时days=3不触发', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [makeCheckIn(ts(2026, 5, 19))];
    const result = checkSmartReminder(checkIns, 3, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(false);
  });

  it('阈值可配置：threshold=3时days=4触发', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [makeCheckIn(ts(2026, 5, 18))];
    const result = checkSmartReminder(checkIns, 3, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(true);
  });

  it('乱序打卡记录中正确找到最近一次打卡', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const currentTime = ts(2026, 5, 22, 14, 0);
    const checkIns = [
      makeCheckIn(ts(2026, 5, 10)),
      makeCheckIn(ts(2026, 5, 18)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    const result = checkSmartReminder(checkIns, 2, true, false, currentTime, []);
    expect(result.shouldRemind).toBe(true);
    expect(result.daysSinceLastCheckIn).toBe(4);
  });
});

describe('useSmartReminder', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('默认enabled=false, threshold=2', () => {
    const { result } = renderHook(() => useSmartReminder());
    expect(result.current.enabled).toBe(false);
    expect(result.current.threshold).toBe(2);
  });

  it('从localStorage读取enabled和threshold', () => {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(true));
    localStorage.setItem(THRESHOLD_KEY, JSON.stringify(3));
    const { result } = renderHook(() => useSmartReminder());
    expect(result.current.enabled).toBe(true);
    expect(result.current.threshold).toBe(3);
  });

  it('setEnabled保存到localStorage', () => {
    const { result } = renderHook(() => useSmartReminder());
    act(() => {
      result.current.setEnabled(true);
    });
    expect(result.current.enabled).toBe(true);
    expect(JSON.parse(localStorage.getItem(ENABLED_KEY) as string)).toBe(true);
  });

  it('setThreshold保存到localStorage', () => {
    const { result } = renderHook(() => useSmartReminder());
    act(() => {
      result.current.setThreshold(5);
    });
    expect(result.current.threshold).toBe(5);
    expect(JSON.parse(localStorage.getItem(THRESHOLD_KEY) as string)).toBe(5);
  });

  it('check函数在enabled=false时返回不提醒', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const { result } = renderHook(() => useSmartReminder());
    const checkResult = result.current.check([], false);
    expect(checkResult.shouldRemind).toBe(false);
  });

  it('check函数在enabled=true且无记录时触发首次打卡提醒', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const { result } = renderHook(() => useSmartReminder());
    act(() => {
      result.current.setEnabled(true);
    });
    const checkResult = result.current.check([], false);
    expect(checkResult.shouldRemind).toBe(true);
    expect(checkResult.message).toBe('开始你的第一次打卡吧！');
  });

  it('check函数从localStorage读取restDays并影响streak文案', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    localStorage.setItem(REST_DAYS_KEY, JSON.stringify([0, 6]));
    const { result } = renderHook(() => useSmartReminder());
    act(() => {
      result.current.setEnabled(true);
    });
    const checkIns = [
      makeCheckIn(ts(2026, 5, 19)),
      makeCheckIn(ts(2026, 5, 18)),
      makeCheckIn(ts(2026, 5, 17)),
    ];
    const checkResult = result.current.check(checkIns, false);
    expect(checkResult.shouldRemind).toBe(true);
    expect(checkResult.message).toBe('已经连续3天了，今天继续保持！');
  });

  it('check函数在todayTriggeredFixed=true时不触发', () => {
    vi.setSystemTime(new Date(2026, 5, 22, 14, 0));
    const { result } = renderHook(() => useSmartReminder());
    act(() => {
      result.current.setEnabled(true);
    });
    const checkIns = [makeCheckIn(ts(2026, 5, 18))];
    const checkResult = result.current.check(checkIns, true);
    expect(checkResult.shouldRemind).toBe(false);
  });

  it('返回值包含所有字段', () => {
    const { result } = renderHook(() => useSmartReminder());
    expect(typeof result.current.enabled).toBe('boolean');
    expect(typeof result.current.threshold).toBe('number');
    expect(typeof result.current.setEnabled).toBe('function');
    expect(typeof result.current.setThreshold).toBe('function');
    expect(typeof result.current.check).toBe('function');
  });
});
