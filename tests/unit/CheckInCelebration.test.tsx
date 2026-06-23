import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';
import { CheckInCelebration } from '../../src/components/CheckInCelebration/CheckInCelebration';

describe('CheckInCelebration 组件', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('open=false 时不渲染', () => {
    render(
      <CheckInCelebration
        open={false}
        encouragement="坚持就是胜利！"
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('modal-backdrop')).toBeNull();
  });

  it('open=true 时渲染鼓励语', () => {
    render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('坚持就是胜利！')).toBeInTheDocument();
  });

  it('3 秒后自动调用 onClose', () => {
    const onClose = vi.fn();
    render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('open 从 true 变 false 时清理定时器，3 秒后不再调用 onClose', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(
      <CheckInCelebration
        open={false}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('点击 backdrop 触发 onClose', () => {
    const onClose = vi.fn();
    render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Esc 键触发 onClose', () => {
    const onClose = vi.fn();
    render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
