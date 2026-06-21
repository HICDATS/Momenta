import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  type PieLabelRenderProps,
} from 'recharts';
import { format, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from 'date-fns';
import type { CheckIn } from '../../types';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import { getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } from '../../utils/dateUtils';
import styles from './StatsChart.module.css';

export type TimeRange = 'week' | 'month' | 'last30days' | 'all';

export interface BarDataPoint {
  label: string;
  count: number;
  date: number;
}

export interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

const MS_PER_DAY = 86400000;
const WEEKDAY_CN = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const FALLBACK_COLOR = '#B2BEC3';
const CHART_HEIGHT = 240;

function getSportMeta(sportTypeId: string): { name: string; color: string } {
  const sport = DEFAULT_SPORT_TYPES.find((s) => s.id === sportTypeId);
  return sport
    ? { name: sport.name, color: sport.color }
    : { name: sportTypeId, color: FALLBACK_COLOR };
}

export function filterCheckInsByTimeRange(
  checkIns: CheckIn[],
  timeRange: TimeRange,
  now: number = Date.now(),
): CheckIn[] {
  if (timeRange === 'all') return [...checkIns];
  let start: number;
  let end: number;
  if (timeRange === 'week') {
    start = getWeekStart(now);
    end = getWeekEnd(now);
  } else if (timeRange === 'month') {
    start = getMonthStart(now);
    end = getMonthEnd(now);
  } else {
    start = now - 30 * MS_PER_DAY;
    end = now;
  }
  return checkIns.filter((c) => c.timestamp >= start && c.timestamp <= end);
}

function buildDayBuckets(start: number, end: number, labels?: string[]): BarDataPoint[] {
  const days = eachDayOfInterval({ start, end });
  return days.map((day, i) => ({
    label: labels ? labels[i] : format(day.getTime(), 'MM-dd'),
    count: 0,
    date: day.getTime(),
  }));
}

function buildBuckets(timeRange: TimeRange, now: number): BarDataPoint[] {
  if (timeRange === 'week') {
    const start = getWeekStart(now);
    return buildDayBuckets(start, start + 6 * MS_PER_DAY, WEEKDAY_CN);
  }
  if (timeRange === 'month') {
    return buildDayBuckets(startOfMonth(now).getTime(), endOfMonth(now).getTime());
  }
  return buildDayBuckets(subDays(now, 29).getTime(), now);
}

function fillBuckets(buckets: BarDataPoint[], checkIns: CheckIn[]): BarDataPoint[] {
  for (const checkIn of checkIns) {
    const idx = buckets.findIndex((b) =>
      checkIn.timestamp >= b.date && checkIn.timestamp <= b.date + MS_PER_DAY - 1,
    );
    if (idx >= 0) buckets[idx] = { ...buckets[idx], count: buckets[idx].count + 1 };
  }
  return buckets;
}

function aggregateByMonth(checkIns: CheckIn[]): BarDataPoint[] {
  const monthMap = new Map<string, BarDataPoint>();
  for (const checkIn of checkIns) {
    const label = format(checkIn.timestamp, 'yyyy-MM');
    const existing = monthMap.get(label);
    if (existing) {
      monthMap.set(label, { ...existing, count: existing.count + 1 });
    } else {
      monthMap.set(label, { label, count: 1, date: startOfMonth(checkIn.timestamp).getTime() });
    }
  }
  return Array.from(monthMap.values()).sort((a, b) => a.date - b.date);
}

export function aggregateBarData(
  checkIns: CheckIn[],
  timeRange: TimeRange,
  now: number = Date.now(),
): BarDataPoint[] {
  const filtered = filterCheckInsByTimeRange(checkIns, timeRange, now);
  if (timeRange === 'all') return aggregateByMonth(filtered);
  return fillBuckets(buildBuckets(timeRange, now), filtered);
}

export function computePieData(checkIns: CheckIn[]): PieDataPoint[] {
  const countMap = new Map<string, number>();
  for (const checkIn of checkIns) {
    countMap.set(checkIn.sportType, (countMap.get(checkIn.sportType) ?? 0) + 1);
  }
  return Array.from(countMap.entries())
    .map(([id, value]) => {
      const meta = getSportMeta(id);
      return { name: meta.name, value, color: meta.color };
    })
    .sort((a, b) => b.value - a.value);
}

interface StatsChartProps {
  checkIns: CheckIn[];
  timeRange: TimeRange;
}

function renderPieLabel(entry: PieLabelRenderProps): string {
  const percent = ((entry.percent ?? 0) * 100).toFixed(0);
  return `${entry.name ?? ''} ${percent}%`;
}

export function StatsChart({ checkIns, timeRange }: StatsChartProps): JSX.Element {
  if (checkIns.length === 0) {
    return <div className={styles.empty} data-testid="stats-chart-empty" />;
  }
  const barData = aggregateBarData(checkIns, timeRange);
  const pieData = computePieData(filterCheckInsByTimeRange(checkIns, timeRange));
  return (
    <div className={styles.container}>
      <section className={styles.section} data-testid="bar-chart">
        <h3 className={styles.sectionTitle}>运动频率</h3>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className={styles.section} data-testid="pie-chart">
        <h3 className={styles.sectionTitle}>运动类型分布</h3>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={renderPieLabel}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
