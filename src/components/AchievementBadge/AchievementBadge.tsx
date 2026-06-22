import {
  Footprints,
  Flame,
  Zap,
  Trophy,
  Volleyball,
  Dumbbell,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import type { AchievementProgress } from '../../hooks/useAchievements';
import styles from './AchievementBadge.module.css';

const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  Flame,
  Zap,
  Trophy,
  Volleyball,
  Dumbbell,
  Sparkles,
  Target,
};

const ICON_SIZE = 32;
const DATE_FORMAT = 'yyyy-MM-dd';
const FULL_PROGRESS = 100;

interface AchievementBadgeProps {
  progress: AchievementProgress;
}

export function AchievementBadge({ progress }: AchievementBadgeProps): JSX.Element {
  const { achievement, unlocked, currentCount, targetCount } = progress;
  const Icon = ICON_MAP[achievement.icon] ?? Footprints;
  const containerClass = unlocked ? styles.unlocked : styles.locked;
  const iconClass = unlocked ? styles.iconActive : styles.iconInactive;
  const progressPercent = Math.round(progress.progress * FULL_PROGRESS);

  return (
    <div
      className={`${styles.badge} ${containerClass}`}
      data-testid="achievement-badge"
    >
      <Icon className={iconClass} size={ICON_SIZE} aria-hidden="true" />
      <div className={styles.name}>{achievement.name}</div>
      <div className={styles.description}>{achievement.description}</div>
      {unlocked ? (
        <div className={styles.unlockedDate}>
          {progress.unlockedAt && format(progress.unlockedAt, DATE_FORMAT)}
        </div>
      ) : (
        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={currentCount}
            aria-valuemin={0}
            aria-valuemax={targetCount}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.progressText}>{currentCount}/{targetCount}</div>
        </div>
      )}
    </div>
  );
}
