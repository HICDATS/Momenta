import { useCheckIns } from '../../hooks/useCheckIns';
import { useAchievements } from '../../hooks/useAchievements';
import { AchievementBadge } from '../../components/AchievementBadge/AchievementBadge';
import styles from './Achievements.module.css';

const PAGE_TITLE = '成就';
const LOADING_TEXT = '加载中...';
const ERROR_PREFIX = '加载失败：';

export function Achievements(): JSX.Element {
  const { checkIns, loading, error } = useCheckIns();
  const achievements = useAchievements(checkIns);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className={styles.achievements} data-testid="page-achievements">
      <h1 className={styles.title}>{PAGE_TITLE}</h1>
      {loading ? (
        <p className={styles.loading}>{LOADING_TEXT}</p>
      ) : error ? (
        <p className={styles.error}>{ERROR_PREFIX}{error}</p>
      ) : (
        <>
          <div className={styles.summary} data-testid="achievements-summary">
            已解锁 {unlockedCount}/{totalCount}
          </div>
          <div className={styles.grid} data-testid="achievements-grid">
            {achievements.map((progress) => (
              <AchievementBadge
                key={progress.achievement.id}
                progress={progress}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
