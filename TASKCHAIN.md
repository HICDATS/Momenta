# 任务链

## 项目：Momenta - 运动打卡PWA
## 关联文档：PRD.md | TECH_DESIGN.md | AGENTS.md
## 工作区：.worktrees/develop（develop 分支）

## 任务执行规则

1. **严格顺序执行**：按 T01 → T20 顺序，不得跳过或打乱
2. **TDD强制**：每个任务先写失败测试，再写实现代码（T01 除外，框架搭建）
3. **修改范围限定**：每个任务只允许修改"涉及文件"中列出的文件
4. **双级审查**：每个任务完成后接受 Spec合规审查 + 代码质量审查
5. **验证门禁**：声称完成前必须运行验证命令并读取输出
6. **即时提交**：每个任务完成后立即 Git 提交，使用预定义的提交信息

## 任务状态图例

| 状态 | 含义 |
|------|------|
| `pending` | 未开始，等待前置依赖完成 |
| `ready` | 前置依赖已完成，可立即执行 |
| `in_progress` | 正在执行 |
| `completed` | 已完成并通过验证 |
| `blocked` | 被阻塞 |

---

## 阶段A：基础层（T01-T04）

#### T01: 初始化项目框架
- 状态：ready
- 优先级：P0
- 依赖：无
- PRD来源：项目基础架构（TECH_DESIGN.md 项目结构 + 技术栈）
- 涉及文件：package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, index.html, src/main.tsx, src/App.tsx, src/vite-env.d.ts, .gitignore(补充node_modules等), vitest配置
- TDD要求：无（框架搭建，后续任务补测试）
- 验收标准：
  - [ ] npm install 成功安装所有依赖
  - [ ] npm run dev 启动开发服务器无错误
  - [ ] npm run build 构建成功
  - [ ] npm test 可运行（即使没有测试用例）
  - [ ] 目录结构符合 TECH_DESIGN.md（components/pages/hooks/db/types/utils/constants/styles）
  - [ ] TypeScript 编译无错误
- 完成提交：feat: 初始化项目框架

#### T02: 类型定义与常量
- 状态：pending
- 优先级：P0
- 依赖：T01
- PRD来源：功能1运动类型列表 + TECH_DESIGN.md 数据模型
- 涉及文件：src/types/index.ts, src/constants/sports.ts
- TDD要求：
  - 测试文件：tests/unit/constants.test.ts
  - 测试场景：预设运动类型至少8种、每个类型有id/name/icon/color、id唯一
  - 验证命令：npm test
- 验收标准：
  - [ ] 定义所有数据模型接口（CheckIn, SportType, Achievement, AchievementCondition, Reminder, Goal, AppSettings）
  - [ ] 预设运动类型至少8种（健身、篮球、跑步、游泳、瑜伽、骑行、羽毛球、乒乓球）
  - [ ] 每个类型有id/name/icon/color/isDefault/order
  - [ ] 所有类型id唯一
  - [ ] 测试全部通过
- 完成提交：feat: 定义类型与常量

#### T03: 日期工具与验证器
- 状态：pending
- 优先级：P0
- 依赖：T02
- PRD来源：功能1规则（时间验证）+ 功能5统计（周/月计算）
- 涉及文件：src/utils/dateUtils.ts, src/utils/validators.ts, tests/unit/dateUtils.test.ts, tests/unit/validators.test.ts
- TDD要求：
  - 测试文件：dateUtils.test.ts, validators.test.ts
  - 测试场景：
    - dateUtils: 周起止（周一为起始）、月起止、格式化、日期分组键、同天判断
    - validators: 未来时间禁止、空值处理、备注长度限制（100字）、运动类型必选
  - 验证命令：npm test
- 验收标准：
  - [ ] getWeekStart/getWeekEnd 以周一为起始
  - [ ] getMonthStart/getMonthEnd 以自然月为准
  - [ ] formatDateTime 格式化友好（如"今天 19:30"）
  - [ ] isFutureTime 验证未来时间
  - [ ] validateNote 限制100字
  - [ ] validateSportType 验证非空
  - [ ] 边界条件全覆盖（空输入、最大值）
  - [ ] 测试全部通过
- 完成提交：feat: 日期工具与验证器

#### T04: Streak连续打卡算法
- 状态：pending
- 优先级：P0
- 依赖：T03
- PRD来源：功能3 Streak连续打卡（核心算法）
- 涉及文件：src/utils/streakCalculator.ts, tests/unit/streakCalculator.test.ts
- TDD要求：
  - 测试文件：streakCalculator.test.ts
  - 测试场景：
    - 连续3天打卡 → Streak=3
    - 连续3天后非休息日中断 → Streak=0
    - 连续3天后休息日中断再打卡 → Streak继续
    - 今天未打卡但昨天有 → Streak保持（今天还没过完）
    - 首次使用无记录 → Streak=0
    - 同一天多次打卡只算一天
    - 历史最高Streak计算
    - 跨周/跨月连续打卡
  - 验证命令：npm test
