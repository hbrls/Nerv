# DEVELOPMENT

> updated_by: HBR - GPT-5
> updated_at: 2026-08-27 00:00:00

本文记录 Nerv 当前已经验证过的开发约定。后续修改应优先保持这些边界，避免把业务数据、画布数据和视觉状态重新耦合。

## Nerv 数据模型

Nerv 使用两层数据：

- `a` 是业务原始数据。主轴按 `u`、`v`、`w` 三个方向组织，`axes` 可将既有节点声明为局部轴锚点。轴结构表达业务关系，不是为了方便渲染。
- `b` 是画布实际使用的静态快照，是一个扁平的 `CanvasNode[]`，包含当前画布上的所有业务节点与 Empty 节点。

页面只渲染 `b`。不要在组件中重新遍历 `a` 生成坐标，也不要让渲染组件理解 `a` 的轴数组结构。

主轴原点由 `a.a` 指向 `a.v` 中的对应节点。`a.axes` 中的局部轴通过 `anchorId` 引用主轴或其他局部轴上的既有节点，并沿自己的 `u`、`v`、`w` 正方向排列节点。局部轴锚点不重复定义；缺失锚点、循环依赖、重复节点 id 和坐标冲突均由 `VisionBuilder` 拒绝。

`CanvasNode` 是基于 `type` 的联合类型：

- `type: "u" | "v" | "w"` 表示 `ContentNode`，三条轴分别对应 Up、Vision、Work。
- `type: "empty"` 表示画布上的空位置。

业务语境下，画布上的所有节点统一称为 Vision 节点。`ContentNode` 与 `EmptyNode` 只用于技术实现中的节点分类，不定义或限制业务术语。

`BusinessStatus` 为 `FAIL | HOLD | PASS | TODO | UNKNOWN`。`UNKNOWN` 是 ContentNode 的真实业务状态，渲染为 Ellipsis（`•••`），适用于 `u`、`v`、`w` 三条轴。它不是 Empty，也不能转换为空位置。

`ContentNode` 的公共渲染逻辑统一由 `ContentNode.tsx` 承担，VisionNode、WorkNode、UpNode 只提供轴向文字与 origin 的差异。

## Empty 的视觉状态

所有 Empty 在功能语义上是同一种节点。`visible` 是离线计算出的默认可见性，不应拆成不同的节点类型：

- `visible: true`：默认显示虚线 Hex，鼠标离开后仍显示。
- `visible: false`：默认不可见，鼠标悬停时临时显示，离开后恢复不可见。

对应样式统一放在 `packages/desktop/src/styles.css`：

- `.nerv-grid-cell-empty`
- `.nerv-grid-cell-empty--visible`
- `.nerv-grid-cell-empty--hover`

未来增加 Empty 的点击能力时，应给全部 Empty 复用同一套交互逻辑，不要因 `visible` 不同而实现两套行为。

## 离线生成规则

所有 Nerv 数据文件都只保存原始业务数据 `a` 和离线生成的静态 `b`。业务轴到坐标的转换统一由 `VisionBuilder` 处理，画布范围、随机筛选和连通性逻辑统一放在 `packages/desktop/src/data/utils.ts`。数据文件中禁止保留生成函数、概率参数、seed 或坐标计算逻辑。应用运行时只能读取 `b`。

`genRndB()` 是离线维护工具，职责是：

1. 从 `a` 计算业务节点坐标。
2. 根据画布 `viewBox` 计算所有可见 Hex 坐标。
3. 根据 seed、原点距离和 `w` 轴倾向随机选择常驻 Empty。
4. 从原点执行六方向连通性搜索，删除不与原点直接或间接连通的随机孤岛。
5. 将连通 Empty 标记为 `visible: true`，其余空坐标标记为 `visible: false`。
6. 返回包含全部可见坐标的扁平 `CanvasNode[]`。

连通性处理是“删除孤岛”，不是补齐断点。

调整随机算法或更新数据时，由 Agent 从 `utils.ts` 离线调用 `genRndB(vision, seed)`，检查结果后将完整数组写回对应数据文件的 `const b`。seed 是每次离线随机生成 `b` 时使用的算法参数。每次重新生成 `b` 必须选择一个新的 seed，不得把已有 seed 当作数据集固定配置或下一次生成的默认值。禁止在 React 组件、路由加载或应用初始化过程中调用 `genRndB()`，以免每次运行产生计算和视觉漂移。

## 多数据集接入

当前数据文件位于：

- `packages/desktop/src/data/nerv-1.ts`
- `packages/desktop/src/data/nerv-2.ts`
- `packages/desktop/src/data/nerv-3.ts`
- `packages/desktop/src/data/nerv-innovation.ts`

新增数据集时按以下顺序处理：

1. 复制一个现有 `nerv-{序号}.ts` 文件。
2. 按业务要求保留或修改 `a`。
3. 选择一个新的 seed，使用 `utils.ts` 中的 `genRndB(vision, seed)` 离线生成并替换静态 `b`。
4. 在 `packages/desktop/src/pages/Nerv.tsx` 的 `NERV_DATASETS` 中注册数据集。
5. 在 `packages/desktop/src/router/menu.ts` 的 Nerv 子菜单中增加入口。
6. 验证业务节点、坐标唯一性、Hex 数量与视觉分布。

