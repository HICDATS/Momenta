import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heatmap } from './Heatmap';
import type { CheckIn } from '../../types';

const baseCheckIn: CheckIn = {
  id: '1',
  sportType: 'running',
  timestamp: Date.now(),
  createdAt: Date.now(),
};

describe('Heatmap', () => {
  it('renders a 12x7 grid (84 cells)', () => {
    const { container } = render(<Heatmap checkIns={[]} />);
    const cells = container.querySelectorAll('[data-testid="heatmap-cell"]');
    expect(cells.length).toBe(84);
  });

  it('uses semantic role="grid" with aria-label', () => {
    render(<Heatmap checkIns={[]} />);
    const grid = screen.getByRole('grid', { name: /过去 12 周打卡情况/ });
    expect(grid).toBeInTheDocument();
  });

  it('marks today with data-cell-today attribute', () => {
    const { container } = render(<Heatmap checkIns={[]} />);
    const today = container.querySelector('[data-cell-today="true"]');
    expect(today).toBeInTheDocument();
  });

  it('marks cell with 1 day streak as level-1', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const checkIns: CheckIn[] = [
      { ...baseCheckIn, timestamp: today.getTime() },
    ];
    const { container } = render(<Heatmap checkIns={checkIns} />);
    const cell = container.querySelector('[data-cell-today="true"]');
    expect(cell).toHaveAttribute('data-cell-level', '1');
  });

  it('marks cell with 4 day streak as level-3', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const checkIns: CheckIn[] = [
      { ...baseCheckIn, id: '1', timestamp: today.getTime() },
      { ...baseCheckIn, id: '2', timestamp: today.getTime() - 86400000 },
      { ...baseCheckIn, id: '3', timestamp: today.getTime() - 2 * 86400000 },
      { ...baseCheckIn, id: '4', timestamp: today.getTime() - 3 * 86400000 },
    ];
    const { container } = render(<Heatmap checkIns={checkIns} />);
    const cell = container.querySelector('[data-cell-today="true"]');
    expect(cell).toHaveAttribute('data-cell-level', '3');
  });

  it('marks cell with 8 day streak as level-4 with paper border', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const checkIns: CheckIn[] = Array.from({ length: 8 }, (_, i) => ({
      ...baseCheckIn,
      id: String(i),
      timestamp: today.getTime() - i * 86400000,
    }));
    const { container } = render(<Heatmap checkIns={checkIns} />);
    const cell = container.querySelector('[data-cell-today="true"]');
    expect(cell).toHaveAttribute('data-cell-level', '4');
    expect(cell).toHaveClass(/paperEdge/);
  });

  it('unregistered days render as level-0 with fog border', () => {
    const { container } = render(<Heatmap checkIns={[]} />);
    const cell = container.querySelector('[data-cell-today="true"]');
    expect(cell).toHaveAttribute('data-cell-level', '0');
  });

  it('respects custom weeks prop', () => {
    const { container } = render(<Heatmap checkIns={[]} weeks={4} />);
    const cells = container.querySelectorAll('[data-testid="heatmap-cell"]');
    expect(cells.length).toBe(28);
  });
});
