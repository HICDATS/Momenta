import { describe, expect, it, vi } from 'vitest';
import {
  getDailyQuote,
  getRandomEncouragement,
} from '../../src/utils/quoteSelector';
import { DAILY_QUOTES, ENCOURAGEMENTS } from '../../src/constants/quotes';

describe('getDailyQuote', () => {
  it('同一天多次调用结果相同', () => {
    const a = getDailyQuote('2026-06-23');
    const b = getDailyQuote('2026-06-23');
    expect(a).toBe(b);
  });

  it('不同日期可能得到不同结果（100 天至少 2 种）', () => {
    const results = new Set<string>();
    for (let i = 1; i <= 100; i++) {
      const day = String(i).padStart(2, '0');
      results.add(getDailyQuote(`2026-03-${day}`));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('不传参数时使用本地日期', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 23, 10, 0, 0));
    const a = getDailyQuote();
    const b = getDailyQuote('2026-06-23');
    expect(a).toBe(b);
    vi.useRealTimers();
  });

  it('索引范围在 [0, DAILY_QUOTES.length)', () => {
    for (let i = 0; i < 1000; i++) {
      const month = String((i % 12) + 1).padStart(2, '0');
      const day = String((i % 28) + 1).padStart(2, '0');
      const result = getDailyQuote(`2026-${month}-${day}`);
      expect(DAILY_QUOTES).toContain(result);
    }
  });
});

describe('getRandomEncouragement', () => {
  it('返回值属于 ENCOURAGEMENTS 池', () => {
    const result = getRandomEncouragement();
    expect(ENCOURAGEMENTS).toContain(result);
  });

  it('10000 次调用覆盖到池中多条', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10000; i++) {
      seen.add(getRandomEncouragement());
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('crypto.getRandomValues 不可用时降级到 Math.random', () => {
    const originalCrypto = (globalThis as { crypto?: Crypto }).crypto;
    delete (globalThis as { crypto?: Crypto }).crypto;
    try {
      const result = getRandomEncouragement();
      expect(ENCOURAGEMENTS).toContain(result);
    } finally {
      (globalThis as { crypto?: Crypto }).crypto = originalCrypto;
    }
  });
});

describe('边界：空池', () => {
  it('getDailyQuote 在 DAILY_QUOTES 为空时抛错', async () => {
    vi.resetModules();
    vi.doMock('../../src/constants/quotes', () => ({
      DAILY_QUOTES: [],
      ENCOURAGEMENTS: ['x'],
    }));
    const { getDailyQuote: getDailyQuoteEmpty } = await import(
      '../../src/utils/quoteSelector'
    );
    expect(() => getDailyQuoteEmpty('2026-06-23')).toThrow('DAILY_QUOTES is empty');
    vi.doUnmock('../../src/constants/quotes');
    vi.resetModules();
  });

  it('getRandomEncouragement 在 ENCOURAGEMENTS 为空时抛错', async () => {
    vi.resetModules();
    vi.doMock('../../src/constants/quotes', () => ({
      DAILY_QUOTES: ['x'],
      ENCOURAGEMENTS: [],
    }));
    const { getRandomEncouragement: getRandomEncouragementEmpty } = await import(
      '../../src/utils/quoteSelector'
    );
    expect(() => getRandomEncouragementEmpty()).toThrow('ENCOURAGEMENTS is empty');
    vi.doUnmock('../../src/constants/quotes');
    vi.resetModules();
  });
});
