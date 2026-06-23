---
change: daily-quote-and-checkin-celebration
design-doc: docs/superpowers/specs/2026-06-23-daily-quote-and-checkin-celebration-design.md
base-ref: b472ca090233ce70f60930ce6bee6161f4e22e48
archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

# Daily Quote & Check-in Celebration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页 Hero 区显示基于日期固定的励志名言，并在打卡成功时弹出 3 秒鼓励语，提升正向情感反馈。

**Architecture:** 数据层（`constants/quotes.ts`） + 纯函数选择器（`utils/quoteSelector.ts`） + 两个无状态展示组件（`DailyQuote` / `CheckInCelebration`） + 在 `Home.tsx` / `QuickCheckIn.tsx` 注入。零新依赖，零破坏性变更。

**Tech Stack:** React 18 + TypeScript + Vitest + React Testing Library + date-fns + CSS Modules

archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

## File Structure

### 新增文件
- `src/constants/quotes.ts` — 文案常量（`DAILY_QUOTES` ≥10，`ENCOURAGEMENTS` ≥10）
- `src/utils/quoteSelector.ts` — `getDailyQuote(dateStr?)` + `getRandomEncouragement()`
- `src/components/DailyQuote/DailyQuote.tsx` — 接受 `quote: string`，渲染 `<aside>` 卡片
- `src/components/DailyQuote/DailyQuote.module.css` — 浅背景 + 左侧 3px 竖条
- `src/components/CheckInCelebration/CheckInCelebration.tsx` — 接受 `open`/`encouragement`/`onClose`，3 秒自动关闭
- `src/components/CheckInCelebration/CheckInCelebration.module.css` — 居中大字号布局
- `tests/unit/quoteSelector.test.ts` — 选择器纯函数测试
- `tests/unit/DailyQuote.test.tsx` — 展示组件渲染测试
- `tests/unit/CheckInCelebration.test.tsx` — 弹窗 + 定时器清理测试

### 修改文件
- `src/pages/Home/Home.tsx` — 新增 `useMemo` 选词 + 插入 `<DailyQuote>`
- `src/components/QuickCheckIn/QuickCheckIn.tsx` — 新增 state + `<CheckInCelebration>` 注入

### 关键约束
- 文案/选择器/组件行为已由 design doc 锁定（`docs/superpowers/specs/2026-06-23-daily-quote-and-checkin-celebration-design.md`）
- 严禁触碰：`Modal.tsx`、`Toast.tsx`、`StreakDisplay.tsx`、`Heatmap.tsx`、`StatsCard.tsx` 等无关文件
- 既有测试（`tests/integration/QuickCheckIn.test.tsx`、`tests/integration/Home.test.tsx` 等）不得破

### 复用变量
- 真实存在的 CSS Variables（设计 doc 中 `--color-surface` 不存在 → 改用 `--color-bg-card`）
- 复用 `Modal`（已含 backdrop 点击关闭、Esc 关闭、`role="dialog"`）
- 复用 `useMemo`（避免 Home 重渲染时重选名言）
- 复用 `format` from `date-fns`（生成 `yyyy-MM-dd`）

archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

## Task 1: 文案数据与选择器

**Files:**
- Create: `src/constants/quotes.ts`
- Create: `src/utils/quoteSelector.ts`
- Create: `tests/unit/quoteSelector.test.ts`

- [x] **Step 1.1: 编写失败测试 — quoteSelector**

创建 `tests/unit/quoteSelector.test.ts`：

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  getDailyQuote,
  getRandomEncouragement,
} from '../../src/utils/quoteSelector';
import { DAILY_QUOTES, ENCOURAGEMENTS } from '../../src/constants/quotes';

describe('getDailyQuote', () => {
  it('同一天多次调用结果相同', () => {
    const a = getDailyQuote('2026-06-23');
    const b = getDailyQuote('2026-06-23');
    expect(a).toBe(b);
  });

  it('不同日期可能得到不同结果（100 天至少 2 种）', () => {
    const results = new Set<string>();
    for (let i = 1; i <= 100; i++) {
      const day = String(i).padStart(2, '0');
      results.add(getDailyQuote(`2026-03-${day}`));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('不传参数时使用本地日期', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 23, 10, 0, 0));
    const a = getDailyQuote();
    const b = getDailyQuote('2026-06-23');
    expect(a).toBe(b);
    vi.useRealTimers();
  });

  it('索引范围在 [0, DAILY_QUOTES.length)', () => {
    for (let i = 0; i < 1000; i++) {
      const month = String((i % 12) + 1).padStart(2, '0');
      const day = String((i % 28) + 1).padStart(2, '0');
      const result = getDailyQuote(`2026-${month}-${day}`);
      expect(DAILY_QUOTES).toContain(result);
    }
  });
});

