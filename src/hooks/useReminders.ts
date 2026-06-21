import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_REMINDERS } from '../constants/reminders';
import type { Reminder } from '../types';

const STORAGE_KEY = 'momenta-reminders';

export interface UseRemindersResult {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
}

export function useReminders(): UseRemindersResult {
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(
    STORAGE_KEY,
    DEFAULT_REMINDERS,
  );

  const addReminder = useCallback(
    (reminder: Omit<Reminder, 'id'>): void => {
      const newReminder: Reminder = {
        ...reminder,
        id: crypto.randomUUID(),
      };
      setReminders([...reminders, newReminder]);
    },
    [reminders, setReminders],
  );

  const updateReminder = useCallback(
    (id: string, updates: Partial<Reminder>): void => {
      setReminders(
        reminders.map((reminder) =>
          reminder.id === id ? { ...reminder, ...updates } : reminder,
        ),
      );
    },
    [reminders, setReminders],
  );

  const deleteReminder = useCallback(
    (id: string): void => {
      setReminders(reminders.filter((reminder) => reminder.id !== id));
    },
    [reminders, setReminders],
  );

  const toggleReminder = useCallback(
    (id: string): void => {
      setReminders(
        reminders.map((reminder) =>
          reminder.id === id
            ? { ...reminder, enabled: !reminder.enabled }
            : reminder,
        ),
      );
    },
    [reminders, setReminders],
  );

  return { reminders, addReminder, updateReminder, deleteReminder, toggleReminder };
}