- 验收标准：
  - [ ] calculateStreak 函数正确计算当前连续天数
  - [ ] calculateMaxStreak 函数正确计算历史最高
  - [ ] 休息日逻辑正确（休息日不中断也不计数）
  - [ ] 今天未打卡时Streak保持（从昨天算起）
  - [ ] 同一天多次打卡只算一天
  - [ ] 边界条件（空数组、单条记录）
  - [ ] 所有测试通过
- 完成提交：feat: 实现Streak计算算法

---

## 阶段B：数据层（T05-T06）

#### T05: 数据库层与打卡记录Hook
- 状态：pending
- 优先级：P0
- 依赖：T04
- PRD来源：功能1打卡 + 功能2历史记录（CRUD）
- 涉及文件：src/db/database.ts, src/hooks/useCheckIns.ts, tests/unit/database.test.ts, tests/unit/useCheckIns.test.ts
- TDD要求：
  - 测试文件：database.test.ts, useCheckIns.test.ts
  - 测试场景：
    - database: Dexie表定义、索引正确、CRUD操作
    - useCheckIns: 添加打卡、删除打卡、查询全部、按类型筛选、按日期范围筛选、记录排序
  - 验证命令：npm test
- 验收标准：
  - [ ] Dexie数据库定义正确（表名、索引）
  - [ ] useCheckIns 提供 addCheckIn/deleteCheckIn/getAllCheckIns/getCheckInsByType/getCheckInsByDateRange
  - [ ] 添加打卡返回成功并写入DB
  - [ ] 删除打卡后记录消失
  - [ ] 查询结果按时间倒序排列
  - [ ] 筛选功能正确
  - [ ] 所有测试通过
- 完成提交：feat: 数据库层与打卡记录Hook

#### T06: Streak与统计Hooks
- 状态：pending
- 优先级：P0
- 依赖：T05
- PRD来源：功能3 Streak + 功能5基础统计
- 涉及文件：src/hooks/useStreak.ts, src/hooks/useStats.ts, src/hooks/useLocalStorage.ts, tests/unit/useStreak.test.ts, tests/unit/useStats.test.ts
- TDD要求：
  - 测试文件：useStreak.test.ts, useStats.test.ts
  - 测试场景：
    - useStreak: 当前Streak、历史最高、Streak状态（进行中/中断）
    - useStats: 本周次数、本月次数、总次数、各类型分布
  - 验证命令：npm test
- 验收标准：
  - [ ] useStreak 返回 currentStreak, maxStreak, isStreakActive
  - [ ] useStats 返回 weekCount, monthCount, totalCount, typeDistribution
  - [ ] useLocalStorage 提供通用的localStorage读写Hook
  - [ ] 统计数据与打卡记录一致
  - [ ] 周统计以周一为起始
  - [ ] 月统计以自然月为准
  - [ ] 所有测试通过
- 完成提交：feat: Streak与统计Hooks

---

## 阶段C：UI外壳（T07-T08）

#### T07: 全局样式系统
- 状态：pending
- 优先级：P0
- 依赖：T01
- PRD来源：界面设计（设计风格 + 配色）
- 涉及文件：src/styles/variables.css, src/styles/global.css, src/styles/animations.css
- TDD要求：无（样式文件，通过视觉验证）
- 验收标准：
  - [ ] variables.css 定义所有CSS变量（颜色#FF6B6B/#2D3436/#F8F9FA/#00B894、间距、字体、圆角、阴影）
  - [ ] global.css 设置基础重置、字体栈、body背景
  - [ ] animations.css 定义关键动画（打卡成功、成就解锁、Streak火焰）
  - [ ] 无硬编码颜色值（全部使用变量）
  - [ ] 移动优先（375px基础）
- 完成提交：style: 全局样式系统

#### T08: 布局与导航
- 状态：pending
- 优先级：P0
- 依赖：T07
- PRD来源：界面设计（5页面 + 底部导航）
- 涉及文件：src/components/Layout/Layout.tsx, src/components/Layout/Layout.module.css, src/components/Navigation/Navigation.tsx, src/components/Navigation/Navigation.module.css, src/context/AppContext.tsx, src/App.tsx
- TDD要求：
  - 测试文件：tests/integration/Layout.test.tsx
  - 测试场景：导航切换、路由渲染对应页面、底部导航5项
  - 验证命令：npm test
