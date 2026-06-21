import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react';
import 'fake-indexeddb/auto';
import { ConfirmDialog } from '../../src/components/common/ConfirmDialog/ConfirmDialog';
import { CheckInCard } from '../../src/components/CheckInCard/CheckInCard';
import { History } from '../../src/pages/History/History';
import { addCheckIn, clearAllCheckIns } from '../../src/db/database';
import { DEFAULT_SPORT_TYPES } from '../../src/constants/sports';
import type { CheckIn } from '../../src/types';

function ts(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): number {
  return new Date(year, month, day, hour, minute).getTime();
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

const TODAY = new Date(2026, 5, 17, 14, 0);

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: 'test-id-1',
    sportType: 'running',
    timestamp: ts(2026, 5, 17, 9, 30),
    note: undefined,
    createdAt: ts(2026, 5, 17, 9, 30),
    ...overrides,
  };
}

describe('ConfirmDialog 组件', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('open=false 时不渲染', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="确认删除"
        message="确定要删除吗？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('open=true 时渲染标题和消息', () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认删除"
        message="确定要删除这条记录吗？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('确认删除')).toBeInTheDocument();
    expect(screen.getByText('确定要删除这条记录吗？')).toBeInTheDocument();
  });

  it('默认按钮文案为 确认/取消', () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="消息"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('支持自定义按钮文案', () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="消息"
        confirmText="删除"
        cancelText="算了"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '算了' })).toBeInTheDocument();
  });

  it('点击确认按钮调用 onConfirm', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="消息"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('点击取消按钮调用 onCancel', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="消息"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ESC 键调用 onCancel', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="消息"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩调用 onCancel', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="消息"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByTestId('confirm-dialog-backdrop'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('danger=true 时确认按钮带 danger 样式类', () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="消息"
        danger={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '确认' })).toHaveClass('danger');
  });

  it('danger 默认 false 时确认按钮不带 danger 样式类', () => {
    render(
      <ConfirmDialog
        open={true}
        title="确认"
        message="消息"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '确认' })).not.toHaveClass(
      'danger',
    );
  });
});

