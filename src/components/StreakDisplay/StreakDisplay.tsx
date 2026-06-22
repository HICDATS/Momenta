import type { CheckIn } from '../../types';
import { useStreak } from '../../hooks/useStreak';
import styles from './StreakDisplay.module.css';

interface StreakDisplayProps {
  checkIns: CheckIn[];
}

const NO_RECORDS_LABEL = '开始你的第一次打卡吧';

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function StreakDisplay({ checkIns }: StreakDisplayProps): JSX.Element {
  const { currentStreak, maxStreak, isStreakActive } = useStreak(checkIns);
  const hasRecords = checkIns.length > 0;
  const lastCheckIn = checkIns
    .map((c) => c.timestamp)
    .sort((a, b) => b - a)[0];
  const subline = hasRecords && isStreakActive && currentStreak > 0
    ? `已完成今日训练 · ${formatTime(lastCheckIn)}`
    : hasRecords
      ? '已中断 · 等你回来'
      : NO_RECORDS_LABEL;
  const showStatus = hasRecords ? (isStreakActive ? '进行中' : '已中断') : '';

  return (
    <div className={styles.container}>
      <div className={styles.label}>连续</div>
      <div className={styles.number}>{currentStreak}</div>
      <div className={styles.unit}>天</div>
      {hasRecords ? (
        <>
          <div className={styles.statusRow}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.statusText}>{showStatus}</span>
            <span className={styles.maxStreak}>· 最高 {maxStreak} 天</span>
          </div>
          <div className={styles.subline}>{subline}</div>
        </>
      ) : (
        <div className={styles.subline}>{subline}</div>
      )}
    </div>
  );
}
