import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Home } from '../../src/pages/Home/Home';
import { addCheckIn, clearAllCheckIns } from '../../src/db/database';
import { DEFAULT_SPORT_TYPES } from '../../src/constants/sports';
import type { CheckIn } from '../../src/types';

function ts(
  year: number,
  month: number,
  day: number,
  hour = 12,
): number {
  return new Date(year, month, day, hour, 0).getTime();
}

interface SeedInput {
  sportType: string;
  timestamp: number;
  note?: string;
}

async function seedCheckIns(records: SeedInput[]): Promise<void> {
  for (const r of records) {
    await addCheckIn(r);
  }
}

function renderHome(initialPath = '/'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<div data-testid="page-history" />} />
      </Routes>
    </MemoryRouter>,
  );
}

const TODAY = new Date(2026, 5, 17, 14, 0);

describe('Home 首页 Dashboard', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
    localStorage.clear();
    await clearAllCheckIns();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.restoreAllMocks();
  });

  it('渲染 StreakDisplay（显示当前 Streak 天数）', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
      { sportType: 'running', timestamp: ts(2026, 5, 16) },
    ]);
    renderHome();
    await waitFor(() =>
      expect(screen.getByText('连续打卡 2 天')).toBeInTheDocument(),
    );
  });

  it('渲染 StatsCard（显示本周/本月/累计统计标签）', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 16) },
    ]);
    renderHome();
    await waitFor(() => expect(screen.getByText('本周')).toBeInTheDocument());
    expect(screen.getByText('本月')).toBeInTheDocument();
    expect(screen.getByText('累计')).toBeInTheDocument();
  });

  it('渲染 QuickCheckIn（运动类型网格）', async () => {
    renderHome();
    await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument());
    for (const sport of DEFAULT_SPORT_TYPES) {
      expect(
        screen.getByRole('button', { name: sport.name }),
      ).toBeInTheDocument();
    }
  });

  it('渲染最近3条打卡记录预览（不多不少）', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 16, 9) },
      { sportType: 'fitness', timestamp: ts(2026, 5, 15, 9) },
      { sportType: 'swimming', timestamp: ts(2026, 5, 14, 9) },
    ]);
    renderHome();
    await waitFor(() =>
      expect(screen.getByTestId('recent-list')).toBeInTheDocument(),
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    const list = screen.getByTestId('recent-list');
    expect(within(list).getByText('跑步')).toBeInTheDocument();
    expect(within(list).getByText('瑜伽')).toBeInTheDocument();
    expect(within(list).getByText('健身')).toBeInTheDocument();
    expect(within(list).queryByText('游泳')).not.toBeInTheDocument();
  });

  it('打卡后数据即时更新（Streak+1，统计+1，预览新增记录）', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 16) },
    ]);
    renderHome();
    await waitFor(() =>
      expect(screen.getByText('连续打卡 1 天')).toBeInTheDocument(),
    );
    const firstSport = DEFAULT_SPORT_TYPES[0];
    fireEvent.click(screen.getByRole('button', { name: firstSport.name }));
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    await waitFor(() =>
      expect(screen.getByText('打卡成功！')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByText('连续打卡 2 天')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('recent-list')).toBeInTheDocument(),
    );
    const list = screen.getByTestId('recent-list');
    expect(within(list).getByText(firstSport.name)).toBeInTheDocument();
  });

  it('无记录时显示空状态鼓励文案', async () => {
    renderHome();
    await waitFor(() =>
      expect(
        screen.getByText('还没有打卡记录，快去运动吧！'),
      ).toBeInTheDocument(),
    );
  });

  it('最近记录显示运动类型名称+格式化时间', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
    ]);
    renderHome();
    await waitFor(() =>
      expect(screen.getByTestId('recent-list')).toBeInTheDocument(),
    );
    const list = screen.getByTestId('recent-list');
    expect(within(list).getByText('跑步')).toBeInTheDocument();
    expect(within(list).getByText(/今天 09:00/)).toBeInTheDocument();
  });

  it('点击"查看全部"导航到 /history', async () => {
    renderHome();
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: '查看全部' }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('link', { name: '查看全部' }));
    expect(screen.getByTestId('page-history')).toBeInTheDocument();
  });

  it('loading 时显示加载状态', async () => {
    const db = await import('../../src/db/database');
    const spy = vi
      .spyOn(db, 'getAllCheckIns')
      .mockImplementation(() => new Promise<CheckIn[]>(() => {}));
    renderHome();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('error 时显示错误提示', async () => {
    const db = await import('../../src/db/database');
    const spy = vi
      .spyOn(db, 'getAllCheckIns')
      .mockRejectedValue(new Error('DB读取失败'));
    renderHome();
    await waitFor(() =>
      expect(screen.getByText(/加载失败/)).toBeInTheDocument(),
    );
    spy.mockRestore();
  });
});
