import { useState, useCallback } from 'react';
import { clearAllCheckIns } from '../../db/database';
import { ConfirmDialog } from '../../components/common/ConfirmDialog/ConfirmDialog';
import { Toast } from '../../components/common/Toast/Toast';
import { SettingsBody } from './SettingsBody';
import styles from './Settings.module.css';

const GOALS_KEY = 'momenta-goals';
const REMINDERS_KEY = 'momenta-reminders';
const CUSTOM_SPORTS_KEY = 'momenta-custom-sports';
const SMART_REMINDER_ENABLED_KEY = 'momenta-smart-reminder-enabled';
const SMART_REMINDER_THRESHOLD_KEY = 'momenta-smart-reminder-threshold';
const REST_DAYS_KEY = 'momenta-rest-days';
const CLEAR_TITLE = '清除所有数据';
const CLEAR_MESSAGE = '确定要清除所有打卡记录和设置吗？此操作不可恢复。';
const CLEAR_CONFIRM = '确认清除';
const CLEAR_SUCCESS = '数据已清除';
const CLEAR_ERROR = '清除数据失败';
const PAGE_TITLE = '设置';
const TOAST_DURATION = 3000;

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function Settings(): JSX.Element {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const handleClearConfirm = useCallback(async (): Promise<void> => {
    setClearDataOpen(false);
    try {
      await clearAllCheckIns();
      localStorage.removeItem(GOALS_KEY);
      localStorage.removeItem(REMINDERS_KEY);
      localStorage.removeItem(CUSTOM_SPORTS_KEY);
      localStorage.removeItem(SMART_REMINDER_ENABLED_KEY);
      localStorage.removeItem(SMART_REMINDER_THRESHOLD_KEY);
      localStorage.removeItem(REST_DAYS_KEY);
      setToast({ message: CLEAR_SUCCESS, type: 'success' });
      setDataVersion((v) => v + 1);
    } catch {
      setToast({ message: CLEAR_ERROR, type: 'error' });
    }
  }, []);

  return (
    <div className={styles.settings} data-testid="page-settings">
      <h1 className={styles.title}>{PAGE_TITLE}</h1>
      <SettingsBody key={dataVersion} onClearData={() => setClearDataOpen(true)} />
      <ConfirmDialog
        open={clearDataOpen}
        title={CLEAR_TITLE}
        message={CLEAR_MESSAGE}
        confirmText={CLEAR_CONFIRM}
        danger
        onConfirm={handleClearConfirm}
        onCancel={() => setClearDataOpen(false)}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={TOAST_DURATION}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
