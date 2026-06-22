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
import { DEFAULT_SPORT_TYPES } from '../../src/constants/sports';

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

function assertStat(label: string, expectedValue: string): void {
  const card = screen.getByText(label).closest('div') as HTMLElement;
  expect(within(card).getByText(expectedValue)).toBeInTheDocument();
}

describe('完整打卡流程集成测试', () => {
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

  it('选择运动→确认→Toast→Streak+统计更新→历史出现记录→首次成就解锁', async () => {
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByText('开始你的第一次打卡吧')).toBeInTheDocument(),
    );
    const sport = DEFAULT_SPORT_TYPES[0];
    fireEvent.click(screen.getByRole('button', { name: sport.name }));
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    await waitFor(() =>
      expect(screen.getByText('打卡成功！')).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText('连续')).toBeInTheDocument());
    const streakContainer = screen.getByText('连续').parentElement as HTMLElement;
    expect(within(streakContainer).getByText('1')).toBeInTheDocument();
    assertStat('累计', '1');
    fireEvent.click(screen.getByRole('link', { name: '历史' }));
    await waitFor(() =>
      expect(screen.getByTestId('page-history')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId('group-今天')).getByText(sport.name),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '成就' }));
    await waitFor(() =>
      expect(screen.getByText('初次启航')).toBeInTheDocument(),
    );
    expect(screen.getByText('已解锁 1/7')).toBeInTheDocument();
  });

  it('删除打卡记录→Streak重新计算→统计更新', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 16) },
    ]);
    renderApp('/');
    await waitFor(() => expect(screen.getByText('连续')).toBeInTheDocument());
    const streakContainer = screen.getByText('连续').parentElement as HTMLElement;
    expect(within(streakContainer).getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '历史' }));
    await waitFor(() =>
      expect(screen.getByTestId('page-history')).toBeInTheDocument(),
    );
    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    fireEvent.click(deleteButtons[0]);
    await waitFor(() =>
      expect(screen.getByTestId('confirm-dialog-backdrop')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    await waitFor(() =>
      expect(screen.getByTestId('records-count')).toHaveTextContent(/1/),
    );
    fireEvent.click(screen.getByRole('link', { name: '首页' }));
    await waitFor(() => expect(screen.getByText('连续')).toBeInTheDocument());
    const updatedContainer = screen.getByText('连续').parentElement as HTMLElement;
    expect(within(updatedContainer).getByText('1')).toBeInTheDocument();
    assertStat('累计', '1');
  });

  it('连续3天打卡→Streak=3→三日燃成就解锁', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
      { sportType: 'running', timestamp: ts(2026, 5, 16) },
      { sportType: 'running', timestamp: ts(2026, 5, 15) },
    ]);
    renderApp('/');
    await waitFor(() => expect(screen.getByText('连续')).toBeInTheDocument());
    const streakContainer = screen.getByText('连续').parentElement as HTMLElement;
    expect(within(streakContainer).getByText('3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '成就' }));
    await waitFor(() =>
      expect(screen.getByText('三日燃')).toBeInTheDocument(),
    );
    expect(screen.getByText('已解锁 2/7')).toBeInTheDocument();
  });

  it('同一天多次打卡→Streak只算1天→三日燃未解锁', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 8) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 17, 12) },
      { sportType: 'fitness', timestamp: ts(2026, 5, 17, 18) },
    ]);
    renderApp('/');
    await waitFor(() => expect(screen.getByText('连续')).toBeInTheDocument());
    const streakContainer = screen.getByText('连续').parentElement as HTMLElement;
    expect(within(streakContainer).getByText('1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '成就' }));
    await waitFor(() =>
      expect(screen.getByText('已解锁 1/7')).toBeInTheDocument(),
    );
  });

  it('打卡后首页数据即时更新（Streak+统计+最近记录同步刷新）', async () => {
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByText('开始你的第一次打卡吧')).toBeInTheDocument(),
    );
    const sport = DEFAULT_SPORT_TYPES[0];
    fireEvent.click(screen.getByRole('button', { name: sport.name }));
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    await waitFor(() =>
      expect(screen.getByText('打卡成功！')).toBeInTheDocument(),
    );
    await waitFor(() => {
      expect(screen.getByText('连续')).toBeInTheDocument();
      const c = screen.getByText('连续').parentElement as HTMLElement;
      expect(within(c).getByText('1')).toBeInTheDocument();
      assertStat('累计', '1');
      const list = screen.getByTestId('recent-list');
      expect(within(list).getByText(sport.name)).toBeInTheDocument();
    });
  });
});
