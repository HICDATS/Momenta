import styles from './Achievements.module.css';

export function Achievements(): JSX.Element {
  return (
    <div className={styles.achievements} data-testid="page-achievements">
      <h1 className={styles.title}>成就</h1>
      <p className={styles.placeholder}>开发中...</p>
    </div>
  );
}
