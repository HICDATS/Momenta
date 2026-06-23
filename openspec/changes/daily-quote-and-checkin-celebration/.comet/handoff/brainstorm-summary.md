# Brainstorm Summary

- Change: daily-quote-and-checkin-celebration
- Date: 2026-06-23

## 确认的技术方案

**数据层**：
- `src/constants/quotes.ts` 导出 `DAILY_QUOTES: string[]`（10+ 条）和 `ENCOURAGEMENTS: string[]`（10+ 条），均为简单字符串数组，无元数据。

**选词工具** (`src/utils/quoteSelector.ts`)：
- `getDailyQuote(dateStr?: string): string` — 自定义字符串哈希：`h = (h * 31 + dateStr.charCodeAt(i)) | 0`，再 `Math.abs(h) % DAILY_QUOTES.length`。默认参数为 `formatDate(new Date())` 本地日期。
- `getRandomEncouragement(): string` — 优先 `crypto.getRandomValues(new Uint32Array(1))[0] % length`，降级 `Math.floor(Math.random() * length)`。

**组件**：
- `src/components/DailyQuote/DailyQuote.tsx` — 无状态，接收 `quote: string` prop。卡片样式：浅背景 + 左侧 3px `--color-primary` 竖条。`aria-label="每日励志名言"`。
- `src/components/CheckInCelebration/CheckInCelebration.tsx` — 复用现有 `Modal`。接收 `encouragement: string` + `open: boolean` + `onClose: () => void`。`useEffect` 启动 3 秒 setTimeout，cleanup 时清除。

**集成点**：
- `Home.tsx` — 在 eyebrow 下方、`<StreakDisplay>` 上方插入 `<DailyQuote quote={getDailyQuote()} />`。
- `QuickCheckIn.tsx` — 新增 `celebrationOpen`/`encouragement` state，`handleConfirm` 成功时 `setEncouragement(getRandomEncouragement())` + `setCelebrationOpen(true)`，底部渲染 `<CheckInCelebration ... />`。

**测试策略**：
- `quoteSelector.test.ts`：固定日期 → 固定结果（多次调用一致）；不同日期 → 可能不同；空池 → 抛错/兜底；`Math.random` mock 验证 `getRandomEncouragement` 索引范围。
- `DailyQuote.test.tsx`：传入 quote 字符串 → 渲染；aria-label 存在；空字符串兜底渲染。
- `CheckInCelebration.test.tsx`：vi.useFakeTimers 验证 3 秒自动调用 onClose；提前手动 onClose 取消定时器；点击 backdrop 关闭（复用 Modal 行为）。

## 关键取舍与风险

- **小池碰撞**：10 条名言池可能 10 天内重复。MVP 接受，后续可扩到 20-30 条。
- **时区**：使用本地日期 `new Date()` 而非 `toISOString()`，与项目其他日期处理一致。
- **3 秒关闭**：可能与 Toast 视觉拥挤，但位置不重叠（Modal 居中、Toast 顶部）。
- **连打卡**：每次 setEncouragement 重新随机，2 次连打看到 2 条不同鼓励。
- **复用 Modal**：避免重复实现遮罩点击、Esc 关闭、a11y。

## 测试策略

- 工具层 100% 单测覆盖（哈希确定性、随机边界、空池）
- 组件层覆盖：渲染 props、关键交互（开关、自动关闭、手动关闭）、a11y 属性
- 集成层沿用现有 `tests/integration/checkInFlow.test.tsx` 验证打卡流程不退化

## Spec Patch

无。OpenSpec delta spec（`daily-quote/spec.md` 和 `checkin-celebration/spec.md`）已覆盖验收场景，无需回写。
