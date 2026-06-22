export interface CheckIn {
  id: string;
  sportType: string;
  timestamp: number;
  note?: string;
  createdAt: number;
}

export interface SportType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  order: number;
}

export type AchievementCondition =
  | { type: 'total_count'; sportType?: string; count: number }
  | { type: 'streak_days'; days: number }
  | { type: 'monthly_count'; count: number }
  | { type: 'sport_variety'; count: number }
  | { type: 'goal_complete' };

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  unlockedAt?: number;
}

export interface Reminder {
  id: string;
  sportType?: string;
  days: number[];
  hour: number;
  minute: number;
  message: string;
  enabled: boolean;
  skipIfCheckedIn: boolean;
}

export interface Goal {
  id: string;
  sportType?: string;
  period: 'weekly' | 'monthly';
  targetCount: number;
  createdAt: number;
}

export interface AppSettings {
  restDays: number[];
  smartReminderEnabled: boolean;
  smartReminderThreshold: number;
  theme: 'light' | 'dark' | 'system';
}
