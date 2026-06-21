import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReminders } from '../../src/hooks/useReminders';
import { DEFAULT_REMINDERS } from '../../src/constants/reminders';
import type { Reminder } from '../../src/types';

const STORAGE_KEY = 'momenta-reminders';

function makeReminderInput(
  overrides: Partial<Omit<Reminder, 'id'>> = {},
): Omit<Reminder, 'id'> {
  return {
    sportType: undefined,
    days: [1, 3, 5],
    hour: 19,
    minute: 0,
    message: '该去运动啦！',
    enabled: true,
    skipIfCheckedIn: true,
    ...overrides,
  };
}

describe('useReminders', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('初始化时从localStorage读取提醒列表', () => {
    const stored: Reminder[] = [
      {
        id: 'stored-1',
        sportType: 'running',
        days: [1, 2],
        hour: 8,
        minute: 0,
        message: '早',
        enabled: true,
        skipIfCheckedIn: false,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useReminders());
    expect(result.current.reminders).toEqual(stored);
  });

  it('无存储时使用DEFAULT_REMINDERS', () => {
    const { result } = renderHook(() => useReminders());
    expect(result.current.reminders).toEqual(DEFAULT_REMINDERS);
  });

  it('addReminder: 添加新提醒，保存到localStorage', () => {
    const { result } = renderHook(() => useReminders());
    const initialCount = result.current.reminders.length;

    act(() => {
      result.current.addReminder(makeReminderInput({ message: '新提醒' }));
    });

    expect(result.current.reminders.length).toBe(initialCount + 1);
    const added = result.current.reminders[result.current.reminders.length - 1];
    expect(added.message).toBe('新提醒');
    expect(added.id).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.length).toBe(initialCount + 1);
  });

  it('addReminder: 生成UUID作为id', () => {
    const { result } = renderHook(() => useReminders());
    act(() => {
      result.current.addReminder(makeReminderInput());
    });
    const added = result.current.reminders[result.current.reminders.length - 1];
    expect(added.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('updateReminder: 更新提醒并保存到localStorage', () => {
    const { result } = renderHook(() => useReminders());
    act(() => {
      result.current.addReminder(makeReminderInput({ message: '原' }));
    });
    const id = result.current.reminders[0].id;

    act(() => {
      result.current.updateReminder(id, { message: '更新后', hour: 7 });
    });

    const updated = result.current.reminders.find((r) => r.id === id);
    expect(updated?.message).toBe('更新后');
    expect(updated?.hour).toBe(7);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.find((r: Reminder) => r.id === id).message).toBe('更新后');
  });

  it('updateReminder: 更新不存在的id不影响列表', () => {
    const { result } = renderHook(() => useReminders());
    const before = result.current.reminders.length;

    act(() => {
      result.current.updateReminder('non-existent', { message: 'X' });
    });

    expect(result.current.reminders.length).toBe(before);
  });

  it('deleteReminder: 删除提醒并保存到localStorage', () => {
    const { result } = renderHook(() => useReminders());
    act(() => {
      result.current.addReminder(makeReminderInput({ message: 'A' }));
    });
    act(() => {
      result.current.addReminder(makeReminderInput({ message: 'B' }));
    });
    const idToDelete = result.current.reminders[0].id;
    const countBefore = result.current.reminders.length;

    act(() => {
      result.current.deleteReminder(idToDelete);
    });

    expect(result.current.reminders.length).toBe(countBefore - 1);
    expect(
      result.current.reminders.find((r) => r.id === idToDelete),
    ).toBeUndefined();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.find((r: Reminder) => r.id === idToDelete)).toBeUndefined();
  });

  it('deleteReminder: 删除不存在的id不影响列表', () => {
    const { result } = renderHook(() => useReminders());
    const before = result.current.reminders.length;

    act(() => {
      result.current.deleteReminder('non-existent');
    });

    expect(result.current.reminders.length).toBe(before);
  });

  it('toggleReminder: 切换enabled状态并保存', () => {
    const { result } = renderHook(() => useReminders());
    act(() => {
      result.current.addReminder(makeReminderInput({ enabled: true }));
    });
    const id = result.current.reminders[0].id;
    const before = result.current.reminders.find((r) => r.id === id)!.enabled;

    act(() => {
      result.current.toggleReminder(id);
    });

    const after = result.current.reminders.find((r) => r.id === id)!.enabled;
    expect(after).toBe(!before);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.find((r: Reminder) => r.id === id).enabled).toBe(!before);
  });

  it('支持至少3个并行提醒', () => {
    const { result } = renderHook(() => useReminders());

    act(() => {
      result.current.addReminder(makeReminderInput({ message: 'A', hour: 8 }));
    });
    act(() => {
      result.current.addReminder(makeReminderInput({ message: 'B', hour: 12 }));
    });
    act(() => {
      result.current.addReminder(makeReminderInput({ message: 'C', hour: 19 }));
    });

    expect(result.current.reminders.length).toBeGreaterThanOrEqual(3);
    const messages = result.current.reminders.map((r) => r.message);
    expect(messages).toContain('A');
    expect(messages).toContain('B');
    expect(messages).toContain('C');

    const ids = result.current.reminders.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('默认提醒配置（DEFAULT_REMINDERS）', () => {
    expect(Array.isArray(DEFAULT_REMINDERS)).toBe(true);
    expect(DEFAULT_REMINDERS.length).toBeGreaterThanOrEqual(1);

    const first = DEFAULT_REMINDERS[0];
    expect(first.enabled).toBe(false);
    expect(first.days).toContain(1);
    expect(first.days).toContain(3);
    expect(first.days).toContain(5);
    expect(first.hour).toBe(19);
    expect(first.minute).toBe(0);
  });

  it('返回值包含所有方法', () => {
    const { result } = renderHook(() => useReminders());
    expect(Array.isArray(result.current.reminders)).toBe(true);
    expect(typeof result.current.addReminder).toBe('function');
    expect(typeof result.current.updateReminder).toBe('function');
    expect(typeof result.current.deleteReminder).toBe('function');
    expect(typeof result.current.toggleReminder).toBe('function');
  });
});
