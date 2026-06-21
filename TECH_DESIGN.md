# Momenta - 技术设计文档

> 根据PRD确定用什么技术、怎么组织代码、数据怎么存储。

## 技术栈

| 层级 | 技术选择 | 版本 | 选择理由 |
|------|----------|------|----------|
| 前端框架 | React | ^18.3.1 | AI代码生成支持最好，组件化完美匹配5页面需求，声明式UI代码简洁 |
| 构建工具 | Vite | ^6.0.0 | 极速冷启动、即时热更新、内置PWA插件支持 |
| 路由 | React Router DOM | ^7.1.0 | 声明式路由、支持PWA历史模式、代码分割 |
| 状态管理 | React Context + useReducer | 内置 | 本项目复杂度足够，无需引入Redux/Zustand等外部状态管理 |
| 数据存储 | Dexie.js | ^4.0.10 | IndexedDB的Promise封装，API如操作数组般简洁，支持索引查询 |
| 图表 | Recharts | ^2.15.0 | React原生图表库，声明式配置，与React数据流无缝集成 |
| PWA | Vite PWA Plugin | ^0.21.0 | 一行配置自动生成Service Worker、Manifest、离线缓存、图标生成 |
| 日期处理 | date-fns | ^4.1.0 | 轻量、模块化、不可变，比moment.js更适合tree-shaking |
| 样式 | CSS Modules | 内置 | 组件级样式隔离，无命名冲突，无需引入CSS-in-JS库 |
| 图标 | Lucide React | ^0.469.0 | 轻量、现代、支持tree-shaking，与React完美集成 |
| 类型检查 | TypeScript | ^5.6.3 | 编译时类型检查，减少运行时错误，提升AI代码生成质量 |
| 测试 | Vitest | ^2.1.0 | 与Vite原生集成，支持React Testing Library，极速执行 |
| 部署 | GitHub Pages / Vercel | - | 免费、自动CI/CD、支持HTTPS（PWA推送通知必需） |

