---
comet_change: daily-quote-and-checkin-celebration
role: technical-design
canonical_spec: openspec
archived-with: 2026-06-23-daily-quote-and-checkin-celebration
status: final
---

# Daily Quote & Check-in Celebration — Technical Design

## Context

Momenta 的产品定位是「2 秒完成打卡、习惯养成」。当前首页（`src/pages/Home/Home.tsx`）由数据展示（eyebrow 日期、Streak、热力图、统计卡）和打卡入口（`QuickCheckIn`）组成，缺少情感化激励元素；打卡成功后的反馈仅有简短 Toast「打卡成功！」，正向反馈力度不足。

本次设计在「打开 App」和「完成关键动作」两个时间点注入动力：
1. 首页 Hero 区显示一句基于日期固定、全天一致的励志名言
2. 打卡确认成功后中央弹窗显示一句鼓励语

这是 UI 层 + 工具层的增量变更，不涉及数据模型、路由、状态管理结构。复用现有 `Modal`、`Toast`、CSS Modules、date-fns、React Hooks 体系，零新依赖。

## Goals / Non-Goals

**Goals：**
- 用户每天打开 App 看到一句励志名言，全天一致
- 跨过午夜后再次打开自动换一句
- 打卡确认成功后中央弹窗显示一句鼓励语
- 弹窗 3 秒后自动关闭，也可点击/Esc 关闭
- 两个文案池相互独立（每日名言偏哲理、鼓励语偏庆祝）
- 选择器逻辑 100% 单测覆盖、组件关键交互 100% 单测覆盖

**Non-Goals：**
- 用户自定义名言
- 网络拉取名言
- 多语言支持
- 根据运动类型/Streak 个性化
- 名言收藏/分享
- 修改现有功能（StreakDisplay、QuickCheckIn 业务逻辑、Toast）行为

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  src/constants/quotes.ts                                    │
│  ├─ DAILY_QUOTES: string[]   (≥10 条)                       │
│  └─ ENCOURAGEMENTS: string[] (≥10 条)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ 静态导入
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  src/utils/quoteSelector.ts                                 │
│  ├─ getDailyQuote(dateStr?: string): string                │
│  └─ getRandomEncouragement(): string                        │
└────────────────────┬────────────────────────────────────────┘
                     │ 调用
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────────┐
│  Home.tsx        │    │  QuickCheckIn.tsx        │
│                  │    │                          │
│  getDailyQuote() │    │  getRandomEncouragement()│
│       │          │    │       │                  │
│       ▼          │    │       ▼                  │
│  <DailyQuote />  │    │  <CheckInCelebration />  │
└──────────────────┘    └──────────────────────────┘
```

**关键边界**：
- 数据层（constants）和选择器（utils）是纯函数/静态数据，可独立测试
- `DailyQuote` 和 `CheckInCelebration` 是无状态展示组件，依赖父组件传入数据
- 父组件负责选词、传递 prop、监听关闭回调
- 工具函数在渲染时同步调用（10 条池极小，O(n) 选择无性能问题）

## Components

### DailyQuote (`src/components/DailyQuote/`)

**接口**：
```ts
interface DailyQuoteProps {
  quote: string;
}
```

**渲染**：
- 一个 `<aside>` 元素，`aria-label="每日励志名言"`，`data-testid="daily-quote"`
- 卡片：浅背景（`var(--color-surface)`）、左 3px 竖条（`var(--color-primary)`）、圆角 8px、内边距 12px 16px
- 引言文本：14px、字色 `var(--color-text)`、行高 1.5
- 单一 `quote` 字符串直接渲染，无需截断或换行处理（10+ 条候选都短于 30 字）

**CSS Variables 使用**（遵循 AGENTS.md）：
- `var(--color-primary)` — 左侧色条
- `var(--color-surface)` — 背景色
- `var(--color-text)` — 文字色
- `var(--radius-md)` — 圆角
- `var(--spacing-2)` / `var(--spacing-4)` — 内边距

### CheckInCelebration (`src/components/CheckInCelebration/`)

**接口**：
```ts
interface CheckInCelebrationProps {
  open: boolean;
  encouragement: string;
  onClose: () => void;
}
```

**行为**：
- `open` 为 `true` 时渲染 `<Modal>`，内容为居中大字号鼓励语 + 下方「点击任意处关闭」小字
- `useEffect` 监听 `open`：`open` 变 `true` 时启动 3 秒 `setTimeout`，超时调用 `onClose`；返回的 cleanup 函数 `clearTimeout` 当前定时器
- 复用 `Modal` 已有的 backdrop 点击关闭和 Esc 关闭行为
- 父组件在 `onClose` 中执行 `setCelebrationOpen(false)`，同时弹窗消失

**CSS Variables 使用**：
- `var(--color-primary)` — 鼓励语字色
- `var(--font-size-2xl)` — 大字号
- `var(--spacing-4)` / `var(--spacing-6)` — 内边距

### Home.tsx 集成

```tsx
import { DailyQuote } from '../../components/DailyQuote/DailyQuote';
import { getDailyQuote } from '../../utils/quoteSelector';

