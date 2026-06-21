import { useState, useCallback } from 'react';

export type NotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export interface UseNotificationsResult {
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<boolean>;
  isSupported: boolean;
}

type BrowserPermission = 'granted' | 'denied' | 'default';

interface NotificationAPI {
  permission: BrowserPermission;
  requestPermission: () => Promise<BrowserPermission>;
  new (title: string, options?: NotificationOptions): unknown;
}

function getNotificationAPI(): NotificationAPI | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return (window as unknown as { Notification?: NotificationAPI }).Notification;
}

export function useNotifications(): UseNotificationsResult {
  const [api] = useState<NotificationAPI | undefined>(() => getNotificationAPI());
  const isSupported = api !== undefined;

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!api) {
      return 'unsupported';
    }
    return api.permission;
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!api) {
      return false;
    }
    try {
      const result = await api.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      setPermission('denied');
      return false;
    }
  }, [api]);

  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions): Promise<boolean> => {
      if (!api || permission !== 'granted') {
        return false;
      }
      try {
        new api(title, options);
        return true;
      } catch {
        return false;
      }
    },
    [api, permission],
  );

  return { permission, requestPermission, showNotification, isSupported };
}
