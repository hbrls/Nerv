# VISION-003: 优化 Gitlab 的读取

> updated_by: HBR - GLM-5.2
> updated_at: 2026-06-27 23:45:40

## 讨论主题

优化 Gitlab 的读取。

## 原始目标

来自 VISION-001 拆分。VISION-001 原始信号为"重启 backstage.js 项目，优化 Gitlab 的读取"，因两个诉求并列、blocker 各异，拆分为 VISION-002（重启 backstage.js 项目）与 VISION-003（优化 Gitlab 的读取）。

时序：`VISION-002 → VISION-003 → VISION-001`。当前认为 VISION-002 已完成，正处于 VISION-003。

## 用户约束

- 实际项目在另一个项目里，不是本项目 Nerv。Nerv 是管理和组织工具，不涉及实际代码改动。
- 除非用户明确提出检查 Nerv 视觉表达，否则不调整 Nerv 代码。

## 已知背景

- 性质：能力 / 数据源问题。
- 卡点（待澄清）：
  1. "Gitlab 的读取"具体指什么？把数据源从 Gitea 换/扩到 Gitlab？新增 Gitlab 读取？读的是什么（blames / plan 上下文 / 代码仓库）？
  2. 做到什么程度算成功？（验收标准）
- VISION-002 与 VISION-003 可能在"重启时顺带换源"上关联，但当前无证据，不应预设关联。
