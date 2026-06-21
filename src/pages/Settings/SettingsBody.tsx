import { useState, useCallback } from 'react';
import { useReminders } from '../../hooks/useReminders';
import { useSmartReminder } from '../../hooks/useSmartReminder';
import { useGoals } from '../../hooks/useGoals';
import { useSportTypes } from '../../hooks/useSportTypes';
import { useCheckIns } from '../../hooks/useCheckIns';
import { Button } from '../../components/common/Button/Button';
import { GoalProgress } from '../../components/GoalProgress/GoalProgress';
import { SportTypeEditor } from '../../components/SportTypeEditor/SportTypeEditor';
import styles from './Settings.module.css';

const APP_VERSION = '0.1.0';
const PRIVACY_TEXT = '数据完全本地存储，不上传任何服务器';
const MIN_THRESHOLD = 1;
const MAX_THRESHOLD = 30;
const DEFAULT_NEW_REMINDER_HOUR = 20;
const DEFAULT_NEW_GOAL_COUNT = 3;
const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDays(days: number[]): string {
  return days.map((d) => DAY_LABELS[d]).join(' ');
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

interface SettingsBodyProps {
  onClearData: () => void;
}

export function SettingsBody({ onClearData }: SettingsBodyProps): JSX.Element {
  const { reminders, addReminder, deleteReminder, toggleReminder } = useReminders();
  const { enabled, threshold, setEnabled, setThreshold } = useSmartReminder();
  const { checkIns } = useCheckIns();
  const { goalsWithProgress, addGoal, deleteGoal } = useGoals(checkIns);
  const { customSportTypes, deleteSportType } = useSportTypes();
  const [editorOpen, setEditorOpen] = useState(false);

  const handleExport = useCallback((): void => {
    const data = {
      checkIns,
      goals: goalsWithProgress.map((g) => g.goal),
      reminders,
      customSportTypes,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momenta-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [checkIns, goalsWithProgress, reminders, customSportTypes]);

  const handleAddReminder = useCallback((): void => {
    addReminder({
      sportType: undefined,
      days: [1, 3, 5],
      hour: DEFAULT_NEW_REMINDER_HOUR,
      minute: 0,
      message: '新提醒',
      enabled: true,
      skipIfCheckedIn: true,
    });
  }, [addReminder]);

  const handleAddGoal = useCallback((): void => {
    addGoal({
      sportType: undefined,
      period: 'weekly',
      targetCount: DEFAULT_NEW_GOAL_COUNT,
    });
  }, [addGoal]);

  const handleThresholdChange = useCallback(
    (value: string): void => {
      const num = Number(value);
      if (!Number.isNaN(num) && num >= MIN_THRESHOLD && num <= MAX_THRESHOLD) {
        setThreshold(num);
      }
    },
    [setThreshold],
  );

  return (
    <div className={styles.body}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>提醒设置</h2>
        <ul className={styles.list}>
          {reminders.map((r) => (
            <li key={r.id} className={styles.listItem}>
              <div className={styles.reminderInfo}>
                <span className={styles.reminderTime}>
                  {formatDays(r.days)} {formatTime(r.hour, r.minute)}
                </span>
                <span className={styles.reminderMessage}>{r.message}</span>
              </div>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.toggle}
                  role="switch"
                  aria-checked={r.enabled}
                  aria-label={`开关-${r.message}`}
                  onClick={() => toggleReminder(r.id)}
                />
                <Button variant="secondary" size="sm" onClick={() => deleteReminder(r.id)}>
                  删除
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={handleAddReminder}>添加提醒</Button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>智能提醒</h2>
        <div className={styles.row}>
          <span className={styles.rowLabel}>超期提醒</span>
          <button
            type="button"
            className={styles.toggle}
            role="switch"
            aria-checked={enabled}
            aria-label="智能提醒开关"
            onClick={() => setEnabled(!enabled)}
          />
        </div>
        <div className={styles.row}>
          <label className={styles.rowLabel} htmlFor="smart-threshold">超期阈值</label>
          <input
            id="smart-threshold"
            type="number"
            min={MIN_THRESHOLD}
            max={MAX_THRESHOLD}
            value={threshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
            className={styles.numberInput}
          />
          <span className={styles.unit}>天</span>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>目标设置</h2>
        <ul className={styles.list}>
          {goalsWithProgress.map((g) => (
            <li key={g.goal.id} className={styles.goalItem}>
              <GoalProgress goalWithProgress={g} />
              <Button variant="secondary" size="sm" onClick={() => deleteGoal(g.goal.id)}>
                删除
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={handleAddGoal}>添加目标</Button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>自定义运动类型</h2>
        <ul className={styles.list}>
          {customSportTypes.map((s) => (
            <li key={s.id} className={styles.listItem}>
              <span className={styles.sportName}>{s.name}</span>
              <Button variant="secondary" size="sm" onClick={() => deleteSportType(s.id)}>
                删除
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={() => setEditorOpen(true)}>添加运动类型</Button>
        <SportTypeEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSaved={() => setEditorOpen(false)}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>数据管理</h2>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleExport}>导出数据</Button>
          <Button variant="danger" onClick={onClearData}>清除所有数据</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>关于</h2>
        <p className={styles.aboutText}>版本 {APP_VERSION}</p>
        <p className={styles.aboutText}>{PRIVACY_TEXT}</p>
      </section>
    </div>
  );
}
