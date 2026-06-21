import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { checkSmartReminder } from '../utils/smartReminderChecker';
import type { SmartReminderResult } from '../utils/smartReminderChecker';
import type { CheckIn } from '../types';

const ENABLED_KEY = 'momenta-smart-reminder-enabled';
const THRESHOLD_KEY = 'momenta-smart-reminder-threshold';
const REST_DAYS_KEY = 'momenta-rest-days';

const DEFAULT_THRESHOLD = 2;

export interface UseSmartReminderResult {
  enabled: boolean;
  threshold: number;
  setEnabled: (enabled: boolean) => void;
  setThreshold: (threshold: number) => void;
  check: (checkIns: CheckIn[], todayTriggeredFixed: boolean) => SmartReminderResult;
}

export function useSmartReminder(): UseSmartReminderResult {
  const [enabled, setEnabled] = useLocalStorage<boolean>(ENABLED_KEY, false);
  const [threshold, setThreshold] = useLocalStorage<number>(
    THRESHOLD_KEY,
    DEFAULT_THRESHOLD,
  );
  const [restDays] = useLocalStorage<number[]>(REST_DAYS_KEY, []);

  const check = useCallback(
    (checkIns: CheckIn[], todayTriggeredFixed: boolean): SmartReminderResult => {
      return checkSmartReminder(
        checkIns,
        threshold,
        enabled,
        todayTriggeredFixed,
        Date.now(),
        restDays,
      );
    },
    [enabled, threshold, restDays],
  );

  return { enabled, threshold, setEnabled, setThreshold, check };
}