### 核心依赖清单

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.0",
    "dexie": "^4.0.10",
    "recharts": "^2.15.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.469.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "typescript": "^5.6.3",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "jsdom": "^25.0.0"
  }
}
```

## 项目结构

```
momenta/
├── public/                          # 静态资源
│   └── icons/                       # PWA图标（由vite-plugin-pwa自动生成）
├── src/
│   ├── components/                  # 可复用组件
│   │   ├── Layout/                  # 布局组件
│   │   │   ├── Layout.tsx           # 主布局（底部导航 + 内容区）
│   │   │   └── Layout.module.css
│   │   ├── Navigation/              # 底部导航栏
│   │   │   ├── Navigation.tsx
│   │   │   └── Navigation.module.css
│   │   ├── QuickCheckIn/            # 快速打卡组件（首页核心）
│   │   │   ├── QuickCheckIn.tsx
│   │   │   └── QuickCheckIn.module.css
│   │   ├── CheckInCard/             # 打卡记录卡片（历史页）
│   │   │   ├── CheckInCard.tsx
│   │   │   └── CheckInCard.module.css
│   │   ├── StreakDisplay/           # Streak展示组件
│   │   │   ├── StreakDisplay.tsx
│   │   │   └── StreakDisplay.module.css
│   │   ├── AchievementBadge/        # 成就徽章组件
│   │   │   ├── AchievementBadge.tsx
│   │   │   └── AchievementBadge.module.css
│   │   ├── StatsChart/              # 统计图表组件
│   │   │   ├── StatsChart.tsx
│   │   │   └── StatsChart.module.css
│   │   ├── GoalProgress/            # 目标进度条组件
│   │   │   ├── GoalProgress.tsx
│   │   │   └── GoalProgress.module.css
│   │   └── common/                  # 通用小组件
│   │       ├── Button/
│   │       ├── Modal/
│   │       ├── Toast/
│   │       └── ConfirmDialog/
│   ├── pages/                       # 页面组件
│   │   ├── Home/                    # 首页（Dashboard）
│   │   │   ├── Home.tsx
│   │   │   └── Home.module.css
│   │   ├── History/                 # 历史记录页
│   │   │   ├── History.tsx
│   │   │   └── History.module.css
│   │   ├── Achievements/            # 成就页
│   │   │   ├── Achievements.tsx
│   │   │   └── Achievements.module.css
│   │   ├── Statistics/              # 统计页
│   │   │   ├── Statistics.tsx
│   │   │   └── Statistics.module.css
│   │   └── Settings/                # 设置页
│   │       ├── Settings.tsx
│   │       └── Settings.module.css
│   ├── hooks/                       # 自定义Hooks
│   │   ├── useCheckIns.ts           # 打卡记录CRUD操作
│   │   ├── useStreak.ts             # Streak计算逻辑
│   │   ├── useAchievements.ts       # 成就解锁逻辑
│   │   ├── useGoals.ts              # 目标追踪逻辑
│   │   ├── useStats.ts              # 统计数据计算
│   │   ├── useReminders.ts          # 提醒设置管理
│   │   └── useNotifications.ts      # 浏览器推送通知
│   ├── context/                     # React Context
│   │   └── AppContext.tsx           # 全局状态（当前页面、主题等）
│   ├── db/                          # 数据库层
│   │   └── database.ts              # Dexie数据库定义、表结构
│   ├── types/                       # TypeScript类型定义
│   │   └── index.ts                 # 所有类型集中导出
│   ├── utils/                       # 工具函数
│   │   ├── dateUtils.ts             # 日期处理（周/月计算、格式化）
│   │   ├── streakCalculator.ts      # Streak核心计算算法
│   │   └── validators.ts            # 输入验证
│   ├── constants/                   # 常量
│   │   ├── sports.ts                # 预设运动类型列表
│   │   ├── achievements.ts          # 成就定义
│   │   └── reminders.ts             # 提醒默认配置
│   ├── styles/                      # 全局样式
│   │   ├── variables.css            # CSS变量（颜色、间距、字体）
│   │   ├── global.css               # 全局基础样式
│   │   └── animations.css           # 动画定义
│   ├── App.tsx                      # 根组件（路由配置）
│   ├── main.tsx                     # 入口文件
│   └── vite-env.d.ts                # Vite类型声明
├── tests/                           # 测试文件
│   ├── unit/                        # 单元测试
│   │   ├── streakCalculator.test.ts # Streak算法测试（核心）
│   │   ├── dateUtils.test.ts        # 日期工具测试
│   │   └── validators.test.ts       # 验证逻辑测试
│   └── integration/                 # 集成测试
│       └── checkInFlow.test.tsx     # 完整打卡流程测试
├── index.html                       # HTML入口
├── vite.config.ts                   # Vite配置（含PWA插件）
├── tsconfig.json                    # TypeScript配置
├── tsconfig.app.json                # 应用TS配置
├── tsconfig.node.json               # Node TS配置
├── package.json
└── README.md
```

## 数据模型

### CheckIn（打卡记录）

```typescript
interface CheckIn {
  id: string;              // UUID，主键
  sportType: string;       // 运动类型（如"健身"、"篮球"）
  timestamp: number;       // 打卡时间戳（毫秒）
  note?: string;           // 备注（可选，最多100字）
  createdAt: number;       // 记录创建时间戳（毫秒）
}
```

**Dexie表定义**：
```typescript
interface CheckIn {
  id: string;
  sportType: string;
  timestamp: number;
  note?: string;
  createdAt: number;
}

class MomentaDB extends Dexie {
  checkIns!: Table<CheckIn>;
  
