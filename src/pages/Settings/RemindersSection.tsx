import { useState, useCallback } from 'react';
import { useReminders } from '../../hooks/useReminders';
import { Button } from '../../components/common/Button/Button';
import styles from './Settings.module.css';

const DEFAULT_NEW_REMINDER_HOUR = 20;
const DEFAULT_NEW_REMINDER_DAYS = [1, 3, 5];
const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDays(days: number[]): string {
  return days.map((d) => DAY_LABELS[d]).join(' ');
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function RemindersSection(): JSX.Element {
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');

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

  const handleStartEdit = useCallback((id: string, msg: string): void => {
    setEditingId(id);
    setEditMessage(msg);
  }, []);

  const handleSaveEdit = useCallback((): void => {
    if (editingId && editMessage.trim()) {
      updateReminder(editingId, { message: editMessage.trim() });
    }
    setEditingId(null);
    setEditMessage('');
  }, [editingId, editMessage, updateReminder]);

  const handleCancelEdit = useCallback((): void => {
    setEditingId(null);
    setEditMessage('');
  }, []);

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
                <div className={styles.editForm}>
                  <input
                    type="text"
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className={styles.editInput}
                    aria-label="编辑提醒文案"
                  />
                  <Button variant="primary" size="sm" onClick={handleSaveEdit}>保存</Button>
                  <Button variant="secondary" size="sm" onClick={handleCancelEdit}>取消</Button>
                </div>
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
                <Button variant="secondary" size="sm" onClick={() => handleStartEdit(r.id, r.message)}>
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
