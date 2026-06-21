import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  isFutureTime,
  validateNote,
  validateSportType,
  validateCheckInTime,
} from '../../src/utils/validators';

describe('isFutureTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('未来时间返回true', () => {
    const future = new Date(2026, 5, 17, 15, 0).getTime();
    expect(isFutureTime(future)).toBe(true);
  });

  it('过去时间返回false', () => {
    const past = new Date(2026, 5, 17, 13, 0).getTime();
    expect(isFutureTime(past)).toBe(false);
  });

  it('当前时间返回false', () => {
    const now = new Date(2026, 5, 17, 14, 0).getTime();
    expect(isFutureTime(now)).toBe(false);
  });

  it('0时间戳返回false（属于过去）', () => {
    expect(isFutureTime(0)).toBe(false);
  });
});

describe('validateNote', () => {
  it('空字符串通过（可选字段）', () => {
    const result = validateNote('');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('正好100字通过', () => {
    const note = 'a'.repeat(100);
    const result = validateNote(note);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('超过100字返回错误', () => {
    const note = 'a'.repeat(101);
    const result = validateNote(note);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('错误信息为非空中文', () => {
    const note = 'a'.repeat(101);
    const result = validateNote(note);
    expect(typeof result.error).toBe('string');
    expect(result.error!.length).toBeGreaterThan(0);
  });

  it('1字通过', () => {
    const result = validateNote('运动真开心');
    expect(result.valid).toBe(true);
  });
});

describe('validateSportType', () => {
  it('空字符串返回错误', () => {
    const result = validateSportType('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('有效ID返回通过', () => {
    const result = validateSportType('running');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('错误信息为非空中文', () => {
    const result = validateSportType('');
    expect(typeof result.error).toBe('string');
    expect(result.error!.length).toBeGreaterThan(0);
  });
});

describe('validateCheckInTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('未来时间返回错误', () => {
    const future = new Date(2026, 5, 17, 15, 0).getTime();
    const result = validateCheckInTime(future);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('过去24小时内通过', () => {
    const recent = new Date(2026, 5, 17, 13, 0).getTime();
    const result = validateCheckInTime(recent);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('正好24小时前通过（边界 inclusive）', () => {
    const now = new Date(2026, 5, 17, 14, 0).getTime();
    const exactly24hAgo = now - 24 * 60 * 60 * 1000;
    const result = validateCheckInTime(exactly24hAgo);
    expect(result.valid).toBe(true);
  });

  it('超过24小时返回错误', () => {
    const now = new Date(2026, 5, 17, 14, 0).getTime();
    const tooOld = now - 24 * 60 * 60 * 1000 - 1;
    const result = validateCheckInTime(tooOld);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('0时间戳返回错误（超过24小时）', () => {
    const result = validateCheckInTime(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('当前时间通过', () => {
    const now = new Date(2026, 5, 17, 14, 0).getTime();
    const result = validateCheckInTime(now);
    expect(result.valid).toBe(true);
  });

  it('错误信息为非空中文', () => {
    const future = new Date(2026, 5, 17, 15, 0).getTime();
    const result = validateCheckInTime(future);
    expect(typeof result.error).toBe('string');
    expect(result.error!.length).toBeGreaterThan(0);
  });
});
