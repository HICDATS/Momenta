# Comet Design Handoff

- Change: daily-quote-and-checkin-celebration
- Phase: design
- Mode: compact
- Context hash: f0bba2628fee7f1d784c3ca4fa0cc7493f16f87b75052af645c77d159f768c6d

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/daily-quote-and-checkin-celebration/proposal.md

- Source: openspec/changes/daily-quote-and-checkin-celebration/proposal.md
- Lines: 1-41
- SHA256: 5d03d27a80042d22fd9232a12e22e3de8f1bd40138db027b236b97dc24a08769

```md
## Why

用户打开 App 进入首页时缺少情感化激励，首页只有数据展示（Streak、热力图、统计卡）和打卡入口，进入门槛较高。打卡成功后只有简短 Toast「打卡成功！」，缺少正向反馈和情感连接。引入每日励志名言 + 打卡鼓励弹窗，可以在用户打开 App 和完成关键动作两个时间点注入动力，强化习惯养成闭环。

## What Changes

- **新增每日名言展示**：首页 Hero 区（eyebrow 日期下方、StreakDisplay 上方）显示一句基于日期固定、全天一致的励志名言
- **新增打卡鼓励弹窗**：打卡确认成功后，中央弹窗显示一句随机鼓励语，3 秒自动关闭或点击关闭
- **新增名言基础设施**：内置 10 条每日名言 + 10 条打卡鼓励语的两个独立文案池，零网络依赖
- **新增日期哈希选词工具**：基于 `YYYY-MM-DD` 做种子，确保同一天选择固定名言，跨天自动切换
- **新增随机选词工具**：从鼓励语池中随机选一条

## Capabilities

### New Capabilities
- `daily-quote`: 每日励志名言展示，包括文案池、日期哈希选择器、首页展示组件
- `checkin-celebration`: 打卡完成后的鼓励弹窗，包括鼓励语池、随机选择器、居中弹窗组件

### Modified Capabilities
无。现有功能（首页、QuickCheckIn、Toast）的行为逻辑不修改，仅新增 UI 元素和回调触发点。

## Impact

**新增文件**：
- `src/constants/quotes.ts` - 名言/鼓励语数据池
- `src/utils/quoteSelector.ts` - 日期哈希 + 随机选择工具
- `src/components/DailyQuote/DailyQuote.tsx` + `.module.css` - 首页名言组件
- `src/components/CheckInCelebration/CheckInCelebration.tsx` + `.module.css` - 弹窗组件

**修改文件**：
- `src/pages/Home/Home.tsx` - 嵌入 `<DailyQuote />` 到 Hero 区
- `src/components/QuickCheckIn/QuickCheckIn.tsx` - 打卡成功后触发 `<CheckInCelebration />`

**测试新增**：
- `tests/unit/quoteSelector.test.ts` - 选择器逻辑（日期哈希、随机分布）
- `tests/unit/DailyQuote.test.tsx` - 组件渲染
- `tests/unit/CheckInCelebration.test.tsx` - 弹窗开关、自动关闭、点击关闭

**依赖变更**：无（使用现有 React 状态 + CSS Modules + date-fns）

**影响范围**：仅 UI 层和工具层，不涉及数据存储、路由、状态管理结构变更。
```

## openspec/changes/daily-quote-and-checkin-celebration/design.md

- Source: openspec/changes/daily-quote-and-checkin-celebration/design.md
- Lines: 1-168
- SHA256: 853c54ba6a2bef80634db5bd8c260312da13e093b0d02e77c889e8fe809c75b4

[TRUNCATED]