- 验收标准：
  - [ ] Layout 组件包含内容区 + 底部导航
  - [ ] Navigation 有5项（首页|历史|成就|统计|设置）
  - [ ] React Router 配置5个路由
  - [ ] AppContext 提供全局状态
  - [ ] 导航点击切换页面
  - [ ] 触摸目标 >= 44x44px
  - [ ] 测试通过
- 完成提交：feat: 布局与导航

---

## 阶段D：P0核心功能（T09-T13）

#### T09: 快速打卡组件
- 状态：pending
- 优先级：P0
- 依赖：T08
- PRD来源：功能1 运动快速打卡
- 涉及文件：src/components/QuickCheckIn/QuickCheckIn.tsx, src/components/QuickCheckIn/QuickCheckIn.module.css, src/components/common/Modal/Modal.tsx, src/components/common/Modal/Modal.module.css, src/components/common/Toast/Toast.tsx, src/components/common/Toast/Toast.module.css
- TDD要求：
  - 测试文件：tests/integration/QuickCheckIn.test.tsx
  - 测试场景：选择运动类型→弹出确认→确认打卡→成功提示
  - 验证命令：npm test
- 验收标准：
  - [ ] 运动类型图标网格展示（至少8种）
  - [ ] 点击图标弹出确认Modal（显示类型+时间+备注输入）
  - [ ] 确认后打卡成功并显示Toast
  - [ ] 备注可选，最多100字
  - [ ] 打卡时间自动取当前时间
  - [ ] 打卡响应 <= 100ms（感知瞬时）
  - [ ] 测试通过
- 完成提交：feat: 快速打卡组件

#### T10: Streak展示与基础统计组件
- 状态：pending
- 优先级：P0
- 依赖：T08
- PRD来源：功能3 Streak展示 + 功能5基础统计展示
- 涉及文件：src/components/StreakDisplay/StreakDisplay.tsx, src/components/StreakDisplay/StreakDisplay.module.css, src/components/StatsCard/StatsCard.tsx, src/components/StatsCard/StatsCard.module.css
- TDD要求：
  - 测试文件：tests/integration/StreakDisplay.test.tsx
  - 测试场景：Streak天数显示、火焰图标、中断状态、统计数据展示
  - 验证命令：npm test
- 验收标准：
  - [ ] StreakDisplay 大字号显示当前Streak天数
  - [ ] 火焰图标（进行中燃烧/中断熄灭）
  - [ ] StatsCard 显示本周/本月/总次数
  - [ ] 无记录时显示鼓励文案
  - [ ] 数据实时更新（打卡后刷新）
  - [ ] 测试通过
- 完成提交：feat: Streak展示与统计组件

#### T11: 首页集成
- 状态：pending
- 优先级：P0
- 依赖：T09, T10
- PRD来源：界面设计 页面1 首页Dashboard
- 涉及文件：src/pages/Home/Home.tsx, src/pages/Home/Home.module.css
- TDD要求：
  - 测试文件：tests/integration/Home.test.tsx
  - 测试场景：首页完整流程（显示Streak→显示统计→快速打卡→打卡后数据更新）
  - 验证命令：npm test
- 验收标准：
  - [ ] 顶部：Streak天数（大字号+火焰）
  - [ ] 中部：本周/本月统计卡片
  - [ ] 中部：快速打卡区域（运动类型网格）
  - [ ] 底部：最近3条打卡记录预览
  - [ ] 底部导航栏
  - [ ] 打卡后所有数据即时更新
  - [ ] 测试通过
- 完成提交：feat: 首页Dashboard

#### T12: 历史记录页
- 状态：pending
- 优先级：P0
- 依赖：T08
- PRD来源：功能2 打卡历史记录 + 界面设计 页面2
- 涉及文件：src/pages/History/History.tsx, src/pages/History/History.module.css, src/components/CheckInCard/CheckInCard.tsx, src/components/CheckInCard/CheckInCard.module.css, src/components/common/ConfirmDialog/ConfirmDialog.tsx, src/components/common/ConfirmDialog/ConfirmDialog.module.css
- TDD要求：
  - 测试文件：tests/integration/History.test.tsx
  - 测试场景：列表展示、按类型筛选、删除确认、空状态、分组显示
  - 验证命令：npm test
- 验收标准：
  - [ ] 记录按时间倒序排列
  - [ ] 按日期分组显示（今天/昨天/本周/更早）
  - [ ] 每条记录显示图标、名称、时间、备注
  - [ ] 支持按运动类型筛选
  - [ ] 删除记录需二次确认
  - [ ] 删除后列表即时更新
  - [ ] 空状态显示"还没有打卡记录，快去运动吧！"
  - [ ] 测试通过
