import { useMemo } from 'react';
import { getDayKey } from '../../utils/dateUtils';
import { calculateStreakAt } from '../../utils/streakCalculator';
import type { CheckIn } from '../../types';
import styles from './Heatmap.module.css';

interface HeatmapProps {
  checkIns: CheckIn[];
  weeks?: number;
  restDays?: number[];
}

const DEFAULT_WEEKS = 12;
const DEFAULT_REST_DAYS = [0, 6];
const MILLIS_PER_DAY = 86_400_000;

type Level = 0 | 1 | 2 | 3 | 4;

function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface Cell {
  date: number;
  level: Level;
  isToday: boolean;
}

function buildCells(
  checkIns: CheckIn[],
  weeks: number,
  restDays: number[],
): Cell[][] {
  const today = startOfDay(Date.now());
  const totalDays = weeks * 7;
  const days: number[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    days.push(today - i * MILLIS_PER_DAY);
  }

  const byDate = new Map<string, CheckIn[]>();
  for (const c of checkIns) {
    const key = getDayKey(c.timestamp);
    const list = byDate.get(key) ?? [];
    list.push(c);
    byDate.set(key, list);
  }

  const columns: Cell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = days[w * 7 + d];
      const dayKey = getDayKey(date);
      const dayOfWeek = new Date(date).getDay();
      const isToday = date === today;
      const isRestDay = restDays.includes(dayOfWeek);

      if (byDate.has(dayKey)) {
        const streakAt = calculateStreakAt(
          checkIns,
          date,
          isRestDay ? restDays : [],
        );
        const level: Level =
          streakAt >= 8 ? 4 :
          streakAt >= 4 ? 3 :
          streakAt >= 2 ? 2 :
          1;
        col.push({ date, level, isToday });
      } else {
        col.push({ date, level: 0, isToday });
      }
    }
    columns.push(col);
  }
  return columns;
}

export function Heatmap({
  checkIns,
  weeks = DEFAULT_WEEKS,
  restDays = DEFAULT_REST_DAYS,
}: HeatmapProps): JSX.Element {
  const cells = useMemo(
    () => buildCells(checkIns, weeks, restDays),
    [checkIns, weeks, restDays],
  );

  return (
    <div
      className={styles.heatmap}
      role="grid"
      aria-label="过去 12 周打卡情况"
      data-testid="heatmap"
    >
      {cells.map((col, ci) => (
        <div key={ci} className={styles.column}>
          {col.map((cell) => {
            const levelClass = styles[`level${cell.level}`];
            const todayClass = cell.isToday ? styles.today : '';
            const paperEdgeClass = cell.level === 4 ? styles.paperEdge : '';
            return (
              <div
                key={cell.date}
                className={`${styles.cell} ${levelClass} ${todayClass} ${paperEdgeClass}`.trim()}
                data-testid="heatmap-cell"
                data-cell-today={cell.isToday}
                data-cell-level={cell.level}
                data-cell-date={new Date(cell.date).toISOString()}
                role="gridcell"
                aria-label={`${new Date(cell.date).toLocaleDateString('zh-CN')} ${
                  cell.level === 0 ? '未打卡' : `连续 ${cell.level} 天`
                }`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
