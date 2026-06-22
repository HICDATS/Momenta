import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  db,
  MomentaDB,
  addCheckIn,
  getAllCheckIns,
  deleteCheckIn,
  getCheckInsByDateRange,
  getCheckInsBySportType,
  clearAllCheckIns,
} from '../../src/db/database';
import type { CheckIn } from '../../src/types';

function makeInput(
  sportType: string,
  timestamp: number,
  note?: string,
): Omit<CheckIn, 'id' | 'createdAt'> {
  return { sportType, timestamp, note };
}

describe('MomentaDB 数据库定义', () => {
  it('表名包含 checkIns', () => {
    expect(db.checkIns).toBeDefined();
  });

  it('MomentaDB 是 Dexie 子类实例', () => {
    expect(db).toBeInstanceOf(MomentaDB);
  });

  it('schema 中主键为 id（非自增）并包含所需索引', () => {
    const schema = db.checkIns.schema;
    expect(schema.primKey.name).toBe('id');
    expect(schema.primKey.auto).toBe(false);
    expect(schema.primKey.keyPath).toBe('id');

    const indexNames = schema.indexes.map((i) => i.name);
    expect(indexNames).toContain('sportType');
    expect(indexNames).toContain('timestamp');
    expect(indexNames).toContain('[sportType+timestamp]');

    const compound = schema.indexes.find((i) => i.name === '[sportType+timestamp]');
    expect(compound?.compound).toBe(true);
  });
});

describe('addCheckIn', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('写入记录成功并返回完整 CheckIn', async () => {
    const input = makeInput('running', Date.now() - 1000);
    const result = await addCheckIn(input);

    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe('string');
    expect(result.sportType).toBe('running');
    expect(result.timestamp).toBe(input.timestamp);
    expect(typeof result.createdAt).toBe('number');
    expect(result.createdAt).toBeGreaterThan(0);

    const stored = await db.checkIns.get(result.id);
    expect(stored).toBeDefined();
    expect(stored?.id).toBe(result.id);
  });

  it('生成的 id 符合 UUID 格式', async () => {
    const result = await addCheckIn(makeInput('yoga', Date.now()));
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('保留可选 note 字段', async () => {
    const result = await addCheckIn(makeInput('running', Date.now(), '晨跑5km'));
    expect(result.note).toBe('晨跑5km');
  });

  it('未提供 note 时不写入 note 字段', async () => {
    const result = await addCheckIn(makeInput('running', Date.now()));
    expect(result.note).toBeUndefined();
  });
});

describe('getAllCheckIns', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('无记录时返回空数组', async () => {
    const result = await getAllCheckIns();
    expect(result).toEqual([]);
  });

  it('按 timestamp 倒序返回（newest first）', async () => {
    const t1 = new Date(2026, 5, 1, 10).getTime();
    const t2 = new Date(2026, 5, 2, 10).getTime();
    const t3 = new Date(2026, 5, 3, 10).getTime();

    await addCheckIn(makeInput('running', t2));
    await addCheckIn(makeInput('running', t1));
    await addCheckIn(makeInput('running', t3));

    const result = await getAllCheckIns();
    expect(result.length).toBe(3);
    expect(result[0].timestamp).toBe(t3);
    expect(result[1].timestamp).toBe(t2);
    expect(result[2].timestamp).toBe(t1);
  });

  it('同时间戳时按返回顺序稳定', async () => {
    const ts = new Date(2026, 5, 1, 10).getTime();
    await addCheckIn(makeInput('running', ts));
    await addCheckIn(makeInput('yoga', ts));

    const result = await getAllCheckIns();
    expect(result.length).toBe(2);
    expect(result[0].timestamp).toBe(ts);
    expect(result[1].timestamp).toBe(ts);
  });
});

describe('deleteCheckIn', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('删除已有记录成功', async () => {
    const added = await addCheckIn(makeInput('running', Date.now()));
    await deleteCheckIn(added.id);

    const stored = await db.checkIns.get(added.id);
    expect(stored).toBeUndefined();
  });

  it('删除不存在的 id 不抛错', async () => {
    await expect(deleteCheckIn('non-existent-id')).resolves.not.toThrow();
  });
});

