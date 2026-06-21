import { useEffect, type MouseEvent } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

const DEFAULT_CONFIRM_TEXT = '确认';
const DEFAULT_CANCEL_TEXT = '取消';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = DEFAULT_CONFIRM_TEXT,
  cancelText = DEFAULT_CANCEL_TEXT,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const confirmClassName = danger
    ? `${styles.confirmButton} ${styles.danger}`
    : styles.confirmButton;

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      data-testid="confirm-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.dialog}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={confirmClassName} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