- 完成提交：feat: 历史记录页

#### T13: 提醒与通知系统
- 状态：pending
- 优先级：P0
- 依赖：T08
- PRD来源：功能4 固定时间浏览器推送提醒
- 涉及文件：src/hooks/useReminders.ts, src/hooks/useNotifications.ts, src/constants/reminders.ts, src/utils/notificationScheduler.ts, tests/unit/useReminders.test.ts, vite.config.ts(更新PWA配置)
- TDD要求：
  - 测试文件：useReminders.test.ts
  - 测试场景：添加提醒、删除提醒、开关提醒、权限申请
  - 验证命令：npm test
- 验收标准：
  - [ ] useReminders 提供增删改查、开关
  - [ ] useNotifications 申请权限、显示通知
  - [ ] 支持设置多个提醒（至少3个）
  - [ ] 提醒包含星期/小时/分钟/文案/开关
  - [ ] 当天已打卡可跳过提醒
  - [ ] 未授权时友好提示
  - [ ] PWA manifest 配置正确
  - [ ] 测试通过
- 完成提交：feat: 提醒与通知系统

---

## 阶段E：P1功能（T14-T19）

#### T14: 成就系统
- 状态：pending
- 优先级：P1
- 依赖：T05
- PRD来源：功能6 成就系统
- 涉及文件：src/constants/achievements.ts, src/hooks/useAchievements.ts, src/components/AchievementBadge/AchievementBadge.tsx, src/components/AchievementBadge/AchievementBadge.module.css, src/pages/Achievements/Achievements.tsx, src/pages/Achievements/Achievements.module.css, tests/unit/useAchievements.test.ts
- TDD要求：
  - 测试文件：useAchievements.test.ts
  - 测试场景：各成就解锁条件、解锁状态、进度计算
  - 验证命令：npm test
- 验收标准：
  - [ ] 至少8个预设成就（初次启航、三日燃、一周全勤、月坚守、篮球达人、健身狂人、百变运动、目标达成）
  - [ ] 成就解锁条件正确（total_count/streak_days/monthly_count/sport_variety/goal_complete）
  - [ ] 未解锁灰色、已解锁彩色+解锁时间
  - [ ] 解锁进度实时计算（如"7/10"）
  - [ ] 解锁时有庆祝动画
  - [ ] 测试通过
- 完成提交：feat: 成就系统

#### T15: 统计图表页
- 状态：pending
- 优先级：P1
- 依赖：T06
- PRD来源：功能7 数据可视化 + 界面设计 页面4
- 涉及文件：src/components/StatsChart/StatsChart.tsx, src/components/StatsChart/StatsChart.module.css, src/pages/Statistics/Statistics.tsx, src/pages/Statistics/Statistics.module.css, tests/unit/useStats.test.ts(扩展)
- TDD要求：
  - 测试文件：useStats.test.ts(扩展图表数据)
  - 测试场景：时间范围切换、图表数据计算、空数据
  - 验证命令：npm test
- 验收标准：
  - [ ] 柱状图：周/月运动频率
  - [ ] 饼图：运动类型分布
  - [ ] 时间范围切换（本周/本月/最近30天/全部）
  - [ ] 图表响应式适配手机
  - [ ] 空数据有友好提示
  - [ ] 关键指标卡片（总次数、最爱运动、平均每周）
  - [ ] 测试通过
- 完成提交：feat: 统计图表页

#### T16: 目标追踪
- 状态：pending
- 优先级：P1
- 依赖：T05
- PRD来源：功能8 目标追踪
- 涉及文件：src/hooks/useGoals.ts, src/components/GoalProgress/GoalProgress.tsx, src/components/GoalProgress/GoalProgress.module.css, tests/unit/useGoals.test.ts
- TDD要求：
  - 测试文件：useGoals.test.ts
  - 测试场景：添加目标、删除目标、进度计算、完成状态
  - 验证命令：npm test
- 验收标准：
  - [ ] 支持设置周/月目标（次数+运动类型可选）
  - [ ] 支持至少3个并行目标
  - [ ] 进度条实时更新（如"3/4次"）
  - [ ] 目标完成时庆祝提示
  - [ ] 周期结束自动重置
  - [ ] 测试通过
- 完成提交：feat: 目标追踪

