## 1. 文案数据与选择器

- [x] 1.1 创建 `src/constants/quotes.ts`，导出 `DAILY_QUOTES`（≥10 条中文励志名言）和 `ENCOURAGEMENTS`（≥10 条中文鼓励语）两个常量数组
- [x] 1.2 创建 `src/utils/quoteSelector.ts`，实现 `getDailyQuote(dateStr?: string): string`（日期哈希选词）和 `getRandomEncouragement(): string`（随机选词）
- [x] 1.3 编写 `tests/unit/quoteSelector.test.ts`：覆盖同一天返回相同、跨天可能不同、空池边界、随机分布四个场景

## 2. DailyQuote 组件

- [x] 2.1 创建 `src/components/DailyQuote/DailyQuote.tsx`：函数式组件，接收 `quote: string` prop，渲染带左侧色条的卡片
- [x] 2.2 创建 `src/components/DailyQuote/DailyQuote.module.css`：使用 CSS Variables（`--color-primary`、`--color-bg-card`），移动端优先样式
- [x] 2.3 编写 `tests/unit/DailyQuote.test.tsx`：覆盖渲染引号文本、aria-label、空字符串兜底

## 3. CheckInCelebration 组件

- [x] 3.1 创建 `src/components/CheckInCelebration/CheckInCelebration.tsx`：基于现有 `Modal`，接收 `encouragement: string` + `open: boolean` + `onClose: () => void`，3 秒自动关闭
- [x] 3.2 创建 `src/components/CheckInCelebration/CheckInCelebration.module.css`：居中大字号布局
- [x] 3.3 编写 `tests/unit/CheckInCelebration.test.tsx`：覆盖打开/关闭渲染、3 秒自动关闭、手动点击关闭、Escape 关闭、清理定时器

## 4. 集成到 Home 页

- [x] 4.1 修改 `src/pages/Home/Home.tsx`：在 eyebrow 日期下方、`<StreakDisplay>` 上方插入 `<DailyQuote quote={getDailyQuote()} />`
- [x] 4.2 验证 `npm test` 通过 + `npm run build` 通过

## 5. 集成到 QuickCheckIn

- [x] 5.1 修改 `src/components/QuickCheckIn/QuickCheckIn.tsx`：新增 `celebrationOpen`、`encouragement` 状态；`handleConfirm` 成功分支设置 `setEncouragement(getRandomEncouragement())` + `setCelebrationOpen(true)`
- [x] 5.2 在组件底部渲染 `<CheckInCelebration encouragement={encouragement} open={celebrationOpen} onClose={() => setCelebrationOpen(false)} />`
- [x] 5.3 验证 `npm test` 通过 + `npm run build` 通过

## 6. 最终验证

- [x] 6.1 运行 `npm test` 确认所有单元测试通过
- [x] 6.2 运行 `npm run build` 确认无 TypeScript 错误
- [x] 6.3 手动验证：dev 模式下打开首页确认名言显示、打卡确认后弹窗出现并自动关闭
- [x] 6.4 提交代码：按 AGENTS.md 规范使用 `<type>(<scope>): <description>` 格式
