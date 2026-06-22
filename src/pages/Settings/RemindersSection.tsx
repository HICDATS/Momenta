import { useState, useCallback, useEffect } from 'react';
import { useReminders } from '../../hooks/useReminders';
import { Button } from '../../components/common/Button/Button';
import type { Reminder } from '../../types';
import styles from './Settings.module.css';

const DEFAULT_NEW_REMINDER_HOUR = 20;
const DEFAULT_NEW_REMINDER_DAYS = [1, 3, 5];
const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const MIN_HOUR = 0;
const MAX_HOUR = 23;
const MIN_MINUTE = 0;
const MAX_MINUTE = 59;

function formatDays(days: number[]): string {
  return days.map((d) => DAY_LABELS[d]).join(' ');
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function clampInt(value: string, min: number, max: number): number | null {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

interface EditState {
  days: number[];
  hour: number;
  minute: number;
  message: string;
  skipIfCheckedIn: boolean;
}

function snapshot(r: Reminder): EditState {
  return {
    days: [...r.days],
    hour: r.hour,
    minute: r.minute,
    message: r.message,
    skipIfCheckedIn: r.skipIfCheckedIn,
  };
}

export function RemindersSection(): JSX.Element {
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditState | null>(null);
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');

  useEffect(() => {
    if (editingId === null) return;
    setHourInput(String(draft?.hour ?? 0));
    setMinuteInput(String(draft?.minute ?? 0));
    // Only run when entering edit mode (editingId becomes non-null) or exiting.
    // We intentionally do not depend on `draft` — once inputs are seeded from the
    // snapshot, user edits to draft.days / draft.message / draft.skipIfCheckedIn
    // must not re-seed hourInput/minuteInput, which would clobber the user's typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const handleAdd = useCallback((): void => {
    addReminder({
      sportType: undefined,
      days: DEFAULT_NEW_REMINDER_DAYS,
      hour: DEFAULT_NEW_REMINDER_HOUR,
      minute: 0,
      message: '新提醒',
      enabled: true,
      skipIfCheckedIn: true,
    });
  }, [addReminder]);

  const handleStartEdit = useCallback((r: Reminder): void => {
    setEditingId(r.id);
    setDraft(snapshot(r));
  }, []);

  const handleSaveEdit = useCallback((): void => {
    if (editingId === null || draft === null) return;
    if (!draft.message.trim()) return;
    const hour = clampInt(hourInput, MIN_HOUR, MAX_HOUR) ?? draft.hour;
    const minute = clampInt(minuteInput, MIN_MINUTE, MAX_MINUTE) ?? draft.minute;
    updateReminder(editingId, {
      days: draft.days,
      hour,
      minute,
      message: draft.message.trim(),
      skipIfCheckedIn: draft.skipIfCheckedIn,
    });
    setEditingId(null);
    setDraft(null);
  }, [editingId, draft, hourInput, minuteInput, updateReminder]);

  const handleCancelEdit = useCallback((): void => {
    setEditingId(null);
    setDraft(null);
  }, []);

  const toggleDay = useCallback((day: number): void => {
    setDraft((prev) => {
      if (prev === null) return prev;
      const exists = prev.days.includes(day);
      const next = exists
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day].sort((a, b) => a - b);
      return { ...prev, days: next };
    });
  }, []);

  const renderEditForm = (): JSX.Element => (
    <div className={styles.editFormExpanded}>
      <div className={styles.editField}>
        <label className={styles.editLabel}>文案</label>
        <input
          type="text"
          value={draft?.message ?? ''}
          onChange={(e) => {
            const next = e.target.value;
            setDraft((prev) => (prev === null ? prev : { ...prev, message: next }));
          }}
          className={styles.editInput}
          aria-label="编辑提醒文案"
        />
      </div>
      <div className={styles.editField}>
        <label className={styles.editLabel}>时间</label>
        <div className={styles.timeRow}>
          <input
            type="number"
            min={MIN_HOUR}
            max={MAX_HOUR}
            value={hourInput}
            onChange={(e) => setHourInput(e.target.value)}
            className={styles.timeInput}
            aria-label="小时"
          />
          <span className={styles.timeSeparator}>:</span>
          <input
            type="number"
            min={MIN_MINUTE}
            max={MAX_MINUTE}
            value={minuteInput}
            onChange={(e) => setMinuteInput(e.target.value)}
            className={styles.timeInput}
            aria-label="分钟"
          />
        </div>
      </div>
      <div className={styles.editField}>
        <label className={styles.editLabel}>重复</label>
        <div className={styles.dayChips}>
          {ALL_DAYS.map((d) => {
            const checked = draft?.days.includes(d) ?? false;
            return (
              <label
                key={d}
                className={`${styles.dayChip} ${checked ? styles.dayChipActive : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDay(d)}
                  aria-label={DAY_LABELS[d]}
                  className={styles.dayChipInput}
                />
                {DAY_LABELS[d]}
              </label>
            );
          })}
        </div>
      </div>
      <div className={styles.editField}>
        <label className={styles.skipRow}>
          <input
            type="checkbox"
            checked={draft?.skipIfCheckedIn ?? false}
            onChange={(e) => {
              const next = e.target.checked;
              setDraft((prev) => (prev === null ? prev : { ...prev, skipIfCheckedIn: next }));
            }}
            className={styles.skipCheckbox}
            aria-label="已打卡则跳过"
          />
          <span>已打卡则跳过</span>
        </label>
      </div>
      <div className={styles.editActions}>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveEdit}
          disabled={!draft?.message.trim()}
        >
          保存
        </Button>
        <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
          取消
        </Button>
      </div>
    </div>
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>提醒设置</h2>
      <ul className={styles.list}>
        {reminders.map((r) => (
          <li key={r.id} className={styles.listItem}>
            <div className={styles.reminderInfo}>
              <span className={styles.reminderTime}>
                {formatDays(r.days)} {formatTime(r.hour, r.minute)}
              </span>
              {editingId === r.id ? (
                renderEditForm()
              ) : (
                <span className={styles.reminderMessage}>{r.message}</span>
              )}
            </div>
            {editingId !== r.id && (
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.toggle}
                  role="switch"
                  aria-checked={r.enabled}
                  aria-label={`开关-${r.message}`}
                  onClick={() => toggleReminder(r.id)}
                />
                <Button variant="secondary" size="sm" onClick={() => handleStartEdit(r)}>
                  编辑
                </Button>
                <Button variant="secondary" size="sm" onClick={() => deleteReminder(r.id)}>
                  删除
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Button variant="secondary" onClick={handleAdd}>添加提醒</Button>
    </section>
  );
}
