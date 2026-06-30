---
name: checkpoint
description: 讨论结束标记：在当前 Vision Id 目录内先输出完整交付包 WORKSHOP-NNN.md（含 USE 人工执行请求），再创建 .done/ 目录。
---

# checkpoint · 结束标记工作流

## 目的

本工作流负责讨论结束时在当前 Vision 目录内执行两项操作：

1. **先交付**：基于当前讨论产出生成完整输出物 `.context/<Vision Id>/WORKSHOP-NNN.md`，其中包含独立的 USE 章节承载人工执行请求
2. **后标记**：创建 `.context/<Vision Id>/.done/` 目录，作为该 Vision 讨论已结束的标记

checkpoint 不参与讨论过程，不启动新的讨论循环。

## Vision Id 边界

Vision Id 是 `.context/` 下的一级目录名，例如 `LSTD-48`。当前 Vision 目录为 `.context/<Vision Id>/`。

checkpoint 由当前 TASK 唤起，Vision Id 必须由当前 TASK 文件所在目录推导。例如当前 TASK 为 `.context/LSTD-48/TASK-003.md` 时，当前 Vision Id 为 `LSTD-48`，当前 Vision 目录为 `.context/LSTD-48/`。

所有输入、输出、编号扫描和结束标记都必须限制在当前 Vision 目录内。不得跨 Vision Id 读取或写入，不得向 `.context/` 根目录写入 `WORKSHOP` 或 `.done`。

## 编号格式

所有 `TASK`、`C`、`WORKSHOP`、`USE` 序列文件名必须使用三位数字零补齐格式：`TASK-001.md`、`C-001.md`、`WORKSHOP-001.md`、`USE-001`（USE 为章节标题，非独立文件）。

不得创建 `TASK-1.md`、`C-1.md`、`WORKSHOP-1.md`、`TASK-01.md`、`C-01.md`、`WORKSHOP-01.md` 等非规范文件。编号扫描只认可三位数字格式。

## WORKSHOP 编号机制

WORKSHOP 编号由当前 Vision 目录下已有的 `WORKSHOP-NNN.md` 文件决定：

- 扫描 `.context/<Vision Id>/` 下所有 `WORKSHOP-*.md` 文件，只解析符合 `WORKSHOP-NNN.md` 三位格式的文件，解析出最大编号 M
- 下一个 WORKSHOP 编号 N = M + 1
- 若当前 Vision 目录中无任何规范 `WORKSHOP-NNN.md` 文件，则 N = 1
- 文件名格式：`.context/<Vision Id>/WORKSHOP-{N:03d}.md`（三位零补齐，如 `WORKSHOP-001.md`、`WORKSHOP-002.md`）
- 不扫描其他 Vision Id 目录下的 `WORKSHOP-*.md`

使用下方 Python 脚本获取编号 N：

```python
import os
import re

vision_dir = '.context/<Vision Id>'
existing = []
if os.path.isdir(vision_dir):
    for f in os.listdir(vision_dir):
        m = re.match(r'^WORKSHOP-(\d{3})\.md$', f)
        if m:
            existing.append(int(m.group(1)))

next_num = max(existing) + 1 if existing else 1
print(f"{next_num:03d}")
```

## WORKSHOP 输出

checkpoint 在创建结束标记之前，必须先回顾本轮讨论的全部产出（由当前 TASK 的输入字段指定的当前 Vision 目录内 `C-NNN.md` 文件，以及当前 TASK 明确列入输入的同 Vision 历史 `WORKSHOP-NNN.md` 参照文件），生成完整输出物并写入 `.context/<Vision Id>/WORKSHOP-NNN.md`。

WORKSHOP 是当前 Vision 内会被保留并供后续接手的完整交付物，不是 `C-NNN` 的摘要，也不是关闭标记本身。checkpoint 应：