路由只保留一个参数化页面：`/nervs/:nervId`。数据集差异由 `nervId -> b` 的映射处理，不要为每个数据集复制页面组件。未知 `nervId` 应进入 `NotFound`。

项目使用 `HashRouter`，因此浏览器中的完整调试地址形如：

```text
http://127.0.0.1:1420/#/nervs/nerv-1
```

React Router 内部定义仍使用 `/nervs/nerv-1`，菜单链接也不应手动添加 `#`。

## 画布约定

当前 Nerv 画布使用 `react-hexgrid`，主要参数为：

```tsx
<HexGrid width={1200} height={750} viewBox="-60 -50 200 100">
  <Layout size={{ x: 5, y: 5 }} flat spacing={1.2} origin={{ x: 0, y: 0 }}>
```

数据生成器中的 `GRID_CONFIG` 必须和页面的 `viewBox`、`size`、`spacing` 保持一致。修改任一参数后都需要重新核对可见坐标范围，并重新生成所有数据集的静态 `b`。

切换 `nervId` 时，`NervCanvas` 使用数据集 id 作为 React `key`，用于重置节点详情等页面内状态。新增局部状态时要继续保证数据集切换不会保留上一个画布的选择结果。

## 当前验收基线

在画布参数不变的前提下：

- 当前画布范围包含 252 个坐标唯一且满足 `q + r + s = 0` 的 Hex 位置。
- Nerv-1 包含 255 个节点：22 个 ContentNode、4 个 UNKNOWN、233 个 Empty，其中 `visible=true` 为 50 个、`visible=false` 为 183 个。`w15`、`w16`、`w17` 是画布范围外仍需保留的业务节点。
- Nerv-2 包含 252 个节点：10 个 ContentNode、2 个 UNKNOWN、242 个 Empty，其中 `visible=true` 为 49 个、`visible=false` 为 193 个。
- Nerv-3 包含 252 个节点：13 个 ContentNode、4 个 UNKNOWN、239 个 Empty，其中 `visible=true` 为 33 个、`visible=false` 为 206 个。
- 创新包含 252 个节点：7 个 ContentNode、245 个 Empty，其中当前静态快照 `visible=true` 为 28 个、`visible=false` 为 217 个。

这些数量只描述当前静态快照，不是跨更新保持不变的常量。所有静态 `b` 均由 `utils.ts` 中的 `genRndB()` 离线生成；重新生成任一 `b` 时必须使用新的 seed，并重新检查节点数量、视觉分布与连通性。

## 界面约定

- Nerv 是左侧父菜单，全部数据集入口是常驻展开的子菜单。
- 项目不需要 Breadcrumb 区域，新增页面时不要恢复 Breadcrumb。
- 前端不提供 Blame 菜单、页面或路由。不要因为后端仍存在相关能力而重新暴露前端入口。
- Nerv 数据集页面共用同一个画布组件，不新增独立网格层。

## 验证流程

本项目是 pnpm monorepo。所有 pnpm 命令必须在仓库根目录执行，并通过 `--filter` 指定目标 package；不要进入 `packages/desktop` 后直接运行 pnpm 命令。

修改 Nerv 数据、路由或菜单后至少在根目录执行：

```bash
pnpm --filter @nerv/desktop exec tsc --noEmit
pnpm --filter @nerv/desktop build
git diff --check
```

项目当前没有安装 `tsx`，不要假设可以直接执行 TypeScript 数据文件。若需要离线检查 `genRndB()`，可使用项目已有的 `typescript` 编译 API 临时转译后执行，或在明确需要时补充正式脚本；不要为了单次验证临时安装依赖。

浏览器验收至少检查：

- Nerv 父菜单及全部子菜单可见。
- 子菜单激活状态与 `nervId` 一致。
- 全部数据集均渲染预期数量的 Hex。
- `visible=true` 与 `visible=false` 数量符合静态数据。
- `/nerv` 和 `/nervs` 重定向至 Nerv-1。
- 未知数据集显示 404。
- 页面中不存在 Blame 菜单和 Breadcrumb。

## 本地开发收尾

本地验证应复用一个由当前任务启动的 devServer，启动命令也必须从 monorepo 根目录执行：

```bash
pnpm --filter @nerv/desktop dev -- --host 127.0.0.1
```

Codex 启动 devServer 或创建 Browser 标签时，必须立即保存内部管理工具返回的 server session、tab 引用或精确 id。离开项目时必须检查并关闭由当前 Codex 任务开启的资源：

1. 通过 Codex 的进程会话管理工具停止本任务保存的 devServer session，并确认该会话已经退出。
2. 通过 Browser 内部管理工具关闭本任务保存的 tab；若 tab 已释放，则只按本任务记录的精确引用或 id 重新认领并关闭。
3. 清理完成后，再通过相同的内部管理工具确认本任务持有的 server session 和 tab 均已释放。

资源归属必须以 Codex 启动时保存的内部记录为准。禁止根据端口、工作目录、进程名称或 localhost URL 扫描并批量关闭资源，因为这些资源可能由用户、编辑器扩展或其他 Agent 启动。

如果 devServer 或 Browser 标签在 Codex 进入项目之前已经存在，默认视为非 Codex 资源，不得关闭；只有用户明确指定目标并要求关闭时才能处理。
