import styles from './History.module.css';

export function History(): JSX.Element {
  return (
    <div className={styles.history} data-testid="page-history">
      <h1 className={styles.title}>历史</h1>
      <p className={styles.placeholder}>开发中...</p>
    </div>
  );
}
