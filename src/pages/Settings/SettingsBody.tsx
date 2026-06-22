import { useState, useCallback } from 'react';
import { useSmartReminder } from '../../hooks/useSmartReminder';
import { useGoals } from '../../hooks/useGoals';
import { useSportTypes } from '../../hooks/useSportTypes';
import { useCheckIns } from '../../hooks/useCheckIns';
import { Button } from '../../components/common/Button/Button';
import { GoalProgress } from '../../components/GoalProgress/GoalProgress';
import { SportTypeEditor } from '../../components/SportTypeEditor/SportTypeEditor';
import { RemindersSection } from './RemindersSection';
import styles from './Settings.module.css';

const APP_VERSION = '0.1.0';
const PRIVACY_TEXT = '数据完全本地存储，不上传任何服务器';
const MIN_THRESHOLD = 1;
const MAX_THRESHOLD = 30;
const DEFAULT_NEW_GOAL_COUNT = 3;

interface SettingsBodyProps {
  onClearData: () => void;
}

export function SettingsBody({ onClearData }: SettingsBodyProps): JSX.Element {
  const { enabled, threshold, setEnabled, setThreshold } = useSmartReminder();
  const { checkIns } = useCheckIns();
  const { goalsWithProgress, addGoal, deleteGoal } = useGoals(checkIns);
  const { customSportTypes, deleteSportType } = useSportTypes();
  const [editorOpen, setEditorOpen] = useState(false);

  const handleExport = useCallback((): void => {
    const data = {
      checkIns,
      goals: goalsWithProgress.map((g) => g.goal),
      reminders: [],
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
  }, [checkIns, goalsWithProgress, customSportTypes]);

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
      <RemindersSection />

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
