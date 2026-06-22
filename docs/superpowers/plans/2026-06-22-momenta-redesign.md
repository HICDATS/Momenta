# Momenta 视觉重塑 — 运动场晨光 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 替换 Momenta 现有视觉为"运动场晨光"方向，引入 Fraunces 衬线 + 5 token 纯色板 + 12×7 纯色阶梯热图 + 顶部能量条签名元素，不动数据流/测试结构/文案。

**Architecture:** 仅 CSS + 1 个新组件 (Heatmap)。颜色/字体 token 集中在 `variables.css`；Google Fonts 通过 `index.html` 引入并 `font-display: swap`；热图作为纯展示组件，从父级接收 `checkIns` props；能量条由 Home 页面管理本地 state（仅在打卡成功时出现 3.4s）。所有改动遵循现有 CSS Modules 模式，不引入新依赖。

**Tech Stack:** React 18 + TypeScript + CSS Modules + Vite 6 + Vitest + React Testing Library + date-fns (已有)

## Global Constraints

来自 spec 的硬性要求（每个任务自动继承）：

- **零渐变**：所有颜色变化必须用纯色阶（step 或离散切换），禁止 `linear-gradient` / `radial-gradient` / `color-mix` 渐变填充
- **零模糊辉光**：禁止 `box-shadow` 半径 > 4px 或 `filter: blur()` 用于装饰
- **零缩放/旋转动画**：禁止 `transform: scale()` / `rotate()` 用于装饰
- **零 hover 动画**：禁止 `:hover` 改变 `transform` / `box-shadow` / `background`
- **唯一被允许的动画**：能量条 `width 0→100%` 线性 0.6s、Toast `translateY(16px)→0` 0.25s ease-out、热图格子 `step-end` 跳变、StreakDisplay 文字 opacity 0→1 0.6s 间隔 80ms 出现、热图格子逐列 opacity 0→1 0.3s 间隔 30ms
- **Reduced motion**：所有动画在 `prefers-reduced-motion: reduce` 下变为 0.01s
- **零新依赖**：不安装新包
- **测试**：所有现有 442 测试必须通过；新增 Heatmap ≥ 8 个测试
- **构建**：`npm run build` 必须成功
- **代码规范**：TS 严格模式（已有 `tsconfig.app.json` strict），2 空格缩进，单引号，分号，组件 ≤ 200 行
- **不动**：`utils/`、`hooks/`、`db/`、`types/`、`context/`、所有测试文件、所有 i18n 文案、路由结构
- **新组件**：仅 `src/components/Heatmap/`

### Color Tokens (全局)

```css
--ink-900: #1F1B16;     /* 主文字 / 图标 / active 描边 */
--paper-50: #FAF6F0;    /* 全局背景 */
--ember-500: #FF6B6B;   /* 品牌主色 / 数字 / 热图 8+ 步阶 */
--ember-700: #E64C4C;   /* 强调 / 今日格子描边 */
--fog-300: #C7BEB2;     /* 辅助 / 分隔线 / 未打卡格子描边 */
```

### Typography Tokens (全局)

```css
--font-display: 'Fraunces', Georgia, serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
```

Fraunces weights: 300, 400, 700 + opsz 14..144。Inter weights: 400, 500, 600。

---

## File Structure

### 修改文件 (10)

| File | Responsibility |
|------|----------------|
| `index.html` | 引入 Google Fonts preconnect + Fraunces/Inter 链接 |
| `src/styles/variables.css` | 替换色板 + 字体变量 |
| `src/styles/global.css` | 改 body 背景为 paper-50，更新字体引用 |
| `src/components/Layout/Layout.module.css` | 容器宽度 420px |
| `src/components/StreakDisplay/StreakDisplay.tsx` + `.module.css` | 重做为"连续 X 天"衬线大字 |
| `src/components/StatsCard/StatsCard.tsx` + `.module.css` | 冷静的 label-数字 对 |
| `src/components/QuickCheckIn/QuickCheckIn.tsx` + `.module.css` | 体育方格纯色描边 + 触发能量条回调 |
| `src/components/CheckInCard/CheckInCard.module.css` | 边框/间距/字体 |
| `src/components/Navigation/Navigation.module.css` | active ember-700 描边 |
| `src/components/common/Toast/Toast.module.css` | 弹入动画 |
| `src/components/common/Modal/Modal.module.css` | 淡出动画 |
| `src/pages/Home/Home.tsx` + `.module.css` | eyebrow + 整合 Heatmap + 能量条触发 |

### 新增文件 (3)

| File | Responsibility |
|------|----------------|
| `src/components/Heatmap/Heatmap.tsx` | 纯展示组件，接收 checkIns 渲染 12×7 网格 |
| `src/components/Heatmap/Heatmap.module.css` | 5 状态纯色阶梯 + 入场动画 |
| `src/components/Heatmap/Heatmap.test.tsx` | ≥ 8 个测试 |

### 不动

- 所有 `utils/`、`hooks/`、`db/`、`types/`、`context/` 目录
- 所有现有测试文件（除新增 Heatmap.test.tsx）
- 所有现有 i18n 文案
- 路由结构
- `vite.config.ts`、所有 `tsconfig*.json`、`vitest.setup.ts`

---

## Task 1: 引入 Google Fonts

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: 无
- Produces: 浏览器可解析的 HTML head，含 Fraunces + Inter 字体

- [ ] **Step 1: 修改 `index.html`**

在 `<head>` 内，`<title>` 之前，添加 preconnect + 字体链接：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" theme-color="#FF6B6B" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <title>Momenta - 运动打卡</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

注：保持 `lang="zh-CN"`，不修改 `<body>` 内容。

- [ ] **Step 2: 验证 HTML 合法**

运行：
```bash
cat index.html
```

预期：输出包含 `<link rel="preconnect" href="https://fonts.googleapis.com" />` 和 Fraunces/Inter 字体链接。

- [ ] **Step 3: 提交**

```bash
git add index.html
git commit -m "feat: 引入 Google Fonts (Fraunces + Inter) 预连接"
```

---

## Task 2: 替换 variables.css 的色板与字体 token

**Files:**
- Modify: `src/styles/variables.css`

**Interfaces:**
- Consumes: 无
- Produces: 5 个新颜色 token (`--ink-900`、`--paper-50`、`--ember-500`、`--ember-700`、`--fog-300`) + 2 个字体 token (`--font-display`、`--font-body`)，同时保留旧 token 名以便兼容现有组件（标记 deprecated）

- [ ] **Step 1: 写失败测试 — 验证新 token 存在**

