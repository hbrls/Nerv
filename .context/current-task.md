# Nerv 创新数据接入方案

> updated_by: HBR - GPT-5
> updated_at: 2026-08-22 11:20:04

## 任务判断

- `Mode`：discussion
- `Ready`：true
- `Next step`：按本方案进入 execute。

本任务为 Nerv 增加第四个真实数据集“创新”。Agent 在维护阶段离线调用上游命令，将返回的二维数组转换为现有 `Vision`，每次选择一个新的 seed 调用 `genRndB()`，然后把生成结果作为静态数据写入仓库。Desktop 应用运行时只读取静态数据。

## 已确认要求

- 菜单名称：`创新`。
- 路由：`/nervs/innovation`。
- 数据集标识：`innovation`。
- 上游命令：`backstage-vikunja scrum GET /visions --filter "创造"`。
- 上游返回 JSON 二维数组。
- 每个子数组的第一个元素是 VisionNode。
- 第一个子数组的第一个元素是原点。
- 子数组其余元素是挂在该 VisionNode 上的 UpNode。
- Agent 离线调用命令并更新仓库中的静态数据。
- 每次调用 `genRndB()` 生成新的 `b` 时，必须选择一个新的 seed。
- seed 是该次随机生成的算法参数，不是数据集固定配置。
- 不修改、不研究 `backstage-vikunja` 的实现。

## 非目标

- 不在应用运行时调用 `backstage-vikunja`。
- 不新增 Tauri 命令。
- 不新增 React 异步加载、缓存或重试逻辑。
- 不把 seed 固定为某个永久值。
- 不保存 seed 历史或增加 seed 溯源机制。
- 不新增正式更新框架、脚本执行器或 `tsx` 依赖。
- 不改造 Nerv-1、Nerv-2、Nerv-3。
- 不复制页面或画布组件。
- 本期不展示 `context`，不把 `priority` 映射为 `BusinessStatus`。

## 离线更新流程

```text
Agent 执行：
backstage-vikunja scrum GET /visions --filter "创造"
  |
  +-- 校验 JSON 二维数组
  |
  +-- 转换为 Vision a
  |
  +-- 为本次生成选择一个新 seed
  |
  +-- 调用 genRndB(a, seed) 生成 b
  |
  +-- 检查业务关系、坐标和视觉结果
  |
  +-- 写入 packages/desktop/src/data/nerv-innovation.ts
  |
  +-- 注册菜单与数据集
```

该流程由执行任务的 Agent 完成，不由应用的 `dev`、`build` 或启动流程自动触发。

## 上游数据结构

当前实际对象字段：

```ts
interface RawVisionNode {
  id: number;
  name: string;
  context?: string;
  priority?: number;
  workspaceId?: number;
}

type RawVisionGroups = RawVisionNode[][];
```

示意输入：

```text
[
  [A],
  [B, C],
  [D, E, F]
]
```

业务语义：

- `A`、`B`、`D` 是主 `v` 轴上的 VisionNode。
- `A` 是原点。
- `C` 是以 `B` 为锚点的 UpNode。
- `E`、`F` 是以 `D` 为锚点的 UpNode，顺序与原数组一致。

## 输入校验

生成前必须验证：

1. 命令成功退出，`stdout` 是合法 JSON。
2. 顶层是非空数组，否则无法确定原点。
3. 每个子元素都是非空数组。
4. 每个节点都是对象。
5. `id` 是有限安全整数。
6. `name` 是非空字符串。
7. 全部节点的 `id` 全局唯一。

响应中的 `workspaceId` 可以不同，不得据此重新分组或拒绝数据。任何校验失败都停止本次更新，不修改现有静态数据。

## 二维数组到 Vision 的转换

只投影现有 `Vision` 需要的字段：

```ts
function toContentNode(raw: RawVisionNode): ContentNodeData {
  return {
    id: String(raw.id),
    name: raw.name.trim(),
  };
}
```

转换规则：

```ts
function toVision(groups: RawVisionGroups): Vision {
  return {
    a: String(groups[0][0].id),
    v: groups.map((group) => toContentNode(group[0])),
    u: groups[0].slice(1).map(toContentNode),
    w: [],
    axes: groups.slice(1).flatMap((group) =>
      group.length > 1
        ? [{
            anchorId: String(group[0].id),
            u: group.slice(1).map(toContentNode),
          }]
        : [],
    ),
  };
}
```

示意输出：

```ts
{
  a: A.id,
  v: [A, B, D],
  u: [],
  w: [],
  axes: [
    { anchorId: B.id, u: [C] },
    { anchorId: D.id, u: [E, F] },
  ],
}
```

约束：

- 保留顶层数组和子数组顺序。
- 不按 ID、名称、`priority` 或 `workspaceId` 排序。
- 数值 ID 转换为字符串，不添加新业务语义。
- 不设置 `status`。
- 原点分组如有额外节点，放入顶层 `u`。
- 其他分组如有额外节点，放入以该组首节点为锚点的局部 `u`。
- 没有 UpNode 的分组不创建空的局部轴。

## 坐标生成

使用现有 `VisionBuilder`，不重新实现坐标算法。

设分组下标为 `i`，从 `0` 开始；组内 UpNode 位置为 `j`，从 `1` 开始：

```text
VisionNode(i) = (0, -i, i)
UpNode(i, j)  = (j, -i-j, i)
```

