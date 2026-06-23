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

**理由**:
- PWA 浏览器（Chrome 90+/Safari 14+）都支持 `crypto.getRandomValues`
- 失败时降级 `Math.random` 避免报错
- 鼓励语对随机性质量要求不高，均匀分布即可

### 4. 组件接口：DailyQuote 接受 `quote: string` prop，CheckInCelebration 接受 `encouragement: string` + `onClose: () => void`

**选择**: 无状态展示组件，逻辑放在父组件（Home 和 QuickCheckIn）。

**理由**:
- 与项目其他组件（StreakDisplay、Heatmap、StatsCard）的接口风格一致：接受数据，渲染 UI
- 便于测试：传入不同 prop 验证渲染
- 选择器逻辑（日期哈希/随机）放在 `quoteSelector.ts` 工具函数中，纯函数易测

### 5. 打卡鼓励弹窗：复用现有 `Modal` 组件

**选择**: CheckInCelebration 内部调用 `<Modal>` 包装居中布局，3 秒后调用 `onClose`。

**理由**:
- 现有 `Modal` 已处理遮罩点击关闭、Esc 关闭、`role="dialog"`、`aria-modal` 等 a11y 细节
- 不重复实现弹窗基础能力
- 弹窗关闭时 Toast 仍可继续显示（两者 z-index 不冲突：Modal 居中、Toast 顶部）

**弹窗内容设计**:
- 大字号居中显示鼓励语
- 下方小字号「点击任意处关闭」提示
- 3 秒后自动 `onClose`

### 6. 触发时序：QuickCheckIn 内部管理 CheckInCelebration 的开关状态

**选择**:
```ts
const [celebrationOpen, setCelebrationOpen] = useState(false);
const [encouragement, setEncouragement] = useState('');

// handleConfirm 成功后：
setEncouragement(getRandomEncouragement());
setCelebrationOpen(true);
```

**理由**:
- 弹窗状态与打卡成功状态强相关，由 QuickCheckIn 自管避免跨组件状态提升
- 不影响 `onCheckInComplete` 回调的现有行为
- 关闭弹窗时 `setCelebrationOpen(false)`，无需额外清理

### 7. 样式：DailyQuote 使用 CSS Variables，复用品牌色 `--color-primary` (`#FF6B6B`)

**选择**: DailyQuote 卡片背景使用 `var(--color-bg-card)`，左侧装饰条使用 `var(--color-primary)`。

**理由**:
- 遵循 AGENTS.md 「所有间距、颜色使用 CSS Variables，禁止硬编码」
- 与现有 Card 风格保持一致

## Risks / Trade-offs

**[风险 1]：日期哈希在小池（10 条）时分布不均，可能连续几天重复出现**
→ 缓解：若用户反馈明显，可将池扩到 20-30 条；当前 10 条可接受作为 MVP。

**[风险 2]：用户首次打开 App 时若系统时区与本地不一致，可能跨日边界时显示前一天/后一天的名言**
→ 缓解：使用 `new Date()`（浏览器本地时区）而非 `new Date().toISOString()`（UTC），与项目其他日期处理一致。

**[风险 3]：3 秒自动关闭可能与 Toast 同时出现，造成视觉拥挤**
→ 缓解：Toast 在屏幕顶部（top: 20px），Modal 居中，位置不重叠；3 秒后两个都消失，时序可接受。

**[风险 4]：若用户极快连续打卡两次，第二次弹窗可能直接覆盖第一次，体感突兀**
→ 缓解：每次 `setEncouragement` 都用 `getRandomEncouragement()` 重新选，2 次连打看到 2 条不同鼓励；自动关闭 3 秒内不允许新弹窗打断。

**[风险 5]：纯客户端名言池无法做 A/B 测试或内容运营**
→ 接受：MVP 阶段不投入此能力；后续可迁至后端。

## Migration Plan

无（纯新增，无破坏性变更）：
- 新增文件不修改任何 import
- 修改的 Home.tsx 仅在 JSX 中插入 `<DailyQuote />`
- 修改的 QuickCheckIn.tsx 仅新增 state、effect、JSX
- 既有测试不受影响

**回滚方案**：若需回滚，删除 4 个新文件 + 还原 Home/QuickCheckIn 的 2 处新增即可。

## Open Questions

- 弹窗 3 秒自动关闭时长是否合适？用户可能希望延长到 5 秒。
  - 当前决定：3 秒，与现有 Toast 一致。
- 名言是否需要显示作者署名？
  - 当前决定：MVP 阶段不显示，10 条名言均无明确作者，添加「——」反而显得累赘。
- 鼓励弹窗是否需要在关闭后也展示动画（如 fade-out）？
  - 当前决定：MVP 阶段无退出动画，依赖 Modal 默认显示。后续可加 framer-motion。
