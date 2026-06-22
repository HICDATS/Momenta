import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCheckIns } from '../../src/hooks/useCheckIns';
import {
  addCheckIn,
  clearAllCheckIns,
  getCheckInsByDateRange,
  getCheckInsBySportType,
} from '../../src/db/database';
import type { UseCheckInsResult } from '../../src/hooks/useCheckIns';
import type { CheckIn } from '../../src/types';

function ts(year: number, month: number, day: number, hour = 10): number {
  return new Date(year, month, day, hour, 0).getTime();
}

function makeInput(
  sportType: string,
  timestamp: number,
  note?: string,
): Omit<CheckIn, 'id' | 'createdAt'> {
  return { sportType, timestamp, note };
}

async function seedCheckIns(inputs: Array<Omit<CheckIn, 'id' | 'createdAt'>>): Promise<void> {
  for (const input of inputs) {
    await addCheckIn(input);
  }
}

describe('useCheckIns 返回值结构', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('返回 checkIns, loading, error, addCheckIn, deleteCheckIn, refresh', async () => {
    const { result } = renderHook(() => useCheckIns());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(Array.isArray(result.current.checkIns)).toBe(true);
    expect(typeof result.current.loading).toBe('boolean');
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
    expect(typeof result.current.addCheckIn).toBe('function');
    expect(typeof result.current.deleteCheckIn).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('初始 loading 为 true，加载完成后变为 false', async () => {
    await seedCheckIns([makeInput('running', ts(2026, 5, 1))]);
    const { result } = renderHook(() => useCheckIns());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('useCheckIns 初始加载', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('挂载后加载所有打卡记录', async () => {
    await seedCheckIns([
      makeInput('running', ts(2026, 5, 1)),
      makeInput('yoga', ts(2026, 5, 2)),
    ]);

    const { result } = renderHook(() => useCheckIns());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.checkIns.length).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('加载的记录按时间倒序排列', async () => {
    await seedCheckIns([
      makeInput('running', ts(2026, 5, 1)),
      makeInput('running', ts(2026, 5, 3)),
      makeInput('running', ts(2026, 5, 2)),
    ]);

    const { result } = renderHook(() => useCheckIns());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.checkIns[0].timestamp).toBe(ts(2026, 5, 3));
    expect(result.current.checkIns[1].timestamp).toBe(ts(2026, 5, 2));
    expect(result.current.checkIns[2].timestamp).toBe(ts(2026, 5, 1));
  });

  it('无记录时 checkIns 为空数组且 error 为 null', async () => {
    const { result } = renderHook(() => useCheckIns());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.checkIns).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

describe('useCheckIns.addCheckIn', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('添加后 checkIns 更新', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addCheckIn(makeInput('running', ts(2026, 5, 10)));
    });

    expect(result.current.checkIns.length).toBe(1);
    expect(result.current.checkIns[0].sportType).toBe('running');
    expect(result.current.checkIns[0].timestamp).toBe(ts(2026, 5, 10));
  });

  it('addCheckIn 返回完整 CheckIn 记录', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: CheckIn | undefined;
    await act(async () => {
      created = await result.current.addCheckIn(makeInput('yoga', ts(2026, 5, 10), '冥想'));
    });

    expect(created).toBeDefined();
    expect(created?.id).toBeTruthy();
    expect(created?.sportType).toBe('yoga');
    expect(created?.note).toBe('冥想');
  });

  it('多次添加后 checkIns 按时间倒序', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addCheckIn(makeInput('running', ts(2026, 5, 1)));
    });
    await act(async () => {
      await result.current.addCheckIn(makeInput('running', ts(2026, 5, 3)));
    });
    await act(async () => {
      await result.current.addCheckIn(makeInput('running', ts(2026, 5, 2)));
    });

    expect(result.current.checkIns.length).toBe(3);
    expect(result.current.checkIns[0].timestamp).toBe(ts(2026, 5, 3));
    expect(result.current.checkIns[1].timestamp).toBe(ts(2026, 5, 2));
    expect(result.current.checkIns[2].timestamp).toBe(ts(2026, 5, 1));
  });
});

describe('useCheckIns.deleteCheckIn', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('删除后 checkIns 更新', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: CheckIn | undefined;
    await act(async () => {
      created = await result.current.addCheckIn(makeInput('running', ts(2026, 5, 10)));
    });
    expect(result.current.checkIns.length).toBe(1);

    await act(async () => {
      await result.current.deleteCheckIn(created!.id);
    });

    expect(result.current.checkIns.length).toBe(0);
  });

  it('删除不存在的 id 不抛错且不影响其他记录', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addCheckIn(makeInput('running', ts(2026, 5, 10)));
    });
    expect(result.current.checkIns.length).toBe(1);

    await act(async () => {
      await result.current.deleteCheckIn('non-existent-id');
    });

    expect(result.current.checkIns.length).toBe(1);
    expect(result.current.error).toBeNull();
  });
});

describe('useCheckIns.refresh', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('refresh 重新从 DB 加载最新数据', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.checkIns.length).toBe(0);

    await addCheckIn(makeInput('running', ts(2026, 5, 5)));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.checkIns.length).toBe(1);
    expect(result.current.checkIns[0].sportType).toBe('running');
  });
});

describe('useCheckIns 错误处理', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('addCheckIn 失败时 error 有值且不抛出', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const spy = vi.spyOn(
      await import('../../src/db/database'),
      'addCheckIn',
    ).mockRejectedValueOnce(new Error('DB写入失败'));

    await act(async () => {
      await result.current.addCheckIn(makeInput('running', ts(2026, 5, 10)));
    });

    expect(result.current.error).not.toBeNull();
    expect(typeof result.current.error).toBe('string');
    expect(result.current.error!.length).toBeGreaterThan(0);

    spy.mockRestore();
  });

  it('deleteCheckIn 失败时 error 有值且不抛出', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const spy = vi.spyOn(
      await import('../../src/db/database'),
      'deleteCheckIn',
    ).mockRejectedValueOnce(new Error('DB删除失败'));

    await act(async () => {
      await result.current.deleteCheckIn('any-id');
    });

    expect(result.current.error).not.toBeNull();
    expect(typeof result.current.error).toBe('string');

    spy.mockRestore();
  });
});

describe('useCheckIns 与底层筛选函数协作', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('可配合 getCheckInsBySportType 筛选', async () => {
    await seedCheckIns([
      makeInput('running', ts(2026, 5, 1)),
      makeInput('yoga', ts(2026, 5, 2)),
      makeInput('running', ts(2026, 5, 3)),
    ]);

    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const running = await getCheckInsBySportType('running');
    expect(running.length).toBe(2);
    expect(running[0].sportType).toBe('running');
  });

  it('可配合 getCheckInsByDateRange 筛选', async () => {
    await seedCheckIns([
      makeInput('running', ts(2026, 5, 1)),
      makeInput('running', ts(2026, 5, 3)),
      makeInput('running', ts(2026, 5, 5)),
    ]);

    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const range = await getCheckInsByDateRange(ts(2026, 5, 2), ts(2026, 5, 4));
    expect(range.length).toBe(1);
    expect(range[0].timestamp).toBe(ts(2026, 5, 3));
  });
});

describe('useCheckIns 类型与契约', () => {
  it('返回类型符合 UseCheckInsResult 接口', async () => {
    const { result } = renderHook(() => useCheckIns());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const value: UseCheckInsResult = result.current;
    expect(value).toBe(result.current);
  });
});