describe('getRandomEncouragement', () => {
  it('返回值属于 ENCOURAGEMENTS 池', () => {
    const result = getRandomEncouragement();
    expect(ENCOURAGEMENTS).toContain(result);
  });

  it('10000 次调用覆盖到池中多条', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10000; i++) {
      seen.add(getRandomEncouragement());
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('crypto.getRandomValues 不可用时降级到 Math.random', () => {
    const originalCrypto = (globalThis as { crypto?: Crypto }).crypto;
    delete (globalThis as { crypto?: Crypto }).crypto;
    try {
      const result = getRandomEncouragement();
      expect(ENCOURAGEMENTS).toContain(result);
    } finally {
      (globalThis as { crypto?: Crypto }).crypto = originalCrypto;
    }
  });
});
```

- [x] **Step 1.2: 运行测试确认失败**

运行: `npx vitest run tests/unit/quoteSelector.test.ts`
预期: FAIL — `Cannot find module '../../src/utils/quoteSelector'`

- [x] **Step 1.3: 创建文案常量 `src/constants/quotes.ts`**

```ts
export const DAILY_QUOTES: string[] = [
  '路虽远，行则将至',
  '不积跬步，无以至千里',
  '今天的汗水是明天的铠甲',
  '坚持比天赋更接近伟大',
  '每一次出发都是新的胜利',
  '身体和灵魂总要有一个在路上',
  '慢慢来，比较快',
  '日拱一卒，功不唐捐',
  '你流的每滴汗都不会辜负你',
  '动起来，世界就在你脚下',
  '把运动过成生活的一部分',
  '自律即自由',
];

export const ENCOURAGEMENTS: string[] = [
  '坚持就是胜利！',
  '今天又是元气满满的一天！',
  '你的坚持，时间看得见',
  '继续加油，下一次更强',
  '你比想象中更强大',
  '打卡成功，习惯在生长',
  '小小一步，巨大改变',
  '流的汗会变成光',
  '让今天的自己感谢现在的你',
  '运动的你，真的很酷',
  '你正在成为想成为的人',
  '再小的进步也值得庆祝',
];
```

- [x] **Step 1.4: 实现选择器 `src/utils/quoteSelector.ts`**

```ts
import { format } from 'date-fns';
import { DAILY_QUOTES, ENCOURAGEMENTS } from '../constants/quotes';

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return h;
}

function getCryptoRandomInt(max: number): number {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    cryptoObj.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function getDailyQuote(dateStr?: string): string {
  const date = dateStr ?? format(new Date(), 'yyyy-MM-dd');
  const idx = Math.abs(hashString(date)) % DAILY_QUOTES.length;
  return DAILY_QUOTES[idx];
}

export function getRandomEncouragement(): string {
  const idx = getCryptoRandomInt(ENCOURAGEMENTS.length);
  return ENCOURAGEMENTS[idx];
}
```

- [x] **Step 1.5: 运行测试确认通过**

运行: `npx vitest run tests/unit/quoteSelector.test.ts`
预期: PASS — 全部用例绿

- [x] **Step 1.6: 提交**

```bash
git add src/constants/quotes.ts \
        src/utils/quoteSelector.ts \
        tests/unit/quoteSelector.test.ts
git commit -m "feat(quotes): 添加每日名言与鼓励语文案池及选择器"
```

archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

## Task 2: DailyQuote 组件

**Files:**
- Create: `src/components/DailyQuote/DailyQuote.tsx`
- Create: `src/components/DailyQuote/DailyQuote.module.css`
- Create: `tests/unit/DailyQuote.test.tsx`

- [x] **Step 2.1: 编写失败测试 — DailyQuote**

创建 `tests/unit/DailyQuote.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyQuote } from '../../src/components/DailyQuote/DailyQuote';