  constructor() {
    super('MomentaDB');
    this.version(1).stores({
      checkIns: '++id, sportType, timestamp, [sportType+timestamp]'
    });
  }
}
```

**索引说明**：
- `++id`：自增主键
- `sportType`：按运动类型查询（筛选功能）
- `timestamp`：按时间范围查询（历史列表、统计）
- `[sportType+timestamp]`：复合索引（按类型+时间联合查询）

### SportType（运动类型）

```typescript
interface SportType {
  id: string;              // 唯一标识（如"fitness"、"basketball"）
  name: string;            // 显示名称（如"健身"、"篮球"）
  icon: string;            // Lucide图标名称
  color: string;           // 主题色（hex）
  isDefault: boolean;      // 是否预设类型（预设不可删除）
  order: number;           // 显示排序
}
```

**存储方式**：localStorage（数据量小，不经常变动）

### Achievement（成就）

```typescript
interface Achievement {
  id: string;              // 唯一标识（如"first-checkin"）
  name: string;            // 成就名称
  description: string;     // 成就描述
  icon: string;            // Lucide图标名称
  condition: AchievementCondition; // 解锁条件
  unlockedAt?: number;     // 解锁时间戳（未解锁为undefined）
}

type AchievementCondition = 
  | { type: 'total_count'; sportType?: string; count: number }
  | { type: 'streak_days'; days: number }
  | { type: 'monthly_count'; count: number }
  | { type: 'sport_variety'; count: number }
  | { type: 'goal_complete' };
```

**存储方式**：localStorage（成就定义是静态的，解锁状态需要持久化）

### Reminder（提醒设置）

```typescript
interface Reminder {
  id: string;              // UUID
  sportType?: string;      // 关联的运动类型（可选，null表示任意运动）
  days: number[];          // 提醒日期 [0, 1, 2, 3, 4, 5, 6]（0=周日）
  hour: number;            // 小时 (0-23)
  minute: number;          // 分钟 (0-59)
  message: string;         // 提醒文案
  enabled: boolean;        // 是否启用
  skipIfCheckedIn: boolean;// 当天已打卡则跳过
}
```

**存储方式**：localStorage + Service Worker定时检查

### Goal（运动目标）

```typescript
interface Goal {
  id: string;              // UUID
  sportType?: string;      // 目标运动类型（null表示任意运动）
  period: 'weekly' | 'monthly'; // 周期
  targetCount: number;     // 目标次数
  createdAt: number;       // 创建时间
}
```

**存储方式**：localStorage

### AppSettings（应用设置）

```typescript
interface AppSettings {
  restDays: number[];      // 每周休息日 [0, 6]（0=周日，6=周六）
  smartReminderEnabled: boolean; // 智能提醒开关
  smartReminderThreshold: number; // 超期阈值（天数，默认2）
  theme: 'light' | 'dark' | 'system'; // 主题设置
}
```

**存储方式**：localStorage

### 数据模型关系

```
CheckIn (多) → SportType (1)  [通过sportType字段关联]
CheckIn (多) → Achievement (多) [通过解锁条件计算关联]
CheckIn (多) → Goal (多) [通过sportType和period计算关联]
Reminder (独立) → CheckIn (通过时间计算是否已打卡)
```

## API设计

本项目为纯前端应用，无后端API。所有数据操作通过Dexie.js（IndexedDB）和localStorage直接进行。

## 关键技术点

### 1. Streak连续打卡算法

**算法描述**：

```typescript
function calculateStreak(checkIns: CheckIn[], restDays: number[]): number {
  if (checkIns.length === 0) return 0;
  
  // 按日期去重（同一天多次打卡只算一天）
  const uniqueDays = new Set(
    checkIns.map(c => format(startOfDay(c.timestamp), 'yyyy-MM-dd'))
  );
  
  const today = startOfDay(Date.now());
  const yesterday = subDays(today, 1);
  
  let streak = 0;
  let currentDay = today;
  
  // 如果今天还没打卡，从昨天开始算
  if (!uniqueDays.has(format(today, 'yyyy-MM-dd'))) {
    currentDay = yesterday;
  }
  
  while (true) {
    const dayStr = format(currentDay, 'yyyy-MM-dd');
    const dayOfWeek = getDay(currentDay); // 0=周日, 6=周六
    
    if (uniqueDays.has(dayStr)) {
      streak++;
      currentDay = subDays(currentDay, 1);
    } else if (restDays.includes(dayOfWeek)) {
      // 休息日，不中断Streak，但也不算入Streak
      currentDay = subDays(currentDay, 1);
    } else {
      // 非休息日且无打卡，Streak中断
      break;
    }
  }
  
  return streak;
}
```

**测试要点**：
- 连续3天打卡 → Streak=3
- 连续3天后休息1天（设为休息日）再打卡 → Streak=4
- 连续3天后非休息日中断 → Streak=0
- 今天未打卡但昨天有 → Streak保持（今天还没过完）
- 首次使用无记录 → Streak=0

### 2. 浏览器推送通知（PWA）

**实现方案**：

```
用户流程：
1. 用户首次设置提醒时 → 申请Notification权限
2. 用户同意 → Service Worker注册Push订阅
3. Service Worker在后台运行定时器（或使用Push API）
4. 到达设定时间 → 检查当天是否已打卡
5. 未打卡 → 显示推送通知
```

**技术细节**：
- 使用Service Worker的`showNotification` API显示本地通知
- 由于纯前端应用无服务器，使用`setInterval`在Service Worker中轮询检查（精确到分钟级别）
- iOS限制：iOS 16.4+ 支持PWA推送，但需用户将App添加到主屏幕
- 降级方案：如果浏览器不支持推送，使用页面可见性API在App打开时显示提醒

**关键代码**：

```typescript
// Service Worker (由vite-plugin-pwa自动生成基础结构，需扩展)
self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_REMINDERS') {
    // 存储提醒配置到Service Worker的缓存
    // 设置定时检查
  }
});

