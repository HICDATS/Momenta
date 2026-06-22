import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-checkin',
    name: '初次启航',
    description: '完成首次打卡',
    icon: 'Footprints',
    condition: { type: 'total_count', count: 1 },
  },
  {
    id: 'three-day-streak',
    name: '三日燃',
    description: '连续打卡3天',
    icon: 'Flame',
    condition: { type: 'streak_days', days: 3 },
  },
  {
    id: 'seven-day-streak',
    name: '一周全勤',
    description: '连续打卡7天',
    icon: 'Zap',
    condition: { type: 'streak_days', days: 7 },
  },
  {
    id: 'monthly-20',
    name: '月坚守',
    description: '一个月内打卡20次',
    icon: 'Trophy',
    condition: { type: 'monthly_count', count: 20 },
  },
  {
    id: 'basketball-master',
    name: '篮球达人',
    description: '累计打篮球10次',
    icon: 'Volleyball',
    condition: { type: 'total_count', sportType: 'basketball', count: 10 },
  },
  {
    id: 'fitness-fanatic',
    name: '健身狂人',
    description: '累计健身30次',
    icon: 'Dumbbell',
    condition: { type: 'total_count', sportType: 'fitness', count: 30 },
  },
  {
    id: 'sport-explorer',
    name: '百变运动',
    description: '体验过5种不同运动类型',
    icon: 'Sparkles',
    condition: { type: 'sport_variety', count: 5 },
  },
];