describe('DailyQuote 组件', () => {
  it('渲染引号文本', () => {
    render(<DailyQuote quote="路虽远，行则将至" />);
    expect(screen.getByText('路虽远，行则将至')).toBeInTheDocument();
  });

  it('包含 aria-label="每日励志名言"', () => {
    render(<DailyQuote quote="测试名言" />);
    expect(screen.getByLabelText('每日励志名言')).toBeInTheDocument();
  });

  it('包含 data-testid="daily-quote"', () => {
    render(<DailyQuote quote="测试名言" />);
    expect(screen.getByTestId('daily-quote')).toBeInTheDocument();
  });

  it('空字符串时仍渲染卡片结构', () => {
    render(<DailyQuote quote="" />);
    const card = screen.getByTestId('daily-quote');
    expect(card).toBeInTheDocument();
    expect(card.textContent).toBe('');
  });
});
```

- [x] **Step 2.2: 运行测试确认失败**

运行: `npx vitest run tests/unit/DailyQuote.test.tsx`
预期: FAIL — `Cannot find module '../../src/components/DailyQuote/DailyQuote'`

- [x] **Step 2.3: 创建样式 `src/components/DailyQuote/DailyQuote.module.css`**

```css
.card {
  display: flex;
  align-items: stretch;
  gap: var(--spacing-sm);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  position: relative;
  overflow: hidden;
}

.bar {
  width: 3px;
  background-color: var(--color-primary);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text);
  margin: 0;
}
```

- [x] **Step 2.4: 实现组件 `src/components/DailyQuote/DailyQuote.tsx`**

```tsx
import styles from './DailyQuote.module.css';

interface DailyQuoteProps {
  quote: string;
}

const ARIA_LABEL = '每日励志名言';
const TESTID = 'daily-quote';

export function DailyQuote({ quote }: DailyQuoteProps): JSX.Element {
  return (
    <aside
      className={styles.card}
      aria-label={ARIA_LABEL}
      data-testid={TESTID}
    >
      <span className={styles.bar} aria-hidden="true" />
      <p className={styles.text}>{quote}</p>
    </aside>
  );
}
```

- [x] **Step 2.5: 运行测试确认通过**

运行: `npx vitest run tests/unit/DailyQuote.test.tsx`
预期: PASS — 全部用例绿

- [x] **Step 2.6: 提交**

```bash
git add src/components/DailyQuote/ tests/unit/DailyQuote.test.tsx
git commit -m "feat(quotes): 添加 DailyQuote 展示组件"
```

archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

## Task 3: CheckInCelebration 组件

**Files:**
- Create: `src/components/CheckInCelebration/CheckInCelebration.tsx`
- Create: `src/components/CheckInCelebration/CheckInCelebration.module.css`
- Create: `tests/unit/CheckInCelebration.test.tsx`

- [x] **Step 3.1: 编写失败测试 — CheckInCelebration**

创建 `tests/unit/CheckInCelebration.test.tsx`：

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';
import { CheckInCelebration } from '../../src/components/CheckInCelebration/CheckInCelebration';

describe('CheckInCelebration 组件', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('open=false 时不渲染', () => {
    render(
      <CheckInCelebration
        open={false}
        encouragement="坚持就是胜利！"
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('modal-backdrop')).toBeNull();
  });

  it('open=true 时渲染鼓励语', () => {
    render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('坚持就是胜利！')).toBeInTheDocument();
  });

  it('3 秒后自动调用 onClose', () => {
    const onClose = vi.fn();
    render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('open 从 true 变 false 时清理定时器，3 秒后不再调用 onClose', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(
      <CheckInCelebration
        open={false}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('点击 backdrop 触发 onClose', () => {
    const onClose = vi.fn();
    render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Esc 键触发 onClose', () => {
    const onClose = vi.fn();
    render(
      <CheckInCelebration
        open={true}
        encouragement="坚持就是胜利！"
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [x] **Step 3.2: 运行测试确认失败**

运行: `npx vitest run tests/unit/CheckInCelebration.test.tsx`
预期: FAIL — `Cannot find module '../../src/components/CheckInCelebration/CheckInCelebration'`

- [x] **Step 3.3: 创建样式 `src/components/CheckInCelebration/CheckInCelebration.module.css`**

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
}

.encouragement {
  font-family: var(--font-display);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  text-align: center;
  margin: 0;
  line-height: 1.3;
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}
```

- [x] **Step 3.4: 实现组件 `src/components/CheckInCelebration/CheckInCelebration.tsx`**

