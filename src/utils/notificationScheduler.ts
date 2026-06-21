import type { Reminder, CheckIn } from '../types';
import { getDay, isSameDay } from 'date-fns';

export function shouldTriggerReminder(
  reminder: Reminder,
  currentTime: number,
  todayCheckIns: CheckIn[],
): boolean {
  if (!reminder.enabled) {
    return false;
  }

  const currentDay = getDay(currentTime);
  if (!reminder.days.includes(currentDay)) {
    return false;
  }

  const currentDate = new Date(currentTime);
  if (currentDate.getHours() !== reminder.hour || currentDate.getMinutes() !== reminder.minute) {
    return false;
  }

  if (reminder.skipIfCheckedIn) {
    const hasTodayCheckIn = todayCheckIns.some((checkIn) =>
      isSameDay(checkIn.timestamp, currentTime),
    );
    if (hasTodayCheckIn) {
      return false;
    }
  }

  return true;
}

export function getRemindersForDay(
  reminders: Reminder[],
  dayOfWeek: number,
): Reminder[] {
  return reminders.filter((reminder) => reminder.enabled && reminder.days.includes(dayOfWeek));
}

function getNextFireTime(reminder: Reminder, currentTime: number): number | null {
  const DAYS_IN_WEEK = 7;
  const currentDate = new Date(currentTime);

  for (let offset = 0; offset < DAYS_IN_WEEK; offset++) {
    const candidateDate = new Date(currentTime);
    candidateDate.setDate(currentDate.getDate() + offset);
    candidateDate.setHours(reminder.hour, reminder.minute, 0, 0);

    const dayOfWeek = getDay(candidateDate.getTime());
    if (!reminder.days.includes(dayOfWeek)) {
      continue;
    }

    if (candidateDate.getTime() > currentTime) {
      return candidateDate.getTime();
    }
  }

  return null;
}

export function getNextReminder(
  reminders: Reminder[],
  currentTime: number,
): Reminder | null {
  let nearestReminder: Reminder | null = null;
  let nearestFireTime: number | null = null;

  for (const reminder of reminders) {
    if (!reminder.enabled) {
      continue;
    }

    const fireTime = getNextFireTime(reminder, currentTime);
    if (fireTime === null) {
      continue;
    }

    if (nearestFireTime === null || fireTime < nearestFireTime) {
      nearestFireTime = fireTime;
      nearestReminder = reminder;
    }
  }

  return nearestReminder;
}