创建 `tests/unit/tokens.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const variables = readFileSync(
  resolve(__dirname, '../../src/styles/variables.css'),
  'utf-8',
);

describe('design tokens', () => {
  it('defines 5 color tokens', () => {
    expect(variables).toMatch(/--ink-900:\s*#1F1B16/);
    expect(variables).toMatch(/--paper-50:\s*#FAF6F0/);
    expect(variables).toMatch(/--ember-500:\s*#FF6B6B/);
    expect(variables).toMatch(/--ember-700:\s*#E64C4C/);
    expect(variables).toMatch(/--fog-300:\s*#C7BEB2/);
  });

  it('defines 2 font tokens', () => {
    expect(variables).toMatch(/--font-display:\s*'Fraunces'/);
    expect(variables).toMatch(/--font-body:\s*'Inter'/);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

运行：
```bash
npx vitest run tests/unit/tokens.test.ts
```

预期：FAIL，"--ink-900" / "--font-display" 等 token 不存在。

- [ ] **Step 3: 重写 `src/styles/variables.css`**

完全替换文件内容为：

```css
:root {
  /* === 运动场晨光 · 5 token 纯色板 === */
  --ink-900: #1F1B16;
  --paper-50: #FAF6F0;
  --ember-500: #FF6B6B;
  --ember-700: #E64C4C;
  --fog-300: #C7BEB2;

  /* === 字体 === */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

  /* === 兼容旧 token（被新 token 取代，逐步迁移） === */
  --color-primary: var(--ember-500);
  --color-primary-hover: var(--ember-700);
  --color-primary-light: rgba(255, 107, 107, 0.12);
  --color-text: var(--ink-900);
  --color-text-secondary: #5C5751;
  --color-text-light: var(--fog-300);
  --color-bg: var(--paper-50);
  --color-bg-white: var(--paper-50);
  --color-bg-card: var(--paper-50);
  --color-success: #4A7C59;
  --color-warning: #B8860B;
  --color-danger: var(--ember-700);
  --color-info: #5A6B7C;
  --color-overlay: rgba(31, 27, 22, 0.4);

  /* === 间距 === */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* === 字号 === */
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-md: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 40px;
  --font-size-display: 64px;

  /* === 字重 === */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* === 圆角 === */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-full: 9999px;

  /* === 阴影（仅用于分隔，无辉光） === */
  --shadow-hairline: inset 0 0 0 1px var(--fog-300);

  /* === 布局 === */
  --nav-height: 64px;
  --max-width: 420px;
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --heatmap-cell: 14px;
  --heatmap-gap: 2px;
}
```

注意：`--color-bg-white` 映射到 `--paper-50`（不再有纯白）；圆角全部缩小（锐化）；阴影仅保留内描边式（无模糊）。

- [ ] **Step 4: 运行测试，确认通过**

运行：
```bash
npx vitest run tests/unit/tokens.test.ts
```

预期：PASS。

- [ ] **Step 5: 运行全部测试**

```bash
npx vitest run
```

预期：442 个测试仍全部通过（token 是向下兼容的，旧组件仍可读到 `--color-primary` 等）。

- [ ] **Step 6: 提交**

```bash
git add src/styles/variables.css tests/unit/tokens.test.ts
git commit -m "feat(tokens): 替换色板与字体 token 为运动场晨光方案"
```

---

## Task 3: 更新 global.css 字体与背景

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Task 2 的新 token
- Produces: 全局 `body` 应用 paper-50 背景 + Fraunces/Inter 字体 + reduced motion 支持

- [ ] **Step 1: 写失败测试 — 验证 body 引用了 paper-50 与新字体**

更新 `tests/unit/tokens.test.ts`，追加测试：

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const variables = readFileSync(
  resolve(__dirname, '../../src/styles/variables.css'),
  'utf-8',
);
const global = readFileSync(
  resolve(__dirname, '../../src/styles/global.css'),
  'utf-8',
);

describe('design tokens', () => {
  it('defines 5 color tokens', () => {
    expect(variables).toMatch(/--ink-900:\s*#1F1B16/);
    expect(variables).toMatch(/--paper-50:\s*#FAF6F0/);
    expect(variables).toMatch(/--ember-500:\s*#FF6B6B/);
    expect(variables).toMatch(/--ember-700:\s*#E64C4C/);
    expect(variables).toMatch(/--fog-300:\s*#C7BEB2/);
  });

  it('defines 2 font tokens', () => {
    expect(variables).toMatch(/--font-display:\s*'Fraunces'/);
    expect(variables).toMatch(/--font-body:\s*'Inter'/);
  });

  it('global.css applies paper-50 background', () => {
    expect(global).toMatch(/background-color:\s*var\(--paper-50\)/);
  });

  it('global.css applies font-body token', () => {
    expect(global).toMatch(/font-family:\s*var\(--font-body\)/);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx vitest run tests/unit/tokens.test.ts
```

预期：后两条测试 FAIL。

- [ ] **Step 3: 重写 `src/styles/global.css`**

完全替换文件内容为：

```css
/* === 基础重置 === */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  font-size: 16px;
  font-family: var(--font-body);
}

body {
  font-family: var(--font-body);
  font-size: var(--font-size-md);
  color: var(--ink-900);
  background-color: var(--paper-50);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'kern' 1, 'liga' 1, 'tnum' 0;
}

button, a, input, select, textarea {
  min-height: 44px;
  font-family: inherit;
}

ul, ol { list-style: none; }

a {
  color: inherit;
  text-decoration: none;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  padding: 0;
}

img { max-width: 100%; display: block; }

#root {
  min-height: 100vh;
  max-width: var(--max-width);
  margin: 0 auto;
  background-color: var(--paper-50);
}

/* === 焦点环 === */
:focus-visible {
  outline: 1px solid var(--ember-500);
  outline-offset: 2px;
}

/* === 减少动效 === */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
npx vitest run tests/unit/tokens.test.ts
```

预期：PASS。

- [ ] **Step 5: 运行全部测试**

```bash
npx vitest run
```

预期：442 个测试仍全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/styles/global.css tests/unit/tokens.test.ts
git commit -m "feat(styles): 应用 paper-50 背景与 Fraunces/Inter 字体"
```

---

## Task 4: 容器宽度 420px

**Files:**
- Modify: `src/components/Layout/Layout.module.css`

**Interfaces:**
- Consumes: Task 2 的 `--max-width: 420px`（已设）
- Produces: Layout 容器最大宽度生效

> 注意：`--max-width` 已在 Task 2 改为 `420px`，`#root` 已在 Task 3 引用此 token。Layout 文件可能不再需要改 max-width。验证一下。

