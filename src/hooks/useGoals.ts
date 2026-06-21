import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
} from '../utils/dateUtils';
import type { Goal, CheckIn } from '../types';

export interface GoalWithProgress {
  goal: Goal;
  currentCount: number;
  targetCount: number;
  progress: number;
  completed: boolean;
}

export interface UseGoalsResult {
  goals: Goal[];
  goalsWithProgress: GoalWithProgress[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  deleteGoal: (id: string) => void;
}

const STORAGE_KEY = 'momenta-goals';
const MAX_PROGRESS = 1;

function countInPeriod(
  checkIns: CheckIn[],
  start: number,
  end: number,
  sportType: string | undefined,
): number {
  return checkIns.filter(
    (c) =>
      c.timestamp >= start &&
      c.timestamp <= end &&
      (sportType === undefined || c.sportType === sportType),
  ).length;
}

function computeProgress(goal: Goal, checkIns: CheckIn[], now: number): GoalWithProgress {
  const start = goal.period === 'weekly' ? getWeekStart(now) : getMonthStart(now);
  const end = goal.period === 'weekly' ? getWeekEnd(now) : getMonthEnd(now);
  const currentCount = countInPeriod(checkIns, start, end, goal.sportType);
  const targetCount = goal.targetCount;
  const progress =
    targetCount > 0 ? Math.min(currentCount / targetCount, MAX_PROGRESS) : 0;
  const completed = currentCount >= targetCount;
  return { goal, currentCount, targetCount, progress, completed };
}

export function useGoals(checkIns: CheckIn[]): UseGoalsResult {
  const [goals, setGoals] = useLocalStorage<Goal[]>(STORAGE_KEY, []);

  const addGoal = useCallback(
    (goal: Omit<Goal, 'id' | 'createdAt'>): void => {
      const newGoal: Goal = {
        ...goal,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      setGoals([...goals, newGoal]);
    },
    [goals, setGoals],
  );

  const deleteGoal = useCallback(
    (id: string): void => {
      setGoals(goals.filter((g) => g.id !== id));
    },
    [goals, setGoals],
  );

  const goalsWithProgress = useMemo<GoalWithProgress[]>(() => {
    const now = Date.now();
    return goals.map((goal) => computeProgress(goal, checkIns, now));
  }, [goals, checkIns]);

  return { goals, goalsWithProgress, addGoal, deleteGoal };
}
