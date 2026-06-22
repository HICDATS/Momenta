import { useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const DEFAULT_DURATION = 3000;

export function Toast({
  message,
  type = 'info',
  duration = DEFAULT_DURATION,
  onClose,
}: ToastProps): JSX.Element {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => {
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      onClick={onClose}
      role="alert"
    >
      {message}
    </div>
  );
}
