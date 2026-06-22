import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from '@testing-library/react';
import 'fake-indexeddb/auto';
import { Modal } from '../../src/components/common/Modal/Modal';
import { Toast } from '../../src/components/common/Toast/Toast';
import { QuickCheckIn } from '../../src/components/QuickCheckIn/QuickCheckIn';
import { clearAllCheckIns } from '../../src/db/database';
import { DEFAULT_SPORT_TYPES } from '../../src/constants/sports';

beforeEach(async () => {
  await clearAllCheckIns();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Modal 组件', () => {
  it('open=false 时不渲染', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open={false} onClose={onClose}>
        <div>内容</div>
      </Modal>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('open=true 时渲染 children', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <div>内容</div>
      </Modal>,
    );
    expect(screen.getByText('内容')).toBeInTheDocument();
  });

  it('点击遮罩关闭', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <div>内容</div>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('点击内容不关闭', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <div data-testid="modal-content">内容</div>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ESC 键关闭', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <div>内容</div>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('渲染标题（提供时）', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="确认打卡">
        <div>内容</div>
      </Modal>,
    );
    expect(screen.getByText('确认打卡')).toBeInTheDocument();
  });
});

describe('Toast 组件', () => {
  it('渲染消息', () => {
    const onClose = vi.fn();
    render(<Toast message="操作成功" onClose={onClose} />);
    expect(screen.getByText('操作成功')).toBeInTheDocument();
  });

  it('点击提前关闭', () => {
    const onClose = vi.fn();
    render(<Toast message="操作成功" onClose={onClose} />);
    fireEvent.click(screen.getByText('操作成功'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('duration 后自动关闭', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="操作成功" duration={3000} onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('QuickCheckIn 组件', () => {
  it('渲染运动类型图标网格（至少8种）', () => {
    render(<QuickCheckIn />);
    for (const sport of DEFAULT_SPORT_TYPES) {
      expect(
        screen.getByRole('button', { name: sport.name }),
      ).toBeInTheDocument();
    }
    expect(DEFAULT_SPORT_TYPES.length).toBeGreaterThanOrEqual(8);
  });

  it('点击运动类型弹出确认 Modal（显示类型+时间+备注输入）', () => {
    render(<QuickCheckIn />);
    const firstSport = DEFAULT_SPORT_TYPES[0];
    fireEvent.click(screen.getByRole('button', { name: firstSport.name }));
    expect(
      screen.getByRole('heading', { name: '确认打卡' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: firstSport.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(/今天 \d{2}:\d{2}/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/备注/)).toBeInTheDocument();
  });

  it('确认打卡（无备注）显示成功 Toast 并调用 onCheckInComplete', async () => {
    const onCheckInComplete = vi.fn();
    render(<QuickCheckIn onCheckInComplete={onCheckInComplete} />);
    fireEvent.click(
      screen.getByRole('button', { name: DEFAULT_SPORT_TYPES[0].name }),
    );
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    await waitFor(() => {
      expect(screen.getByText('打卡成功！')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(onCheckInComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('备注可选（不填也能打卡）', async () => {
    const onCheckInComplete = vi.fn();
    render(<QuickCheckIn onCheckInComplete={onCheckInComplete} />);
    fireEvent.click(
      screen.getByRole('button', { name: DEFAULT_SPORT_TYPES[0].name }),
    );
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    await waitFor(() => {
      expect(onCheckInComplete).toHaveBeenCalledTimes(1);
    });
    const checkIn = onCheckInComplete.mock.calls[0][0];
    expect(checkIn.note).toBeUndefined();
  });

  it('取消关闭 Modal', () => {
    render(<QuickCheckIn />);
    fireEvent.click(
      screen.getByRole('button', { name: DEFAULT_SPORT_TYPES[0].name }),
    );
    expect(screen.getByPlaceholderText(/备注/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.queryByPlaceholderText(/备注/)).not.toBeInTheDocument();
  });

  it('备注超过100字显示验证提示', () => {
    render(<QuickCheckIn />);
    fireEvent.click(
      screen.getByRole('button', { name: DEFAULT_SPORT_TYPES[0].name }),
    );
    const textarea = screen.getByPlaceholderText(/备注/);
    fireEvent.change(textarea, { target: { value: 'a'.repeat(101) } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    expect(screen.getByText(/备注不能超过100字/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/备注/)).toBeInTheDocument();
  });
});
