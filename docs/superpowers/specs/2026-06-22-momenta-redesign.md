# Momenta 设计重塑 — 运动场晨光

**日期**：2026-06-22
**类型**：Visual Redesign
**范围**：仅视觉层（CSS + 1 个新增组件），不动数据流、utils、hooks、db、context、测试结构

---

## 1. 设计信条

**约束自己**：
- 不用渐变、不用模糊、不用 box-shadow 辉光、不用 scale 缩放
- 不用 hover 动画、不用 shimmer、骨架屏闪烁
- 唯一被允许的动画：能量条 0.6s 线性填充 + Toast 0.25s 弹入 + 热图格子 step-end 跳变 + 1 处微妙的页面入场（StreakDisplay 文字"印刷感"逐字上墨）
- 用**对比**承担视觉冲击，不用**效果**承担视觉冲击
- 用**留白**承担呼吸感，不用**留色**承担呼吸感
- 用**字体性格**承担品牌识别，不用**色彩个性**承担品牌识别

**被砍掉的 AI 三大默认之一**：渐变风格。

---

## 2. 配色：5 个 token，全是纯色

| token | hex | 用途 |
|-------|-----|------|
| `--ink-900` | `#1F1B16` | 主文字、图标、active 描边（深炭灰，不死黑） |
| `--paper-50` | `#FAF6F0` | 全局背景（暖奶油） |
| `--ember-500` | `#FF6B6B` | 品牌主色：CTA、连续天数数字、热图 8+ 步阶 |
| `--ember-700` | `#E64C4C` | 强调：今日格子、active 描边 |
| `--fog-300` | `#C7BEB2` | 辅助：分隔线、未打卡格子描边、placeholder 文字 |

**取消** dawn-300（#F5C518 亮黄）：没有渐变后它没有用武之地，会让色板变得"AI 三件套"。

**热图纯色阶梯**（共 5 个视觉状态）：
- 未打卡（0 天）：`paper-50` 底 + `fog-300` 1px 描边
- 1 天：`ember-500` 22% 透明度
- 2-3 天：`ember-500` 55% 透明度
- 4-7 天：`ember-500` 100% 实色
- 8+ 天：`ember-500` 100% + `paper-50` 1px 内描边（"被印章盖过"的感觉）
- 今天标记（独立于上述）：`ember-700` 1px 外描边（永远显示）

**风险点（值得做的风险）**：8+ 天的"内描边"是一个 AI 不会选的细节。看上去像老式日历上"被勾过的方格"，对**运动打卡这个反复的、累积的行为**特别合适。AI 默认会用更大、更亮、更花哨的方式去表达"成就"，我们反着用减法。

---

## 3. 字体：2 个字体，承担 80% 的品牌识别

| 角色 | 字体 | 备选 | 用法 |
|------|------|------|------|
| Display | **Fraunces** (Google Fonts) | DM Serif Display | "连续 X 天"、页面 H1、eyebrow |
| Body | **Inter** | 现有系统栈 | 副标、正文、按钮 |

**为什么是 Fraunces**：
- 它是 SOFT 衬线（serifs 圆润），不像 Playfair/DM Serif 那么"奢侈品"也不像 Noto Serif 那么"教科书"
- 它的 opsz 变量字重可以同时担任"连续 7 天"的大字标题（高 opsz）和"周三 · 6月22日"的小字 eyebrow（低 opsz），不需要换字体
- 主流设计师默认会用：Playfair（太多人用）、DM Serif Display（太常见）、Cormorant（太正式）。Fraunces 是 2023 年才进入主流视野的，**对"运动 + 晨光"这个主题它最对味**，但不会被默认选中

