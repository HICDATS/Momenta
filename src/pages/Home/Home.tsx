import { Link, useInRouterContext } from 'react-router-dom';
import { useCheckIns } from '../../hooks/useCheckIns';
import { StreakDisplay } from '../../components/StreakDisplay/StreakDisplay';
import { StatsCard } from '../../components/StatsCard/StatsCard';
import { QuickCheckIn } from '../../components/QuickCheckIn/QuickCheckIn';
import { formatDateTime } from '../../utils/dateUtils';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import styles from './Home.module.css';

const RECENT_PREVIEW_COUNT = 3;
const LOADING_TEXT = '加载中...';
const ERROR_PREFIX = '加载失败：';
const EMPTY_TEXT = '还没有打卡记录，快去运动吧！';
const RECENT_TITLE = '最近打卡';
const VIEW_ALL = '查看全部';
const PAGE_TITLE = '首页';

export function Home(): JSX.Element {
  const { checkIns, loading, error, refresh } = useCheckIns();
  const inRouter = useInRouterContext();
  const recentCheckIns = checkIns.slice(0, RECENT_PREVIEW_COUNT);

  const viewAllLink = inRouter ? (
    <Link to="/history" className={styles.viewAll}>
      {VIEW_ALL}
    </Link>
  ) : (
    <a href="/history" className={styles.viewAll}>
      {VIEW_ALL}
    </a>
  );

  return (
    <div className={styles.home} data-testid="page-home">
      <h1 className={styles.srOnly}>{PAGE_TITLE}</h1>
      {loading ? (
        <p className={styles.loading}>{LOADING_TEXT}</p>
      ) : error ? (
        <p className={styles.error}>{ERROR_PREFIX}{error}</p>
      ) : (
        <>
          <StreakDisplay checkIns={checkIns} />
          <StatsCard checkIns={checkIns} />
          <QuickCheckIn onCheckInComplete={() => { void refresh(); }} />
          <section className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{RECENT_TITLE}</h2>
              {viewAllLink}
            </div>
            {recentCheckIns.length > 0 ? (
              <ul className={styles.recentList} data-testid="recent-list">
                {recentCheckIns.map((checkIn) => {
                  const sport = DEFAULT_SPORT_TYPES.find(
                    (s) => s.id === checkIn.sportType,
                  );
                  return (
                    <li key={checkIn.id} className={styles.recentItem}>
                      <span className={styles.sportName}>
                        {sport?.name ?? checkIn.sportType}
                      </span>
                      <span className={styles.checkInTime}>
                        {formatDateTime(checkIn.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.emptyText}>{EMPTY_TEXT}</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
