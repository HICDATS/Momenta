import { NavLink } from 'react-router-dom';
import {
  Home,
  History,
  Trophy,
  BarChart3,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import styles from './Navigation.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: '首页', icon: Home },
  { to: '/history', label: '历史', icon: History },
  { to: '/achievements', label: '成就', icon: Trophy },
  { to: '/statistics', label: '统计', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: SettingsIcon },
];

export function Navigation(): JSX.Element {
  return (
    <nav className={styles.nav} aria-label="主导航">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
          }
        >
          <item.icon className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
