import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGoals } from '../../src/hooks/useGoals';
import type { CheckIn, Goal } from '../../src/types';

const STORAGE_KEY = 'momenta-goals';

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

function makeGoalInput(
  overrides: Partial<Omit<Goal, 'id' | 'createdAt'>> = {},
): Omit<Goal, 'id' | 'createdAt'> {
  return {
    sportType: undefined,
    period: 'weekly',
    targetCount: 3,
    ...overrides,
  };
}

function findProgress(
  list: ReturnType<typeof useGoals>['goalsWithProgress'],
  id: string,
) {
  const item = list.find((p) => p.goal.id === id);
  if (!item) throw new Error(`goal ${id} not found`);
  return item;
}

describe('useGoals', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('返回值包含 goals, goalsWithProgress, addGoal, deleteGoal', () => {
    const { result } = renderHook(() => useGoals([]));
    expect(Array.isArray(result.current.goals)).toBe(true);
    expect(Array.isArray(result.current.goalsWithProgress)).toBe(true);
    expect(typeof result.current.addGoal).toBe('function');
    expect(typeof result.current.deleteGoal).toBe('function');
  });

  it('初始化时从localStorage读取目标列表', () => {
    const stored: Goal[] = [
      {
        id: 'stored-1',
        sportType: 'fitness',
        period: 'weekly',
        targetCount: 5,
        createdAt: ts(2026, 5, 10),
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useGoals([]));
    expect(result.current.goals).toEqual(stored);
    expect(result.current.goals).toHaveLength(1);
  });

  it('无存储时goals为空数组', () => {
    const { result } = renderHook(() => useGoals([]));
    expect(result.current.goals).toEqual([]);
    expect(result.current.goalsWithProgress).toEqual([]);
  });

  it('addGoal: 添加新目标并保存到localStorage', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(makeGoalInput({ targetCount: 4 }));
    });
    expect(result.current.goals).toHaveLength(1);
    const added = result.current.goals[0];
    expect(added.targetCount).toBe(4);
    expect(added.period).toBe('weekly');
    expect(added.id).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored).toHaveLength(1);
    expect(stored[0].targetCount).toBe(4);
  });

  it('addGoal: 生成UUID作为id', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(makeGoalInput());
    });
    expect(result.current.goals[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('addGoal: 设置createdAt为当前时间', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(makeGoalInput());
    });
    expect(result.current.goals[0].createdAt).toBe(Date.now());
  });

  it('deleteGoal: 删除目标并从localStorage移除', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(makeGoalInput({ targetCount: 1 }));
    });
    act(() => {
      result.current.addGoal(makeGoalInput({ targetCount: 2 }));
    });
    const idToDelete = result.current.goals[0].id;
    const countBefore = result.current.goals.length;

    act(() => {
      result.current.deleteGoal(idToDelete);
    });

    expect(result.current.goals).toHaveLength(countBefore - 1);
    expect(
      result.current.goals.find((g) => g.id === idToDelete),
    ).toBeUndefined();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.find((g: Goal) => g.id === idToDelete)).toBeUndefined();
  });

  it('updateGoal: 更新目标字段并保存到localStorage', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(
        makeGoalInput({ period: 'weekly', targetCount: 3 }),
      );
    });
    const id = result.current.goals[0].id;

    act(() => {
      result.current.updateGoal(id, {
        targetCount: 7,
        period: 'monthly',
        sportType: 'fitness',
      });
    });

    const updated = result.current.goals.find((g) => g.id === id)!;
    expect(updated.targetCount).toBe(7);
    expect(updated.period).toBe('monthly');
    expect(updated.sportType).toBe('fitness');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored[0].targetCount).toBe(7);
    expect(stored[0].period).toBe('monthly');
    expect(stored[0].sportType).toBe('fitness');
  });

  it('updateGoal: 部分更新不影响其他字段', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(
        makeGoalInput({ period: 'weekly', targetCount: 3, sportType: 'fitness' }),
      );
    });
    const id = result.current.goals[0].id;

    act(() => {
      result.current.updateGoal(id, { targetCount: 10 });
    });

    const updated = result.current.goals.find((g) => g.id === id)!;
    expect(updated.targetCount).toBe(10);
    expect(updated.period).toBe('weekly');
    expect(updated.sportType).toBe('fitness');
  });

  it('updateGoal: 更新不存在的id不影响列表', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(makeGoalInput({ targetCount: 3 }));
    });
    const before = result.current.goals[0].targetCount;
    act(() => {
      result.current.updateGoal('non-existent', { targetCount: 99 });
    });
    expect(result.current.goals[0].targetCount).toBe(before);
  });

  it('返回值包含 updateGoal 函数', () => {
    const { result } = renderHook(() => useGoals([]));
    expect(typeof result.current.updateGoal).toBe('function');
  });

  it('deleteGoal: 删除不存在的id不影响列表', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(makeGoalInput());
    });
    const before = result.current.goals.length;
    act(() => {
      result.current.deleteGoal('non-existent');
    });
    expect(result.current.goals).toHaveLength(before);
  });

  it('支持至少3个并行目标', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(
        makeGoalInput({ period: 'weekly', targetCount: 3 }),
      );
    });
    act(() => {
      result.current.addGoal(
        makeGoalInput({
          period: 'monthly',
          targetCount: 10,
          sportType: 'fitness',
        }),
      );
    });
    act(() => {
      result.current.addGoal(
        makeGoalInput({
          period: 'weekly',
          targetCount: 5,
          sportType: 'running',
        }),
      );
    });

    expect(result.current.goals).toHaveLength(3);
    expect(result.current.goalsWithProgress).toHaveLength(3);
    const ids = result.current.goals.map((g) => g.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('GoalWithProgress 包含必需字段', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(makeGoalInput());
    });
    const p = result.current.goalsWithProgress[0];
    expect(p).toHaveProperty('goal');
    expect(p).toHaveProperty('currentCount');
    expect(p).toHaveProperty('targetCount');
    expect(p).toHaveProperty('progress');
    expect(p).toHaveProperty('completed');
    expect(typeof p.currentCount).toBe('number');
    expect(typeof p.targetCount).toBe('number');
    expect(typeof p.progress).toBe('number');
    expect(typeof p.completed).toBe('boolean');
  });

  it('进度计算: weekly目标统计本周打卡数（周一起始）', () => {
    // 2026-06-17 周三, 本周 06-15(周一) ~ 06-21(周日)
    const checkIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 17)),
    ];
    const { result } = renderHook(() => useGoals(checkIns));
    act(() => {
      result.current.addGoal(makeGoalInput({ period: 'weekly', targetCount: 5 }));
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(3);
    expect(p.targetCount).toBe(5);
    expect(p.completed).toBe(false);
    expect(p.progress).toBeCloseTo(3 / 5);
  });

  it('weekly目标排除本周外的打卡记录', () => {
    // 本周 06-15~06-21；上周日 06-14 不应计入
    const checkIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 14)),
    ];
    const { result } = renderHook(() => useGoals(checkIns));
    act(() => {
      result.current.addGoal(makeGoalInput({ period: 'weekly', targetCount: 5 }));
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(3);
  });

  it('进度计算: monthly目标统计本月打卡数', () => {
    // 2026-06 本月 06-01 ~ 06-30
    const checkIns = [
      makeCheckIn(ts(2026, 5, 1)),
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 30)),
    ];
    const { result } = renderHook(() => useGoals(checkIns));
    act(() => {
      result.current.addGoal(
        makeGoalInput({ period: 'monthly', targetCount: 5 }),
      );
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(3);
    expect(p.targetCount).toBe(5);
    expect(p.completed).toBe(false);
    expect(p.progress).toBeCloseTo(3 / 5);
  });

  it('monthly目标排除本月外的打卡记录', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 4, 30)),
    ];
    const { result } = renderHook(() => useGoals(checkIns));
    act(() => {
      result.current.addGoal(
        makeGoalInput({ period: 'monthly', targetCount: 5 }),
      );
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(1);
  });

  it('sportType定义时只统计该类型打卡', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17), 'fitness'),
      makeCheckIn(ts(2026, 5, 17), 'fitness'),
      makeCheckIn(ts(2026, 5, 17), 'running'),
      makeCheckIn(ts(2026, 5, 17), 'basketball'),
    ];
    const { result } = renderHook(() => useGoals(checkIns));
    act(() => {
      result.current.addGoal(
        makeGoalInput({ period: 'weekly', targetCount: 3, sportType: 'fitness' }),
      );
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(2);
    expect(p.completed).toBe(false);
    expect(p.progress).toBeCloseTo(2 / 3);
  });

  it('sportType为undefined时统计全部打卡', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17), 'fitness'),
      makeCheckIn(ts(2026, 5, 17), 'running'),
      makeCheckIn(ts(2026, 5, 17), 'basketball'),
    ];
    const { result } = renderHook(() => useGoals(checkIns));
    act(() => {
      result.current.addGoal(
        makeGoalInput({ period: 'weekly', targetCount: 5, sportType: undefined }),
      );
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(3);
  });

  it('完成状态: currentCount >= targetCount 时 completed=true, progress=1', () => {
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    const { result } = renderHook(() => useGoals(checkIns));
    act(() => {
      result.current.addGoal(makeGoalInput({ period: 'weekly', targetCount: 3 }));
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(3);
    expect(p.targetCount).toBe(3);
    expect(p.completed).toBe(true);
    expect(p.progress).toBe(1);
  });

  it('完成状态: currentCount > targetCount 时 progress 限制为 1', () => {
    // 本周 06-15~06-21，4次打卡均在本周
    const checkIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 18)),
    ];
    const { result } = renderHook(() => useGoals(checkIns));
    act(() => {
      result.current.addGoal(makeGoalInput({ period: 'weekly', targetCount: 2 }));
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(4);
    expect(p.completed).toBe(true);
    expect(p.progress).toBe(1);
  });

  it('空 checkIns 时 currentCount=0, completed=false, progress=0', () => {
    const { result } = renderHook(() => useGoals([]));
    act(() => {
      result.current.addGoal(makeGoalInput({ period: 'weekly', targetCount: 3 }));
    });
    const id = result.current.goals[0].id;
    const p = findProgress(result.current.goalsWithProgress, id);
    expect(p.currentCount).toBe(0);
    expect(p.completed).toBe(false);
    expect(p.progress).toBe(0);
  });

  it('周期重置: 跨周时weekly进度归零', () => {
    const goal: Goal = {
      id: 'goal-weekly',
      sportType: undefined,
      period: 'weekly',
      targetCount: 3,
      createdAt: ts(2026, 5, 10),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([goal]));
    const week1CheckIns = [
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 17)),
    ];

    // 第1周: 2026-06-17 周三
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { result: week1 } = renderHook(() => useGoals(week1CheckIns));
    const p1 = findProgress(week1.current.goalsWithProgress, 'goal-weekly');
    expect(p1.currentCount).toBe(3);
    expect(p1.completed).toBe(true);
    expect(p1.progress).toBe(1);

    // 跨周到第2周: 2026-06-24 周三（上周打卡不再计入）
    vi.setSystemTime(new Date(2026, 5, 24, 14, 0));
    const { result: week2 } = renderHook(() => useGoals(week1CheckIns));
    const p2 = findProgress(week2.current.goalsWithProgress, 'goal-weekly');
    expect(p2.currentCount).toBe(0);
    expect(p2.completed).toBe(false);
    expect(p2.progress).toBe(0);
  });

  it('周期重置: 跨月时monthly进度归零', () => {
    const goal: Goal = {
      id: 'goal-monthly',
      sportType: undefined,
      period: 'monthly',
      targetCount: 5,
      createdAt: ts(2026, 5, 1),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([goal]));
    const juneCheckIns = [
      makeCheckIn(ts(2026, 5, 1)),
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 5, 30)),
    ];

    // 2026-06
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { result: june } = renderHook(() => useGoals(juneCheckIns));
    const pJune = findProgress(june.current.goalsWithProgress, 'goal-monthly');
    expect(pJune.currentCount).toBe(3);
    expect(pJune.completed).toBe(false);
    expect(pJune.progress).toBeCloseTo(3 / 5);

    // 跨月到 2026-07
    vi.setSystemTime(new Date(2026, 6, 15, 14, 0));
    const { result: july } = renderHook(() => useGoals(juneCheckIns));
    const pJuly = findProgress(july.current.goalsWithProgress, 'goal-monthly');
    expect(pJuly.currentCount).toBe(0);
    expect(pJuly.completed).toBe(false);
    expect(pJuly.progress).toBe(0);
  });

  it('使用 useMemo 缓存 goalsWithProgress（相同输入返回相同引用）', () => {
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    const { result, rerender } = renderHook(() => useGoals(checkIns));
    const first = result.current.goalsWithProgress;
    rerender();
    expect(result.current.goalsWithProgress).toBe(first);
  });
});
