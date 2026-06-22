import { Outlet } from 'react-router-dom';
import { Navigation } from '../Navigation/Navigation';
import styles from './Layout.module.css';

export function Layout(): JSX.Element {
  return (
    <div className={styles.layout}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <Navigation />
    </div>
  );
}
