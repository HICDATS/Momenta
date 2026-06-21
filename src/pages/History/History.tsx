import { useState, useMemo } from 'react';
import { subDays } from 'date-fns';
import { useCheckIns } from '../../hooks/useCheckIns';
import { CheckInCard } from '../../components/CheckInCard/CheckInCard';
import { ConfirmDialog } from '../../components/common/ConfirmDialog/ConfirmDialog';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import { getDayKey, getWeekStart, getWeekEnd } from '../../utils/dateUtils';
import type { CheckIn } from '../../types';
import styles from './History.module.css';

const GROUP_TODAY = '今天';
const GROUP_YESTERDAY = '昨天';
const GROUP_THIS_WEEK = '本周';
const GROUP_EARLIER = '更早';
const GROUP_ORDER = [GROUP_TODAY, GROUP_YESTERDAY, GROUP_THIS_WEEK, GROUP_EARLIER] as const;
type GroupKey = (typeof GROUP_ORDER)[number];

const FILTER_ALL = 'all';
const LOADING_TEXT = '加载中...';
const ERROR_PREFIX = '加载失败：';
const EMPTY_TEXT = '还没有打卡记录，快去运动吧！';
const FILTERED_EMPTY_TEXT = '没有符合条件的记录';
const PAGE_TITLE = '历史';
const DELETE_TITLE = '确认删除';
const DELETE_MESSAGE = '确定要删除这条打卡记录吗？';

function groupByDate(checkIns: CheckIn[]): Record<GroupKey, CheckIn[]> {
  const now = Date.now();
  const todayKey = getDayKey(now);
  const yesterdayKey = getDayKey(subDays(now, 1).getTime());
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);

  const groups: Record<GroupKey, CheckIn[]> = {
    [GROUP_TODAY]: [],
    [GROUP_YESTERDAY]: [],
    [GROUP_THIS_WEEK]: [],
    [GROUP_EARLIER]: [],
  };

  for (const checkIn of checkIns) {
    const dayKey = getDayKey(checkIn.timestamp);
    if (dayKey === todayKey) {
      groups[GROUP_TODAY].push(checkIn);
    } else if (dayKey === yesterdayKey) {
      groups[GROUP_YESTERDAY].push(checkIn);
    } else if (checkIn.timestamp >= weekStart && checkIn.timestamp <= weekEnd) {
      groups[GROUP_THIS_WEEK].push(checkIn);
    } else {
      groups[GROUP_EARLIER].push(checkIn);
    }
  }

  return groups;
}

export function History(): JSX.Element {
  const { checkIns, deleteCheckIn, loading, error } = useCheckIns();
  const [filterSportType, setFilterSportType] = useState<string>(FILTER_ALL);
  const [deleteTarget, setDeleteTarget] = useState<CheckIn | null>(null);

  const filteredCheckIns = useMemo(
    () =>
      filterSportType === FILTER_ALL
        ? checkIns
        : checkIns.filter((c) => c.sportType === filterSportType),
    [checkIns, filterSportType],
  );

  const groupedCheckIns = useMemo(
    () => groupByDate(filteredCheckIns),
    [filteredCheckIns],
  );

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteCheckIn(target.id);
    } catch (err) {
      setDeleteTarget(target);
      throw err;
    }
  };

  const handleCancelDelete = (): void => {
    setDeleteTarget(null);
  };

  const hasRecords = checkIns.length > 0;

  return (
    <div className={styles.history} data-testid="page-history">
      <h1 className={styles.title}>{PAGE_TITLE}</h1>

      {loading ? (
        <p className={styles.loading}>{LOADING_TEXT}</p>
      ) : error ? (
        <p className={styles.error}>{ERROR_PREFIX}{error}</p>
      ) : !hasRecords ? (
        <p className={styles.emptyText}>{EMPTY_TEXT}</p>
      ) : (
        <>
          <div className={styles.filterBar} role="group" aria-label="按运动类型筛选">
            <button
              className={`${styles.filterChip} ${filterSportType === FILTER_ALL ? styles.filterChipActive : ''}`}
              onClick={() => setFilterSportType(FILTER_ALL)}
            >
              全部
            </button>
            {DEFAULT_SPORT_TYPES.map((sport) => (
              <button
                key={sport.id}
                className={`${styles.filterChip} ${filterSportType === sport.id ? styles.filterChipActive : ''}`}
                onClick={() => setFilterSportType(sport.id)}
              >
                {sport.name}
              </button>
            ))}
          </div>

          {filteredCheckIns.length === 0 ? (
            <p className={styles.emptyText}>{FILTERED_EMPTY_TEXT}</p>
          ) : (
            <div className={styles.groups}>
              {GROUP_ORDER.map((groupKey) => {
                const records = groupedCheckIns[groupKey];
                if (records.length === 0) return null;
                return (
                  <section
                    key={groupKey}
                    className={styles.group}
                    data-testid={`group-${groupKey}`}
                  >
                    <h2 className={styles.groupTitle}>{groupKey}</h2>
                    <div className={styles.cardList}>
                      {records.map((checkIn) => (
                        <CheckInCard
                          key={checkIn.id}
                          checkIn={checkIn}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <p className={styles.recordsCount} data-testid="records-count">
            共 {filteredCheckIns.length} 条记录
          </p>
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={DELETE_TITLE}
        message={DELETE_MESSAGE}
        danger={true}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
