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
import { Button } from '../../src/components/common/Button/Button';
import { Settings } from '../../src/pages/Settings/Settings';
import { addCheckIn, clearAllCheckIns, getAllCheckIns } from '../../src/db/database';
import type { Reminder, Goal, SportType } from '../../src/types';

const REMINDERS_KEY = 'momenta-reminders';
const GOALS_KEY = 'momenta-goals';
const CUSTOM_SPORTS_KEY = 'momenta-custom-sports';
const SMART_ENABLED_KEY = 'momenta-smart-reminder-enabled';
const SMART_THRESHOLD_KEY = 'momenta-smart-reminder-threshold';

const TODAY = new Date(2026, 5, 17, 14, 0);

function seedReminders(reminders: Reminder[]): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

function seedGoals(goals: Goal[]): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function seedCustomSports(sports: SportType[]): void {
  localStorage.setItem(CUSTOM_SPORTS_KEY, JSON.stringify(sports));
}

function seedSmartReminder(enabled: boolean, threshold: number): void {
  localStorage.setItem(SMART_ENABLED_KEY, JSON.stringify(enabled));
  localStorage.setItem(SMART_THRESHOLD_KEY, JSON.stringify(threshold));
}

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'reminder-1',
    sportType: undefined,
    days: [1, 3, 5],
    hour: 19,
    minute: 0,
    message: '该去运动啦！加油！',
    enabled: true,
    skipIfCheckedIn: true,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    sportType: undefined,
    period: 'weekly',
    targetCount: 3,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeCustomSport(overrides: Partial<SportType> = {}): SportType {
  return {
    id: 'custom-test-1',
    name: '攀岩',
    icon: 'Sparkles',
    color: '#FF6B6B',
    isDefault: false,
    order: 100,
    ...overrides,
  };
}

function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month, day, hour, 0).getTime();
}

async function seedCheckIns(
  records: { sportType: string; timestamp: number }[],
): Promise<void> {
  for (const r of records) {
    await addCheckIn(r);
  }
}

function getSection(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name });
  return heading.closest('section') as HTMLElement;
}

