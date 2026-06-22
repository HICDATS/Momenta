import type { CheckIn } from '../../types';
import { useStats } from '../../hooks/useStats';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  checkIns: CheckIn[];
}

const STAT_ITEMS = [
  { key: 'weekCount', label: '本周' },
  { key: 'monthCount', label: '本月' },
  { key: 'totalCount', label: '累计' },
] as const;

export function StatsCard({ checkIns }: StatsCardProps): JSX.Element {
  const { weekCount, monthCount, totalCount } = useStats(checkIns);
  const counts = { weekCount, monthCount, totalCount };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {STAT_ITEMS.map((item) => (
          <div key={item.key} className={styles.card}>
            <span className={styles.number}>{counts[item.key]}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