- 读取当前 TASK 指定的输入文件
- 确认输入文件位于当前 Vision 目录内
- 将当前 TASK 指定输入中的有效结论、方案、字段、SOP、状态矩阵、判定规则、停止条件、执行入口、人工验收点和后续接手方式合并与完整化
- 若当前 TASK 指定同 Vision 历史 `WORKSHOP-NNN.md` 作为结构参照或基线，读取它并对齐其覆盖度；成熟样板应达到类似 `WORKSHOP-001` 的完整章节深度（如 §0-§10，含字段表 / SOP / 状态矩阵 / 判定规则 / 停止条件 / USE 章节）
- 将完整交付包写入 `.context/<Vision Id>/WORKSHOP-NNN.md`

checkpoint 的合并动作只写入新的 `WORKSHOP-NNN.md`，不得回头修改已有 `WORKSHOP-NNN.md`、`C-NNN.md` 或 `TASK-NNN.md`。如果历史产物本身需要修正，应由上游重新运行 workshop / workflow 生成新产物，而不是由 checkpoint 直接编辑原产物。

## USE 章节机制

### USE 是什么

USE 是 checkpoint 在收束时识别到"某些闭合动作必须由人执行、Agent 已无法独立完成"后，在 WORKSHOP-NNN.md 内发起的**结构化人工执行请求**。USE 是执行权移交，不是问题、不是异常、不是通知。

USE 承载于 WORKSHOP-NNN.md 文件内，作为独立的顶级章节存在，不拆分为独立文件。

### USE 编号机制

- USE 编号与所在 WORKSHOP 编号对应：`WORKSHOP-001` 内的 USE 章节标题为 `# USE-001`
- 一个 WORKSHOP 内只有一个 USE 大章节，编号与 WORKSHOP 一致
- USE 章节位于 WORKSHOP-NNN.md 文件末尾，与 WORKSHOP 主体用 `---` 分割

### USE 判定标准（何时必须生成 USE）

checkpoint 在步骤 3 生成 WORKSHOP 时，必须扫描本轮讨论产出中是否存在"必须由人执行"的闭合动作。判定标准参考 use skill：

- **身份持有者专属操作**：必须由掌握特定实际项目 / 实例 / 环境的人提供的信息或操作
- **现实操作执行**：需要人在实际项目中核实的配置、环境、权限、验收用例
- **用户偏好 + 实际项目环境信息**：本环境（Agent 侧）无法独立获取或推断的事实
- **Agent 侧已穷尽**：经多轮 LENS / TASK 调度仍标记为"需用户回答"，无可独立锁定项

命中以上任一，且该动作是进入下一阶段的强制前置条件时，checkpoint 必须生成 USE 章节。未命中时，WORKSHOP 不含 USE 章节。

### USE 章节结构

USE 章节结构如下：

```markdown
---

# USE-NNN

> Target: {执行主体}

{一句话说明：本轮收束识别到哪些闭合动作必须由人执行}

---

## {锚点编号} {问题一句话}

> Target: {执行主体}

### 需要什么人工

直接说明需要什么样的帮助——谁、做什么。不是 why（为什么是人工），是 what（需要什么人工）。checkpoint 已通过规则判定需要人工，此处只说清需要什么样的帮助，直接、明确，不解释判定理由。

### 执行请求

具体要做什么、输入是什么、产出是什么。给出明确的选项或要求，不要"都可以 / 看情况"。

### 回答

用户回答的原地记录区。初始为空，随问答推进原地更新：

- 用户回答后，Agent 把回答**梳理总结为规范文本**写入本节，不记录用户原文
- 回答不完整时，Agent 可在本节内追问，追问与回答都留在本节
- 追问完成自然进入下一个问题
- 不需要状态字段：USE 被产出即意味着 open，追问中即继续追问，完成即进入下一题

### 完成判据

怎样算这个 USE 做完（可验证的条件）。必须包含回写要求——回答回写到 `.context/<Vision Id>/Index.md` 的"待澄清"段。

### 影响

- 阻塞主流程：是 / 否
- 完成后下一步
- 未完成时策略（暂停 / 等待 / 降级）
```

### USE 回答区机制

USE 子章节包含「回答」区，用于原地记录用户反馈，构成闭环：

