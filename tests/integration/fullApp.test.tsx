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
import { AppProvider } from '../../src/context/AppContext';
import { Layout } from '../../src/components/Layout/Layout';
import { Home } from '../../src/pages/Home/Home';
import { History } from '../../src/pages/History/History';
import { Achievements } from '../../src/pages/Achievements/Achievements';
import { Statistics } from '../../src/pages/Statistics/Statistics';
import { Settings } from '../../src/pages/Settings/Settings';
import { addCheckIn, clearAllCheckIns } from '../../src/db/database';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

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

function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month, day, hour, 0).getTime();
}

function renderApp(initialPath = '/'): ReturnType<typeof render> {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

const TODAY = new Date(2026, 5, 17, 14, 0);

describe('全应用页面切换集成测试', () => {
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

  it('首页渲染正常（StreakDisplay+StatsCard+QuickCheckIn+最近记录区域）', async () => {
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByRole('grid')).toBeInTheDocument(),
    );
    expect(screen.getByText('本周')).toBeInTheDocument();
    expect(screen.getByText('本月')).toBeInTheDocument();
    expect(screen.getByText('累计')).toBeInTheDocument();
    expect(
      screen.getByText('还没有打卡记录，快去运动吧！'),
    ).toBeInTheDocument();
  });

  it('导航到历史页→显示打卡记录', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
    ]);
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByText('连续打卡 1 天')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('link', { name: '历史' }));
    await waitFor(() =>
      expect(screen.getByTestId('page-history')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId('group-今天')).getByText('跑步'),
    ).toBeInTheDocument();
  });

  it('导航到成就页→显示7个成就', async () => {
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByTestId('page-home')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('link', { name: '成就' }));
    await waitFor(() =>
      expect(screen.getByTestId('page-achievements')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('achievements-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('achievement-badge')).toHaveLength(7);
    expect(screen.getByText('已解锁 0/7')).toBeInTheDocument();
  });

  it('导航到统计页→显示图表', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
    ]);
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByText('连续打卡 1 天')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('link', { name: '统计' }));
    await waitFor(() =>
      expect(screen.getByTestId('page-statistics')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('导航到设置页→显示设置内容', async () => {
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByTestId('page-home')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('link', { name: '设置' }));
    await waitFor(() =>
      expect(screen.getByTestId('page-settings')).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: '设置' })).toBeInTheDocument();
  });

  it('页面间切换不丢失数据（记录在多次切换后仍然存在）', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
    ]);
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByText('连续打卡 1 天')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('link', { name: '历史' }));
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId('group-今天')).getByText('跑步'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '成就' }));
    await waitFor(() =>
      expect(screen.getByText('已解锁 1/7')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('link', { name: '历史' }));
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId('group-今天')).getByText('跑步'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '首页' }));
    await waitFor(() =>
      expect(screen.getByText('连续打卡 1 天')).toBeInTheDocument(),
    );
  });
});