#### T17: 自定义运动类型
- 状态：pending
- 优先级：P1
- 依赖：T05
- PRD来源：功能10 自定义运动类型
- 涉及文件：src/hooks/useSportTypes.ts, src/components/SportTypeEditor/SportTypeEditor.tsx, src/components/SportTypeEditor/SportTypeEditor.module.css, tests/unit/useSportTypes.test.ts
- TDD要求：
  - 测试文件：useSportTypes.test.ts
  - 测试场景：添加自定义类型、编辑、删除、预设不可删、名称长度限制
  - 验证命令：npm test
- 验收标准：
  - [ ] 支持添加自定义运动类型（名称最多10字）
  - [ ] 支持选择图标
  - [ ] 预设类型不可删除
  - [ ] 删除自定义类型不影响历史记录
  - [ ] 自定义类型在打卡界面正常使用
  - [ ] 测试通过
- 完成提交：feat: 自定义运动类型

#### T18: 智能提醒
- 状态：pending
- 优先级：P1
- 依赖：T13
- PRD来源：功能9 智能提醒
- 涉及文件：src/utils/smartReminderChecker.ts, src/hooks/useSmartReminder.ts, tests/unit/smartReminder.test.ts
- TDD要求：
  - 测试文件：smartReminder.test.ts
  - 测试场景：超期检测、文案根据Streak变化、不与固定提醒重复
  - 验证命令：npm test
- 验收标准：
  - [ ] 超期未打卡（超过阈值）触发提醒
  - [ ] 提醒文案根据Streak状态个性化
  - [ ] 不与固定提醒重复发送
  - [ ] 阈值可配置（默认2天）
  - [ ] 测试通过
- 完成提交：feat: 智能提醒

#### T19: 设置页
- 状态：pending
- 优先级：P1
- 依赖：T13, T16, T17, T18
- PRD来源：界面设计 页面5 设置页
- 涉及文件：src/pages/Settings/Settings.tsx, src/pages/Settings/Settings.module.css, src/components/common/Button/Button.tsx, src/components/common/Button/Button.module.css
- TDD要求：
  - 测试文件：tests/integration/Settings.test.tsx
  - 测试场景：提醒管理、目标管理、自定义类型管理、数据导出、清除数据确认
  - 验证命令：npm test
- 验收标准：
  - [ ] 提醒设置区（添加/编辑/删除/开关）
  - [ ] 智能提醒开关 + 阈值设置
  - [ ] 目标设置区（添加/编辑/删除）
  - [ ] 自定义运动类型管理
  - [ ] 数据导出（JSON格式）
  - [ ] 清除数据需二次确认
  - [ ] 关于信息（版本号、隐私说明）
  - [ ] 测试通过
- 完成提交：feat: 设置页

---

## 阶段F：打磨与收尾（T20）

#### T20: 集成测试与优化
- 状态：pending
- 优先级：P0
- 依赖：T11, T12, T13, T14, T15, T16, T17, T18, T19
- PRD来源：非功能性需求（性能 + 兼容性 + 可访问性）
- 涉及文件：tests/integration/checkInFlow.test.tsx, tests/integration/fullApp.test.tsx, 各组件性能优化、PWA最终配置
- TDD要求：
  - 测试文件：checkInFlow.test.tsx, fullApp.test.tsx
  - 测试场景：完整打卡流程（打卡→Streak更新→统计更新→成就解锁）、页面切换、离线访问
  - 验证命令：npm test && npm run build
- 验收标准：
  - [ ] 完整打卡流程集成测试通过
  - [ ] 首屏加载 <= 2秒
  - [ ] 打卡响应 <= 100ms
  - [ ] 100条记录加载 <= 1秒
  - [ ] 图表渲染 <= 500ms
  - [ ] PWA可添加到主屏幕
  - [ ] 离线访问核心功能正常
  - [ ] 无console.log、无未使用变量
  - [ ] 所有测试通过 + 构建成功
- 完成提交：test: 集成测试与性能优化

---

## 任务依赖关系图

```
T01 (框架) → T02 (类型) → T03 (日期工具) → T04 (Streak算法) → T05 (数据库) → T06 (Hooks)
T01 → T07 (样式) → T08 (布局导航)
T08 → T09 (快速打卡) → T11 (首页)
T08 → T10 (Streak展示) → T11 (首页)
T08 → T12 (历史页)
T08 → T13 (提醒系统)
T05 → T14 (成就)
T06 → T15 (统计图表)
T05 → T16 (目标)
T05 → T17 (自定义类型)
T13 → T18 (智能提醒)
T13 + T16 + T17 + T18 → T19 (设置页)
全部 → T20 (集成优化)
```

## 进度统计

- 总任务数：20
- 已完成：0
- 进行中：0
- 待开始：20
- 阻塞：0
