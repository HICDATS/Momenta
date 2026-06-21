import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSportTypes } from '../../src/hooks/useSportTypes';
import { DEFAULT_SPORT_TYPES } from '../../src/constants/sports';
import type { SportType } from '../../src/types';

const STORAGE_KEY = 'momenta-custom-sports';
const MAX_NAME_LENGTH = 10;
const CUSTOM_ID_PREFIX = 'custom-';

function makeSportTypeInput(
  overrides: Partial<Omit<SportType, 'id' | 'isDefault' | 'order'>> = {},
): Omit<SportType, 'id' | 'isDefault' | 'order'> {
  return {
    name: '攀岩',
    icon: 'Sparkles',
    color: '#FF6B6B',
    ...overrides,
  };
}

describe('useSportTypes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('返回值包含 sportTypes, customSportTypes, addSportType, updateSportType, deleteSportType', () => {
    const { result } = renderHook(() => useSportTypes());
    expect(Array.isArray(result.current.sportTypes)).toBe(true);
    expect(Array.isArray(result.current.customSportTypes)).toBe(true);
    expect(typeof result.current.addSportType).toBe('function');
    expect(typeof result.current.updateSportType).toBe('function');
    expect(typeof result.current.deleteSportType).toBe('function');
  });

  it('初始化时加载预设运动类型', () => {
    const { result } = renderHook(() => useSportTypes());
    expect(result.current.sportTypes.length).toBeGreaterThanOrEqual(
      DEFAULT_SPORT_TYPES.length,
    );
    for (const preset of DEFAULT_SPORT_TYPES) {
      const found = result.current.sportTypes.find((s) => s.id === preset.id);
      expect(found).toEqual(preset);
    }
  });

  it('初始化时无自定义运动类型，customSportTypes为空', () => {
    const { result } = renderHook(() => useSportTypes());
    expect(result.current.customSportTypes).toEqual([]);
  });

  it('初始化时从localStorage读取自定义运动类型', () => {
    const stored: SportType[] = [
      {
        id: 'custom-abc',
        name: '攀岩',
        icon: 'Sparkles',
        color: '#A29BFE',
        isDefault: false,
        order: 100,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useSportTypes());
    expect(result.current.customSportTypes).toHaveLength(1);
    expect(result.current.customSportTypes[0]).toEqual(stored[0]);
    expect(result.current.sportTypes).toHaveLength(
      DEFAULT_SPORT_TYPES.length + 1,
    );
  });

  it('sportTypes 合并预设与自定义并按order升序排序', () => {
    const stored: SportType[] = [
      {
        id: 'custom-1',
        name: '攀岩',
        icon: 'Sparkles',
        color: '#A29BFE',
        isDefault: false,
        order: 50,
      },
      {
        id: 'custom-2',
        name: '滑板',
        icon: 'Zap',
        color: '#FD79A8',
        isDefault: false,
        order: 3,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useSportTypes());
    const orders = result.current.sportTypes.map((s) => s.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it('addSportType: 添加自定义类型并保存到localStorage', () => {
    const { result } = renderHook(() => useSportTypes());
    let created: SportType | null = null;
    act(() => {
      created = result.current.addSportType(makeSportTypeInput());
    });
    expect(created).not.toBeNull();
    expect(result.current.customSportTypes).toHaveLength(1);
    expect(result.current.sportTypes).toHaveLength(
      DEFAULT_SPORT_TYPES.length + 1,
    );

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) as string,
    ) as SportType[];
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('攀岩');
  });

  it('addSportType: 生成 custom- 前缀的唯一id', () => {
    const { result } = renderHook(() => useSportTypes());
    const ids: string[] = [];
    act(() => {
      const a = result.current.addSportType(
        makeSportTypeInput({ name: '攀岩' }),
      );
      const b = result.current.addSportType(
        makeSportTypeInput({ name: '滑板' }),
      );
      if (a) ids.push(a.id);
      if (b) ids.push(b.id);
    });
    expect(ids).toHaveLength(2);
    expect(ids[0].startsWith(CUSTOM_ID_PREFIX)).toBe(true);
    expect(ids[1].startsWith(CUSTOM_ID_PREFIX)).toBe(true);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('addSportType: 自定义类型 isDefault=false', () => {
    const { result } = renderHook(() => useSportTypes());
    let created: SportType | null = null;
    act(() => {
      created = result.current.addSportType(makeSportTypeInput());
    });
    expect(created?.isDefault).toBe(false);
    expect(result.current.customSportTypes[0].isDefault).toBe(false);
  });

  it('addSportType: order = 当前最大order + 1', () => {
    const { result } = renderHook(() => useSportTypes());
    const maxDefaultOrder = Math.max(
      ...DEFAULT_SPORT_TYPES.map((s) => s.order),
    );
    let created: SportType | null = null;
    act(() => {
      created = result.current.addSportType(makeSportTypeInput());
    });
    expect(created?.order).toBe(maxDefaultOrder + 1);

    let second: SportType | null = null;
    act(() => {
      second = result.current.addSportType(
        makeSportTypeInput({ name: '滑板' }),
      );
    });
    expect(second?.order).toBe(maxDefaultOrder + 2);
  });

  it('addSportType: 无自定义类型时order从预设最大值递增', () => {
    const { result } = renderHook(() => useSportTypes());
    let created: SportType | null = null;
    act(() => {
      created = result.current.addSportType(makeSportTypeInput());
    });
    const maxDefaultOrder = Math.max(
      ...DEFAULT_SPORT_TYPES.map((s) => s.order),
    );
    expect(created?.order).toBe(maxDefaultOrder + 1);
  });

  it('addSportType: 名称超过10字返回null且不添加', () => {
    const { result } = renderHook(() => useSportTypes());
    const longName = '一二三四五六七八九十十一';
    expect(longName.length).toBeGreaterThan(MAX_NAME_LENGTH);
    let created: SportType | null = null;
    act(() => {
      created = result.current.addSportType(
        makeSportTypeInput({ name: longName }),
      );
    });
    expect(created).toBeNull();
    expect(result.current.customSportTypes).toHaveLength(0);
    expect(result.current.sportTypes).toHaveLength(DEFAULT_SPORT_TYPES.length);
  });

  it('addSportType: 名称正好10字可以添加', () => {
    const { result } = renderHook(() => useSportTypes());
    const exactName = '一二三四五六七八九十';
    expect(exactName.length).toBe(MAX_NAME_LENGTH);
    let created: SportType | null = null;
    act(() => {
      created = result.current.addSportType(
        makeSportTypeInput({ name: exactName }),
      );
    });
    expect(created).not.toBeNull();
    expect(created?.name).toBe(exactName);
  });

  it('addSportType: 空名称返回null', () => {
    const { result } = renderHook(() => useSportTypes());
    let created: SportType | null = null;
    act(() => {
      created = result.current.addSportType(makeSportTypeInput({ name: '' }));
    });
    expect(created).toBeNull();
    expect(result.current.customSportTypes).toHaveLength(0);
  });

  it('addSportType: 多次添加保证id唯一', () => {
    const { result } = renderHook(() => useSportTypes());
    const ids: string[] = [];
    act(() => {
      for (let i = 0; i < 5; i++) {
        const c = result.current.addSportType(
          makeSportTypeInput({ name: `运动${i}` }),
        );
        if (c) ids.push(c.id);
      }
    });
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  it('updateSportType: 只能更新自定义类型', () => {
    const { result } = renderHook(() => useSportTypes());
    let customId = '';
    act(() => {
      const created = result.current.addSportType(makeSportTypeInput());
      if (created) customId = created.id;
    });
    act(() => {
      result.current.updateSportType(customId, { name: '攀岩更新' });
    });
    const updated = result.current.customSportTypes.find(
      (s) => s.id === customId,
    );
    expect(updated?.name).toBe('攀岩更新');
  });

  it('updateSportType: 预设类型不可更新', () => {
    const { result } = renderHook(() => useSportTypes());
    const presetId = DEFAULT_SPORT_TYPES[0].id;
    const originalName = DEFAULT_SPORT_TYPES[0].name;
    act(() => {
      result.current.updateSportType(presetId, { name: '被篡改' });
    });
    const preset = result.current.sportTypes.find(
      (s) => s.id === presetId,
    );
    expect(preset?.name).toBe(originalName);
  });

  it('updateSportType: 更新不存在的id不影响列表', () => {
    const { result } = renderHook(() => useSportTypes());
    const before = result.current.customSportTypes.length;
    act(() => {
      result.current.updateSportType('non-existent', { name: '不存在' });
    });
    expect(result.current.customSportTypes).toHaveLength(before);
  });

  it('deleteSportType: 删除自定义类型返回true', () => {
    const { result } = renderHook(() => useSportTypes());
    let customId = '';
    act(() => {
      const created = result.current.addSportType(makeSportTypeInput());
      if (created) customId = created.id;
    });
    let success = false;
    act(() => {
      success = result.current.deleteSportType(customId);
    });
    expect(success).toBe(true);
    expect(result.current.customSportTypes).toHaveLength(0);
    expect(result.current.sportTypes).toHaveLength(DEFAULT_SPORT_TYPES.length);
  });

  it('deleteSportType: 预设类型不可删除，返回false', () => {
    const { result } = renderHook(() => useSportTypes());
    const presetId = DEFAULT_SPORT_TYPES[0].id;
    let success = true;
    act(() => {
      success = result.current.deleteSportType(presetId);
    });
    expect(success).toBe(false);
    expect(result.current.sportTypes).toHaveLength(DEFAULT_SPORT_TYPES.length);
    const preset = result.current.sportTypes.find((s) => s.id === presetId);
    expect(preset).toBeDefined();
  });

  it('deleteSportType: 删除不存在的id返回false', () => {
    const { result } = renderHook(() => useSportTypes());
    let success = true;
    act(() => {
      success = result.current.deleteSportType('non-existent');
    });
    expect(success).toBe(false);
  });

  it('deleteSportType: 从localStorage移除', () => {
    const { result } = renderHook(() => useSportTypes());
    let customId = '';
    act(() => {
      const created = result.current.addSportType(makeSportTypeInput());
      if (created) customId = created.id;
    });
    act(() => {
      result.current.deleteSportType(customId);
    });
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) as string,
    ) as SportType[];
    expect(stored).toHaveLength(0);
  });

  it('删除自定义类型后预设类型仍完整', () => {
    const { result } = renderHook(() => useSportTypes());
    let customId = '';
    act(() => {
      const created = result.current.addSportType(
        makeSportTypeInput({ name: '临时类型' }),
      );
      if (created) customId = created.id;
    });
    act(() => {
      result.current.deleteSportType(customId);
    });
    for (const preset of DEFAULT_SPORT_TYPES) {
      const found = result.current.sportTypes.find((s) => s.id === preset.id);
      expect(found).toEqual(preset);
    }
  });

  it('预设类型 isDefault=true，自定义类型 isDefault=false', () => {
    const { result } = renderHook(() => useSportTypes());
    for (const preset of DEFAULT_SPORT_TYPES) {
      const found = result.current.sportTypes.find((s) => s.id === preset.id);
      expect(found?.isDefault).toBe(true);
    }
    act(() => {
      result.current.addSportType(makeSportTypeInput());
    });
    expect(result.current.customSportTypes[0].isDefault).toBe(false);
  });

  it('删除自定义类型不影响历史记录数据（localStorage中仅自定义列表变化）', () => {
    const { result } = renderHook(() => useSportTypes());
    let customId = '';
    act(() => {
      const created = result.current.addSportType(makeSportTypeInput());
      if (created) customId = created.id;
    });
    // 模拟历史记录数据（用其它key保存）
    const historyKey = 'momenta-checkins';
    const fakeCheckIn = JSON.stringify([
      { id: 'c1', sportType: customId, timestamp: 1, createdAt: 1 },
    ]);
    localStorage.setItem(historyKey, fakeCheckIn);

    act(() => {
      result.current.deleteSportType(customId);
    });

    // 历史记录未被触动
    expect(localStorage.getItem(historyKey)).toBe(fakeCheckIn);
  });
});
