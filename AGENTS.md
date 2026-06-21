# Momenta - AI 开发指令 (AGENTS.md)

> AGENTS.md 是给AI编程工具的"工作手册"，让AI在项目中遵循统一的规则和规范。
> 这是一个社区标准格式，主流AI编程工具会自动读取此文件。

## 项目概述

Momenta 是一款面向个人运动爱好者的极简运动打卡PWA（渐进式Web应用）。用户通过手机浏览器打开即可使用，核心体验是"2秒完成打卡"。应用通过Streak连续打卡、成就系统、数据可视化和目标追踪等组合激励机制，帮助用户建立并维持运动习惯。

## 技术栈

- **前端框架**：React 18 + TypeScript
- **样式方案**：CSS Modules + CSS Variables
- **状态管理**：React Context + useReducer（不引入Redux/Zustand）
- **数据存储**：IndexedDB（Dexie.js）存储打卡记录，localStorage存储配置/设置
- **路由**：React Router DOM v7
- **图表**：Recharts
- **PWA**：Vite PWA Plugin（自动生成Service Worker和Manifest）
- **日期处理**：date-fns
- **图标**：Lucide React
- **构建工具**：Vite 6
- **测试**：Vitest + React Testing Library
- **部署**：GitHub Pages

## 开发规范

### 代码语言
- 使用 **TypeScript**，确保类型安全
- 组件使用 **函数式组件 + Hooks**（禁止使用类组件）
- 文件命名：
  - 组件文件：**PascalCase**（如 `QuickCheckIn.tsx`）
  - 工具函数/Hook文件：**camelCase**（如 `useCheckIns.ts`）
  - 样式文件：与组件同名，后缀 `.module.css`（如 `QuickCheckIn.module.css`）
- 每个组件一个目录，包含 `.tsx` 和 `.module.css` 文件

### 样式开发
- 使用 **CSS Modules** 进行组件级样式隔离
- 全局样式变量定义在 `src/styles/variables.css`
- 响应式设计遵循 **移动优先**（375px为基础，向上适配）
- 设计风格：极简、活力、现代
  - 主色调：#FF6B6B（活力橙/珊瑚色）
  - 辅助色：#2D3436（深灰）
  - 背景色：#F8F9FA（浅灰）
  - 成功色：#00B894（亮绿）
- 所有间距、颜色使用CSS Variables，禁止硬编码

### 数据处理
- 打卡记录（CheckIn）存储在 **IndexedDB**（Dexie.js）
- 配置/设置（运动类型、提醒、目标、成就）存储在 **localStorage**
- 日期处理统一使用 **date-fns**（禁止使用moment.js或原生Date计算）
- 所有时间戳以**毫秒**为单位存储
- 表单使用**受控组件**（Controlled Components）

## 代码风格

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `QuickCheckIn`、`StreakDisplay` |
| 函数名 | camelCase | `calculateStreak`、`addCheckIn` |
| 常量名 | UPPER_SNAKE_CASE | `DEFAULT_REMINDERS`、`SPORT_TYPES` |
| Hook名 | use + PascalCase | `useCheckIns`、`useStreak` |
| 类型名 | PascalCase | `CheckIn`、`SportType`、`AchievementCondition` |
| 文件名（组件） | PascalCase | `QuickCheckIn.tsx` |
| 文件名（工具） | camelCase | `streakCalculator.ts` |
| CSS类名 | camelCase（CSS Modules自动处理） | `.checkInButton`、`.streakCount` |
| 数据库表名 | camelCase | `checkIns`、`sportTypes` |

### Lint和格式化
- **不使用ESLint/Prettier**（简化配置，依靠TypeScript编译时检查）
- 缩进：**2个空格**
- 引号：**单引号**（字符串）
- 分号：**有**
- 每行最大长度：**100字符**
- 函数最大行数：**50行**（超过需拆分）
- 组件文件最大行数：**200行**（超过需拆分）

### TypeScript规范
- 所有函数参数和返回值必须标注类型
- 禁止使用 `any` 类型（特殊情况需注释说明）
- 接口使用 `interface`，类型别名使用 `type`
- 枚举使用 `const enum` 或字面量联合类型

## 测试要求

### TDD（测试驱动开发）—— 强制执行
- **铁律：无失败测试，不生产代码**
- 每个公共函数必须有至少一个单元测试
- 每个自定义Hook必须有至少一个测试
- 边界条件必须覆盖：空输入、最大值、异常类型

### 测试结构
- 单元测试：`tests/unit/` 目录
- 集成测试：`tests/integration/` 目录
- 测试文件命名：`[被测模块].test.ts` 或 `[被测组件].test.tsx`

### 必测场景
1. **Streak计算**：连续打卡、中断、休息日、跨周/跨月
2. **打卡流程**：添加、删除、筛选、时间验证
3. **日期工具**：周/月起止计算、格式化、时区处理
4. **验证逻辑**：未来时间禁止、空值处理

### 测试命令
```bash
npm test          # 运行所有测试
npm run test:ui   # Vitest UI模式
```

## 目录结构约定

```
src/
├── components/       # 可复用组件（每个组件一个目录）
│   ├── Layout/
│   ├── Navigation/
│   ├── QuickCheckIn/
│   ├── CheckInCard/
│   ├── StreakDisplay/
│   ├── AchievementBadge/
│   ├── StatsChart/
│   ├── GoalProgress/
│   └── common/       # 通用小组件（Button、Modal、Toast等）
├── pages/            # 页面级组件（每个页面一个目录）
│   ├── Home/
│   ├── History/
│   ├── Achievements/
│   ├── Statistics/
│   └── Settings/
├── hooks/            # 自定义Hooks
├── context/          # React Context
├── db/               # 数据库层（Dexie定义）
├── types/            # TypeScript类型定义
├── utils/            # 工具函数
├── constants/        # 常量定义
├── styles/           # 全局样式（variables.css、global.css、animations.css）
├── App.tsx           # 根组件
└── main.tsx          # 入口文件
```