```md
## Context

Momenta 首页目前由数据展示（eyebrow 日期、Streak、热力图、统计卡）和打卡入口（QuickCheckIn）组成，缺少情感化激励元素。打卡成功后的反馈仅有简短 Toast「打卡成功！」，3 秒后消失，正向反馈力度不足。引入每日励志名言和打卡鼓励弹窗，可以在「打开 App」和「完成关键动作」两个关键时点注入动力，契合「习惯养成」的产品定位。

本设计是 UI 层 + 工具层的增量变更，不涉及数据模型、路由、状态管理结构的修改。复用现有 Modal、Toast、CSS Modules、date-fns、React Hooks 体系。

## Goals / Non-Goals

**Goals:**
- 在首页 Hero 区（eyebrow 下方、StreakDisplay 上方）显示一句励志名言
- 同一天内多次打开 App 看到的名言相同
- 跨过午夜后再次打开 App 名言自动更新
- 打卡确认成功后中央弹窗显示一句鼓励语
- 弹窗 3 秒后自动关闭，也可点击关闭
- 两个文案池相互独立（每日名言偏哲理，鼓励语偏庆祝）
- 单元测试覆盖率：选择器逻辑 100%、组件行为 100%

**Non-Goals:**
- 用户自定义名言（无设置入口、无 localStorage 存储）
- 网络拉取名言（无 API 依赖）
- 多语言支持（仅中文）
- 根据运动类型/Streak 个性化
- 通知/分享/收藏名言
- 修改现有功能的行为逻辑（StreakDisplay、QuickCheckIn、Toast）

## Decisions

### 1. 文案数据存储在 `src/constants/quotes.ts`

**选择**: 静态 TS 数组常量，分 `DAILY_QUOTES` 和 `ENCOURAGEMENTS` 两个导出。

**理由**:
- 与项目其他常量文件（`sports.ts`、`achievements.ts`、`reminders.ts`）的组织方式一致
- TypeScript 编译时类型校验，避免运行时缺失
- 无 fetch/await 开销，零网络依赖
- 后续若要扩为可编辑，再迁移到 IndexedDB 不影响组件接口

**考虑过的方案**:
- JSON 文件 + import：增加构建步骤和类型推导成本
- IndexedDB：当前无用户编辑需求，过度设计

### 2. 日期哈希算法：`YYYY-MM-DD` 字符串 → 简单哈希 → mod 池大小

**选择**:
```ts
function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
const idx = hashDate(today) % DAILY_QUOTES.length;
```

**理由**:
- 字符串哈希可读、可测试、可在 Node 端和浏览器端都得到一致结果
- `Math.abs()` 保证非负数，`| 0` 防止 32 位整数溢出
- 池小（10 条）时碰撞率可接受：每 10 天循环一次
- 无需任何第三方哈希库

**考虑过的方案**:
- 用 `Date.now()` 模：跨午夜切换的边界问题（同一秒可能跨日）
- 加密哈希（crypto.subtle）：异步 API，组件同步渲染时不便
- 第三方库（`hash-sum`）：单文件几行代码，引入依赖不划算

### 3. 鼓励语随机选择：使用 `crypto.getRandomValues` 降级到 `Math.random`

**选择**:
```ts
function randomIndex(length: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % length;
  }
  return Math.floor(Math.random() * length);
}
```

```

Full source: openspec/changes/daily-quote-and-checkin-celebration/design.md

## openspec/changes/daily-quote-and-checkin-celebration/tasks.md

- Source: openspec/changes/daily-quote-and-checkin-celebration/tasks.md
- Lines: 1-35
- SHA256: baa5271882a8436d0da04def966276fc63c23000d1cc6bd2285ad2df73f7d2aa