- [ ] **Step 1: 检查 Layout.module.css 是否仍需要改**

读取 `src/components/Layout/Layout.module.css`：

```bash
cat src/components/Layout/Layout.module.css
```

- [ ] **Step 2: 如果文件使用 `var(--max-width)`，无需改动**

预期：`.layout` 类使用 `max-width: var(--max-width);`，则 Task 2 的 token 变更已生效，跳到 Step 4。

- [ ] **Step 3: 如果文件使用硬编码 `480px`，改为 `var(--max-width)`**

替换为：

```css
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: var(--max-width);
  margin: 0 auto;
  background-color: var(--paper-50);
}

.content {
  flex: 1 1 auto;
  padding-bottom: calc(var(--nav-height) + var(--safe-area-bottom));
  width: 100%;
}
```

- [ ] **Step 4: 提交（如有改动）**

```bash
git add src/components/Layout/Layout.module.css
git commit -m "refactor(layout): 使用 --max-width token（已为 420px）"
```

> 如果无改动，跳过 commit。

---

## Task 5: Heatmap 组件 — 纯色阶梯（5 状态）

**Files:**
- Create: `src/components/Heatmap/Heatmap.tsx`
- Create: `src/components/Heatmap/Heatmap.module.css`
- Create: `src/components/Heatmap/Heatmap.test.tsx`

**Interfaces:**
- Consumes: `CheckIn[]` props（已有类型）
- Produces: 12 列 × 7 行的网格，每格根据当日打卡状态显示 5 种视觉状态之一

`Heatmap` 组件签名：

```typescript
interface HeatmapProps {
  checkIns: CheckIn[];
  weeks?: number; // 默认 12
  restDays?: number[]; // 默认 [0, 6]
}
```

- [ ] **Step 1: 写失败测试 — Heatmap 渲染 12×7 网格**

创建 `src/components/Heatmap/Heatmap.test.tsx`：

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heatmap } from './Heatmap';
import type { CheckIn } from '../../types';

const baseCheckIn: CheckIn = {
  id: '1',
  sportType: 'running',
  timestamp: Date.now(),
  createdAt: Date.now(),
};

describe('Heatmap', () => {
  it('renders a 12x7 grid (84 cells)', () => {
    const { container } = render(<Heatmap checkIns={[]} />);
    const cells = container.querySelectorAll('[data-testid="heatmap-cell"]');
    expect(cells.length).toBe(84);
  });

  it('uses semantic role="grid" with aria-label', () => {
    render(<Heatmap checkIns={[]} />);
    const grid = screen.getByRole('grid', { name: /过去 12 周打卡情况/ });
    expect(grid).toBeInTheDocument();
  });

  it('marks today with data-cell-today attribute', () => {
    const { container } = render(<Heatmap checkIns={[]} />);
    const today = container.querySelector('[data-cell-today="true"]');
    expect(today).toBeInTheDocument();
  });

  it('marks cell with 1 day streak as level-1', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const checkIns: CheckIn[] = [
      { ...baseCheckIn, timestamp: today.getTime() },
    ];
    const { container } = render(<Heatmap checkIns={checkIns} />);
    const today = container.querySelector('[data-cell-today="true"]');
    expect(today).toHaveAttribute('data-cell-level', '1');
  });

  it('marks cell with 4 day streak as level-3', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const checkIns: CheckIn[] = [
      { ...baseCheckIn, id: '1', timestamp: today.getTime() },
      { ...baseCheckIn, id: '2', timestamp: today.getTime() - 86400000 },
      { ...baseCheckIn, id: '3', timestamp: today.getTime() - 2 * 86400000 },
      { ...baseCheckIn, id: '4', timestamp: today.getTime() - 3 * 86400000 },
    ];
    const { container } = render(<Heatmap checkIns={checkIns} />);
    const cell = container.querySelector('[data-cell-today="true"]');
    expect(cell).toHaveAttribute('data-cell-level', '3');
  });

  it('marks cell with 8 day streak as level-4 with paper border', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const checkIns: CheckIn[] = Array.from({ length: 8 }, (_, i) => ({
      ...baseCheckIn,
      id: String(i),
      timestamp: today.getTime() - i * 86400000,
    }));
    const { container } = render(<Heatmap checkIns={checkIns} />);
    const cell = container.querySelector('[data-cell-today="true"]');
    expect(cell).toHaveAttribute('data-cell-level', '4');
    expect(cell).toHaveClass(/paperEdge/);
  });

  it('unregistered days render as level-0 with fog border', () => {
    const { container } = render(<Heatmap checkIns={[]} />);
    const cell = container.querySelector('[data-cell-today="true"]');
    expect(cell).toHaveAttribute('data-cell-level', '0');
  });

  it('respects custom weeks prop', () => {
    const { container } = render(<Heatmap checkIns={[]} weeks={4} />);
    const cells = container.querySelectorAll('[data-testid="heatmap-cell"]');
    expect(cells.length).toBe(28);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx vitest run src/components/Heatmap/Heatmap.test.tsx
```

预期：FAIL，"Cannot find module './Heatmap'"。

- [ ] **Step 3: 实现 Heatmap 组件**

创建 `src/components/Heatmap/Heatmap.tsx`：

```typescript
import { useMemo } from 'react';
import { getDayKey } from '../../utils/dateUtils';
import { calculateStreakAt } from '../../utils/streakCalculator';
import type { CheckIn } from '../../types';
import styles from './Heatmap.module.css';

interface HeatmapProps {
  checkIns: CheckIn[];
  weeks?: number;
  restDays?: number[];
}

const DEFAULT_WEEKS = 12;
const DEFAULT_REST_DAYS = [0, 6];
const MILLIS_PER_DAY = 86_400_000;

type Level = 0 | 1 | 2 | 3 | 4;

function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface Cell {
  date: number;
  level: Level;
  isToday: boolean;
}

function buildCells(
  checkIns: CheckIn[],
  weeks: number,
  restDays: number[],
): Cell[][] {
  const today = startOfDay(Date.now());
  const totalDays = weeks * 7;
  const days: number[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    days.push(today - i * MILLIS_PER_DAY);
  }

  const byDate = new Map<string, CheckIn[]>();
  for (const c of checkIns) {
    const key = getDayKey(c.timestamp);
    const list = byDate.get(key) ?? [];
    list.push(c);
    byDate.set(key, list);
  }

  const columns: Cell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = days[w * 7 + d];
      const dayKey = getDayKey(date);
      const dayOfWeek = new Date(date).getDay();
      const isToday = date === today;
      const isRestDay = restDays.includes(dayOfWeek);

      if (byDate.has(dayKey)) {
        const streakAt = calculateStreakAt(
          checkIns,
          date,
          isRestDay ? restDays : [],
        );
        const level: Level =
          streakAt >= 8 ? 4 :
          streakAt >= 4 ? 3 :
          streakAt >= 2 ? 2 :
          1;
        col.push({ date, level, isToday });
      } else {
        col.push({ date, level: 0, isToday });
      }
    }
    columns.push(col);
  }
  return columns;
}