## Git提交规范

提交信息格式：`<type>(<scope>): <description>`

- **type**：
  - `feat`: 新功能
  - `fix`: 修复Bug
  - `docs`: 文档更新
  - `style`: 样式调整（不影响功能）
  - `refactor`: 重构
  - `test`: 测试
  - `chore`: 构建/工具变更
- **scope**：可选，如 `home`、`streak`、`settings`
- **description**：简洁描述，使用中文

**提交频率**：每完成一个功能点或修复一个Bug就提交一次，禁止大量代码一次性提交。

## Superpowers 工程纪律（强制执行）

### TDD（测试驱动开发）
- **铁律**：无失败测试，不生产代码
- 每个功能必须遵循：RED（写失败测试）→ 验证RED（确认失败）→ GREEN（写最小代码通过）→ 验证GREEN（确认通过）→ REFACTOR（清理代码）
- 测试用真实代码（非mock），除非不可避免
- 测试名称必须清晰描述行为

### 验证门禁
- **铁律**：声称完成前必须运行验证命令并读取输出
- 禁止用语："应该可以了"、"看起来正确"、"大概没问题"
- 每次提交前：测试必须全绿、构建必须成功、输出必须干净

### 代码审查
- 每个任务完成后必须接受Spec合规审查 + 代码质量审查
- Spec合规：代码是否精确实现了PRD/TASKCHAIN中的要求
- 代码质量：命名、结构、重复、测试覆盖

### 调试规范
- 遇到问题必须先完成根因调查，再尝试修复
- 四阶段法：根因调查 → 模式分析 → 假设验证 → 实现修复
- 连续3次修复失败 → 停止并质疑架构

### 工作隔离
- 所有开发工作在隔离工作区中进行
- 每个功能完成后立即Git提交
- 出错时通过 `git reset` 回退到最近正常节点

## 重要注意事项

### 1. 限定修改范围（最关键）
- **每次修改只允许动指定的文件，不得擅自修改无关模块**
- 如果任务涉及文件A和B，不要修改C、D、E
- 如需修改多个文件，必须在任务描述中明确列出

### 2. 避免过度设计
- 优先实现核心功能，不要提前优化
- 不引入不必要的抽象层
- 能用简单方案就不用复杂方案

### 3. 移动端优先
- 所有UI必须以手机体验为优先（375px-428px宽度）
- 触摸目标最小44x44px
- 避免hover交互（手机没有hover）

### 4. 中文文案
- 所有UI文案使用中文
- 提示语要友好、有温度（如"还没有打卡记录，快去运动吧！"）

### 5. 错误处理
- 所有异步操作必须有try-catch
- 错误必须显示给用户（Toast或Alert），禁止静默失败
- IndexedDB操作失败时降级到localStorage（仅用于打卡记录）

### 6. 数据安全
- 用户数据完全本地存储，不上传任何服务器
- 清除数据功能需要二次确认
- 导出数据格式为JSON，用户可控

### 7. 性能要求
- 首屏加载 ≤ 2秒
- 打卡操作响应 ≤ 100ms
- 历史记录100条加载 ≤ 1秒
- 图表渲染 ≤ 500ms

### 8. 代码质量红线
- 禁止出现 `console.log`（提交前删除）
- 禁止出现未使用的变量/导入
- 禁止出现魔法数字（必须定义为常量）
- 禁止出现深层嵌套（最多3层）

## 开发环境

- **操作系统**：Linux / macOS / Windows（使用WSL2）
- **Node.js版本**：>= 18.0.0
- **包管理器**：npm >= 9.0.0
- **浏览器**：Chrome 90+ / Safari 14+ / Edge 90+

### 常用命令
```bash
npm run dev       # 启动开发服务器
npm run build     # 生产构建
npm run preview   # 预览生产构建
npm test          # 运行测试
```

## 已知问题和待办

<!-- 记录开发过程中发现的问题，便于后续处理 -->

---

## 用户确认

> ⚠️ **此文档完成后必须经过用户确认，确认通过后方可进入阶段5。**

**核心要点摘要：**
1. **开发规范**：TypeScript + React Hooks + CSS Modules，移动优先
2. **代码风格**：PascalCase组件、camelCase函数、单引号、2空格缩进
3. **测试要求**：TDD强制执行，每个公共函数必须有测试，边界条件全覆盖
4. **Superpowers工程纪律**：TDD、验证门禁、代码审查、调试规范、工作隔离
5. **修改范围限定**：每次只允许修改指定文件，不得碰无关模块
6. **质量红线**：无console.log、无未使用变量、无魔法数字、最多3层嵌套

AI操作：
1. 通知用户 `AGENTS.md` 已写入项目根目录，附简要摘要
2. 重点提醒审阅：开发规范是否与自身习惯一致、"修改范围限定"规则
3. 请求确认：*"`AGENTS.md` 已写入项目根目录，请查看本地文件。这些规则将约束所有后续AI编码行为，请仔细审阅。"*
4. 等待用户明确回应
5. 如需修改 → 修改后通知已更新并附修改要点，再次请求确认
6. 确认通过 → 更新 PROGRESS.md 标记阶段4完成，记录确认结果

**确认记录：**
- 日期：
- 确认结果：⬜ 通过 / ⬜ 需修改（修改内容：______）
- 修改轮次：第 ___ 次确认

---

> 下一步（确认通过后）：开始实现和迭代（阶段5），参考 PROGRESS.md 追踪进度
