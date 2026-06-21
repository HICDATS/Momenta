import styles from './Statistics.module.css';

export function Statistics(): JSX.Element {
  return (
    <div className={styles.statistics} data-testid="page-statistics">
      <h1 className={styles.title}>统计</h1>
      <p className={styles.placeholder}>开发中...</p>
    </div>
  );
}