describe('getCheckInsByDateRange', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('按时间范围筛选（含两端）', async () => {
    const t1 = new Date(2026, 5, 1, 10).getTime();
    const t2 = new Date(2026, 5, 2, 10).getTime();
    const t3 = new Date(2026, 5, 3, 10).getTime();
    const t4 = new Date(2026, 5, 4, 10).getTime();

    await addCheckIn(makeInput('running', t1));
    await addCheckIn(makeInput('running', t2));
    await addCheckIn(makeInput('running', t3));
    await addCheckIn(makeInput('running', t4));

    const result = await getCheckInsByDateRange(t2, t3);
    expect(result.length).toBe(2);
    const timestamps = result.map((c) => c.timestamp);
    expect(timestamps).toContain(t2);
    expect(timestamps).toContain(t3);
  });

  it('无符合记录返回空数组', async () => {
    await addCheckIn(makeInput('running', new Date(2026, 5, 1).getTime()));
    const result = await getCheckInsByDateRange(
      new Date(2026, 6, 1).getTime(),
      new Date(2026, 6, 10).getTime(),
    );
    expect(result).toEqual([]);
  });

  it('按时间倒序返回', async () => {
    const t1 = new Date(2026, 5, 1).getTime();
    const t2 = new Date(2026, 5, 2).getTime();
    const t3 = new Date(2026, 5, 3).getTime();

    await addCheckIn(makeInput('running', t1));
    await addCheckIn(makeInput('running', t2));
    await addCheckIn(makeInput('running', t3));

    const result = await getCheckInsByDateRange(t1, t3);
    expect(result[0].timestamp).toBe(t3);
    expect(result[2].timestamp).toBe(t1);
  });
});

describe('getCheckInsBySportType', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('按运动类型筛选', async () => {
    await addCheckIn(makeInput('running', Date.now()));
    await addCheckIn(makeInput('yoga', Date.now()));
    await addCheckIn(makeInput('running', Date.now() - 1000));

    const result = await getCheckInsBySportType('running');
    expect(result.length).toBe(2);
    for (const c of result) {
      expect(c.sportType).toBe('running');
    }
  });

  it('无符合类型返回空数组', async () => {
    await addCheckIn(makeInput('running', Date.now()));
    const result = await getCheckInsBySportType('swimming');
    expect(result).toEqual([]);
  });

  it('按时间倒序返回', async () => {
    const t1 = new Date(2026, 5, 1).getTime();
    const t2 = new Date(2026, 5, 2).getTime();

    await addCheckIn(makeInput('running', t1));
    await addCheckIn(makeInput('running', t2));

    const result = await getCheckInsBySportType('running');
    expect(result[0].timestamp).toBe(t2);
    expect(result[1].timestamp).toBe(t1);
  });
});

describe('clearAllCheckIns', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('清空所有记录', async () => {
    await addCheckIn(makeInput('running', Date.now()));
    await addCheckIn(makeInput('yoga', Date.now() - 1000));

    await clearAllCheckIns();
    const all = await getAllCheckIns();
    expect(all).toEqual([]);
  });

  it('空数据库时清空不抛错', async () => {
    await clearAllCheckIns();
    await expect(clearAllCheckIns()).resolves.not.toThrow();
  });
});

describe('错误处理', () => {
  beforeEach(async () => {
    await clearAllCheckIns();
  });

  it('addCheckIn 失败时抛出 Error', async () => {
    const original = db.checkIns.add.bind(db.checkIns);
    const failing = (() => Promise.reject(new Error('IndexedDB write failed'))) as typeof original;
    db.checkIns.add = failing;
    try {
      await expect(addCheckIn(makeInput('running', Date.now()))).rejects.toThrow();
    } finally {
      db.checkIns.add = original;
    }
  });

  it('getAllCheckIns 失败时抛出 Error', async () => {
    const original = db.checkIns.orderBy.bind(db.checkIns);
    db.checkIns.orderBy = (() => {
      throw new Error('IndexedDB read failed');
    }) as typeof original;
    try {
      await expect(getAllCheckIns()).rejects.toThrow();
    } finally {
      db.checkIns.orderBy = original;
    }
  });
});