- **初始状态**：checkpoint 生成 USE 时，回答区为空。USE 被产出即意味着 open，不需要状态字段
- **用户回答流入**：用户回答后，Agent 把回答梳理总结为规范文本写入回答区，不记录用户原文
- **追问**：若回答不完整或需进一步澄清，Agent 在回答区内追问并继续记录，追问与回答都留在本节
- **完成**：追问完成、回答满足完成判据后，自然进入下一个问题，不需要标记状态
- **不扩散**：回答只针对当前 USE 子章节，不要因为回答内容而新增 USE 或偏离当前问题；除非回答暴露了明显的路线问题
- **原地更新**：回答直接在 USE 子章节的回答区原地更新，不另建文件

### USE 子章节锚点编号规则

- 每个 USE 动作是 USE 大章节下的一个 `##` 子章节
- **子章节编号以原文锚点为准**（如 `4.1.1`、`4.2.1`、`4.3.1`），不重新连续编号，不追求顺序
- 原文不是每个问题都会成为 USE；只有被判定为"必须由人执行"的问题才进入 USE 章节
- 因此 USE 子章节编号可能跳号、不连续——这是正确的，因为编号是锚点而非序号
- 若原文没有现成锚点编号，使用原文的章节路径作为锚点

### USE 五段结构的语义约束

| 小节 | 语义 | 常见错误 |
| --- | --- | --- |
| 需要什么人工 | what——需要什么样的帮助（谁、做什么） | ❌ 写成 why——解释为什么是人工 / Agent 已穷尽的经过 |
| 执行请求 | 具体可执行的请求 | ❌ 模糊的"请回答以下问题"无选项无要求 |
| 回答 | 用户反馈的原地记录，可追问 | ❌ 空着不更新；❌ 扩散到新 USE；❌ 另建文件 |
| 完成判据 | 可验证的完成条件 | ❌ 缺少回写要求 |
| 影响 | 阻塞判断 + 后续策略 | ❌ 只写阻塞不写未完成时策略 |

## 执行步骤

### 步骤 1：读取任务

读取当前任务文件，确认任务为结束标记操作，并根据当前 TASK 文件所在目录推导 Vision Id。

### 步骤 2：确定 WORKSHOP 编号

扫描当前 Vision 目录下已有规范 `WORKSHOP-NNN.md` 文件，按"WORKSHOP 编号机制"计算下一个编号 N。

### 步骤 3：生成 WORKSHOP 完整输出物

1. 读取当前 TASK 指定应读取的输入文件（如当前 Vision 目录内的 `C-NNN.md`，以及被当前 TASK 明确列入输入的同 Vision 历史 `WORKSHOP-NNN.md`）
2. 基于输入整合并完整化本轮讨论的全部有效结论与可执行细节
3. **USE 判定**：扫描产出中是否存在命中"USE 判定标准"的闭合动作
   - 命中：按"USE 章节结构"在 WORKSHOP 末尾生成 `# USE-NNN` 独立章节，每个需人工的动作为一 `##` 子章节，带完整四段结构
   - 未命中：WORKSHOP 不含 USE 章节
4. 将完整输出物写入 `.context/<Vision Id>/WORKSHOP-{N:03d}.md`

### 步骤 4：创建结束标记

1. 确认当前 Vision 目录 `.context/<Vision Id>/` 存在
2. 创建 `.context/<Vision Id>/.done/` 目录
3. 报告完成状态

### 步骤 5：停止

上述步骤全部完成后，checkpoint 必须立即停止。

## 约束

- 先输出 WORKSHOP（含 USE 章节），后创建 `.done/`；顺序不可颠倒
- 扫描编号时只关注当前 Vision 目录内的规范 `WORKSHOP-NNN.md` 文件，不与 C-NNN 或 TASK-NNN 编号混淆
- 仅读取当前 TASK 指定的输入文件，不读取其他 TASK 或未指定的 C-* 文件
- 不读取或写入其他 Vision Id 目录
- 不向 `.context/` 根目录创建 `WORKSHOP` 或 `.done`
- 不修改任何已有文件
- 不启动新的讨论循环
- 不创建新的 TASK 文件
- 不使用一位或两位数字编号创建 `WORKSHOP` 文件
- USE 章节承载于 WORKSHOP-NNN.md 内，不创建独立的 USE 文件
- USE 子章节编号以原文锚点为准，不重新连续编号
- USE「需要什么人工」写 what 不写 why
