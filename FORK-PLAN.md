# M3E Canvas Fork 改造计划

## 项目目标
从 m3e-canvas (MIT) fork 一个可视化 UI 拖拽编辑器，用于给 AI 编程工具生成精确的 UI 描述 prompt。
保留 M3 组件库，增加品牌定制和 prompt 增强。

## Phase 1: 品牌化 + 部署（1-2天）
- [ ] 重命名项目（待定：Canvas / UI Sketch / Prompt Canvas）
- [ ] 替换 logo 和 favicon
- [ ] 配色方案：保留 M3 主题系统，但默认用我们的暖色琥珀系
- [ ] 部署到 CF Pages（子域名：canvas.gridpaw.com 或独立域名）
- [ ] 初始化新 git 仓库，保留原始 LICENSE 和 NOTICE

## Phase 2: Prompt 增强（3-5天）
- [ ] 增加 prompt 模板系统：不同场景的 prompt 模板（移动端 app、Web 工具、落地页）
- [ ] 支持自定义 prompt 前缀/后缀（注入项目上下文、技术栈约束）
- [ ] 增加"Copy to Hermes"按钮，直接生成 Hermes 可用的 prompt 格式
- [ ] Prompt 预览和编辑面板增强

## Phase 3: 组件扩展（1-2周）
- [ ] 增加非 M3 组件：自定义卡片、统计图表占位、表单布局
- [ ] 增加 web 特有组件：Hero section、Feature grid、CTA、Footer
- [ ] 组件分类优化：按用途分组（导航 / 内容 / 输入 / 布局 / 反馈）

## Phase 4: 高级功能（按需）
- [ ] 多设计系统支持（除了 M3 还支持 Tailwind/shadcn 风格）
- [ ] 导入已有 UI 截图作为参考层
- [ ] 与 Hermes 集成：从 Canvas 直接触发 AI 生成代码
- [ ] 项目保存/加载（localStorage → 云同步）

## 技术栈
- Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript 7
- 静态导出（CF Pages 部署）
- 无后端（localStorage 持久化）

## 原始项目
- 仓库: https://github.com/lnkiai/m3e-canvas
- License: MIT
- Stars: 2239 (2026-09-05)
