import { useState, useMemo } from 'react';
import { useCheckIns } from '../../hooks/useCheckIns';
import { StatsChart, type TimeRange } from '../../components/StatsChart/StatsChart';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import { getWeekStart } from '../../utils/dateUtils';
import type { CheckIn } from '../../types';
import styles from './Statistics.module.css';

const PAGE_TITLE = '统计';
const LOADING_TEXT = '加载中...';
const ERROR_PREFIX = '加载失败：';
const EMPTY_TEXT = '还没有打卡记录，快去运动吧！';

const TIME_RANGE_OPTIONS: ReadonlyArray<{ value: TimeRange; label: string }> = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'last30days', label: '最近30天' },
  { value: 'all', label: '全部' },
];

const FALLBACK_SPORT_NAME = '—';

interface Metrics {
  total: number;
  favoriteSportName: string;
  weeklyAvg: number;
}

function computeMetrics(checkIns: CheckIn[]): Metrics {
  const total = checkIns.length;
  if (total === 0) {
    return { total: 0, favoriteSportName: FALLBACK_SPORT_NAME, weeklyAvg: 0 };
  }
  const countMap = new Map<string, number>();
  for (const checkIn of checkIns) {
    countMap.set(
      checkIn.sportType,
      (countMap.get(checkIn.sportType) ?? 0) + 1,
    );
  }
  let favoriteId = '';
  let favoriteCount = 0;
  for (const [id, count] of countMap) {
    if (count > favoriteCount) {
      favoriteId = id;
      favoriteCount = count;
    }
  }
  const sport = DEFAULT_SPORT_TYPES.find((s) => s.id === favoriteId);
  const favoriteSportName = sport?.name ?? favoriteId;

  const weekKeys = new Set<number>();
  for (const checkIn of checkIns) {
    weekKeys.add(getWeekStart(checkIn.timestamp));
  }
  const weekCount = weekKeys.size;
  const weeklyAvg = weekCount > 0 ? total / weekCount : 0;

  return { total, favoriteSportName, weeklyAvg };
}

function formatWeeklyAvg(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1);
}

export function Statistics(): JSX.Element {
  const { checkIns, loading, error } = useCheckIns();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const metrics = useMemo(() => computeMetrics(checkIns), [checkIns]);
  const hasRecords = checkIns.length > 0;

  return (
    <div className={styles.statistics} data-testid="page-statistics">
      <h1 className={styles.title}>{PAGE_TITLE}</h1>

      {loading ? (
        <p className={styles.loading}>{LOADING_TEXT}</p>
      ) : error ? (
        <p className={styles.error}>{ERROR_PREFIX}{error}</p>
      ) : (
        <>
          <div className={styles.rangeBar} role="group" aria-label="时间范围">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.rangeButton} ${timeRange === option.value ? styles.rangeButtonActive : ''}`}
                onClick={() => setTimeRange(option.value)}
                aria-pressed={timeRange === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!hasRecords ? (
            <p className={styles.emptyText}>{EMPTY_TEXT}</p>
          ) : (
            <>
              <StatsChart checkIns={checkIns} timeRange={timeRange} />

              <div className={styles.metrics}>
                <div className={styles.metricCard} data-testid="metric-total">
                  <span className={styles.metricValue}>{metrics.total}</span>
                  <span className={styles.metricLabel}>总次数</span>
                </div>
                <div className={styles.metricCard} data-testid="metric-favorite">
                  <span className={styles.metricValue}>{metrics.favoriteSportName}</span>
                  <span className={styles.metricLabel}>最爱运动</span>
                </div>
                <div className={styles.metricCard} data-testid="metric-weekly-avg">
                  <span className={styles.metricValue}>{formatWeeklyAvg(metrics.weeklyAvg)}</span>
                  <span className={styles.metricLabel}>平均每周</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