**排版规则**：
- "连续 X 天"：Fraunces 700, opsz 144, 字号 64px，行高 0.92，字距 -0.025em，`--ember-500`
- "连续"这个词：Fraunces 300, opsz 14, 字号 28px, `--ink-900`，与大字同行
- eyebrow "周三 · 6月22日"：Fraunces 400, opsz 14, 字号 11px, 字距 0.18em, 大写, `--fog-300`
- 副标"已完成今日训练 · 03:24 AM"：Inter 500, 字号 13px, `--ink-900`，前面有一个 4×4 ink-900 实心方块作 eyebrow mark
- 统计数字"3 / 8 / 47"：Inter 600, 字号 24px, `--ink-900`（**不**用 ember，保持冷静）
- 数字下标"本周/本月/累计"：Inter 500, 字号 11px, 字距 0.12em, 大写, `--fog-300`

**字体引入**：
- 在 `index.html` 添加 Google Fonts preconnect + 链接
- `Fraunces`: weights 300, 400, 700；opsz 14..144
- `Inter`: weights 400, 500, 600

---

## 4. 布局：克制的 12/7 方格阵列

**容器宽度**：从 480px 降到 420px（让 paper-50 的留白有呼吸）。

**首页结构**（自上而下，单列）：

```
┌─────────────────────────────────┐
│  ◾ WED · 22 JUN  （eyebrow）   │  Fraunces 11px, ink-900, 0.18em
│                                 │
│  连续                           │  Fraunces 300, ink-900, 28px
│  7天                            │  Fraunces 700, ember-500, 64px
│  ◾ 已完成今日训练 · 03:24       │  Inter 13px, ink-900
│                                 │
│  ┌─ 12 × 7 纯色阶梯热图 ────┐   │
│  │ ▢▪▪▪▪▪▪▪▪▪▪▪▪            │   │  14×14 px, 2px gap
│  │ ▫▪▪▪▢▢▢▢▪▪▪▪▪            │   │
│  │ ▫▪▪▪▪▪▢▢▪▪▪▪▪            │   │  4 阶纯色 + paper 内描边
│  │ ▪▪▪▪▪▪▪▪▪▪▪▪◼            │   │  ◼ = 今天 (ember-700 描边)
│  │ ...                       │   │
│  └──────────────────────────┘   │
│                                 │
│  本周  本月  累计               │  Inter 11px, fog-300, 大写
│   3    8    47                  │  Inter 600, 24px, ink-900
│                                 │
│  ────────── 今日运动 ────────    │  1px fog-300, 居中
│                                 │
│  [ 健身 ] [ 篮球 ] [ 跑步 ]     │  3 列方格, sport.color
│  [ 游泳 ] [ 瑜伽 ] [ 骑行 ]     │
│  [ 羽毛球 ] [ 乒乓球 ]          │
│                                 │
│  ▢ 最近打卡                     │  Fraunces 14px, ink-900
│    跑步  ·  今早 06:12          │  Inter 13px
│    瑜伽  ·  昨天 20:30          │
└─────────────────────────────────┘
```

**唯一被允许的入场动画**（页面切换时）：
- "连续"和"7天"两个词用 0.6s 内 opacity 0→1 渐入（**不是渐变填充**），间隔 80ms 出现（轻微的印刷"上墨"感）
- 热图格子用 0.3s 内从右到左逐列 opacity 0→1 渐入（**仍不是渐变，是 step-by-step 出现**），每列间隔 30ms
- 其他元素无入场动画

**风险点（值得做的风险）**：让"7天"这个大数字用印刷感衬线 + 大字号 + 居中，但故意把它放在 eyebrow 和热图之间而不是顶部。这种"先把上下文（日期）放出来，再把成就（连续天数）放出来，最后把细节（热图）放出来"的信息流顺序，跟 AI 默认的"数字+小标签+渐变"完全不同。它读起来像一封信的抬头：日期 → 状态 → 历史。

---

## 5. 签名元素：能量条（只在打卡时出现）

**位置**：eyebrow（"WED · 22 JUN"）和"连续"之间，垂直居中。1.5px 高，整宽，**初始状态不可见**（不是 0% 宽度，是整个组件 height: 0，display 仍占位但不渲染）。