// 在 Home 函数体顶部：
const dailyQuote = getDailyQuote();

// 在 JSX 中，eyebrow 下方、StreakDisplay 上方：
<div className={styles.dailyQuoteWrapper}>
  <DailyQuote quote={dailyQuote} />
</div>
```

**为什么用 `useMemo` 包装 `getDailyQuote()`？**
- Home 每次重渲染（如 checkIn 完成后 refresh）都会重新调用 `getDailyQuote()`
- 由于基于本地日期，结果是稳定的（除非跨午夜），但 `useMemo` 避免无意义的重渲染检测
- 实际开销可忽略，但符合 React 优化习惯

```tsx
const dailyQuote = useMemo(() => getDailyQuote(), []);
```

### QuickCheckIn.tsx 集成

```tsx
import { CheckInCelebration } from '../CheckInCelebration/CheckInCelebration';
import { getRandomEncouragement } from '../../utils/quoteSelector';

// 在 QuickCheckIn 函数体顶部，新增 state：
const [celebrationOpen, setCelebrationOpen] = useState(false);
const [encouragement, setEncouragement] = useState('');

// 修改 handleConfirm 成功分支：
if (created) {
  setToast({ message: SUCCESS_MESSAGE, type: 'success' });
  onCheckInComplete?.(created);
  setEncouragement(getRandomEncouragement());
  setCelebrationOpen(true);
  resetForm();
}

// 在 JSX 末尾、toast 之后：
<CheckInCelebration
  open={celebrationOpen}
  encouragement={encouragement}
  onClose={() => setCelebrationOpen(false)}
/>
```

**关键时序**：
1. `addCheckIn` 成功返回 `created`
2. 显示 Toast「打卡成功！」
3. 调用 `onCheckInComplete` 回调（Home 中触发 refresh + 顶部能量条）
4. 选一句鼓励语、打开弹窗
5. 重置表单
6. 3 秒后弹窗自动关闭，Toast 也已自动消失

## Data Flow

### 每日名言选择

```
User opens App
       │
       ▼
Home.tsx 渲染
       │
       ├─ useMemo(() => getDailyQuote(), [])
       │
       ▼
quoteSelector.getDailyQuote()
       │
       ├─ dateStr = formatLocalDate(new Date())  // "2026-06-23"
       ├─ hash = customHash(dateStr)             // e.g. 1729384
       └─ idx = Math.abs(hash) % 10              // e.g. 3
       │
       ▼
DAILY_QUOTES[3]  // e.g. "路虽远，行则将至"
       │
       ▼
<DailyQuote quote="路虽远，行则将至" />
```

### 打卡鼓励语触发

```
User clicks 确认 button
       │
       ▼
