---
name: vision
description: USE 回流后的裁决工作流：读取 WORKSHOP-NNN.md 的 USE 回答，在对话中判定下一步动作（重开 workshop / 拆分前置 Vision / 转 Plan）。
---

# vision · 回流裁决工作流

## 目的

本工作流在 checkpoint 完成且 USE 回流后执行，负责裁决当前 Vision 的下一步动作。

vision 是**高交互流程**：在对话中与用户对齐，不写文件、不改 WORKSHOP、不产出 DECISION。

## 触发条件

vision 在以下条件**全部满足**时触发：

1. 当前 Vision 目录已存在 `WORKSHOP-NNN.md`（checkpoint 已完成交付）
2. `WORKSHOP-NNN.md` 中的 USE 章节已有回答记录（USE 已回流）

若以上条件未满足，vision 不触发，保持等待状态。

## Vision Id 边界

Vision Id 是 `.context/` 下的一级目录名。当前 Vision 目录为 `.context/<Vision Id>/`。

vision 由用户 / 上游显式唤起，Vision Id 必须由唤起指令明确指定。

读取输入限制在当前 Vision 目录内。但裁决中的「拆分前置 Vision」可能涉及新的 Vision——此为裁决建议，vision 本身不创建，由上游执行。

## 三种裁决结果

vision 读取 WORKSHOP-NNN.md 的 USE 回答后，必须从以下三种结果中裁决出唯一一种，在对话中向用户说明：

### 结果一：重开 workshop（继续澄清）

**判定条件**：
- USE 回答引入了新的、未在原讨论中覆盖的关键问题
- 或 USE 回答与 WORKSHOP 已锁定结论存在矛盾，需重新讨论
- 或 USE 回答暴露当前讨论范围不足，需扩展澄清

### 结果二：拆分前置 Vision（先做前置）

**判定条件**：
- USE 回答后，当前 Vision 的目标已对齐，但存在一个或多个前置依赖未解决
- 前置依赖是独立的、可拆分的 Vision（非当前 Vision 内部可闭合的子问题）
- 不解决前置依赖，当前 Vision 无法转 Plan

### 结果三：转 Plan（进入设计）

**判定条件**：
- USE 回答已闭合全部关键缺口
- WORKSHOP 已锁定结论足够清晰、可执行
- 无未解决的前置依赖
- 信息和材料已足够开始设计 Plan

## 对话回答结构

vision 在对话中回答，结构如下：

```text
## 裁决

**{结果一 / 结果二 / 结果三}**

依据：{逐条列出支撑裁决的事实，引用 WORKSHOP §3/§5/USE 回答}

## 下一步

{根据裁决结果}
- 结果一：需新增澄清的关键问题
- 结果二：前置 Vision 清单（目标、关系、时序位置）
- 结果三：转 Plan 的输入摘要（可执行目标、验收标准、约束）
```

裁决必须给出明确选择，不得"都可以 / 看情况"。

## 执行步骤

### 步骤 1：确认触发条件

确认当前 Vision 目录满足全部触发条件。不满足则停止，报告等待状态。

### 步骤 2：读取基线

读取当前 Vision 目录下最新的 `WORKSHOP-NNN.md`，重点关注：
- §3 状态矩阵
- §5 已锁定结论
- USE 章节各子章节的回答区
- §6.3 假设登记

### 步骤 3：裁决并对话回答

基于基线内容，按「三种裁决结果」的判定条件，裁决出唯一结果，在对话中向用户说明裁决结果、依据和下一步。

### 步骤 4：等待用户指令

裁决回答后，等待用户指令。不自行执行下一步动作。

## 约束

- vision 是高交互流程，在对话中回答，**不写任何文件**
- 不修改 WORKSHOP-NNN.md、C-NNN.md、TASK-NNN.md、Index.md 或任何已有文件
- 不创建 DECISION 文件或其他产物文件
- 不读取或写入其他 Vision Id 目录
- 不创建 TASK 文件
- 不启动新的讨论循环
- 不自行执行裁决结果（重开 workshop / 创建 Vision / 转 Plan 由用户 / 上游驱动）
- 裁决必须明确，不得悬而未决
