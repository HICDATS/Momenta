import type { AppSettings, SportType } from '../types';

export const DEFAULT_SPORT_TYPES: SportType[] = [
  {
    id: 'fitness',
    name: '健身',
    icon: 'Dumbbell',
    color: '#FF6B6B',
    isDefault: true,
    order: 1,
  },
  {
    id: 'basketball',
    name: '篮球',
    icon: 'Basketball',
    color: '#FF9F43',
    isDefault: true,
    order: 2,
  },
  {
    id: 'running',
    name: '跑步',
    icon: 'Footprints',
    color: '#00B894',
    isDefault: true,
    order: 3,
  },
  {
    id: 'swimming',
    name: '游泳',
    icon: 'Waves',
    color: '#0984E3',
    isDefault: true,
    order: 4,
  },
  {
    id: 'yoga',
    name: '瑜伽',
    icon: 'Flower',
    color: '#6C5CE7',
    isDefault: true,
    order: 5,
  },
  {
    id: 'cycling',
    name: '骑行',
    icon: 'Bike',
    color: '#FDCB6E',
    isDefault: true,
    order: 6,
  },
  {
    id: 'badminton',
    name: '羽毛球',
    icon: 'Circle',
    color: '#00CEC9',
    isDefault: true,
    order: 7,
  },
  {
    id: 'table_tennis',
    name: '乒乓球',
    icon: 'Table',
    color: '#D63031',
    isDefault: true,
    order: 8,
  },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  restDays: [0, 6],
  smartReminderEnabled: true,
  smartReminderThreshold: 2,
  theme: 'system',
};