// 定期检查（每分钟）
setInterval(async () => {
  const reminders = await getRemindersFromCache();
  const now = new Date();
  
  for (const reminder of reminders) {
    if (shouldTrigger(reminder, now)) {
      const todayCheckedIn = await checkTodayCheckedIn();
      if (!todayCheckedIn || !reminder.skipIfCheckedIn) {
        self.registration.showNotification('Momenta', {
          body: reminder.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: reminder.id,
          requireInteraction: false
        });
      }
    }
  }
}, 60000);
```

### 3. PWA离线访问

**配置**（vite.config.ts）：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Momenta - 运动打卡',
        short_name: 'Momenta',
        description: '极简运动打卡，记录每一次坚持',
        theme_color: '#FF6B6B',
        background_color: '#F8F9FA',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'cdn-cache' }
          }
        ]
      }
    })
  ]
});
```

### 4. 数据存储策略

**分层存储方案**：

| 数据类型 | 存储方式 | 理由 |
|----------|----------|------|
| 打卡记录（CheckIn） | IndexedDB（Dexie.js） | 数据量大、需要索引查询、支持复杂筛选 |
| 运动类型（SportType） | localStorage | 数据量小、读取频繁、无需索引 |
| 成就（Achievement） | localStorage | 数据量小、需要快速读取解锁状态 |
| 提醒（Reminder） | localStorage + Service Worker | 设置数据在localStorage，触发逻辑在Service Worker |
| 目标（Goal） | localStorage | 数据量小、结构简单 |
| 设置（AppSettings） | localStorage | 键值对配置，localStorage最适合 |

**数据迁移策略**：
- 使用Dexie的数据库版本控制（`db.version(n)`）
- 每次 schema 变更时升级版本号，提供升级回调

### 5. 日期处理规范

**统一使用date-fns**：

```typescript
import { startOfDay, isSameDay, subDays, getDay, format } from 'date-fns';

// 所有日期比较以"天"为单位
function isSameCalendarDay(timestamp1: number, timestamp2: number): boolean {
  return isSameDay(timestamp1, timestamp2);
}

// 获取某天的起始时间戳（用于去重）
function getDayKey(timestamp: number): string {
  return format(startOfDay(timestamp), 'yyyy-MM-dd');
}
```

**时区处理**：
- 所有时间戳以用户本地时区为准
- 不涉及跨时区场景（个人使用，设备在哪里就按哪里的时区）

## 第三方库选择

