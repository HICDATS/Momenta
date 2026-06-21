import styles from './Home.module.css';

export function Home(): JSX.Element {
  return (
    <div className={styles.home} data-testid="page-home">
      <h1 className={styles.title}>首页</h1>
      <p className={styles.placeholder}>开发中...</p>
    </div>
  );
}
