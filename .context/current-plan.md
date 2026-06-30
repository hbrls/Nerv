# current-plan

> Vision Id: VISION-003
> 来源裁决: vision workflow 对话裁决（结果三：转 Plan）
> 基线: `.context/VISION-003/WORKSHOP-001.md`
> created_by: HBR - GLM-5.2
> created_at: 2026-07-01 00:49:07

## 可执行目标

验证注入式 JS 读取机制可行性：在私有化部署的 Gitlab 上，通过 Tampermonkey 注入 JS，用 person token 或已登录态 cookie 调用 Gitlab 接口读取 issues，规范化为 JSON 并在浏览器 console 打印。

## 验收标准

- 人工验收
- 能 console.log 出 issues 数据且有值
- 字段使用 Gitlab issues 标准字段（不自定义）
- 最终由人工确认

## 约束

- 只读，不涉及写回操作（创建 MR、评论、修改 issue 等）
- 人工低频使用，不考虑性能问题
- 鉴权方式（person token / cookie）是调研和开发目标本身，在本 Plan 中确定
- backstage 平台消费 JSON 不在此范围

## 待确定（本 Plan 中解决）

- 鉴权机制：person token 还是 cookie，如何获取、如何失效兜底
- 注入方案：Tampermonkey 为主，是否有其他更优方案
- 接口选择：用 Gitlab 公开 API 还是页面内部接口