| 功能 | 库名 | 版本 | 说明 |
|------|------|------|------|
| IndexedDB封装 | Dexie.js | ^4.0.10 | Promise API，支持索引，比原生IndexedDB简洁10倍 |
| 图表 | Recharts | ^2.15.0 | React原生，声明式配置，支持响应式 |
| PWA | Vite PWA Plugin | ^0.21.0 | 自动生成Service Worker、Manifest、图标、离线缓存 |
| 日期处理 | date-fns | ^4.1.0 | 模块化导入，tree-shaking友好 |
| 图标 | Lucide React | ^0.469.0 | 现代简洁，支持tree-shaking |
| 路由 | React Router DOM | ^7.1.0 | 声明式路由，支持PWA历史模式 |
| 测试 | Vitest | ^2.1.0 | Vite原生集成，极速执行 |
| 测试工具 | React Testing Library | ^16.1.0 | 用户行为驱动的组件测试 |

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    用户界面层                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  首页     │ │  历史页   │ │  成就页   │ ...       │
│  │  Home    │ │ History  │ │Achievements│           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │            │            │                    │
│  ┌────┴────────────┴────────────┴────┐              │
│  │           组件层                   │              │
│  │  QuickCheckIn  CheckInCard  ...   │              │
│  └────┬────────────────────────┬─────┘              │
│       │                        │                    │
│  ┌────┴────────────────────────┴─────┐              │
│  │           自定义Hooks层             │              │
│  │  useCheckIns  useStreak  useStats  │              │
│  └────┬────────────────────────┬─────┘              │
│       │                        │                    │
│  ┌────┴────────────────────────┴─────┐              │
│  │         数据/服务层                │              │
│  │  ┌──────────┐    ┌──────────┐    │              │
│  │  │ Dexie.js │    │localStorage│   │              │
│  │  │IndexedDB │    │(配置/设置) │   │              │
│  │  └──────────┘    └──────────┘    │              │
│  └───────────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────┐
│              Service Worker (PWA)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 离线缓存  │  │ 推送通知  │  │ 后台同步  │          │
│  │ 资源缓存  │  │ 定时触发  │  │ (未来)   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### 数据流向

```
用户操作 → 组件事件 → Custom Hook → Dexie.js/localStorage → 状态更新 → 组件重渲染

示例：用户点击"健身"图标打卡
1. QuickCheckIn组件捕获点击事件
2. 调用useCheckIns.addCheckIn({sportType: '健身', timestamp: Date.now()})
3. Dexie.js插入记录到IndexedDB
4. 触发状态更新（React Context或Hook内部state）
5. 订阅该状态的所有组件自动重渲染（StreakDisplay更新、StatsChart更新等）
```

### 状态管理方案

**React Context + Hooks 组合**：

```typescript
// AppContext.tsx
interface AppState {
  // 全局UI状态
  currentPage: string;
  theme: 'light' | 'dark';
  isOffline: boolean;
  
  // 全局数据状态（缓存）
  todayCheckIns: CheckIn[];
  currentStreak: number;
}

// 使用useReducer管理复杂状态更新
```

**各页面独立管理自己的数据**：
- 首页：使用useCheckIns、useStreak、useStats获取数据
- 历史页：使用useCheckIns（带筛选参数）
- 成就页：使用useAchievements
- 统计页：使用useStats
- 设置页：使用useReminders、useGoals

## 开发环境配置

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0（或 yarn >= 1.22.0 / pnpm >= 8.0.0）
- **浏览器**: Chrome 90+ / Safari 14+ / Edge 90+

### 初始化步骤

```bash
# 1. 创建项目
npm create vite@latest momenta -- --template react-ts

# 2. 进入项目
cd momenta

# 3. 安装核心依赖
npm install react-router-dom dexie recharts date-fns lucide-react

# 4. 安装开发依赖
npm install -D @types/react @types/react-dom typescript vite vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom jsdom

# 5. 启动开发服务器
npm run dev
```

### 脚本配置（package.json）

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### VS Code 推荐配置

创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 部署方案

### 方案1：GitHub Pages（推荐，免费）

**优点**：完全免费、与Git仓库集成、自动部署

