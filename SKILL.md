---
name: mingdao-workflow-analysis
description: 明道云工作流深度分析与逻辑简化重实现。给定工作流URL或process_id，自动递归提取完整逻辑链（含所有嵌套子流程、封装业务流程），采集所有涉及的表结构和集成API配置，分析工作流的业务目标，然后用最简代码重新实现相同目标，输出可部署到服务器/本地/GitHub的独立脚本。
tools: Bash, Read, Write, Edit, Glob, Grep
---

# 明道云工作流分析 → 代码重实现

## 核心目标

**分析工作流到底要干什么 → 用最简单的代码实现同样的事**

不是优化工作流本身，而是：
1. 彻底理解工作流的业务目标
2. 用 Node.js 脚本替代整个工作流
3. 脚本可部署到服务器、本地定时任务、或 GitHub Actions

## 工作流程（你必须按此顺序执行）

### Step 1: 提取 — 运行分析脚本

```bash
SCRIPTS=~/.claude/skills/operations/mingdao-workflow-analysis/scripts

# 完整分析（递归提取所有层级 + 表结构 + 集成API + 蓝图）
node $SCRIPTS/analyze-workflow.mjs <URL或processId> --output ./reports
```

支持的输入格式：
- URL: `https://www.dedlion.com/workflowedit/xxx#type=2`
- 纯 ID: `6280b898300c0a383fc86120`
- 批量: `id1 id2 id3`

### Step 2: 分析业务目标

阅读报告后，你必须回答这些问题：

1. **这个工作流的最终目的是什么？**（一句话，如"定时校准挂售商品是否仍在售"）
2. **触发条件是什么？**（定时/Webhook/工作表事件/手动按钮）
3. **数据流向是怎样的？**（从哪张表读 → 经过什么处理 → 写入哪张表）
4. **外部依赖有哪些？**（第三方API、集成中心API、代理服务等）
5. **有哪些可以去掉的复杂度？**（重复查询、冗余分支、不必要的子流程嵌套）

### Step 3: 设计最简方案

基于业务目标，设计代码方案。原则：

- **合并子流程**: 工作流中的子流程/封装流程在代码中就是函数调用，不需要分层
- **批量查询替代逐条查询**: 工作流子流程每条记录查一次的表，代码中提前一次查完
- **条件互斥替代并行**: 明确品类/类型后只调对应的API，不做无用调用
- **直接调API替代集成中心**: 集成中心API的URL/Method/Body已提取，直接用fetch调用
- **MCP操作明道云数据**: 查询/更新/新增/删除全部通过MCP协议

### Step 4: 编写独立脚本

输出一个完整的 Node.js 脚本（`.mjs`），包含：

```javascript
// 1. 配置区 — 所有常量集中管理
const CONFIG = {
  mcpUrl: process.env.MINGDAO_MCP_URL || "...",
  worksheets: { /* 表ID映射 */ },
  externalApis: { /* 外部API地址 */ },
  requestDelay: 200,
  batchSize: 100,
};

// 2. MCP通信层 — 标准模板，复用即可
// 3. 数据查询函数 — 每个表的查询封装
// 4. 外部API调用 — 每个第三方接口的封装
// 5. 写入操作 — 更新/新增/删除的封装
// 6. 主流程 — 最简业务逻辑
// 7. 统计和日志 — 执行结果汇总
```

必须支持：
- `--dry-run` 只查询不写入
- `--limit N` 限制处理条数
- 执行统计（总计/成功/失败/跳过）

### Step 5: 部署建议

根据触发方式给出部署方案：
- **定时触发** → cron job / PM2 / GitHub Actions schedule
- **Webhook触发** → Express/Hono 服务 + 端口监听
- **手动触发** → CLI脚本直接运行

## 辅助命令

```bash
# 仅提取逻辑（轻量，不调MCP）
node $SCRIPTS/extract-workflow-logic.mjs <processId>

# 提取集成中心API的完整请求配置
node $SCRIPTS/get-integration-api-config.mjs <apiId>

# 列出/搜索工作流
node $SCRIPTS/extract-workflow-logic.mjs --list
node $SCRIPTS/extract-workflow-logic.mjs --search <关键词>
```

## 递归提取能力

| 嵌套类型 | 识别方式 | 递归深度 |
|----------|---------|---------|
| 子流程调用 (typeId=16) | subProcessId | 最深5层 |
| 调用封装流程 (typeId=29) | subProcessId | 最深5层 |
| 封装业务流程 (typeId=42) | subProcessId | 最深5层 |
| 调用封装业务流程 (actionId=500) | appId即processId | 最深5层 |

每一层的每一个节点都会提取完整配置（筛选条件、字段映射、代码块、API参数等）。

## 认证配置

```bash
export MINGDAO_BASE_URL="https://www.dedlion.com"
export MINGDAO_AUTH_TOKEN="md_pss_id xxx"  # 浏览器 cookie
export MINGDAO_MCP_URL="https://www.dedlion.com/mcp?HAP-Appkey=xxx&HAP-Sign=xxx"
```

## 参考范例

`scripts/calibrate-listing-foreign.mjs` — 从工作流 `6944f290063a4bbf0780bebf` 重实现的完整脚本：
- 原工作流: 主流程7节点 + 子流程36节点 = 43节点
- 重实现: 366行 Node.js 脚本
- 优化效果: 代理查询从100次→1次，外部API按品类互斥调用
