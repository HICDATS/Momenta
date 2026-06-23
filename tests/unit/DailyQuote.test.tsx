import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyQuote } from '../../src/components/DailyQuote/DailyQuote';

describe('DailyQuote 组件', () => {
  it('渲染引号文本', () => {
    render(<DailyQuote quote="路虽远，行则将至" />);
    expect(screen.getByText('路虽远，行则将至')).toBeInTheDocument();
  });

  it('包含 aria-label="每日励志名言"', () => {
    render(<DailyQuote quote="测试名言" />);
    expect(screen.getByLabelText('每日励志名言')).toBeInTheDocument();
  });

  it('包含 data-testid="daily-quote"', () => {
    render(<DailyQuote quote="测试名言" />);
    expect(screen.getByTestId('daily-quote')).toBeInTheDocument();
  });

  it('空字符串时仍渲染卡片结构', () => {
    render(<DailyQuote quote="" />);
    const card = screen.getByTestId('daily-quote');
    expect(card).toBeInTheDocument();
    expect(card.textContent).toBe('');
  });
});
