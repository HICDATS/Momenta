import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCheckIns } from '../../hooks/useCheckIns';
import { StreakDisplay } from '../../components/StreakDisplay/StreakDisplay';
import { StatsCard } from '../../components/StatsCard/StatsCard';
import { Heatmap } from '../../components/Heatmap/Heatmap';
import { QuickCheckIn } from '../../components/QuickCheckIn/QuickCheckIn';
import { DailyQuote } from '../../components/DailyQuote/DailyQuote';
import { formatDateTime } from '../../utils/dateUtils';
import { getDailyQuote } from '../../utils/quoteSelector';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import styles from './Home.module.css';

const RECENT_PREVIEW_COUNT = 3;
const LOADING_TEXT = '加载中...';
const ERROR_PREFIX = '加载失败：';
const EMPTY_TEXT = '还没有打卡记录，快去运动吧！';
const RECENT_TITLE = '最近打卡';
const VIEW_ALL = '查看全部';
const TODAY_LABEL = '今日运动';

const ENERGY_BAR_TOTAL_MS = 3400;

function formatEyebrow(timestamp: number): string {
  const d = new Date(timestamp);
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[d.getDay()]} · ${d.getDate()} ${months[d.getMonth()]}`;
}

export function Home(): JSX.Element {
  const { checkIns, loading, error, refresh } = useCheckIns();
  const recentCheckIns = checkIns.slice(0, RECENT_PREVIEW_COUNT);
  const dailyQuote = useMemo(() => getDailyQuote(), []);
  const [showEnergyBar, setShowEnergyBar] = useState(false);

  useEffect(() => {
    if (!showEnergyBar) return;
    const fadeTimer = setTimeout(() => {
      setShowEnergyBar(false);
    }, ENERGY_BAR_TOTAL_MS);
    return () => clearTimeout(fadeTimer);
  }, [showEnergyBar]);

  const handleCheckInComplete = (): void => {
    setShowEnergyBar(true);
    void refresh();
  };

  return (
    <div className={styles.home} data-testid="page-home">
      <h1 className={styles.srOnly}>首页</h1>
      {loading ? (
        <p className={styles.loading}>{LOADING_TEXT}</p>
      ) : error ? (
        <p className={styles.error}>{ERROR_PREFIX}{error}</p>
      ) : (
        <>
          <div className={styles.eyebrow} data-testid="home-eyebrow">
            <span className={styles.eyebrowMark} aria-hidden="true" />
            <span>{formatEyebrow(Date.now())}</span>
          </div>

          {showEnergyBar && (
            <div
              className={styles.energyBar}
              data-testid="energy-bar"
              role="presentation"
            />
          )}

          <DailyQuote quote={dailyQuote} />

          <StreakDisplay checkIns={checkIns} />
          <Heatmap checkIns={checkIns} />
          <StatsCard checkIns={checkIns} />

          <div className={styles.divider}>
            <span className={styles.dividerText}>{TODAY_LABEL}</span>
          </div>

          <QuickCheckIn onCheckInComplete={handleCheckInComplete} />

          <section className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{RECENT_TITLE}</h2>
              <Link to="/history" className={styles.viewAll}>
                {VIEW_ALL}
              </Link>
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