**触发**：用户点击运动 → 模态 → 点"确认"瞬间。

**动效**（克制到极致）：
1. 0.0s - 0.6s：能量条从 0% 宽度线性填充到 100%（用 `width: 0 → 100%`，linear easing，**无 ease-out**）
2. 0.6s - 3.0s：保持满格 `ember-500`
3. 3.0s - 3.4s：opacity 1→0 fade（width 不动）
4. 3.4s 之后：组件 height 回到 0

**颜色**：纯 `ember-500`（不是渐变）。

**伴随**：
- Toast "已记录 · 跑步" 从屏幕底部中央弹入（`translateY(16px) → 0` + opacity 0→1，0.25s ease-out），停留 1.5s，然后 fade 0.2s
- 模态消失用 0.15s 淡出（不是缩放消失）
- 热图上"今天"格子 step-end 跳变（**无任何过渡**）从"未打卡"变成"1 天"阶颜色

**不**做的：
- ❌ 整页背景辉光
- ❌ 模态缩放消失
- ❌ Toast 弹跳
- ❌ 数字滚动
- ❌ 整页"ribbon"飘过
- ❌ 任何与 ember 颜色无关的庆祝效果

---

## 6. 改动文件清单

**改样式 + 改组件**（不改变数据流/测试/结构）：
- `index.html` — 添加 Google Fonts preconnect + Fraunces/Inter 链接
- `src/styles/variables.css` — 替换色板 + 字体变量
- `src/styles/global.css` — 改 body 背景为 paper-50，更新字体引用
- `src/components/Layout/Layout.module.css` — 内容容器宽度 420px
- `src/components/StreakDisplay/StreakDisplay.tsx` + `.module.css` — 重做为"连续 X 天"衬线大字
- `src/components/StatsCard/StatsCard.tsx` + `.module.css` — 重做为冷静的"label-数字"对
- `src/components/QuickCheckIn/QuickCheckIn.tsx` + `.module.css` — 体育方格改纯色描边 + 触发能量条
- `src/components/CheckInCard/CheckInCard.module.css` — 改边框、间距、字体
- `src/components/Navigation/Navigation.module.css` — active 改 ember-700 描边（非填充）
- `src/components/common/Toast/Toast.module.css` — 弹入动画
- `src/components/common/Modal/Modal.module.css` — 淡出动画
- `src/pages/Home/Home.module.css` + `.tsx` — 新增 eyebrow / 整合热图 / 加入能量条触发

**新增 1 个组件**：
- `src/components/Heatmap/Heatmap.tsx` + `Heatmap.module.css` + `Heatmap.test.tsx`

**不动**：
- 所有 utils / hooks / db / types / context / 测试结构 / 文案（除必要样式调整）

**新增依赖**：零。

---

## 7. 兼容性 & 质量底线

- 响应式：iPhone SE (375px) 仍可正常显示，热图自动缩到 13×13 px
- 键盘焦点：所有可点击元素保留 `--fog-300` outline focus 环
- `prefers-reduced-motion`：所有入场动画 + 能量条 + Toast 弹入 → 0.01s（直接完成）
- 测试：所有现有 442 个测试必须通过，新增 Heatmap 至少 8 个测试覆盖：4 阶颜色、12×7 网格、连续天数计算、8+ 天内描边、今天标记、reduced motion fallback
- 构建：`npm run build` 必须成功，gzip 增量控制在 30KB 内（Google Fonts 是 woff2 缓存友好）

---

## 8. 不做什么（明确的边界）

- 不引入新依赖（Tailwind、动画库等都不要）
- 不改路由结构
- 不改数据模型
- 不加新功能
- 不重写任何 utils / hooks
- 不改 i18n 文案（保持现有中文）
- 不做暗色模式（保持纸白主调）