```md
## 1. 文案数据与选择器

- [ ] 1.1 创建 `src/constants/quotes.ts`，导出 `DAILY_QUOTES`（≥10 条中文励志名言）和 `ENCOURAGEMENTS`（≥10 条中文鼓励语）两个常量数组
- [ ] 1.2 创建 `src/utils/quoteSelector.ts`，实现 `getDailyQuote(dateStr?: string): string`（日期哈希选词）和 `getRandomEncouragement(): string`（随机选词）
- [ ] 1.3 编写 `tests/unit/quoteSelector.test.ts`：覆盖同一天返回相同、跨天可能不同、空池边界、随机分布四个场景

## 2. DailyQuote 组件

- [ ] 2.1 创建 `src/components/DailyQuote/DailyQuote.tsx`：函数式组件，接收 `quote: string` prop，渲染带左侧色条的卡片
- [ ] 2.2 创建 `src/components/DailyQuote/DailyQuote.module.css`：使用 CSS Variables（`--color-primary`、`--color-surface`），移动端优先样式
- [ ] 2.3 编写 `tests/unit/DailyQuote.test.tsx`：覆盖渲染引号文本、aria-label、空字符串兜底

## 3. CheckInCelebration 组件

- [ ] 3.1 创建 `src/components/CheckInCelebration/CheckInCelebration.tsx`：基于现有 `Modal`，接收 `encouragement: string` + `open: boolean` + `onClose: () => void`，3 秒自动关闭
- [ ] 3.2 创建 `src/components/CheckInCelebration/CheckInCelebration.module.css`：居中大字号布局
- [ ] 3.3 编写 `tests/unit/CheckInCelebration.test.tsx`：覆盖打开/关闭渲染、3 秒自动关闭、手动点击关闭、Escape 关闭、清理定时器

## 4. 集成到 Home 页

- [ ] 4.1 修改 `src/pages/Home/Home.tsx`：在 eyebrow 日期下方、`<StreakDisplay>` 上方插入 `<DailyQuote quote={getDailyQuote()} />`
- [ ] 4.2 验证 `npm test` 通过 + `npm run build` 通过

## 5. 集成到 QuickCheckIn

- [ ] 5.1 修改 `src/components/QuickCheckIn/QuickCheckIn.tsx`：新增 `celebrationOpen`、`encouragement` 状态；`handleConfirm` 成功分支设置 `setEncouragement(getRandomEncouragement())` + `setCelebrationOpen(true)`
- [ ] 5.2 在组件底部渲染 `<CheckInCelebration encouragement={encouragement} open={celebrationOpen} onClose={() => setCelebrationOpen(false)} />`
- [ ] 5.3 验证 `npm test` 通过 + `npm run build` 通过

## 6. 最终验证

- [ ] 6.1 运行 `npm test` 确认所有单元测试通过
- [ ] 6.2 运行 `npm run build` 确认无 TypeScript 错误
- [ ] 6.3 手动验证：dev 模式下打开首页确认名言显示、打卡确认后弹窗出现并自动关闭
- [ ] 6.4 提交代码：按 AGENTS.md 规范使用 `<type>(<scope>): <description>` 格式
```

## openspec/changes/daily-quote-and-checkin-celebration/specs/checkin-celebration/spec.md

- Source: openspec/changes/daily-quote-and-checkin-celebration/specs/checkin-celebration/spec.md
- Lines: 1-87
- SHA256: bf8d6eb2dee277ffbf1dc8b349df559fde3fd49d8fd4cbc90b48b5bfc34353bb

[TRUNCATED]

```md
# Check-in Celebration Specification

## ADDED Requirements

### Requirement: Celebration Modal After Successful Check-in
The system SHALL display a centered modal containing an encouragement message when a check-in is successfully confirmed.

#### Scenario: Modal appears on success
- **WHEN** the user confirms a check-in and the check-in is saved successfully
- **THEN** the system displays a modal in the center of the screen
- **AND** the modal contains one encouragement message selected from the built-in `ENCOURAGEMENTS` pool

#### Scenario: Modal does not appear on failure
- **WHEN** the user attempts a check-in but the save fails (e.g., validation error, storage error)
- **THEN** the celebration modal MUST NOT be displayed
- **AND** the existing error feedback (Toast) is still shown

### Requirement: Random Encouragement Selection
The system SHALL select an encouragement from the `ENCOURAGEMENTS` pool using a uniform random distribution.

#### Scenario: Each check-in shows a different encouragement
- **WHEN** the user performs multiple check-ins in succession
- **THEN** each successful check-in may display a different encouragement (random per event)
- **AND** the distribution across many check-ins is approximately uniform

#### Scenario: Pool is non-empty
- **WHEN** the selector is called
- **THEN** `ENCOURAGEMENTS.length >= 1`
- **AND** the returned index is within `[0, ENCOURAGEMENTS.length)`

### Requirement: Built-in Encouragement Pool
The system SHALL provide a built-in `ENCOURAGEMENTS` constant in `src/constants/quotes.ts` containing at least 10 Chinese encouragement messages.

#### Scenario: Pool has minimum size
- **WHEN** the application starts
- **THEN** `ENCOURAGEMENTS.length >= 10`
- **AND** every entry is a non-empty string

### Requirement: Auto-close After 3 Seconds
The system SHALL automatically close the celebration modal 3 seconds after it opens.

#### Scenario: Timer triggers close
- **WHEN** the modal becomes visible
- **THEN** after 3 seconds, the system invokes the `onClose` callback
- **AND** the modal disappears from the DOM

#### Scenario: Timer is cleaned up on manual close
- **WHEN** the user manually closes the modal (click or Escape) before 3 seconds elapse
- **THEN** the auto-close timer is cancelled
- **AND** no further `onClose` invocations occur after manual close

### Requirement: User-Initiated Close
The system SHALL allow the user to close the celebration modal by clicking the modal backdrop or pressing the Escape key.

#### Scenario: Click backdrop to close
- **WHEN** the user clicks the modal backdrop (outside the modal content)
- **THEN** the modal closes immediately

#### Scenario: Press Escape to close
- **WHEN** the modal is open and the user presses the Escape key
- **THEN** the modal closes immediately

### Requirement: Modal Does Not Block Subsequent Check-ins
The system SHALL allow the user to perform another check-in after the celebration modal closes.

#### Scenario: Form is reset after close
- **WHEN** the celebration modal closes
- **THEN** the underlying check-in form has been reset (no selected sport, no note)
- **AND** the user can select another sport and check in again

#### Scenario: Independent of Toast
- **WHEN** both the celebration modal and the success Toast are visible
- **THEN** they do not visually overlap (Toast at top, Modal in center)
- **AND** closing one does not affect the other

## ADDED Requirements

### Requirement: CheckInCelebration Component
The system SHALL provide a `<CheckInCelebration>` component that wraps the existing `Modal` to display an encouragement message.

```

