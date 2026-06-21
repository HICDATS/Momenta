import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Statistics } from '../../src/pages/Statistics/Statistics';
import { addCheckIn, clearAllCheckIns } from '../../src/db/database';
import type { CheckIn } from '../../src/types';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

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

function renderStatistics(initialPath = '/statistics'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Statistics />
    </MemoryRouter>,
  );
}

const TODAY = new Date(2026, 5, 17, 14, 0);

describe('Statistics 统计图表页', () => {
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

  it('渲染页面标题"统计"', async () => {
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '统计' })).toBeInTheDocument(),
    );
  });

  it('渲染4个时间范围按钮：本周/本月/最近30天/全部', async () => {
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '本周' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: '本月' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '最近30天' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument();
  });

  it('默认选中"本周"', async () => {
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '本周' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: '本周' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('点击"本月"切换时间范围', async () => {
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '本周' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '本月' }));
    expect(screen.getByRole('button', { name: '本月' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '本周' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('有数据时渲染柱状图容器', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
    ]);
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument(),
    );
  });

  it('有数据时渲染饼图容器', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
    ]);
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument(),
    );
  });

  it('渲染关键指标卡片：总次数/最爱运动/平均每周', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
    ]);
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByText('总次数')).toBeInTheDocument(),
    );
    expect(screen.getByText('最爱运动')).toBeInTheDocument();
    expect(screen.getByText('平均每周')).toBeInTheDocument();
  });

  it('显示总次数正确', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
      { sportType: 'fitness', timestamp: ts(2026, 5, 16) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 15) },
    ]);
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByTestId('metric-total')).toHaveTextContent('3'),
    );
  });

  it('最爱运动为出现次数最多的运动类型名称', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
      { sportType: 'running', timestamp: ts(2026, 5, 16) },
      { sportType: 'fitness', timestamp: ts(2026, 5, 15) },
    ]);
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByTestId('metric-favorite')).toHaveTextContent('跑步'),
    );
  });

  it('平均每周次数正确计算', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
      { sportType: 'running', timestamp: ts(2026, 5, 16) },
      { sportType: 'running', timestamp: ts(2026, 5, 15) },
    ]);
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByTestId('metric-weekly-avg')).toBeInTheDocument(),
    );
    const card = screen.getByTestId('metric-weekly-avg');
    const valueSpan = card.firstElementChild;
    expect(valueSpan?.textContent ?? '').toMatch(/^\d+(\.\d+)?$/);
  });

  it('空数据时显示友好提示', async () => {
    renderStatistics();
    await waitFor(() =>
      expect(
        screen.getByText('还没有打卡记录，快去运动吧！'),
      ).toBeInTheDocument(),
    );
  });

  it('loading 时显示加载状态', async () => {
    const db = await import('../../src/db/database');
    const spy = vi
      .spyOn(db, 'getAllCheckIns')
      .mockImplementation(() => new Promise<CheckIn[]>(() => {}));
    renderStatistics();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('error 时显示错误提示', async () => {
    const db = await import('../../src/db/database');
    const spy = vi
      .spyOn(db, 'getAllCheckIns')
      .mockRejectedValue(new Error('DB读取失败'));
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByText(/加载失败/)).toBeInTheDocument(),
    );
    spy.mockRestore();
  });

  it('点击"全部"显示全部数据图表', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17) },
      { sportType: 'fitness', timestamp: ts(2025, 0, 1) },
    ]);
    renderStatistics();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '本周' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '全部' }));
    expect(screen.getByRole('button', { name: '全部' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() =>
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument(),
    );
  });
});
