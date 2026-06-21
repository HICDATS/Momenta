import { describe, expect, it, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../../src/hooks/useNotifications';

type PermissionState = 'granted' | 'denied' | 'default';

interface MockNotificationAPI {
  permission: PermissionState;
  requestPermission: () => Promise<PermissionState>;
  new (title: string, options?: NotificationOptions): unknown;
}

function setNotification(
  permission: PermissionState,
  requestResult?: PermissionState,
): MockNotificationAPI {
  const result = requestResult ?? permission;
  const MockClass = class {
    static permission: PermissionState = permission;
    static requestPermission = vi.fn().mockResolvedValue(result);
    constructor(public title: string, public options?: NotificationOptions) {}
  };
  Object.defineProperty(window, 'Notification', {
    value: MockClass,
    writable: true,
    configurable: true,
  });
  return MockClass as unknown as MockNotificationAPI;
}

function clearNotification(): void {
  try {
    delete (window as unknown as { Notification?: unknown }).Notification;
  } catch {
    // ignore
  }
}

describe('useNotifications', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearNotification();
  });

  it('不支持通知时 isSupported=false, permission=unsupported', () => {
    clearNotification();
    const { result } = renderHook(() => useNotifications());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe('unsupported');
  });

  it('支持通知但未授权时 permission=default', () => {
    setNotification('default');
    const { result } = renderHook(() => useNotifications());
    expect(result.current.isSupported).toBe(true);
    expect(result.current.permission).toBe('default');
  });

  it('permission状态：granted', () => {
    setNotification('granted');
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permission).toBe('granted');
  });

  it('permission状态：denied', () => {
    setNotification('denied');
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permission).toBe('denied');
  });

  it('requestPermission: 申请通知权限成功返回true并更新状态', async () => {
    setNotification('default', 'granted');
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permission).toBe('default');

    let granted = false;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(true);
    expect(result.current.permission).toBe('granted');
  });

  it('requestPermission: 拒绝授权返回false并更新状态', async () => {
    setNotification('default', 'denied');
    const { result } = renderHook(() => useNotifications());

    let granted = true;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(false);
    expect(result.current.permission).toBe('denied');
  });

  it('requestPermission: 不支持时返回false', async () => {
    clearNotification();
    const { result } = renderHook(() => useNotifications());

    let granted = true;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(false);
  });

  it('showNotification: 有权限时显示通知返回true', async () => {
    setNotification('granted');
    const { result } = renderHook(() => useNotifications());

    let shown = false;
    await act(async () => {
      shown = await result.current.showNotification('标题', { body: '正文' });
    });

    expect(shown).toBe(true);
  });

  it('showNotification: 无权限时返回false', async () => {
    setNotification('denied');
    const { result } = renderHook(() => useNotifications());

    let shown = true;
    await act(async () => {
      shown = await result.current.showNotification('标题');
    });

    expect(shown).toBe(false);
  });

  it('showNotification: 不支持时返回false', async () => {
    clearNotification();
    const { result } = renderHook(() => useNotifications());

    let shown = true;
    await act(async () => {
      shown = await result.current.showNotification('标题');
    });

    expect(shown).toBe(false);
  });

  it('通知包含标题和正文（构造函数被调用）', async () => {
    const calls: Array<{ title: string; options?: NotificationOptions }> = [];
    Object.defineProperty(window, 'Notification', {
      value: class {
        static permission: PermissionState = 'granted';
        static requestPermission = vi.fn().mockResolvedValue('granted');
        constructor(title: string, options?: NotificationOptions) {
          calls.push({ title, options });
        }
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.showNotification('运动提醒', { body: '该去运动啦！' });
    });

    expect(calls.length).toBe(1);
    expect(calls[0].title).toBe('运动提醒');
    expect(calls[0].options?.body).toBe('该去运动啦！');
  });
});
