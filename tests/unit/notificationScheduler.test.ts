import { describe, expect, it } from 'vitest';
import type { Reminder, CheckIn } from '../../src/types';
import {
  shouldTriggerReminder,
  getRemindersForDay,
  getNextReminder,
} from '../../src/utils/notificationScheduler';

function ts(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): number {
  return new Date(year, month, day, hour, minute).getTime();
}

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'r1',
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

function makeCheckIn(timestamp: number): CheckIn {
  return {
    id: `c-${timestamp}`,
    sportType: 'running',
    timestamp,
    createdAt: timestamp,
  };
}

describe('shouldTriggerReminder', () => {
  it('到达设定时间返回true', () => {
    const currentTime = ts(2026, 5, 17, 19, 0);
    const reminder = makeReminder();
    expect(shouldTriggerReminder(reminder, currentTime, [])).toBe(true);
  });

  it('未到时间（小时不同）返回false', () => {
    const currentTime = ts(2026, 5, 17, 18, 0);
    const reminder = makeReminder();
    expect(shouldTriggerReminder(reminder, currentTime, [])).toBe(false);
  });

  it('分钟不匹配返回false', () => {
    const currentTime = ts(2026, 5, 17, 19, 30);
    const reminder = makeReminder();
    expect(shouldTriggerReminder(reminder, currentTime, [])).toBe(false);
  });

  it('当天已打卡且skipIfCheckedIn=true返回false', () => {
    const currentTime = ts(2026, 5, 17, 19, 0);
    const reminder = makeReminder({ skipIfCheckedIn: true });
    const checkIns = [makeCheckIn(ts(2026, 5, 17, 8, 0))];
    expect(shouldTriggerReminder(reminder, currentTime, checkIns)).toBe(false);
  });

  it('当天已打卡但skipIfCheckedIn=false仍触发', () => {
    const currentTime = ts(2026, 5, 17, 19, 0);
    const reminder = makeReminder({ skipIfCheckedIn: false });
    const checkIns = [makeCheckIn(ts(2026, 5, 17, 8, 0))];
    expect(shouldTriggerReminder(reminder, currentTime, checkIns)).toBe(true);
  });

  it('提醒disabled返回false', () => {
    const currentTime = ts(2026, 5, 17, 19, 0);
    const reminder = makeReminder({ enabled: false });
    expect(shouldTriggerReminder(reminder, currentTime, [])).toBe(false);
  });

  it('当天星期不在days中返回false', () => {
    const currentTime = ts(2026, 5, 18, 19, 0);
    const reminder = makeReminder();
    expect(shouldTriggerReminder(reminder, currentTime, [])).toBe(false);
  });

  it('其他日期的打卡记录不影响当天触发', () => {
    const currentTime = ts(2026, 5, 17, 19, 0);
    const reminder = makeReminder({ skipIfCheckedIn: true });
    const checkIns = [makeCheckIn(ts(2026, 5, 16, 8, 0))];
    expect(shouldTriggerReminder(reminder, currentTime, checkIns)).toBe(true);
  });

  it('todayCheckIns为空且skipIfCheckedIn=true可触发', () => {
    const currentTime = ts(2026, 5, 17, 19, 0);
    const reminder = makeReminder({ skipIfCheckedIn: true });
    expect(shouldTriggerReminder(reminder, currentTime, [])).toBe(true);
  });
});

describe('getRemindersForDay', () => {
  it('返回某天需要触发的提醒', () => {
    const reminders = [
      makeReminder({ id: 'r1', days: [1, 3, 5] }),
      makeReminder({ id: 'r2', days: [2, 4] }),
      makeReminder({ id: 'r3', days: [1, 3, 5, 6] }),
    ];
    const wednesday = 3;
    const result = getRemindersForDay(reminders, wednesday);
    expect(result.map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('过滤掉disabled的提醒', () => {
    const reminders = [
      makeReminder({ id: 'r1', days: [1, 3, 5], enabled: true }),
      makeReminder({ id: 'r2', days: [1, 3, 5], enabled: false }),
    ];
    const result = getRemindersForDay(reminders, 3);
    expect(result.map((r) => r.id)).toEqual(['r1']);
  });

  it('无匹配时返回空数组', () => {
    const reminders = [makeReminder({ id: 'r1', days: [1, 3, 5] })];
    expect(getRemindersForDay(reminders, 2)).toEqual([]);
  });

  it('空提醒列表返回空数组', () => {
    expect(getRemindersForDay([], 3)).toEqual([]);
  });
});

describe('getNextReminder', () => {
  it('返回今天之后即将触发的提醒', () => {
    const currentTime = ts(2026, 5, 17, 10, 0);
    const r1 = makeReminder({ id: 'r1', days: [1, 3, 5], hour: 19, minute: 0 });
    const r2 = makeReminder({ id: 'r2', days: [2, 4], hour: 9, minute: 0 });
    const result = getNextReminder([r1, r2], currentTime);
    expect(result?.id).toBe('r1');
  });

  it('今天时间已过则返回下一天的提醒', () => {
    const currentTime = ts(2026, 5, 17, 20, 0);
    const r1 = makeReminder({ id: 'r1', days: [1, 3, 5], hour: 19, minute: 0 });
    const result = getNextReminder([r1], currentTime);
    expect(result?.id).toBe('r1');
  });

  it('选择更近的提醒', () => {
    const currentTime = ts(2026, 5, 17, 10, 0);
    const r1 = makeReminder({ id: 'r1', days: [1, 3, 5], hour: 19, minute: 0 });
    const r2 = makeReminder({ id: 'r2', days: [1, 3, 5], hour: 20, minute: 0 });
    const result = getNextReminder([r1, r2], currentTime);
    expect(result?.id).toBe('r1');
  });

  it('无可用提醒时返回null', () => {
    const currentTime = ts(2026, 5, 17, 10, 0);
    const r1 = makeReminder({ id: 'r1', enabled: false });
    expect(getNextReminder([r1], currentTime)).toBeNull();
  });

  it('忽略disabled的提醒', () => {
    const currentTime = ts(2026, 5, 17, 10, 0);
    const r1 = makeReminder({
      id: 'r1', days: [1, 3, 5], hour: 19, minute: 0, enabled: false,
    });
    const r2 = makeReminder({
      id: 'r2', days: [1, 3, 5], hour: 20, minute: 0, enabled: true,
    });
    const result = getNextReminder([r1, r2], currentTime);
    expect(result?.id).toBe('r2');
  });

  it('空列表返回null', () => {
    const currentTime = ts(2026, 5, 17, 10, 0);
    expect(getNextReminder([], currentTime)).toBeNull();
  });

  it('跨周寻找下一个提醒', () => {
    const currentTime = ts(2026, 5, 19, 20, 0);
    const r1 = makeReminder({ id: 'r1', days: [1, 3, 5], hour: 19, minute: 0 });
    const result = getNextReminder([r1], currentTime);
    expect(result?.id).toBe('r1');
  });
});