公式用于检查结果；实际坐标由 `VisionBuilder` 生成。所有节点满足 `q + r + s = 0`，并且按当前二维数组结构不会发生坐标碰撞。

## Empty 生成与 seed

每次离线更新执行：

```ts
const b = genRndB(a, seed);
```

规则：

- seed 由本次执行任务的 Agent 新选择。
- 每次生成新的 `b` 都必须使用一个新的 seed。
- 不把任何 seed 写成 Innovation 的永久配置。
- 不要求下一次生成复用当前 seed。
- 不把某次 seed 产生的 `visible` / `hidden` Empty 数量当作跨更新不变的验收常量。
- Agent 必须检查本次随机结果的视觉分布和连通性，再决定是否写入静态数据。

`genRndB()` 继续负责：

1. 使用 `VisionBuilder` 生成业务节点坐标。
2. 生成画布范围内的 Empty。
3. 根据本次 seed 随机选择常驻 Empty。
4. 从原点检查连通性并删除随机孤岛。
5. 返回静态 `CanvasNode[]`。

业务节点即使超出当前 viewBox 也不得被裁剪。

## 当前真实数据结构检查

当前上游命令返回：

```text
分组数：4
分组长度：[1, 2, 3, 1]
节点 ID：[[10], [12, 9], [17, 13, 6], [8]]
VisionNode：4
UpNode：3
业务节点总数：7
```

转换后的业务节点坐标应为：

```text
10  v  (0,  0, 0)  origin
12  v  (0, -1, 1)
17  v  (0, -2, 2)
8   v  (0, -3, 3)
9   u  (1, -2, 1)  anchor=12
13  u  (1, -3, 2)  anchor=17
6   u  (2, -4, 2)  anchor=17
```

这些业务节点数量和坐标由上游数组结构决定，与 seed 无关。Empty 的可见性分布由本次新 seed 决定，执行前不预设具体数量。

## 静态数据文件

新增 `packages/desktop/src/data/nerv-innovation.ts`：

```ts
import type { CanvasNode, Vision } from "../features/vision/types";

export const a: Vision = {
  // 由本次上游数据转换得到
};

export const b: CanvasNode[] = [
  // 由本次新 seed 离线生成
];
```

文件遵循现有规范，只保存 `a` 和 `b`，不保存上游调用、生成函数或 seed 配置。

## 应用接入

修改 `packages/desktop/src/pages/Nerv.tsx`：

```ts
import { b as innovation } from "../data/nerv-innovation";

const NERV_DATASETS: Record<string, CanvasNode[]> = {
  "nerv-1": nerv1,
  "nerv-2": nerv2,
  "nerv-3": nerv3,
  innovation,
};
```

修改 `packages/desktop/src/router/menu.ts`：

```ts
{ label: "创新", path: "/nervs/innovation" }
```

不修改 `router/index.tsx`，因为现有 `/nervs/:nervId` 已覆盖该路由。

## DEVELOPMENT 文档修正

现有文档列出了 Nerv-1、Nerv-2、Nerv-3 曾使用的具体 seed，但没有说明重新生成时必须选择新 seed，容易被错误理解成固定配置。

实施时应明确写入以下规则：

> seed 是每次离线随机生成 `b` 时使用的算法参数。每次重新生成 `b` 必须选择一个新的 seed，不得把已有 seed 当作数据集固定配置或下一次生成的默认值。

同时删除或改写任何要求后续继续使用同一 seed 的表述。本任务不引入 seed 历史或溯源机制。

## 实施文件范围

新增：

- `packages/desktop/src/data/nerv-innovation.ts`

修改：

- `packages/desktop/src/pages/Nerv.tsx`
- `packages/desktop/src/router/menu.ts`
- `DEVELOPMENT.md`

不修改：

- `packages/desktop/package.json`
- `packages/desktop/pnpm-lock.yaml`
- `packages/desktop/src/router/index.tsx`
- `packages/desktop/src-tauri/**`
- Nerv-1、Nerv-2、Nerv-3 数据文件
- `VisionBuilder` 和 `genRndB`

## 执行与验收

执行阶段由 Agent：

1. 调用真实上游命令。
2. 校验并转换二维数组。
3. 为本次生成选择一个新 seed。
4. 离线调用 `genRndB()`。
5. 检查业务坐标、Empty 分布和连通性。
6. 写入 `nerv-innovation.ts`。
7. 注册菜单和数据集。
8. 修正 `DEVELOPMENT.md` 的 seed 语义。

验证命令从仓库根目录执行：

```bash
pnpm --filter @nerv/desktop exec tsc --noEmit
pnpm --filter @nerv/desktop build
git diff --check
```

结果验收：

- 菜单显示“创新”，链接为 `/nervs/innovation`。
- 页面复用现有 Nerv 画布。
- 4 个 VisionNode、3 个 UpNode 的关系和坐标正确。
- Empty 使用本次新 seed 生成，视觉分布经过检查。
- `nerv-innovation.ts` 只包含静态 `a`、`b`。
- 应用运行时不调用 `backstage-vikunja` 或 `genRndB()`。
- Nerv-1、Nerv-2、Nerv-3 行为不变。
- 未知 `nervId` 仍显示 404。

## 结论

方案只实现初始任务要求的离线数据转换和静态菜单接入。seed 每次重新选择，不固定、不复用、不增加历史或溯源要求。
