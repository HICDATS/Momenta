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
