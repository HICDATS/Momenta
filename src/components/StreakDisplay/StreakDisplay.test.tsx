import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakDisplay } from './StreakDisplay';
import type { CheckIn } from '../../types';

const today = new Date();
today.setHours(10, 0, 0, 0);
const T = today.getTime();

const make = (offsetDays: number, id: string): CheckIn => ({
  id,
  sportType: 'running',
  timestamp: T - offsetDays * 86_400_000,
  createdAt: T,
});

describe('StreakDisplay', () => {
  it('renders "连续" label and big number', () => {
    render(<StreakDisplay checkIns={[]} />);
    expect(screen.getByText('连续')).toBeInTheDocument();
  });

  it('renders 0 when no records', () => {
    render(<StreakDisplay checkIns={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders 7 for a 7-day streak', () => {
    const cis: CheckIn[] = [0, 1, 2, 3, 4, 5, 6].map((i) => make(i, String(i)));
    render(<StreakDisplay checkIns={cis} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