QuickCheckIn.handleConfirm()
       │
       ├─ addCheckIn(...) → CheckIn
       │
       ├─ setToast({ message: '打卡成功！', type: 'success' })
       ├─ onCheckInComplete(created)  // Home: setShowEnergyBar(true) + refresh
       ├─ setEncouragement(getRandomEncouragement())
       ├─ setCelebrationOpen(true)
       └─ resetForm()
       │
       ▼
React 重渲染
       │
       ├─ <CheckInCelebration open={true} encouragement="..." />
       │     │
       │     ├─ Modal renders
       │     └─ useEffect: setTimeout(onClose, 3000)
       │
       └─ 3 秒后：
           │
           ├─ onClose() → setCelebrationOpen(false)
           └─ Modal unmounts
```

## Decisions

### D1. 自定义字符串哈希 vs 第三方库

**选择**：自定义 `h = (h * 31 + charCode) | 0`。

**理由**：
- 同步、单函数、零依赖
- 跨 Node/浏览器结果一致（仅使用 `charCodeAt` 基础 API）
- 10 条池的碰撞率可接受（每 10 天循环一次）
- `Math.abs()` + `| 0` 防止 32 位整数溢出

**考虑过的方案**：
- `crypto.subtle.digest`（SHA-256）：异步，组件渲染不便
- `hash-sum` 库：多一个 npm 依赖，单文件几行代码不值得
- 直接拼接数字（"20260623" 解析为数字）：跨月份位数变化（9 位 → 8 位），需额外处理

### D2. 简单字符串数组 vs 对象数组

**选择**：`string[]`。

**理由**：
- 现有 `src/constants/sports.ts` 使用对象数组是因为有 `icon`/`color`/`order` 等多字段
- 名言/鼓励语只需要文本，字符串数组最简单
- 后续若需作者署名，再迁移到 `{ text, author }[]` 也兼容

### D3. 复用 Modal vs 自建弹窗

**选择**：复用 `src/components/common/Modal/Modal.tsx`。

**理由**：
- 现有 `Modal` 已处理 backdrop 点击关闭、Esc 关闭、`role="dialog"`、`aria-modal` 等 a11y
- 不重复实现弹窗基础能力
- 一致的弹窗样式和交互

### D4. 3 秒自动关闭放在子组件还是父组件

**选择**：放在 `CheckInCelebration` 子组件（`useEffect` + `setTimeout`）。

**理由**：
- 弹窗的"自动关闭"是弹窗自身的特性，与父组件业务逻辑解耦
- 父组件只需 `open`/`onClose` 两个 prop，符合受控组件模式
- 子组件 cleanup 正确处理：手动关闭时定时器被取消

### D5. 鼓励语选词时机

**选择**：在 `handleConfirm` 成功分支内同步调用 `getRandomEncouragement()`。

**理由**：
- 与打开弹窗绑定，每次开弹都是新一次随机
- 用户连打卡看到不同鼓励，增强新鲜感
- 同步调用，无异步等待

### D6. DailyQuote 选词时机

**选择**：Home 组件首次渲染时 `useMemo` 调用一次。

**理由**：
- 同一天内多次打开 App 看到同一句（用户期望）
- 跨午夜后下次重新打开才换（新一次 `useMemo`）
- `useMemo([])` 空依赖避免每次重渲染重新计算

## Error Handling

| 场景 | 处理 |
|------|------|
| `DAILY_QUOTES` 数组为空 | `getDailyQuote` 抛 `Error('DAILY_QUOTES is empty')`，单元测试覆盖；运行时通过 TS 编译时长度校验避免（强制 ≥10） |
| `ENCOURAGEMENTS` 数组为空 | 同上 |
| 浏览器不支持 `crypto.getRandomValues` | 降级到 `Math.random()` |
| 用户系统时间被改为无效值 | `formatLocalDate` 内部 `try-catch`，降级为 `new Date().toISOString().slice(0,10)` |
| Modal 渲染异常 | 由 `Modal` 自身处理，弹窗关闭后无残留 |
| 组件 prop 传入空字符串 | DailyQuote 渲染空字符串但卡片结构保留，CheckInCelebration 在 `open` 为 true 时不渲染（Modal 未打开） |

## Testing

### `tests/unit/quoteSelector.test.ts`

| 用例 | 断言 |
|------|------|
| 同一天多次调用结果相同 | `getDailyQuote('2026-06-23') === getDailyQuote('2026-06-23')` |
| 不同日期结果可能不同 | `getDailyQuote('2026-06-23')` 与 `getDailyQuote('2026-06-24')` 多次对比 |
| 默认参数为本地日期 | 不传参调用，mock `Date` 验证使用本地日期 |
| 索引范围 | 对 1000 个日期字符串循环调用，所有结果索引在 `[0, 10)` |
| 空池抛错 | `expect(() => getDailyQuote('2026-06-23')).toThrow()` |
| `getRandomEncouragement` 索引范围 | mock `crypto.getRandomValues` 返回大数，验证模运算 |
| `getRandomEncouragement` 降级 | mock `crypto` 为 `undefined`，验证 `Math.random` 路径 |
| `getRandomEncouragement` 10000 次分布 | 验证 10 个桶分布大致均匀（容差 ±10%） |

### `tests/unit/DailyQuote.test.tsx`

| 用例 | 断言 |
|------|------|
| 渲染引号文本 | `screen.getByText('路虽远，行则将至')` |
| 包含 aria-label | `screen.getByLabelText('每日励志名言')` |
| 包含 testid | `screen.getByTestId('daily-quote')` |
| 空字符串仍渲染卡片 | 卡片结构存在，文本节点为空 |

### `tests/unit/CheckInCelebration.test.tsx`

| 用例 | 断言 |
|------|------|
| `open=false` 不渲染 | `queryByTestId('modal-backdrop')` 为 null |
| `open=true` 渲染鼓励语 | `screen.getByText('坚持就是胜利！')` |
| 3 秒自动关闭 | `vi.useFakeTimers()` + `vi.advanceTimersByTime(3000)` → `expect(onClose).toHaveBeenCalledOnce()` |
| 提前手动关闭清理定时器 | 调用 onClose 后 `vi.advanceTimersByTime(3000)` → onClose 不会被二次调用 |
| 点击 backdrop 关闭 | 复用 Modal 行为，验证 onClose 被调用 |
| Esc 键关闭 | 同上 |

### 集成测试

不新增集成测试，沿用现有 `tests/integration/checkInFlow.test.tsx` 和 `tests/integration/Home.test.tsx`，确保打卡流程和首页渲染不退化。如有需要，可在 QuickCheckIn 测试中添加「打卡成功弹窗出现」断言。

## Migration Plan

无破坏性变更：
- 4 个新文件（`quotes.ts`、`quoteSelector.ts`、`DailyQuote/`、`CheckInCelebration/`）和 3 个测试文件
- 2 个修改文件（`Home.tsx`、`QuickCheckIn.tsx`）仅新增 import/state/JSX

**部署步骤**：
1. 运行 `npm run build` 确认无 TS 错误
2. 运行 `npm test` 确认所有单测通过
3. 提交（按 AGENTS.md 规范：`<type>(<scope>): <description>`）

**回滚方案**：
- 删除 4 个新文件和 3 个测试文件
- `git checkout` 还原 `Home.tsx` 和 `QuickCheckIn.tsx`

## Open Questions

- **3 秒自动关闭时长是否合适？** 当前与 Toast 一致。若用户反馈太快，可调到 5 秒，需修改 `CheckInCelebration.tsx` 中的 `setTimeout` 参数。
- **弹窗是否需要 fade-in/out 动画？** 当前复用 Modal 默认无动画。后续可引入 framer-motion 或 CSS transitions。
- **名言是否需要「换一句」按钮？** 当前无。后续如需，可加 `<DailyQuote>` 接受 `onRefresh?: () => void`。
- **跨午夜时正在使用 App 的用户是否需要提示？** 当前无。后续可加「今日名言已更新」轻提示。