Full source: openspec/changes/daily-quote-and-checkin-celebration/specs/checkin-celebration/spec.md

## openspec/changes/daily-quote-and-checkin-celebration/specs/daily-quote/spec.md

- Source: openspec/changes/daily-quote-and-checkin-celebration/specs/daily-quote/spec.md
- Lines: 1-63
- SHA256: a7adef652d3288a9edce45a119f81dae43117ae5c1f75a94b46a01d392fc4c0f

```md
# Daily Quote Specification

## ADDED Requirements

### Requirement: Daily Quote Display on Home Page
The system SHALL display one inspirational quote at the top of the home page (hero area, below the date eyebrow and above the StreakDisplay).

#### Scenario: First visit on a given day
- **WHEN** the user opens the App and lands on the home page for the first time on a calendar day
- **THEN** the system displays exactly one quote from the built-in `DAILY_QUOTES` pool
- **AND** the quote is selected deterministically based on the current date

#### Scenario: Repeat visit on the same day
- **WHEN** the user closes and reopens the App multiple times on the same calendar day
- **THEN** the system displays the same quote for all visits on that day

#### Scenario: Visit after midnight
- **WHEN** the user opens the App on a new calendar day
- **THEN** the system displays a different quote than the previous day (or the same if the hash collides, but generally different)

### Requirement: Date-Based Deterministic Selection
The system SHALL select a quote from the `DAILY_QUOTES` pool using a deterministic hash of the current local date (`YYYY-MM-DD` format).

#### Scenario: Hash produces a valid index
- **WHEN** the selector receives a date string
- **THEN** it computes a non-negative integer index within `[0, DAILY_QUOTES.length)`
- **AND** the same date string always produces the same index

#### Scenario: Different dates may produce different indices
- **WHEN** the selector receives two different date strings
- **THEN** the indices may differ (collisions acceptable for small pools)

### Requirement: Built-in Quote Pool
The system SHALL provide a built-in `DAILY_QUOTES` constant in `src/constants/quotes.ts` containing at least 10 Chinese inspirational quotes related to sports, exercise, and habit building.

#### Scenario: Pool has minimum size
- **WHEN** the application starts
- **THEN** `DAILY_QUOTES.length >= 10`
- **AND** every entry is a non-empty string

### Requirement: No Network Dependency
The system SHALL display the daily quote without making any network requests.

#### Scenario: Offline display
- **WHEN** the user opens the App while offline
- **THEN** the daily quote is still displayed correctly

## ADDED Requirements

### Requirement: DailyQuote Component
The system SHALL provide a `<DailyQuote>` component that renders a single quote in a styled card with left-side color accent.

#### Scenario: Renders quote text
- **WHEN** the component receives a `quote: string` prop
- **THEN** it renders the quote text in a readable card

#### Scenario: Aria label for accessibility
- **WHEN** the component renders
- **THEN** it includes an appropriate `aria-label` or `role` for screen readers (e.g., `aria-label="每日励志名言"`)

#### Scenario: Component is pure
- **WHEN** the component is rendered with the same prop
- **THEN** it produces stable, side-effect-free output
```