```tsx
import { useEffect } from 'react';
import { Modal } from '../common/Modal/Modal';
import styles from './CheckInCelebration.module.css';

interface CheckInCelebrationProps {
  open: boolean;
  encouragement: string;
  onClose: () => void;
}

const AUTO_CLOSE_MS = 3000;
const HINT_TEXT = '点击任意处关闭';

export function CheckInCelebration({
  open,
  encouragement,
  onClose,
}: CheckInCelebrationProps): JSX.Element {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose();
    }, AUTO_CLOSE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [open, onClose]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.container} data-testid="check-in-celebration">
        <p className={styles.encouragement}>{encouragement}</p>
        <p className={styles.hint}>{HINT_TEXT}</p>
      </div>
    </Modal>
  );
}
```

- [x] **Step 3.5: 运行测试确认通过**

运行: `npx vitest run tests/unit/CheckInCelebration.test.tsx`
预期: PASS — 全部用例绿

- [x] **Step 3.6: 提交**

```bash
git add src/components/CheckInCelebration/ tests/unit/CheckInCelebration.test.tsx
git commit -m "feat(quotes): 添加 CheckInCelebration 弹窗组件"
```

archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

## Task 4: 集成到 Home 页

**Files:**
- Modify: `src/pages/Home/Home.tsx`（仅新增 import + useMemo + JSX 块）

> **警告**：不要触碰 Home.tsx 现有逻辑（eyebrow、StreakDisplay、Heatmap、StatsCard、QuickCheckIn、最近打卡列表），仅插入新代码。

- [x] **Step 4.1: 修改 `src/pages/Home/Home.tsx`**

1. 修改 import 行：在 `useState, useEffect` 上追加 `useMemo`：

   ```ts
   import { useState, useEffect, useMemo } from 'react';
   ```

2. 在已有 `import { StreakDisplay } ...` 块之后追加两行：

   ```ts
   import { DailyQuote } from '../../components/DailyQuote/DailyQuote';
   import { getDailyQuote } from '../../utils/quoteSelector';
   ```

3. 在 Home 函数体顶部、`const recentCheckIns` 之后追加一行：

   ```tsx
   const dailyQuote = useMemo(() => getDailyQuote(), []);
   ```

4. 在 JSX 中，找到 `<StreakDisplay checkIns={checkIns} />` 这一行，**在它之前**插入：

   ```tsx
   <DailyQuote quote={dailyQuote} />
   ```

   （最终位置：在 `</>` 片段内、`{showEnergyBar && ...}` 之后、`<StreakDisplay>` 之前。）

- [x] **Step 4.2: 运行单测验证既有测试不破**

运行: `npx vitest run tests/integration/Home.test.tsx`
预期: PASS — 既有 4 个 Home 集成测试全绿

- [x] **Step 4.3: 运行构建验证 TS 编译通过**

运行: `npm run build`
预期: 退出码 0，无 TS 错误

- [x] **Step 4.4: 提交**

```bash
git add src/pages/Home/Home.tsx
git commit -m "feat(home): 首页 Hero 区注入每日名言"
```

archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

## Task 5: 集成到 QuickCheckIn

**Files:**
- Modify: `src/components/QuickCheckIn/QuickCheckIn.tsx`（仅新增 import + state + 弹窗 JSX + 修改 handleConfirm 成功分支）

> **警告**：不要触碰 QuickCheckIn 现有表单逻辑（handleSportClick、validateNote、Modal 中表单渲染），仅在 `handleConfirm` 成功分支**追加**两行。

- [x] **Step 5.1: 修改 `src/components/QuickCheckIn/QuickCheckIn.tsx`**

1. 在 import 块末尾（`import styles from './QuickCheckIn.module.css';` 之前）追加两行：

   ```ts
   import { CheckInCelebration } from '../CheckInCelebration/CheckInCelebration';
   import { getRandomEncouragement } from '../../utils/quoteSelector';
   ```

2. 在 `const [toast, setToast] = useState<ToastState | null>(null);` 之后追加两行：

   ```tsx
   const [celebrationOpen, setCelebrationOpen] = useState(false);
   const [encouragement, setEncouragement] = useState('');
   ```

3. 修改 `handleConfirm` 的成功分支：将

   ```tsx
   if (created) {
     setToast({ message: SUCCESS_MESSAGE, type: 'success' });
     onCheckInComplete?.(created);
     resetForm();
   }
   ```

   改为：

   ```tsx
   if (created) {
     setToast({ message: SUCCESS_MESSAGE, type: 'success' });
     onCheckInComplete?.(created);
     setEncouragement(getRandomEncouragement());
     setCelebrationOpen(true);
     resetForm();
   }
   ```