**步骤**：
1. 代码推送到GitHub仓库
2. 开启GitHub Pages（Settings → Pages → Source: GitHub Actions）
3. 配置GitHub Actions工作流自动构建部署

**GitHub Actions工作流**（`.github/workflows/deploy.yml`）：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 方案2：Vercel（备选，免费）

**优点**：自动HTTPS、全球CDN、零配置部署

**步骤**：
1. 将GitHub仓库连接到Vercel
2. 自动部署，每次push自动更新
3. 自动配置HTTPS（PWA推送通知必需）

### 环境变量

本项目为纯前端应用，**不需要环境变量**。PWA的manifest和配置在构建时确定。

## 风险分析

### 技术风险

| 风险 | 影响 | 概率 | 缓解方案 |
|------|------|------|----------|
| **iOS PWA推送通知限制** | 高 | 中 | iOS 16.4+支持PWA推送，但需添加到主屏幕；降级为App内提醒 |
| **IndexedDB存储限制** | 中 | 低 | 打卡记录占用极小（<1KB/条），即使1000条也仅1MB；提供数据导出功能 |
| **Service Worker缓存失效** | 中 | 中 | 配置vite-plugin-pwa的autoUpdate，用户每次打开自动更新 |
| **浏览器兼容性** | 低 | 低 | 目标浏览器（Chrome/Safari/Edge）均支持所需API |
| **date-fns时区处理** | 低 | 低 | 统一使用本地时区，不涉及跨时区场景 |

### 依赖风险

| 依赖 | 风险 | 缓解方案 |
|------|------|----------|
| vite-plugin-pwa | 停止维护 | 使用社区广泛采用的插件（>10k stars），风险低；如停止维护可手动配置Workbox |
| Dexie.js | 停止维护 | API稳定，IndexedDB标准不变则Dexie长期可用；如停止维护可迁移至原生IndexedDB |
| Recharts | 停止维护 | 图表库众多（Chart.js、Victory等），迁移成本可控 |

### 性能风险

| 风险 | 缓解方案 |
|------|----------|
| 历史记录过多导致加载慢 | 虚拟滚动或分页加载（每次加载50条） |
| 图表渲染卡顿 | 使用Recharts的ResponsiveContainer，数据量过大时采样显示 |
| 首次加载慢 | PWA缓存核心资源，第二次打开无网络请求 |

---

## 用户确认

> ⚠️ **此文档完成后必须经过用户确认，确认通过后方可进入阶段4。**

**核心要点摘要：**
1. **技术栈**：React 18 + Vite + TypeScript + Dexie.js + Recharts + Vite PWA Plugin
2. **项目结构**：components + pages + hooks + db + utils 分层，共5个页面
3. **数据模型**：6个核心模型（CheckIn、SportType、Achievement、Reminder、Goal、AppSettings），CheckIn用IndexedDB，其余用localStorage
4. **关键技术**：Streak算法（核心）、浏览器推送通知、PWA离线缓存、分层存储策略
5. **主要风险**：iOS PWA推送限制（有降级方案）、IndexedDB容量（实际占用极小）
6. **部署**：GitHub Pages免费自动部署

AI操作：
1. 通知用户 `TECH_DESIGN.md` 已写入项目根目录，附简要摘要
2. 重点提醒审阅：技术栈选择（一旦确定较难更换）、项目结构、数据模型
3. 请求确认：*"`TECH_DESIGN.md` 已写入项目根目录，请查看本地文件。请重点审阅技术栈选择和项目结构。"*
4. 等待用户明确回应
5. 如需修改 → 修改后通知已更新并附修改要点，再次请求确认
6. 如技术栈大幅调整 → 评估是否需要回退修改阶段2的PRD
7. 确认通过 → 更新 PROGRESS.md 标记阶段3完成，记录确认结果

**确认记录：**
- 日期：
- 确认结果：⬜ 通过 / ⬜ 需修改（修改内容：______）
- 修改轮次：第 ___ 次确认

---

> 下一步（确认通过后）：基于此文档编写 AGENTS.md（AI代理指令）
