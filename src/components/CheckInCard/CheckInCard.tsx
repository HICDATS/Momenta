import {
  Dumbbell,
  Footprints,
  Waves,
  Flower,
  Bike,
  Circle,
  Table,
  Volleyball,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import { formatDateTime } from '../../utils/dateUtils';
import type { CheckIn, SportType } from '../../types';
import styles from './CheckInCard.module.css';

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell,
  Basketball: Volleyball,
  Footprints,
  Waves,
  Flower,
  Bike,
  Circle,
  Table,
};

function getSport(sportTypeId: string): SportType | undefined {
  return DEFAULT_SPORT_TYPES.find((s) => s.id === sportTypeId);
}

function renderIcon(
  sport: SportType | undefined,
  className: string,
): JSX.Element | null {
  if (!sport) return null;
  const Icon = ICON_MAP[sport.icon];
  if (!Icon) return null;
  return (
    <Icon
      className={className}
      style={{ color: sport.color }}
      aria-hidden="true"
    />
  );
}

interface CheckInCardProps {
  checkIn: CheckIn;
  onDelete: (checkIn: CheckIn) => void;
}

export function CheckInCard({ checkIn, onDelete }: CheckInCardProps): JSX.Element {
  const sport = getSport(checkIn.sportType);
  const sportName = sport?.name ?? checkIn.sportType;

  return (
    <div className={styles.card} data-testid="checkin-card">
      <div className={styles.iconWrapper} style={{ color: sport?.color }}>
        {renderIcon(sport, styles.icon)}
      </div>
      <div className={styles.content}>
        <span className={styles.sportName}>{sportName}</span>
        <span className={styles.time}>
          {formatDateTime(checkIn.timestamp)}
        </span>
        {checkIn.note && <span className={styles.note}>{checkIn.note}</span>}
      </div>
      <button
        className={styles.deleteButton}
        onClick={() => onDelete(checkIn)}
        aria-label="删除"
      >
        <Trash2 className={styles.deleteIcon} aria-hidden="true" />
      </button>
    </div>
  );
}