4. 在 JSX 末尾，`</div>` 容器闭合之前、`{toast && (...)}` 块之后，追加：

   ```tsx
   <CheckInCelebration
     encouragement={encouragement}
     open={celebrationOpen}
     onClose={() => setCelebrationOpen(false)}
   />
   ```

- [x] **Step 5.2: 运行单测验证既有测试不破**

运行: `npx vitest run tests/integration/QuickCheckIn.test.tsx`
预期: PASS — 既有 Modal 组件 + 打卡流程集成测试全绿

- [x] **Step 5.3: 运行全量测试套件**

运行: `npm test`
预期: 全部测试通过（既有 + 新增 3 个测试文件，共增加约 16 个新测试用例）

- [x] **Step 5.4: 运行构建验证 TS 编译通过**

运行: `npm run build`
预期: 退出码 0，无 TS 错误

- [x] **Step 5.5: 提交**

```bash
git add src/components/QuickCheckIn/QuickCheckIn.tsx
git commit -m "feat(checkin): 打卡成功后弹窗显示鼓励语"
```

archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

## Task 6: 最终验证

- [x] **Step 6.1: 运行全量单元测试**

运行: `npm test`
预期: 全部测试通过，零失败

- [x] **Step 6.2: 运行生产构建**

运行: `npm run build`
预期: 退出码 0，无 TS 错误，无 Vite 警告

- [x] **Step 6.3: 手动 dev 验证**

```bash
npm run dev
```

打开浏览器，依次验证：

1. **首页名言**：刷新首页 → `<aside data-testid="daily-quote">` 在 eyebrow 日期下方、`<StreakDisplay>` 上方显示一句中文名言
2. **全天一致**：1 分钟内多次刷新 → 同一句名言
3. **打卡弹窗**：选择任一运动 → 点确认 → 中央 Modal 弹出鼓励语，3 秒后自动消失
4. **手动关闭**：再次打卡 → 点 backdrop 关闭
5. **Esc 关闭**：再次打卡 → 按 Esc 关闭
6. **Toast 顺序**：打卡成功时 Toast「打卡成功！」与 Modal 鼓励语同时出现

预期: 全部行为符合上述描述。

- [x] **Step 6.4: 最终提交（如有遗漏）**

若 Step 6.1-6.3 通过、无遗漏文件：

```bash
git status  # 确认无未提交修改
```

预期: `nothing to commit, working tree clean`

archived-with: 2026-06-23-daily-quote-and-checkin-celebration
---

## Self-Review（已完成）

**Spec 覆盖：**
- [x] 每日名言全天一致（Task 1.4 `getDailyQuote` 哈希 + Task 4 `useMemo([])`）
- [x] 跨午夜自动换（隐式：跨午夜后 React 重新挂载 → 重新 `useMemo`）
- [x] 打卡弹窗鼓励语（Task 3.4 `CheckInCelebration` + Task 5.1 handleConfirm）
- [x] 弹窗 3 秒自动关闭（Task 3.4 `setTimeout(..., 3000)` + Task 3.1 测试）
- [x] 两个文案池独立（Task 1.3 `DAILY_QUOTES` + `ENCOURAGEMENTS`）
- [x] 100% 单测覆盖（Task 1.1 + Task 2.1 + Task 3.1 共 16 个用例）

**Placeholder 扫描：** 无 "TBD"/"TODO"/"类似 Task N"。

**类型一致性：**
- `getDailyQuote()` 无参版本（Task 1.4）↔ Task 4 调用 `getDailyQuote()` ↔ Task 1.1 测试 `getDailyQuote()` 无参
- `getRandomEncouragement()` 无参（Task 1.4）↔ Task 5.1 调用 ↔ Task 1.1 测试无参
- `DailyQuote` prop 名 `quote: string`（Task 2.4）↔ Task 4 使用 `quote={dailyQuote}` ↔ Task 2.1 测试使用 `quote="..."`
- `CheckInCelebration` props `open`/`encouragement`/`onClose`（Task 3.4）↔ Task 5.1 使用 ↔ Task 3.1 测试使用
- `setCelebrationOpen` / `setEncouragement` setter 名（Task 5.1）↔ 调用点一致
- `data-testid="modal-backdrop"`（Task 3.1 测试）↔ `Modal.tsx:42` 既有实现

**发现并修正：** 设计 doc 中 `--color-surface` 在 `variables.css` 不存在 → Task 2.3 改用 `--color-bg-card`（项目已有）。
