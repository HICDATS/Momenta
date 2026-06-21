import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { StreakDisplay } from '../../src/components/StreakDisplay/StreakDisplay';
import { StatsCard } from '../../src/components/StatsCard/StatsCard';
import type { CheckIn } from '../../src/types';

function ts(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month, day, hour, 0).getTime();
}

function makeCheckIn(timestamp: number, sportType = 'running'): CheckIn {
  return {
    id: `checkin-${timestamp}`,
    sportType,
    timestamp,
    createdAt: timestamp,
  };
}

describe('StreakDisplay 组件', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('显示当前 Streak 天数（大字号）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    render(<StreakDisplay checkIns={checkIns} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('Streak > 0 且进行中时火焰图标燃烧（active 类）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
    ];
    const { container } = render(<StreakDisplay checkIns={checkIns} />);
    expect(container.querySelector('svg.flameActive')).toBeInTheDocument();
    expect(container.querySelector('svg.flameInactive')).not.toBeInTheDocument();
  });

  it('Streak = 0 时火焰图标熄灭/灰色（inactive 类）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { container } = render(<StreakDisplay checkIns={[]} />);
    expect(container.querySelector('svg.flameInactive')).toBeInTheDocument();
    expect(container.querySelector('svg.flameActive')).not.toBeInTheDocument();
  });

  it('Streak 中断（有历史但未打卡）时火焰图标熄灭', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [makeCheckIn(ts(2026, 5, 10))];
    const { container } = render(<StreakDisplay checkIns={checkIns} />);
    expect(container.querySelector('svg.flameInactive')).toBeInTheDocument();
    expect(container.querySelector('svg.flameActive')).not.toBeInTheDocument();
  });

  it('显示"连续打卡 X 天"文案', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
    ];
    render(<StreakDisplay checkIns={checkIns} />);
    expect(screen.getByText('连续打卡 2 天')).toBeInTheDocument();
  });

  it('显示历史最高 Streak', () => {
    vi.setSystemTime(new Date(2026, 5, 25, 14, 0));
    const checkIns: CheckIn[] = [];
    for (let d = 10; d <= 14; d++) {
      checkIns.push(makeCheckIn(ts(2026, 5, d)));
    }
    checkIns.push(makeCheckIn(ts(2026, 5, 25)));
    render(<StreakDisplay checkIns={checkIns} />);
    expect(screen.getByText(/历史最高.*5.*天/)).toBeInTheDocument();
  });

  it('Streak 进行中显示"进行中"状态', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [makeCheckIn(ts(2026, 5, 17))];
    render(<StreakDisplay checkIns={checkIns} />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('Streak 中断时显示"已中断"状态', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [makeCheckIn(ts(2026, 5, 10))];
    render(<StreakDisplay checkIns={checkIns} />);
    expect(screen.getByText('已中断')).toBeInTheDocument();
  });

  it('无记录时显示鼓励文案"开始你的第一次打卡吧！"', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    render(<StreakDisplay checkIns={[]} />);
    expect(screen.getByText('开始你的第一次打卡吧！')).toBeInTheDocument();
  });

  it('数据实时更新（传入新 checkIns 后刷新）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { rerender } = render(<StreakDisplay checkIns={[]} />);
    expect(screen.getByText('开始你的第一次打卡吧！')).toBeInTheDocument();
    rerender(
      <StreakDisplay
        checkIns={[makeCheckIn(ts(2026, 5, 17)), makeCheckIn(ts(2026, 5, 16))]}
      />,
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('连续打卡 2 天')).toBeInTheDocument();
  });
});

describe('StatsCard 组件', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('显示本周/本月/累计三项标签', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
    ];
    render(<StatsCard checkIns={checkIns} />);
    expect(screen.getByText('本周')).toBeInTheDocument();
    expect(screen.getByText('本月')).toBeInTheDocument();
    expect(screen.getByText('累计')).toBeInTheDocument();
  });

  it('本周/本月/累计数字正确', () => {
    // 2026-06-17 周三，本周一 2026-06-15
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 16)),
      makeCheckIn(ts(2026, 5, 15)),
      makeCheckIn(ts(2026, 4, 10)),
    ];
    render(<StatsCard checkIns={checkIns} />);
    const weekCard = screen.getByText('本周').closest('div') as HTMLElement;
    const monthCard = screen.getByText('本月').closest('div') as HTMLElement;
    const totalCard = screen.getByText('累计').closest('div') as HTMLElement;
    expect(within(weekCard).getByText('3')).toBeInTheDocument();
    expect(within(monthCard).getByText('3')).toBeInTheDocument();
    expect(within(totalCard).getByText('4')).toBeInTheDocument();
  });

  it('无记录时所有统计为 0 并显示鼓励文案', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    render(<StatsCard checkIns={[]} />);
    const weekCard = screen.getByText('本周').closest('div') as HTMLElement;
    const monthCard = screen.getByText('本月').closest('div') as HTMLElement;
    const totalCard = screen.getByText('累计').closest('div') as HTMLElement;
    expect(within(weekCard).getByText('0')).toBeInTheDocument();
    expect(within(monthCard).getByText('0')).toBeInTheDocument();
    expect(within(totalCard).getByText('0')).toBeInTheDocument();
    expect(screen.getByText('动起来吧！')).toBeInTheDocument();
  });

  it('数据正确性：跨周/跨月记录只计入对应周期', () => {
    // 2026-06-17 周三，本周一 2026-06-15；6月14日属于上周但仍在6月
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const checkIns = [
      makeCheckIn(ts(2026, 5, 17)),
      makeCheckIn(ts(2026, 5, 14)),
      makeCheckIn(ts(2026, 4, 30)),
    ];
    render(<StatsCard checkIns={checkIns} />);
    const weekCard = screen.getByText('本周').closest('div') as HTMLElement;
    const monthCard = screen.getByText('本月').closest('div') as HTMLElement;
    const totalCard = screen.getByText('累计').closest('div') as HTMLElement;
    expect(within(weekCard).getByText('1')).toBeInTheDocument();
    expect(within(monthCard).getByText('2')).toBeInTheDocument();
    expect(within(totalCard).getByText('3')).toBeInTheDocument();
  });

  it('数据实时更新（传入新 checkIns 后刷新）', () => {
    vi.setSystemTime(new Date(2026, 5, 17, 14, 0));
    const { rerender } = render(<StatsCard checkIns={[]} />);
    const totalCard = screen.getByText('累计').closest('div') as HTMLElement;
    expect(within(totalCard).getByText('0')).toBeInTheDocument();
    rerender(<StatsCard checkIns={[makeCheckIn(ts(2026, 5, 17))]} />);
    const totalCardAfter = screen.getByText('累计').closest('div') as HTMLElement;
    expect(within(totalCardAfter).getByText('1')).toBeInTheDocument();
  });
});
