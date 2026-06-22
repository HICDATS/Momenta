import { describe, expect, it } from 'vitest';
import { DEFAULT_APP_SETTINGS, DEFAULT_SPORT_TYPES } from '../../src/constants/sports';
import type { AppSettings, SportType } from '../../src/types';

describe('DEFAULT_SPORT_TYPES', () => {
  it('包含至少8种预设运动类型', () => {
    expect(DEFAULT_SPORT_TYPES.length).toBeGreaterThanOrEqual(8);
  });

  it('每个运动类型包含完整的必需字段(id/name/icon/color/isDefault/order)', () => {
    const requiredKeys: (keyof SportType)[] = [
      'id',
      'name',
      'icon',
      'color',
      'isDefault',
      'order',
    ];
    for (const sport of DEFAULT_SPORT_TYPES) {
      for (const key of requiredKeys) {
        expect(sport).toHaveProperty(key);
      }
    }
  });

  it('所有运动类型id唯一', () => {
    const ids = DEFAULT_SPORT_TYPES.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('所有预设运动类型isDefault为true', () => {
    for (const sport of DEFAULT_SPORT_TYPES) {
      expect(sport.isDefault).toBe(true);
    }
  });

  it('order字段均为正整数', () => {
    for (const sport of DEFAULT_SPORT_TYPES) {
      expect(Number.isInteger(sport.order)).toBe(true);
      expect(sport.order).toBeGreaterThan(0);
    }
  });

  it('包含PRD要求的8种运动类型', () => {
    const requiredIds = [
      'fitness',
      'basketball',
      'running',
      'swimming',
      'yoga',
      'cycling',
      'badminton',
      'table_tennis',
    ];
    const ids = DEFAULT_SPORT_TYPES.map((s) => s.id);
    for (const id of requiredIds) {
      expect(ids).toContain(id);
    }
  });

  it('每个运动类型字段类型与格式正确', () => {
    for (const sport of DEFAULT_SPORT_TYPES) {
      expect(typeof sport.id).toBe('string');
      expect(sport.id.length).toBeGreaterThan(0);
      expect(typeof sport.name).toBe('string');
      expect(sport.name.length).toBeGreaterThan(0);
      expect(typeof sport.icon).toBe('string');
      expect(sport.icon.length).toBeGreaterThan(0);
      expect(typeof sport.color).toBe('string');
      expect(sport.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(typeof sport.isDefault).toBe('boolean');
      expect(typeof sport.order).toBe('number');
    }
  });

  it('运动类型颜色互不相同', () => {
    const colors = DEFAULT_SPORT_TYPES.map((s) => s.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });
});

describe('DEFAULT_APP_SETTINGS', () => {
  it('包含完整的设置字段', () => {
    const requiredKeys: (keyof AppSettings)[] = [
      'restDays',
      'smartReminderEnabled',
      'smartReminderThreshold',
      'theme',
    ];
    for (const key of requiredKeys) {
      expect(DEFAULT_APP_SETTINGS).toHaveProperty(key);
    }
  });

  it('theme为light/dark/system之一', () => {
    expect(['light', 'dark', 'system']).toContain(DEFAULT_APP_SETTINGS.theme);
  });

  it('smartReminderThreshold为正整数', () => {
    expect(Number.isInteger(DEFAULT_APP_SETTINGS.smartReminderThreshold)).toBe(true);
    expect(DEFAULT_APP_SETTINGS.smartReminderThreshold).toBeGreaterThan(0);
  });

  it('restDays为数组且元素在0-6范围内', () => {
    expect(Array.isArray(DEFAULT_APP_SETTINGS.restDays)).toBe(true);
    for (const day of DEFAULT_APP_SETTINGS.restDays) {
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    }
  });

  it('smartReminderEnabled为布尔值', () => {
    expect(typeof DEFAULT_APP_SETTINGS.smartReminderEnabled).toBe('boolean');
  });
});
