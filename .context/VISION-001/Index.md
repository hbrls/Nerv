# VISION-001: 重启 backstage.js 项目，优化 Gitlab 的读取

> updated_by: HBR - GLM-5.2
> updated_at: 2026-06-26 23:48:00

## 同步约定

Vision 的当前事实由本地代码管理，而非本文件内的结构化 Schema：

- **管理文件**：`packages/desktop/src/data/vision.ts` 中的 `const A`
- **作用**：`A` 是 Vision 模拟数据，手动编辑即生效，无需改动组件逻辑。每个 Vision 节点的 `status`（`PASS`/`HOLD`/`TODO`/`null`）即该 Vision 的推进状态。
- **规则**：后续 Agent 推进 VISION-001 时，必须通过修改 `const A` 中对应节点的 `status` 来反映状态变化，不要在 `Index.md` 内另造状态字段。`Index.md` 仅用于人类可读的叙事与缺失事实记录。
- **样板数据约束**：`const A` 中已提前填充样板数据，可能与实际数据不一致。除非用户明确指出并与 Agent 一起修改，否则**不要改动样板数据**。保持样板数据是为了视觉上方便处理。

## Vision Schema

Vision 的数据模型定义在 `packages/desktop/src/features/vision/types.ts`：

- 真实字段：`id`（Vision 唯一标识，如 `"VISION-001"`）、`name`（一句话描述）
- 计算字段：`title` = `${id}: ${name}`，由 `visionTitle()` 派生，不存储
- `Vision`：`{ a: string; u; v; w }`
  - `a`：原点 Vision 的 id，指向 v 轴数组中某个元素的 id，该元素即原点（坐标 0,0,0）。原点身份由 `a` 直接指定，与 status 无关。
  - v 轴：vision 轴，唯一支持正负轴。原点 step=0，之前负轴（正下），之后正轴（正上）。
  - u/w 轴：只正轴，挂在原点上。
- **未来演进**：当前用本地代码方案是为简单同步；未来可能在 `Index.md` 内引入 Schema 做格式化规范化追踪，届时再迁移。

## 信号

用户一句话："重启 backstage.js 项目，优化 Gitlab 的读取"。

这是一句模糊 Vision，不是 spec。所指之物（backstage.js、Gitlab 读取）不一定在当前仓库内，不假定在本项目找实现。

## 状态

`signal_captured_clarification_needed`

- 当前目标：澄清 Vision 的真实所指与边界
- 等待：用户澄清下述缺失事实
- 退出条件：转为可执行 Plan（范围/动机/验收明确后），或明确判死

## 缺失事实

1. "backstage.js" 是哪个项目？是 Nerv 仓库里 Tauri 调用的 `backstage-gitea` CLI，还是另有一个独立项目？它现在在哪、还活着吗？
2. "重启"的动机是什么？旧项目停滞、换技术栈、还是调方向？从零新建还是在现有基础上推进？
3. "Gitlab 的读取"具体指什么？把数据源从 Gitea 换/扩到 Gitlab？新增 Gitlab 读取？读的是什么（blames / plan 上下文 / 代码仓库）？
4. 做到什么程度算成功？

## 下一步

向用户提出上述 4 个澄清问题。用户未澄清前，Vision 保持当前状态，不进入任何实现动作。

## 进展记录

- 2026-06-26：捕获原始信号，落地为 VISION-001。识别出 4 项缺失事实，未去仓库猜方案、未写实现代码。
- 2026-06-27：判定当前 Vision 不可作为单一目标推进——标题压了两个并列诉求，blocker 各异、follow-up 会失焦。试运行阶段 eager 拆分为两个独立 Vision：VISION-002、VISION-003。拆分暂记录于本文件，后续可能迁移至 `const A`。

## 拆分

VISION-001 当前信息不足以确认两个诉求是否关联，eager 拆分为独立子项各自澄清。拆分产生新的独立 Vision，不使用子编号。后续 Agent 应分别推进 VISION-002、VISION-003，不要把它们当同一件事处理。

> 编号说明：VISION-NNN 三位数字，无顺序意义（可视为雪花 ID），父子/先后关系通过内容记录而非编号表达。详见 SKILL「编号规则」。

### 顺序

所有 Vision 必须有先后关系，不存在并列。当前设计：

```text
VISION-002 → VISION-003 → VISION-001
```

箭头方向 === 时间流逝方向 === 资源投入顺序。资源先投入 VISION-002（澄清 backstage.js 项目本体），再投入 VISION-003（优化 Gitlab 读取），最后 VISION-001 作为母 Vision 在子项完成后收尾关闭，故位于链尾。

理由：003 的优化对象是否即 002 所指之物尚不明确，在 002 未澄清前 003 的对象悬空，故 002 先于 003。001 是拆分源头，其完成依赖 002/003，故排末尾。待 002 澄清后复核此顺序是否仍成立。

### VISION-002：重启 backstage.js 项目
- 性质：项目本体问题
- 卡点（待澄清）：
  1. "backstage.js" 是哪个项目？是 Nerv 仓库里 Tauri 调用的 `backstage-gitea` CLI，还是另有一个独立项目？它现在在哪、还活着吗？
  2. "重启"的动机是什么？旧项目停滞、换技术栈、还是调方向？从零新建还是在现有基础上推进？
- 下一步：澄清上述两点后，判断是否转 Plan 或继续拆。

### VISION-003：优化 Gitlab 的读取
- 性质：能力 / 数据源问题
- 卡点（待澄清）：
  3. "Gitlab 的读取"具体指什么？把数据源从 Gitea 换/扩到 Gitlab？新增 Gitlab 读取？读的是什么（blames / plan 上下文 / 代码仓库）？
  4. 做到什么程度算成功？（验收标准）
- 下一步：澄清上述两点后，判断是否转 Plan 或继续拆。

### 拆分理由（供后续 Agent）
- 试运行阶段 eager 拆分：两个诉求各自缺不同事实，合并推进会让 follow-up 失焦。
- 关联性未证实：VISION-002 与 VISION-003 可能在"重启时顺带换源"上关联，但当前无证据，不应预设关联。
- 拆分位置：当前记录于本文件；未来可能迁移至 `const A` 用独立节点表达。
