import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../src/hooks/useLocalStorage';

const STORAGE_KEY = 'momenta-test-key';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('key不存在时返回默认值', () => {
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('读取已存储的值', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('写入值后 state 和 localStorage 同步更新', () => {
    const { result } = renderHook(() => useLocalStorage<string>(STORAGE_KEY, ''));
    act(() => {
      result.current[1]('hello');
    });
    expect(result.current[0]).toBe('hello');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify('hello'));
  });

  it('JSON 序列化/反序列化对象', () => {
    const obj = { a: 1, b: ['x', 'y'] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    const { result } = renderHook(() =>
      useLocalStorage<{ a: number; b: string[] }>(STORAGE_KEY, { a: 0, b: [] }),
    );
    expect(result.current[0]).toEqual(obj);
  });

  it('写入对象同步到 localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage<{ count: number }>(STORAGE_KEY, { count: 0 }),
    );
    act(() => {
      result.current[1]({ count: 42 });
    });
    expect(result.current[0]).toEqual({ count: 42 });
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify({ count: 42 }));
  });

  it('JSON.parse 失败时回退到默认值', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    const { result } = renderHook(() => useLocalStorage(STORAGE_KEY, 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('setter 是稳定引用（useCallback）', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage<number>(STORAGE_KEY, 0),
    );
    const firstSetter = result.current[1];
    rerender();
    expect(result.current[1]).toBe(firstSetter);
  });
});
