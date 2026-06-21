import type { Reminder } from '../types';

export const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'default-1',
    sportType: undefined,
    days: [1, 3, 5],
    hour: 19,
    minute: 0,
    message: '该去运动啦！加油！',
    enabled: false,
    skipIfCheckedIn: true,
  },
];

export const DEFAULT_REMINDER_MESSAGE = '该去运动啦！加油！';
