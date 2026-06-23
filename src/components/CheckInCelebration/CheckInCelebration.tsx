import { useEffect, useRef } from 'react';
import { Modal } from '../common/Modal/Modal';
import styles from './CheckInCelebration.module.css';

interface CheckInCelebrationProps {
  open: boolean;
  encouragement: string;
  onClose: () => void;
}

const AUTO_CLOSE_MS = 3000;
const HINT_TEXT = '点击任意处关闭';

export function CheckInCelebration({
  open,
  encouragement,
  onClose,
}: CheckInCelebrationProps): JSX.Element {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, AUTO_CLOSE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.container} data-testid="check-in-celebration">
        <p className={styles.encouragement}>{encouragement}</p>
        <p className={styles.hint}>{HINT_TEXT}</p>
      </div>
    </Modal>
  );
}