export function Heatmap({
  checkIns,
  weeks = DEFAULT_WEEKS,
  restDays = DEFAULT_REST_DAYS,
}: HeatmapProps): JSX.Element {
  const cells = useMemo(
    () => buildCells(checkIns, weeks, restDays),
    [checkIns, weeks, restDays],
  );

  return (
    <div
      className={styles.heatmap}
      role="grid"
      aria-label="过去 12 周打卡情况"
      data-testid="heatmap"
    >
      {cells.map((col, ci) => (
        <div key={ci} className={styles.column}>
          {col.map((cell) => {
            const levelClass = styles[`level${cell.level}`];
            const todayClass = cell.isToday ? styles.today : '';
            const paperEdgeClass = cell.level === 4 ? styles.paperEdge : '';
            return (
              <div
                key={cell.date}
                className={`${styles.cell} ${levelClass} ${todayClass} ${paperEdgeClass}`.trim()}
                data-testid="heatmap-cell"
                data-cell-today={cell.isToday}
                data-cell-level={cell.level}
                data-cell-date={new Date(cell.date).toISOString()}
                role="gridcell"
                aria-label={`${new Date(cell.date).toLocaleDateString('zh-CN')} ${
                  cell.level === 0 ? '未打卡' : `连续 ${cell.level} 天`
                }`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 在 streakCalculator 添加工具函数（避免动现有 useStreak）**

读取 `src/utils/streakCalculator.ts`，添加（如果不存在）：

```typescript
export function calculateStreakAt(
  checkIns: CheckIn[],
  atTimestamp: number,
  restDays: number[],
): number {
  // 计算到 atTimestamp 当天为止的连续打卡天数（含 atTimestamp 自身若已打卡）
  // 不破坏现有 calculateStreak / calculateMaxStreak / isStreakActive 签名
  // ...
}
```

> **重要**：如果 `calculateStreakAt` 不存在，需要先写一个失败测试，再实现最小逻辑，再通过测试。**这里要先** `cat src/utils/streakCalculator.ts` 看现有 API 是否有可复用的 helper；如果没有 `calculateStreakAt`，新建一个纯函数（不动现有 3 个），并写它的单元测试。

- [ ] **Step 5: 实现 `calculateStreakAt` 的测试与实现**

`tests/unit/streakCalculator.test.ts`（如已存在则追加）：

```typescript
describe('calculateStreakAt', () => {
  it('returns 0 when no checkIns on or before the date', () => {
    expect(calculateStreakAt([], Date.now(), [])).toBe(0);
  });

  it('returns 1 when only the target date has a checkIn', () => {
    const t = new Date('2026-06-22T10:00:00').getTime();
    const cis: CheckIn[] = [{ id: '1', sportType: 'x', timestamp: t, createdAt: t }];
    expect(calculateStreakAt(cis, t, [])).toBe(1);
  });

  it('returns 4 when target and previous 3 days all checked in', () => {
    const t = new Date('2026-06-22T10:00:00').getTime();
    const cis: CheckIn[] = [0, 1, 2, 3].map((i) => ({
      id: String(i),
      sportType: 'x',
      timestamp: t - i * 86_400_000,
      createdAt: t,
    }));
    expect(calculateStreakAt(cis, t, [])).toBe(4);
  });

  it('skips rest days in the streak count', () => {
    const sunday = new Date('2026-06-21T10:00:00').getTime();
    const monday = new Date('2026-06-22T10:00:00').getTime();
    const cis: CheckIn[] = [monday, sunday - 86_400_000 * 4, sunday - 86_400_000 * 5].map(
      (ts, i) => ({ id: String(i), sportType: 'x', timestamp: ts, createdAt: ts }),
    );
    // [0, 6] 周日和周六是休息日，连续 1 天 (周一)
    expect(calculateStreakAt(cis, monday, [0, 6])).toBe(1);
  });
});
```

`src/utils/streakCalculator.ts` 添加：

```typescript
export function calculateStreakAt(
  checkIns: CheckIn[],
  atTimestamp: number,
  restDays: number[],
): number {
  if (checkIns.length === 0) return 0;
  const target = new Date(atTimestamp);
  target.setHours(0, 0, 0, 0);
  const targetTime = target.getTime();

  const dayKeys = new Set(checkIns.map((c) => getDayKey(c.timestamp)));
  let count = 0;
  let cursor = targetTime;

  // 包含目标日（若已打卡）
  if (dayKeys.has(getDayKey(cursor))) {
    count++;
  }

  // 向前逐日计数，跳过休息日
  while (true) {
    cursor -= 86_400_000;
    const dayKey = getDayKey(cursor);
    const dow = new Date(cursor).getDay();
    if (restDays.includes(dow)) continue;
    if (dayKeys.has(dayKey)) {
      count++;
    } else {
      break;
    }
  }

  return count;
}
```

确认 imports 包含 `CheckIn` 和 `getDayKey`。

- [ ] **Step 6: 实现 Heatmap 样式**

创建 `src/components/Heatmap/Heatmap.module.css`：

```css
.heatmap {
  display: flex;
  flex-direction: row;
  gap: var(--heatmap-gap);
  padding: var(--spacing-sm) 0;
  overflow-x: auto;
}

.column {
  display: flex;
  flex-direction: column;
  gap: var(--heatmap-gap);
}

.cell {
  width: var(--heatmap-cell);
  height: var(--heatmap-cell);
  box-sizing: border-box;
  transition: none;
}

/* 5 个状态 */
.level0 {
  background-color: var(--paper-50);
  border: 1px solid var(--fog-300);
}

.level1 {
  background-color: rgba(255, 107, 107, 0.22);
  border: 1px solid transparent;
}

.level2 {
  background-color: rgba(255, 107, 107, 0.55);
  border: 1px solid transparent;
}

.level3 {
  background-color: var(--ember-500);
  border: 1px solid transparent;
}

.level4 {
  background-color: var(--ember-500);
  border: 1px solid transparent;
  box-shadow: inset 0 0 0 1px var(--paper-50);
}

.paperEdge {
  box-shadow: inset 0 0 0 1px var(--paper-50);
}

.today {
  border-color: var(--ember-700) !important;
}

/* 入场：逐列 opacity 0→1，间隔 30ms */
.heatmap .column {
  opacity: 0;
  animation: columnIn 0.3s linear forwards;
}
.heatmap .column:nth-child(1)  { animation-delay: 0ms;   }
.heatmap .column:nth-child(2)  { animation-delay: 30ms;  }
.heatmap .column:nth-child(3)  { animation-delay: 60ms;  }
.heatmap .column:nth-child(4)  { animation-delay: 90ms;  }
.heatmap .column:nth-child(5)  { animation-delay: 120ms; }
.heatmap .column:nth-child(6)  { animation-delay: 150ms; }
.heatmap .column:nth-child(7)  { animation-delay: 180ms; }
.heatmap .column:nth-child(8)  { animation-delay: 210ms; }
.heatmap .column:nth-child(9)  { animation-delay: 240ms; }
.heatmap .column:nth-child(10) { animation-delay: 270ms; }
.heatmap .column:nth-child(11) { animation-delay: 300ms; }
.heatmap .column:nth-child(12) { animation-delay: 330ms; }

@keyframes columnIn {
  to { opacity: 1; }
}
```

- [ ] **Step 7: 运行 Heatmap 测试，确认通过**

```bash
npx vitest run src/components/Heatmap/Heatmap.test.tsx tests/unit/streakCalculator.test.ts
```

预期：全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add src/components/Heatmap/ src/utils/streakCalculator.ts tests/unit/streakCalculator.test.ts
git commit -m "feat(heatmap): 12x7 纯色阶梯热图 + calculateStreakAt 工具"
```

---

## Task 6: StreakDisplay 重做为"连续 X 天"

**Files:**
- Modify: `src/components/StreakDisplay/StreakDisplay.tsx`
- Modify: `src/components/StreakDisplay/StreakDisplay.module.css`

**Interfaces:**
- Consumes: `useStreak` 返回的 `{ currentStreak, maxStreak, isStreakActive }`
- Produces: 衬线"连续 X 天"大字 + eyebrow 副标 + 入场动画

- [ ] **Step 1: 写失败测试 — 验证"连续"和天数同时显示**

读取 `tests/integration/fullApp.test.tsx`，找到 StreakDisplay 相关测试，确认现有断言。如果现有断言查 "连续打卡 X 天" 等旧文案，先**更新断言**而非删测试。

在 `src/components/StreakDisplay/StreakDisplay.test.tsx`（如不存在则新建）：

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakDisplay } from './StreakDisplay';
import type { CheckIn } from '../../types';

const today = new Date();
today.setHours(10, 0, 0, 0);
const T = today.getTime();

const make = (offsetDays: number, id: string): CheckIn => ({
  id,
  sportType: 'running',
  timestamp: T - offsetDays * 86_400_000,
  createdAt: T,
});

describe('StreakDisplay', () => {
  it('renders "连续" label and big number', () => {
    render(<StreakDisplay checkIns={[]} />);
    expect(screen.getByText('连续')).toBeInTheDocument();
  });

  it('renders 0 when no records', () => {
    render(<StreakDisplay checkIns={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders 7 for a 7-day streak', () => {
    const cis: CheckIn[] = [0, 1, 2, 3, 4, 5, 6].map((i) => make(i, String(i)));
    render(<StreakDisplay checkIns={cis} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx vitest run src/components/StreakDisplay/StreakDisplay.test.tsx
```

预期：FAIL（如果文件不存在）或"找不到 '连续' 文字"。

- [ ] **Step 3: 重写 `StreakDisplay.tsx`**

```typescript
import type { CheckIn } from '../../types';
import { useStreak } from '../../hooks/useStreak';
import styles from './StreakDisplay.module.css';

interface StreakDisplayProps {
  checkIns: CheckIn[];
}

const NO_RECORDS_LABEL = '开始你的第一次打卡吧';

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function StreakDisplay({ checkIns }: StreakDisplayProps): JSX.Element {
  const { currentStreak, maxStreak, isStreakActive } = useStreak(checkIns);
  const hasRecords = checkIns.length > 0;
  const lastCheckIn = checkIns
    .map((c) => c.timestamp)
    .sort((a, b) => b - a)[0];
  const subline = hasRecords && isStreakActive && currentStreak > 0
    ? `已完成今日训练 · ${formatTime(lastCheckIn)}`
    : hasRecords
      ? '已中断 · 等你回来'
      : NO_RECORDS_LABEL;
  const showStatus = hasRecords ? (isStreakActive ? '进行中' : '已中断') : '';

  return (
    <div className={styles.container}>
      <div className={styles.label}>连续</div>
      <div className={styles.number}>{currentStreak}</div>
      <div className={styles.unit}>天</div>
      {hasRecords ? (
        <>
          <div className={styles.statusRow}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.statusText}>{showStatus}</span>
            <span className={styles.maxStreak}>· 最高 {maxStreak} 天</span>
          </div>
          <div className={styles.subline}>{subline}</div>
        </>
      ) : (
        <div className={styles.subline}>{subline}</div>
      )}
    </div>
  );
}
```

> 移除原 `<Flame>` icon 和 `isStreakActive` 的火焰颜色（按 spec：火苗改为小装饰性方块 `statusDot`）。

- [ ] **Step 4: 重写 `StreakDisplay.module.css`**

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs);
  padding: var(--spacing-lg) 0;
  position: relative;
}

.label {
  font-family: var(--font-display);
  font-weight: 300;
  font-variation-settings: 'opsz' 14;
  font-size: 28px;
  line-height: 1;
  color: var(--ink-900);
  letter-spacing: -0.01em;
  opacity: 0;
  animation: inkIn 0.6s linear forwards;
  animation-delay: 0ms;
}

.number {
  font-family: var(--font-display);
  font-weight: 700;
  font-variation-settings: 'opsz' 144;
  font-size: var(--font-size-display);
  line-height: 0.92;
  color: var(--ember-500);
  letter-spacing: -0.025em;
  opacity: 0;
  animation: inkIn 0.6s linear forwards;
  animation-delay: 80ms;
}

.unit {
  position: absolute;
  top: 28px;
  left: 88px;
  font-family: var(--font-display);
  font-weight: 300;
  font-variation-settings: 'opsz' 14;
  font-size: 20px;
  color: var(--ink-900);
  opacity: 0;
  animation: inkIn 0.6s linear forwards;
  animation-delay: 80ms;
}

.statusRow {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--ink-900);
  margin-top: var(--spacing-sm);
}

.statusDot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: var(--ember-500);
}

.statusText {
  color: var(--ink-900);
}

.maxStreak {
  color: var(--fog-300);
}

.subline {
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  color: var(--fog-300);
  margin-top: var(--spacing-xs);
}

@keyframes inkIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

> 注意：`.unit` 用绝对定位放在数字右边 88px（视情况微调），保留"7天"连写的视觉感。

- [ ] **Step 5: 运行 StreakDisplay + 集成测试**

```bash
npx vitest run src/components/StreakDisplay/ tests/integration/fullApp.test.tsx
```

预期：全部通过（需要同步更新全应用测试里的旧文案断言）。

- [ ] **Step 6: 提交**

```bash
git add src/components/StreakDisplay/
git commit -m "feat(streak): 重做为 Fraunces '连续 X 天' 衬线大字"
```

---

## Task 7: StatsCard 重做为冷静 label-数字 对

**Files:**
- Modify: `src/components/StatsCard/StatsCard.tsx`
- Modify: `src/components/StatsCard/StatsCard.module.css`

- [ ] **Step 1: 重写 `StatsCard.tsx`**

```typescript
import type { CheckIn } from '../../types';
import { useStats } from '../../hooks/useStats';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  checkIns: CheckIn[];
}

const STAT_ITEMS = [
  { key: 'weekCount', label: '本周' },
  { key: 'monthCount', label: '本月' },
  { key: 'totalCount', label: '累计' },
] as const;

export function StatsCard({ checkIns }: StatsCardProps): JSX.Element {
  const { weekCount, monthCount, totalCount } = useStats(checkIns);
  const counts = { weekCount, monthCount, totalCount };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {STAT_ITEMS.map((item) => (
          <div key={item.key} className={styles.card}>
            <span className={styles.number}>{counts[item.key]}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

> 移除"动起来吧"空状态提示（按 spec：让 StatsCard 始终冷静显示三个数字，由 Home 处理空态）。

- [ ] **Step 2: 重写 `StatsCard.module.css`**

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs);
}

.number {
  font-family: var(--font-body);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-xl);
  line-height: 1;
  color: var(--ink-900);
  font-variant-numeric: tabular-nums;
}

.label {
  font-family: var(--font-body);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-xs);
  color: var(--fog-300);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run src/components/StatsCard/ tests/integration/
```

预期：全部通过（如果旧测试查"动起来吧"，更新断言或删除该断言）。

- [ ] **Step 4: 提交**

```bash
git add src/components/StatsCard/
git commit -m "feat(stats): 重做为冷静 label-数字 对（无卡片背景）"
```

---

## Task 8: Home 页面整合 Heatmap + Eyebrow + 能量条

**Files:**
- Modify: `src/pages/Home/Home.tsx`
- Modify: `src/pages/Home/Home.module.css`

**Interfaces:**
- Consumes: `useCheckIns`（已有）、`Heatmap`（新）、本地 state `showEnergyBar`
- Produces: 顶部 eyebrow 日期 → 能量条 → StreakDisplay → Heatmap → StatsCard → 分割线 → QuickCheckIn → 最近打卡

- [ ] **Step 1: 写失败测试 — Home 渲染 Heatmap 和 eyebrow**

更新 `tests/integration/fullApp.test.tsx` 中首页断言，追加：

```typescript
it('首页显示热图和日期 eyebrow', async () => {
  // ... setup
  expect(screen.getByTestId('heatmap')).toBeInTheDocument();
  // eyebrow 包含 "WED" 或 "周三" 字样（按浏览器 locale）
  expect(screen.getByTestId('home-eyebrow')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx vitest run tests/integration/fullApp.test.tsx
```

预期：FAIL，"heatmap" 找不到。

- [ ] **Step 3: 重写 `Home.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCheckIns } from '../../hooks/useCheckIns';
import { StreakDisplay } from '../../components/StreakDisplay/StreakDisplay';
import { StatsCard } from '../../components/StatsCard/StatsCard';
import { Heatmap } from '../../components/Heatmap/Heatmap';
import { QuickCheckIn } from '../../components/QuickCheckIn/QuickCheckIn';
import { formatDateTime } from '../../utils/dateUtils';
import { DEFAULT_SPORT_TYPES } from '../../constants/sports';
import styles from './Home.module.css';

const RECENT_PREVIEW_COUNT = 3;
const LOADING_TEXT = '加载中...';
const ERROR_PREFIX = '加载失败：';
const EMPTY_TEXT = '还没有打卡记录，快去运动吧！';
const RECENT_TITLE = '最近打卡';
const VIEW_ALL = '查看全部';
const TODAY_LABEL = '今日运动';

const ENERGY_BAR_TOTAL_MS = 3400;
const ENERGY_BAR_FADE_MS = 400;

function formatEyebrow(timestamp: number): string {
  const d = new Date(timestamp);
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[d.getDay()]} · ${d.getDate()} ${months[d.getMonth()]}`;
}

export function Home(): JSX.Element {
  const { checkIns, loading, error, refresh } = useCheckIns();
  const recentCheckIns = checkIns.slice(0, RECENT_PREVIEW_COUNT);
  const [showEnergyBar, setShowEnergyBar] = useState(false);

  useEffect(() => {
    if (!showEnergyBar) return;
    const fadeTimer = setTimeout(() => {
      setShowEnergyBar(false);
    }, ENERGY_BAR_TOTAL_MS);
    return () => clearTimeout(fadeTimer);
  }, [showEnergyBar]);

  const handleCheckInComplete = (): void => {
    setShowEnergyBar(true);
    void refresh();
  };

  return (
    <div className={styles.home} data-testid="page-home">
      <h1 className={styles.srOnly}>首页</h1>
      {loading ? (
        <p className={styles.loading}>{LOADING_TEXT}</p>
      ) : error ? (
        <p className={styles.error}>{ERROR_PREFIX}{error}</p>
      ) : (
        <>
          <div className={styles.eyebrow} data-testid="home-eyebrow">
            <span className={styles.eyebrowMark} aria-hidden="true" />
            <span>{formatEyebrow(Date.now())}</span>
          </div>

          {showEnergyBar && (
            <div
              className={styles.energyBar}
              data-testid="energy-bar"
              role="presentation"
            />
          )}

          <StreakDisplay checkIns={checkIns} />
          <Heatmap checkIns={checkIns} />
          <StatsCard checkIns={checkIns} />

          <div className={styles.divider}>
            <span className={styles.dividerText}>{TODAY_LABEL}</span>
          </div>

          <QuickCheckIn onCheckInComplete={handleCheckInComplete} />

          <section className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{RECENT_TITLE}</h2>
              <Link to="/history" className={styles.viewAll}>
                {VIEW_ALL}
              </Link>
            </div>
            {recentCheckIns.length > 0 ? (
              <ul className={styles.recentList} data-testid="recent-list">
                {recentCheckIns.map((checkIn) => {
                  const sport = DEFAULT_SPORT_TYPES.find(
                    (s) => s.id === checkIn.sportType,
                  );
                  return (
                    <li key={checkIn.id} className={styles.recentItem}>
                      <span className={styles.sportName}>
                        {sport?.name ?? checkIn.sportType}
                      </span>
                      <span className={styles.checkInTime}>
                        {formatDateTime(checkIn.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.emptyText}>{EMPTY_TEXT}</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
```

> 注意：`QuickCheckIn` 当前签名是 `onCheckInComplete?: (checkIn: CheckIn) => void`，需要确认或在 Task 9 修改。

- [ ] **Step 4: 重写 `Home.module.css`**

```css
.home {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  padding-bottom: var(--spacing-xl);
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-family: var(--font-display);
  font-weight: 400;
  font-variation-settings: 'opsz' 14;
  font-size: var(--font-size-xs);
  color: var(--ink-900);
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.eyebrowMark {
  display: inline-block;
  width: 4px;
  height: 4px;
  background-color: var(--ink-900);
}

.energyBar {
  height: 1.5px;
  background-color: var(--ember-500);
  transform-origin: left center;
  animation: energyFill 0.6s linear forwards, energyFade 0.4s linear 3s forwards;
  width: 100%;
}

@keyframes energyFill {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

@keyframes energyFade {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.divider {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: var(--spacing-md) 0 var(--spacing-sm);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--fog-300);
}

.dividerText {
  font-family: var(--font-display);
  font-weight: 400;
  font-variation-settings: 'opsz' 14;
  font-size: var(--font-size-xs);
  color: var(--ink-900);
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.loading {
  margin: var(--spacing-xl) 0;
  text-align: center;
  font-size: var(--font-size-md);
  color: var(--fog-300);
}

.error {
  margin: var(--spacing-xl) 0;
  padding: var(--spacing-md);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--ember-700);
  border: 1px solid var(--fog-300);
}

.recentSection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sectionTitle {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-variation-settings: 'opsz' 14;
  font-size: var(--font-size-sm);
  color: var(--ink-900);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.viewAll {
  font-size: var(--font-size-sm);
  color: var(--ember-500);
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.recentList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.recentItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--fog-300);
}

.recentItem:last-child {
  border-bottom: none;
}

.sportName {
  font-family: var(--font-body);
  font-size: var(--font-size-md);
  color: var(--ink-900);
  font-weight: var(--font-weight-medium);
}

.checkInTime {
  font-size: var(--font-size-sm);
  color: var(--fog-300);
}

.emptyText {
  margin: 0;
  padding: var(--spacing-lg) 0;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--fog-300);
}
```

- [ ] **Step 5: 运行所有测试**

```bash
npx vitest run
```

预期：全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/pages/Home/
git commit -m "feat(home): 整合 eyebrow / Heatmap / 能量条触发"
```

---

## Task 9: QuickCheckIn 改为纯色描边方格 + 触发回调

**Files:**
- Modify: `src/components/QuickCheckIn/QuickCheckIn.tsx`
- Modify: `src/components/QuickCheckIn/QuickCheckIn.module.css`

**Interfaces:**
- Consumes: `onCheckInComplete?: (checkIn: CheckIn) => void`（已有）
- Produces: 8 个方格，纯色描边，触发时调用 onCheckInComplete（已被 Home 监听以触发能量条）

- [ ] **Step 1: 修改 `QuickCheckIn.tsx`**

只改模态标题"确认打卡"为"今 × × ×"（sport name 由 selectedSport 渲染，无需改）。主要改样式。

> 如果 props 类型已经正确传 `checkIn`，无需改 .tsx。

- [ ] **Step 2: 重写 `QuickCheckIn.module.css`**

```css
.container {
  padding: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.sportButton {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-sm);
  min-height: 64px;
  background-color: transparent;
  border: 1px solid var(--fog-300);
  transition: none;
  cursor: pointer;
}

.sportButton:active {
  border-color: var(--ember-700);
}

.icon {
  width: 28px;
  height: 28px;
}

.name {
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  color: var(--ink-900);
}

.checkInForm {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.sportInfo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.modalIcon {
  width: 28px;
  height: 28px;
}

.sportName {
  font-family: var(--font-display);
  font-weight: 700;
  font-variation-settings: 'opsz' 144;
  font-size: var(--font-size-xl);
  color: var(--ink-900);
}

.timeDisplay {
  font-size: var(--font-size-sm);
  color: var(--fog-300);
}

.noteInput {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--fog-300);
  border-radius: 0;
  background-color: transparent;
  font-size: var(--font-size-sm);
  font-family: inherit;
  resize: vertical;
  min-height: 44px;
  color: var(--ink-900);
}

.noteInput:focus {
  border-color: var(--ember-500);
  outline: none;
}

.error {
  color: var(--ember-700);
  font-size: var(--font-size-sm);
}

.actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.cancelButton,
.confirmButton {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-body);
  min-height: 44px;
  background-color: transparent;
  border: 1px solid var(--fog-300);
  color: var(--ink-900);
  cursor: pointer;
  transition: none;
}

.confirmButton {
  background-color: var(--ember-500);
  border-color: var(--ember-500);
  color: var(--paper-50);
}

.cancelButton:active,
.confirmButton:active {
  opacity: 0.7;
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/QuickCheckIn/
git commit -m "feat(checkin): 纯色描边方格 + 锐化按钮"
```

---

## Task 10: CheckInCard / Navigation / Toast / Modal 微调

**Files:**
- Modify: `src/components/CheckInCard/CheckInCard.module.css`
- Modify: `src/components/Navigation/Navigation.module.css`
- Modify: `src/components/common/Toast/Toast.module.css`
- Modify: `src/components/common/Modal/Modal.module.css`

- [ ] **Step 1: 重写 `CheckInCard.module.css`**

```css
.card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--fog-300);
}

.iconWrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--fog-300);
  flex-shrink: 0;
}

.icon {
  width: 20px;
  height: 20px;
}

.content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sportName {
  font-family: var(--font-body);
  font-size: var(--font-size-md);
  color: var(--ink-900);
  font-weight: var(--font-weight-medium);
}

.time {
  font-size: var(--font-size-xs);
  color: var(--fog-300);
}

.note {
  font-size: var(--font-size-sm);
  color: var(--fog-300);
  font-style: italic;
}

.deleteButton {
  background: none;
  border: none;
  padding: var(--spacing-xs);
  color: var(--fog-300);
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deleteButton:active {
  color: var(--ember-700);
}

.deleteIcon {
  width: 18px;
  height: 18px;
}
```

- [ ] **Step 2: 重写 `Navigation.module.css`**

```css
.nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(var(--nav-height) + var(--safe-area-bottom));
  padding-bottom: var(--safe-area-bottom);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background-color: var(--paper-50);
  border-top: 1px solid var(--fog-300);
  z-index: 100;
  max-width: var(--max-width);
  margin: 0 auto;
}

.navItem {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  color: var(--fog-300);
  text-decoration: none;
  font-size: var(--font-size-xs);
  font-family: var(--font-body);
  transition: none;
  border-top: 1px solid transparent;
}

.active {
  color: var(--ember-700);
  border-top-color: var(--ember-700);
}

.icon {
  width: 22px;
  height: 22px;
}

.label {
  font-size: var(--font-size-xs);
  line-height: 1;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 3: 重写 `Toast.module.css`**

```css
.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--nav-height) + var(--safe-area-bottom) + var(--spacing-md));
  transform: translateX(-50%) translateY(16px);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--ink-900);
  color: var(--paper-50);
  font-size: var(--font-size-sm);
  font-family: var(--font-body);
  z-index: 300;
  opacity: 0;
  animation: toastIn 0.25s ease-out forwards;
  max-width: calc(100% - var(--spacing-lg) * 2);
  text-align: center;
}

.success {
  background-color: var(--ember-500);
  color: var(--paper-50);
}

.error {
  background-color: var(--ember-700);
  color: var(--paper-50);
}

.info {
  background-color: var(--ink-900);
  color: var(--paper-50);
}

@keyframes toastIn {
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}
```

- [ ] **Step 4: 重写 `Modal.module.css`**

```css
.backdrop {
  position: fixed;
  inset: 0;
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--spacing-md);
  animation: backdropIn 0.15s linear forwards;
}

.modal {
  background-color: var(--paper-50);
  border: 1px solid var(--ink-900);
  padding: var(--spacing-lg);
  width: 100%;
  max-width: 380px;
  animation: modalIn 0.15s linear forwards;
}

.title {
  font-family: var(--font-display);
  font-weight: 700;
  font-variation-settings: 'opsz' 144;
  font-size: var(--font-size-xl);
  color: var(--ink-900);
  margin-bottom: var(--spacing-md);
}

.content {
  color: var(--ink-900);
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
}

@keyframes backdropIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes modalIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

- [ ] **Step 5: 运行全部测试**

```bash
npx vitest run
```

预期：全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/components/CheckInCard/ src/components/Navigation/ src/components/common/Toast/ src/components/common/Modal/
git commit -m "feat(cards): CheckInCard/Navigation/Toast/Modal 锐化与无阴影化"
```

---

## Task 11: 构建与可视化验证

**Files:**
- 无文件改动

- [ ] **Step 1: 运行构建**

```bash
npm run build
```

预期：成功生成 `dist/`，无 TS 错误，gzip 增量在 30KB 内。

- [ ] **Step 2: 本地预览**

```bash
npm run preview &
sleep 3
curl -s http://localhost:4173/ | head -20
kill %1
```

预期：返回的 HTML 含 `<link rel="preconnect"` 和 `/assets/index-*.js` 脚本。

- [ ] **Step 3: 运行全部测试**

```bash
npx vitest run
```

预期：所有测试 PASS（应 ≥ 450 个：442 原 + 8 新增）。

- [ ] **Step 4: 提交（如有任何未提交改动）**

```bash
git status
# 如果有改动：
git add -A
git commit -m "chore: build verification"
```

---

## Task 12: 部署与端到端验证

**Files:**
- 无文件改动

- [ ] **Step 1: 推送到 GitHub**

```bash
git push
```

预期：所有 commit 推送到 `main`。

- [ ] **Step 2: 等待 Netlify 自动部署完成**

在 Netlify Dashboard 观察：
- `npm install` 成功（无 ETARGET 错误）
- `npm run build` 成功
- 部署 URL 仍为 `https://flourishing-gelato-7a1c45.netlify.app/`

- [ ] **Step 3: 浏览器验证首页**

抓取部署后的 HTML 并验证关键元素：

```bash
curl -s https://flourishing-gelato-7a1c45.netlify.app/ | grep -E '(Fraunces|Inter|pwa-192|pwa-512)'
```

预期：HTML 含 Fraunces + Inter 字体引用；含 PWA 图标引用。

- [ ] **Step 4: 用户在手机端验证**

让用户在手机上：
1. 删除旧的 PWA 快捷方式
2. 重新打开网站
3. 添加到主屏幕
4. 验证：图标是橙底白勾圆角图标（不是纯色方块）
5. 验证：首页顶部是"连续 X 天"衬线大字
6. 验证：热图显示 12×7 网格
7. 验证：点击运动 → 打卡后出现能量条（1.5px 橙色从左到右填满 0.6s，保持 ~2.4s，fade out）

- [ ] **Step 5: 提交验证记录**

```bash
git log --oneline -12
```

确认所有 commit 都在远程。

---

## Self-Review

**1. Spec coverage**:
- §1 设计信条 → 整个 plan 都遵守（无渐变、无辉光等）
- §2 配色 5 token → Task 2
- §3 字体 2 个 → Task 1 (引入) + Task 2 (token) + Task 3 (应用)
- §4 布局 12×7 + 入场动画 → Task 5 (Heatmap) + Task 8 (Home 整合)
- §5 签名元素能量条 → Task 8 (CSS) + Task 8 (Home state) + Task 9 (QuickCheckIn 触发)
- §6 改动文件清单 → 全部 Task 都对应
- §7 兼容性 → Task 3 (reduced motion) + Task 11 (构建) + Task 12 (端到端)
- §8 不做什么 → 整个 plan 未引入新依赖、未改 utils/hooks/db/types/context/路由

**2. Placeholder scan**: 未发现 TBD/TODO。

**3. Type consistency**:
- `HeatmapProps` 在 Task 5 定义并在 Task 8 使用 ✓
- `CheckIn` 类型来自 `src/types/index.ts`，未改动 ✓
- `calculateStreakAt` 签名在 Task 5 定义并在 Task 5 Heatmap 内部使用 ✓
- `onCheckInComplete?: (checkIn: CheckIn) => void` 在 Task 9 引用，与 QuickCheckIn 现有签名一致 ✓

通过。