describe('CheckInCard 组件', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('显示运动类型名称、格式化时间、备注', () => {
    const checkIn = makeCheckIn({
      sportType: 'running',
      timestamp: ts(2026, 5, 17, 9, 30),
      note: '晨跑5公里',
    });
    render(<CheckInCard checkIn={checkIn} onDelete={vi.fn()} />);
    expect(screen.getByText('跑步')).toBeInTheDocument();
    expect(screen.getByText(/今天 09:30/)).toBeInTheDocument();
    expect(screen.getByText('晨跑5公里')).toBeInTheDocument();
  });

  it('无备注时不渲染备注区域', () => {
    const checkIn = makeCheckIn({ note: undefined });
    render(<CheckInCard checkIn={checkIn} onDelete={vi.fn()} />);
    expect(screen.getByText('跑步')).toBeInTheDocument();
    expect(screen.queryByText('晨跑5公里')).not.toBeInTheDocument();
  });

  it('渲染删除按钮', () => {
    const checkIn = makeCheckIn();
    render(<CheckInCard checkIn={checkIn} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument();
  });

  it('点击删除按钮调用 onDelete 并传入 checkIn', () => {
    const checkIn = makeCheckIn({ id: 'card-1' });
    const onDelete = vi.fn();
    render(<CheckInCard checkIn={checkIn} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(checkIn);
  });

  it('显示运动类型图标', () => {
    const checkIn = makeCheckIn({ sportType: 'running' });
    const { container } = render(
      <CheckInCard checkIn={checkIn} onDelete={vi.fn()} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});

describe('History 历史记录页', () => {
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

  it('loading 时显示加载状态', async () => {
    const db = await import('../../src/db/database');
    const spy = vi
      .spyOn(db, 'getAllCheckIns')
      .mockImplementation(() => new Promise<CheckIn[]>(() => {}));
    render(<History />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('error 时显示错误提示', async () => {
    const db = await import('../../src/db/database');
    const spy = vi
      .spyOn(db, 'getAllCheckIns')
      .mockRejectedValue(new Error('DB读取失败'));
    render(<History />);
    await waitFor(() =>
      expect(screen.getByText(/加载失败/)).toBeInTheDocument(),
    );
    spy.mockRestore();
  });

  it('无记录时显示空状态鼓励文案', async () => {
    render(<History />);
    await waitFor(() =>
      expect(
        screen.getByText('还没有打卡记录，快去运动吧！'),
      ).toBeInTheDocument(),
    );
  });

  it('渲染筛选栏（包含"全部"和各运动类型）', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument(),
    );
    for (const sport of DEFAULT_SPORT_TYPES) {
      expect(
        screen.getByRole('button', { name: sport.name }),
      ).toBeInTheDocument();
    }
  });

  it('记录按时间倒序排列（最新在最上面）', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 8, 0) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 17, 18, 0) },
      { sportType: 'fitness', timestamp: ts(2026, 5, 17, 12, 0) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    const todayGroup = screen.getByTestId('group-今天');
    const names = within(todayGroup)
      .getAllByTestId('checkin-card')
      .map((card) => within(card).getByText(/跑步|瑜伽|健身/).textContent);
    expect(names).toEqual(['瑜伽', '健身', '跑步']);
  });

  it('按日期分组显示（今天/昨天/本周/更早）', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 16, 9) },
      { sportType: 'fitness', timestamp: ts(2026, 5, 15, 9) },
      { sportType: 'swimming', timestamp: ts(2026, 5, 10, 9) },
    ]);
    render(<History />);
    await waitFor(() => expect(screen.getByTestId('group-今天')).toBeInTheDocument());
    expect(screen.getByTestId('group-昨天')).toBeInTheDocument();
    expect(screen.getByTestId('group-本周')).toBeInTheDocument();
    expect(screen.getByTestId('group-更早')).toBeInTheDocument();
    expect(within(screen.getByTestId('group-今天')).getByText('跑步')).toBeInTheDocument();
    expect(within(screen.getByTestId('group-昨天')).getByText('瑜伽')).toBeInTheDocument();
    expect(within(screen.getByTestId('group-本周')).getByText('健身')).toBeInTheDocument();
    expect(within(screen.getByTestId('group-更早')).getByText('游泳')).toBeInTheDocument();
  });

  it('不显示没有记录的分组', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
    ]);
    render(<History />);
    await waitFor(() => expect(screen.getByTestId('group-今天')).toBeInTheDocument());
    expect(screen.queryByTestId('group-昨天')).not.toBeInTheDocument();
    expect(screen.queryByTestId('group-本周')).not.toBeInTheDocument();
    expect(screen.queryByTestId('group-更早')).not.toBeInTheDocument();
  });

  it('按运动类型筛选记录', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 17, 10) },
      { sportType: 'fitness', timestamp: ts(2026, 5, 17, 11) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '跑步' }));
    await waitFor(() =>
      expect(
        within(screen.getByTestId('group-今天')).getByText('跑步'),
      ).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId('group-今天')).queryByText('瑜伽'),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('group-今天')).queryByText('健身'),
    ).not.toBeInTheDocument();
  });

  it('点击"全部"恢复显示所有记录', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 17, 10) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '跑步' }));
    await waitFor(() =>
      expect(
        within(screen.getByTestId('group-今天')).queryByText('瑜伽'),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '全部' }));
    await waitFor(() =>
      expect(
        within(screen.getByTestId('group-今天')).getByText('瑜伽'),
      ).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId('group-今天')).getByText('跑步'),
    ).toBeInTheDocument();
  });

  it('筛选后无结果时显示"没有符合条件的记录"', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '瑜伽' }));
    await waitFor(() =>
      expect(screen.getByText('没有符合条件的记录')).toBeInTheDocument(),
    );
  });

  it('底部显示记录总数', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 16, 9) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByTestId('records-count')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('records-count')).toHaveTextContent(/2/);
  });

  it('点击删除按钮弹出确认弹窗', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    await waitFor(() =>
      expect(screen.getByTestId('confirm-dialog-backdrop')).toBeInTheDocument(),
    );
  });

  it('确认删除后记录从列表消失', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
      { sportType: 'yoga', timestamp: ts(2026, 5, 17, 10) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
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
  });

  it('取消删除后记录保留', async () => {
    await seedCheckIns([
      { sportType: 'running', timestamp: ts(2026, 5, 17, 9) },
    ]);
    render(<History />);
    await waitFor(() =>
      expect(screen.getByTestId('group-今天')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    await waitFor(() =>
      expect(screen.getByTestId('confirm-dialog-backdrop')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    await waitFor(() =>
      expect(
        screen.queryByTestId('confirm-dialog-backdrop'),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId('group-今天')).getByText('跑步'),
    ).toBeInTheDocument();
  });
});
