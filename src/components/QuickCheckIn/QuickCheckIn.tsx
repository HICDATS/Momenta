import { useCallback, useState } from 'react';
import {
  Dumbbell,
  Footprints,
  Waves,
  Flower,
  Bike,
  Circle,
  Table,
  Volleyball,
  type LucideIcon,
} from 'lucide-react';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import { useCheckIns } from '../../hooks/useCheckIns';
import { formatDateTime } from '../../utils/dateUtils';
import { validateNote } from '../../utils/validators';
import { getRandomEncouragement } from '../../utils/quoteSelector';
import type { CheckIn, SportType } from '../../types';
import { Modal } from '../common/Modal/Modal';
import { Toast } from '../common/Toast/Toast';
import { CheckInCelebration } from '../CheckInCelebration/CheckInCelebration';
import styles from './QuickCheckIn.module.css';

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

const SUCCESS_MESSAGE = '打卡成功！';
const ERROR_MESSAGE = '打卡失败，请重试';
const NOTE_PLACEHOLDER = '添加备注（可选）';

interface QuickCheckInProps {
  onCheckInComplete?: (checkIn: CheckIn) => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export function QuickCheckIn({
  onCheckInComplete,
}: QuickCheckInProps): JSX.Element {
  const { addCheckIn } = useCheckIns();
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [note, setNote] = useState<string>('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [encouragement, setEncouragement] = useState('');

  const handleToastClose = useCallback((): void => {
    setToast(null);
  }, []);

  const resetForm = (): void => {
    setSelectedSport(null);
    setNote('');
    setNoteError(null);
  };

  const handleSportClick = (sport: SportType): void => {
    setSelectedSport(sport);
    setNote('');
    setNoteError(null);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!selectedSport) return;
    const validation = validateNote(note);
    if (!validation.valid) {
      setNoteError(validation.error ?? null);
      return;
    }
    try {
      const created = await addCheckIn({
        sportType: selectedSport.id,
        timestamp: Date.now(),
        note: note.trim() || undefined,
      });
      if (created) {
        setToast({ message: SUCCESS_MESSAGE, type: 'success' });
        onCheckInComplete?.(created);
        setEncouragement(getRandomEncouragement());
        setCelebrationOpen(true);
        resetForm();
      } else {
        setToast({ message: ERROR_MESSAGE, type: 'error' });
      }
    } catch {
      setToast({ message: ERROR_MESSAGE, type: 'error' });
    }
  };

  const renderSportIcon = (
    sport: SportType,
    className: string,
  ): JSX.Element | null => {
    const Icon = ICON_MAP[sport.icon];
    if (!Icon) return null;
    return (
      <Icon
        className={className}
        style={{ color: sport.color }}
        aria-hidden="true"
      />
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid} role="grid">
        {DEFAULT_SPORT_TYPES.map((sport) => (
          <button
            key={sport.id}
            className={styles.sportButton}
            onClick={() => handleSportClick(sport)}
          >
            {renderSportIcon(sport, styles.icon)}
            <span className={styles.name}>{sport.name}</span>
          </button>
        ))}
      </div>

      <Modal open={selectedSport !== null} onClose={resetForm} title="确认打卡">
        {selectedSport && (
          <div className={styles.checkInForm}>
            <div className={styles.sportInfo}>
              {renderSportIcon(selectedSport, styles.modalIcon)}
              <h3 className={styles.sportName}>{selectedSport.name}</h3>
            </div>
            <p className={styles.timeDisplay}>{formatDateTime(Date.now())}</p>
            <textarea
              className={styles.noteInput}
              placeholder={NOTE_PLACEHOLDER}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (noteError) setNoteError(null);
              }}
              rows={3}
              aria-label="备注"
            />
            {noteError && <p className={styles.error}>{noteError}</p>}
            <div className={styles.actions}>
              <button className={styles.cancelButton} onClick={resetForm}>
                取消
              </button>
              <button className={styles.confirmButton} onClick={handleConfirm}>
                确认
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleToastClose}
        />
      )}

      <CheckInCelebration
        encouragement={encouragement}
        open={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
      />
    </div>
  );
}
