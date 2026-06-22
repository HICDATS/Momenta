import { Flame } from 'lucide-react';
import type { CheckIn } from '../../types';
import { useStreak } from '../../hooks/useStreak';
import styles from './StreakDisplay.module.css';

interface StreakDisplayProps {
  checkIns: CheckIn[];
}

const FLAME_SIZE = 48;

export function StreakDisplay({ checkIns }: StreakDisplayProps): JSX.Element {
  const { currentStreak, maxStreak, isStreakActive } = useStreak(checkIns);
  const hasRecords = checkIns.length > 0;
  const isFlameActive = isStreakActive && currentStreak > 0;
  const flameClass = isFlameActive ? styles.flameActive : styles.flameInactive;

  return (
    <div className={styles.container}>
      <Flame
        className={flameClass}
        size={FLAME_SIZE}
        aria-hidden="true"
      />
      <div className={styles.number}>{currentStreak}</div>
      {hasRecords ? (
        <>
          <div className={styles.label}>连续打卡 {currentStreak} 天</div>
          <div
            className={isFlameActive ? styles.statusActive : styles.statusInactive}
          >
            {isFlameActive ? '进行中' : '已中断'}
          </div>
          <div className={styles.maxStreak}>历史最高：{maxStreak} 天</div>
        </>
      ) : (
        <div className={styles.emptyText}>开始你的第一次打卡吧！</div>
      )}
    </div>
  );
}