describe('Button 通用按钮组件', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('渲染 children 文本', () => {
    render(<Button onClick={vi.fn()}>确定</Button>);
    expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
  });

  it('点击触发 onClick 回调', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>确定</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('默认 variant=primary size=md', () => {
    render(<Button onClick={vi.fn()}>确定</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('primary');
    expect(button).toHaveClass('md');
  });

  it('variant=secondary 时有 secondary 样式类', () => {
    render(
      <Button onClick={vi.fn()} variant="secondary">
        取消
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('secondary');
  });

  it('variant=danger 时有 danger 样式类', () => {
    render(
      <Button onClick={vi.fn()} variant="danger">
        删除
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('danger');
  });

  it('size=sm 时有 sm 样式类', () => {
    render(
      <Button onClick={vi.fn()} size="sm">
        小
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('sm');
  });

  it('size=lg 时有 lg 样式类', () => {
    render(
      <Button onClick={vi.fn()} size="lg">
        大
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('lg');
  });

  it('disabled=true 时按钮禁用且不触发 onClick', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        禁用
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fullWidth=true 时有 fullWidth 样式类', () => {
    render(
      <Button onClick={vi.fn()} fullWidth>
        全宽
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('fullWidth');
  });
});

describe('Settings 设置页', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
    localStorage.clear();
    await clearAllCheckIns();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    cleanup();
    vi.restoreAllMocks();
  });

  it('渲染页面标题"设置"', () => {
    render(<Settings />);
    expect(
      screen.getByRole('heading', { name: '设置', level: 1 }),
    ).toBeInTheDocument();
  });

  it('渲染6个分区标题', () => {
    render(<Settings />);
    expect(screen.getByRole('heading', { name: '提醒设置' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '智能提醒' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '目标设置' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '自定义运动类型' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '数据管理' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '关于' })).toBeInTheDocument();
  });

  it('提醒设置区：显示现有提醒列表', () => {
    seedReminders([
      makeReminder({ id: 'r1', message: '晨跑时间到啦' }),
      makeReminder({ id: 'r2', message: '晚间瑜伽', hour: 20, minute: 30 }),
    ]);
    render(<Settings />);
    expect(screen.getByText('晨跑时间到啦')).toBeInTheDocument();
    expect(screen.getByText('晚间瑜伽')).toBeInTheDocument();
  });

  it('提醒设置区：点击开关切换提醒启用状态', () => {
    seedReminders([makeReminder({ id: 'r1', enabled: false, message: '去跑步' })]);
    render(<Settings />);
    const toggle = screen.getByRole('switch', { name: /去跑步/ });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('提醒设置区：点击删除按钮删除提醒', () => {
    seedReminders([
      makeReminder({ id: 'r1', message: '提醒一' }),
      makeReminder({ id: 'r2', message: '提醒二' }),
    ]);
    render(<Settings />);
    const section = getSection('提醒设置');
    const deleteButtons = within(section).getAllByRole('button', { name: '删除' });
    fireEvent.click(deleteButtons[0]);
    expect(screen.queryByText('提醒一')).not.toBeInTheDocument();
    expect(screen.getByText('提醒二')).toBeInTheDocument();
  });

  it('提醒设置区：点击添加按钮新增提醒', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '添加提醒' }));
    expect(screen.getByText('新提醒')).toBeInTheDocument();
  });

  it('提醒设置区：编辑提醒可修改时间（小时）', () => {
    seedReminders([
      makeReminder({ id: 'r1', message: '去跑步', hour: 19, minute: 0 }),
    ]);
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    const hourInput = screen.getByLabelText('小时') as HTMLInputElement;
    fireEvent.change(hourInput, { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    const stored = JSON.parse(localStorage.getItem(REMINDERS_KEY) as string);
    expect(stored[0].hour).toBe(8);
  });

  it('提醒设置区：编辑提醒可修改时间（分钟）', () => {
    seedReminders([
      makeReminder({ id: 'r1', message: '去跑步', hour: 19, minute: 0 }),
    ]);
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    const minuteInput = screen.getByLabelText('分钟') as HTMLInputElement;
    fireEvent.change(minuteInput, { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    const stored = JSON.parse(localStorage.getItem(REMINDERS_KEY) as string);
    expect(stored[0].minute).toBe(45);
  });

  it('提醒设置区：编辑提醒可修改重复日', () => {
    seedReminders([
      makeReminder({ id: 'r1', message: '去跑步', days: [1, 3, 5] }),
    ]);
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    const monday = screen.getByLabelText('周一') as HTMLInputElement;
    expect(monday.checked).toBe(true);
    fireEvent.click(monday);
    expect(monday.checked).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    const stored = JSON.parse(localStorage.getItem(REMINDERS_KEY) as string);
    expect(stored[0].days).toEqual([3, 5]);
  });

  it('提醒设置区：编辑提醒可修改 skipIfCheckedIn 开关', () => {
    seedReminders([
      makeReminder({ id: 'r1', message: '去跑步', skipIfCheckedIn: true }),
    ]);
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    const skip = screen.getByLabelText('已打卡则跳过') as HTMLInputElement;
    expect(skip.checked).toBe(true);
    fireEvent.click(skip);
    expect(skip.checked).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    const stored = JSON.parse(localStorage.getItem(REMINDERS_KEY) as string);
    expect(stored[0].skipIfCheckedIn).toBe(false);
  });

  it('提醒设置区：编辑保存后多个字段同时生效', () => {
    seedReminders([
      makeReminder({
        id: 'r1',
        message: '去跑步',
        days: [1, 3, 5],
        hour: 19,
        minute: 0,
        skipIfCheckedIn: true,
      }),
    ]);
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    const hourInput = screen.getByLabelText('小时') as HTMLInputElement;
    fireEvent.change(hourInput, { target: { value: '7' } });
    const minuteInput = screen.getByLabelText('分钟') as HTMLInputElement;
    fireEvent.change(minuteInput, { target: { value: '30' } });
    const messageInput = screen.getByLabelText('编辑提醒文案') as HTMLInputElement;
    fireEvent.change(messageInput, { target: { value: '晨练' } });
    const sunday = screen.getByLabelText('周日') as HTMLInputElement;
    fireEvent.click(sunday);
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    const stored = JSON.parse(localStorage.getItem(REMINDERS_KEY) as string);
    expect(stored[0]).toMatchObject({
      hour: 7,
      minute: 30,
      message: '晨练',
      skipIfCheckedIn: true,
    });
    expect(stored[0].days).toEqual([0, 1, 3, 5]);
  });

  it('智能提醒区：点击开关切换启用状态', () => {
    seedSmartReminder(false, 2);
    render(<Settings />);
    const toggle = screen.getByRole('switch', { name: '智能提醒开关' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('智能提醒区：修改阈值数字', () => {
    seedSmartReminder(true, 2);
    render(<Settings />);
    const input = screen.getByLabelText('超期阈值') as HTMLInputElement;
    expect(input.value).toBe('2');
    fireEvent.change(input, { target: { value: '5' } });
    expect(input.value).toBe('5');
  });

  it('目标设置区：显示目标列表', () => {
    seedGoals([
      makeGoal({ id: 'g1', targetCount: 5, period: 'weekly' }),
      makeGoal({ id: 'g2', targetCount: 10, period: 'monthly' }),
    ]);
    render(<Settings />);
    expect(screen.getAllByTestId('goal-progress')).toHaveLength(2);
  });

  it('目标设置区：点击删除按钮删除目标', () => {
    seedGoals([
      makeGoal({ id: 'g1', targetCount: 5 }),
      makeGoal({ id: 'g2', targetCount: 10 }),
    ]);
    render(<Settings />);
    expect(screen.getAllByTestId('goal-progress')).toHaveLength(2);
    const section = getSection('目标设置');
    const deleteButtons = within(section).getAllByRole('button', { name: '删除' });
    fireEvent.click(deleteButtons[0]);
    expect(screen.getAllByTestId('goal-progress')).toHaveLength(1);
  });

  it('目标设置区：点击添加按钮新增目标', () => {
    render(<Settings />);
    expect(screen.queryAllByTestId('goal-progress')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: '添加目标' }));
    expect(screen.getAllByTestId('goal-progress')).toHaveLength(1);
  });

  it('自定义运动类型区：显示自定义类型列表', () => {
    seedCustomSports([
      makeCustomSport({ id: 'c1', name: '攀岩' }),
      makeCustomSport({ id: 'c2', name: '滑板' }),
    ]);
    render(<Settings />);
    expect(screen.getByText('攀岩')).toBeInTheDocument();
    expect(screen.getByText('滑板')).toBeInTheDocument();
  });

  it('自定义运动类型区：点击添加按钮打开编辑器', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '添加运动类型' }));
    expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
    expect(screen.getByLabelText('运动名称')).toBeInTheDocument();
  });

  it('自定义运动类型区：点击删除按钮删除类型', () => {
    seedCustomSports([
      makeCustomSport({ id: 'c1', name: '攀岩' }),
      makeCustomSport({ id: 'c2', name: '滑板' }),
    ]);
    render(<Settings />);
    const section = getSection('自定义运动类型');
    const deleteButtons = within(section).getAllByRole('button', { name: '删除' });
    fireEvent.click(deleteButtons[0]);
    expect(screen.queryByText('攀岩')).not.toBeInTheDocument();
    expect(screen.getByText('滑板')).toBeInTheDocument();
  });

  it('数据管理区：点击导出按钮触发下载', async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '导出数据' }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('数据管理区：点击清除按钮弹出确认弹窗', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '清除所有数据' }));
    expect(screen.getByTestId('confirm-dialog-backdrop')).toBeInTheDocument();
  });

  it('数据管理区：确认清除后清空所有数据并显示成功提示', async () => {
    await seedCheckIns([{ sportType: 'running', timestamp: ts(2026, 5, 17) }]);
    seedReminders([makeReminder({ id: 'r1', message: '测试提醒' })]);
    seedGoals([makeGoal({ id: 'g1' })]);
    seedCustomSports([makeCustomSport({ id: 'c1' })]);
    render(<Settings />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '清除所有数据' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '清除所有数据' }));
    fireEvent.click(screen.getByRole('button', { name: '确认清除' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('数据已清除');
    const remaining = await getAllCheckIns();
    expect(remaining).toHaveLength(0);
    expect(localStorage.getItem(GOALS_KEY)).toBeNull();
    expect(localStorage.getItem(CUSTOM_SPORTS_KEY)).toBeNull();
    expect(localStorage.getItem(REMINDERS_KEY)).toBeNull();
  });

  it('数据管理区：取消清除后不删除数据', async () => {
    await seedCheckIns([{ sportType: 'running', timestamp: ts(2026, 5, 17) }]);
    seedGoals([makeGoal({ id: 'g1' })]);
    render(<Settings />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '清除所有数据' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: '清除所有数据' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    await waitFor(() =>
      expect(screen.queryByTestId('confirm-dialog-backdrop')).not.toBeInTheDocument(),
    );
    const remaining = await getAllCheckIns();
    expect(remaining).toHaveLength(1);
    expect(localStorage.getItem(GOALS_KEY)).not.toBeNull();
  });

  it('关于区：显示版本号', () => {
    render(<Settings />);
    expect(screen.getByText(/0\.1\.0/)).toBeInTheDocument();
  });

  it('关于区：显示隐私说明', () => {
    render(<Settings />);
    expect(screen.getByText(/数据完全本地存储/)).toBeInTheDocument();
    expect(screen.getByText(/不上传任何服务器/)).toBeInTheDocument();
  });
});
