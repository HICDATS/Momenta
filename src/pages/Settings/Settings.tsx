import styles from './Settings.module.css';

export function Settings(): JSX.Element {
  return (
    <div className={styles.settings} data-testid="page-settings">
      <h1 className={styles.title}>设置</h1>
      <p className={styles.placeholder}>开发中...</p>
    </div>
  );
}
