import type { Goal } from '../../types';
import type { GoalWithProgress } from '../../hooks/useGoals';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import styles from './GoalProgress.module.css';

interface GoalProgressProps {
  goalWithProgress: GoalWithProgress;
}

const PERIOD_LABEL: Record<Goal['period'], string> = {
  weekly: '每周',
  monthly: '每月',
};

const FULL_PROGRESS = 100;
const DEFAULT_SPORT_NAME = '运动';

function describeGoal(goal: Goal): string {
  const period = PERIOD_LABEL[goal.period];
  if (goal.sportType) {
    const sport = DEFAULT_SPORT_TYPES.find((s) => s.id === goal.sportType);
    const sportName = sport?.name ?? DEFAULT_SPORT_NAME;
    return `${period}${sportName}${goal.targetCount}次`;
  }
  return `${period}${DEFAULT_SPORT_NAME}${goal.targetCount}次`;
}

export function GoalProgress({ goalWithProgress }: GoalProgressProps): JSX.Element {
  const { goal, currentCount, targetCount, progress, completed } = goalWithProgress;
  const percent = Math.round(progress * FULL_PROGRESS);
  const fillClass = completed ? styles.fillSuccess : styles.fillPrimary;

  return (
    <div className={styles.card} data-testid="goal-progress">
      <div className={styles.header}>
        <div className={styles.description}>{describeGoal(goal)}</div>
        {completed && <div className={styles.completedLabel}>已完成</div>}
      </div>
      <div className={styles.progressContainer}>
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-valuenow={currentCount}
          aria-valuemin={0}
          aria-valuemax={targetCount}
        >
          <div
            className={`${styles.progressFill} ${fillClass}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className={styles.progressText}>{currentCount}/{targetCount}次</div>
      </div>
    </div>
  );
}
