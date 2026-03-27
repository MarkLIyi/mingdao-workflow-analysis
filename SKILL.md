---
name: mingdao-workflow-analysis
description: 明道云一站式技能。工作流深度分析与代码重实现（应用级全景/单工作流/工作表引用），以及平台知识库（HAP应用开发、私有部署、MCP数据访问、API V2/V3、集成中心API搜索）。当用户提到明道云、Mingdao、HAP、工作流、工作表、MCP、集成API、私有部署时触发。
tools: Bash, Read, Write, Edit, Glob, Grep
---

# 明道云一站式技能

根据用户输入自动判断任务类型，选择对应模式执行。

---

## Part 1: 工作流分析与代码重实现

### 模式判断

- **输入是应用URL**（含 `/app/xxx/workflow`）→ **模式A: 应用级全景分析**
- **输入是工作流URL或processId** → **模式B: 单工作流代码重实现**
- **输入是worksheetId或提到"工作表引用"** → **模式C: 工作表引用分析**

### 模式A: 应用级全景分析

**目标**: 扫描整个应用的所有工作流，生成分类报告、依赖图谱、健康诊断和优化建议。

#### Step A1: 应用扫描

```bash
SCRIPTS=~/.claude/skills/mingdao-workflow-analysis/scripts

# 扫描应用下所有工作流，生成分类统计报告
node $SCRIPTS/scan-app-workflows.mjs <应用URL或appId> --detail --output ./reports/scan-report.md
```

输出：工作流总数、按触发类型/分组/负责人分布、复杂度排名Top20、完整清单。

#### Step A2: 依赖图谱

```bash
# 分析跨工作流依赖关系，生成 Mermaid 图 + 级联风险
node $SCRIPTS/map-dependencies.mjs --app <应用URL或appId> --output ./reports/dependencies.md
```

输出：表级触发链、子流程调用关系、级联触发风险、写冲突检测。

#### Step A3: 健康诊断

```bash
# 自动检测问题（重复/未命名/级联/过载等）
node $SCRIPTS/diagnose-app.mjs <应用URL或appId> --detail --output ./reports/diagnosis.md
```

输出：P0-P3分级问题清单 + 优化建议优先级。

#### Step A4: 汇总报告

综合以上三个报告，你必须：

1. 画出完整的业务链路（订单→采购→物流→结算）
2. 识别核心工作流（高频、高节点数、多子流程）
3. 给出**代码重实现优先级排序**（按投入产出比排序）
4. 给出**架构优化建议**（合并/迁移/拆分）

#### Step A5: 选择性深度分析

对于Step A4中识别出的核心工作流，使用 **模式B** 逐个深入分析和重实现。

---

### 模式B: 单工作流 → 代码重实现

**目标**: 分析单个工作流到底要干什么 → 用最简单的代码实现同样的事

#### Step B1: 提取 — 运行分析脚本

```bash
SCRIPTS=~/.claude/skills/mingdao-workflow-analysis/scripts

# 完整分析（递归提取所有层级 + 表结构 + 集成API + 蓝图）
node $SCRIPTS/analyze-workflow.mjs <URL或processId> --output ./reports
```

支持的输入格式：
- URL: `https://www.dedlion.com/workflowedit/xxx#type=2`
- 纯 ID: `6280b898300c0a383fc86120`
- 批量: `id1 id2 id3`

#### Step B2: 分析业务目标

阅读报告后，你必须回答这些问题：

1. **这个工作流的最终目的是什么？**（一句话，如"定时校准挂售商品是否仍在售"）
2. **触发条件是什么？**（定时/Webhook/工作表事件/手动按钮）
3. **数据流向是怎样的？**（从哪张表读 → 经过什么处理 → 写入哪张表）
4. **外部依赖有哪些？**（第三方API、集成中心API、代理服务等）
5. **有哪些可以去掉的复杂度？**（重复查询、冗余分支、不必要的子流程嵌套）

#### Step B3: 设计最简方案

基于业务目标，设计代码方案。原则：

- **合并子流程**: 工作流中的子流程/封装流程在代码中就是函数调用，不需要分层
- **批量查询替代逐条查询**: 工作流子流程每条记录查一次的表，代码中提前一次查完
- **条件互斥替代并行**: 明确品类/类型后只调对应的API，不做无用调用
- **直接调API替代集成中心**: 集成中心API的URL/Method/Body已提取，直接用fetch调用
- **V3 API或MCP操作明道云数据**: 查询/更新/新增/删除通过V3 REST API或MCP协议

#### Step B4: 编写独立脚本

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

// 2. MCP/V3通信层 — 标准模板，复用即可
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

#### Step B5: 部署建议

根据触发方式给出部署方案：
- **定时触发** → cron job / PM2 / GitHub Actions schedule
- **Webhook触发** → Express/Hono 服务 + 端口监听
- **手动触发** → CLI脚本直接运行

---

### 模式C: 工作表引用分析

**目标**: 分析任意一张工作表被多少工作流引用，输出引用关系报告、操作分类、风险提示。

```bash
SCRIPTS=~/.claude/skills/mingdao-workflow-analysis/scripts

# 基本分析
node $SCRIPTS/worksheet-references.mjs <worksheetId>

# 指定表名和应用ID + 详细节点
node $SCRIPTS/worksheet-references.mjs <worksheetId> --name "表名" --app <appId> --detail

# 输出到文件
node $SCRIPTS/worksheet-references.mjs <worksheetId> --output report.md
```

报告包含：
1. **汇总统计** — 关联工作流总数、启用/禁用、引用节点数
2. **触发类型分布** — 定时/事件/按钮/Webhook/封装流程
3. **操作类型分布** — 新增/更新/删除/查询各多少个节点
4. **完整工作流清单** — 每个工作流的processId、触发类型、编辑链接
5. **风险分析** — 写操作工作流列表 + 触发源工作流列表

---

## Part 2: 明道云平台知识库

### 知识路由规则

根据用户问题类型，加载对应的参考文件：

#### 1. HAP 应用开发
当用户问到应用创建、工作表设计、字段类型、视图、权限、工作流设计、飞书/钉钉/门户/集成场景时：
→ 读取 `references/hap/` 目录下的相关文件

#### 2. 私有部署
当用户问到私有部署、集群/单节点部署、升级/备份/恢复、安全/监控/运维时：
→ 读取 `references/private-deployment/` 目录下的相关文件

#### 3. MCP 数据访问
当用户需要工作表发现、字段结构查询、记录探索、MCP请求模式时：
→ 读取 `references/mcp/` 目录下的指南

#### 4. API V2 直接请求
当用户需要 HTTP REST API 查询/写入数据（getFilterRows、addRow、editRow、deleteRow 等）：
→ 读取 `references/api-v2.md`

> API V2 比 MCP 更稳定，大数据量查询推荐使用 API V2。

#### 5. API V3 参考
当用户需要 V3 版本的 API 操作（更友好的参数命名、字段类型对照、筛选器格式等）：
→ 读取 `data/mingdao-v3-api-reference.md`

#### 6. 集成中心API搜索
当用户需要查找连接列表、搜索API名称/URL、查看请求/响应字段详情时：

```bash
SCRIPTS=~/.claude/skills/mingdao-workflow-analysis/scripts
node $SCRIPTS/mingdao-api-search.js --list-connects
node $SCRIPTS/mingdao-api-search.js --connect <关键词> --detail
node $SCRIPTS/mingdao-api-search.js --search <关键词> --detail
```

#### 7. 通用明道云知识
→ 读取 `references/mingdao_knowledge.md`

---

## 所有可用脚本

```bash
SCRIPTS=~/.claude/skills/mingdao-workflow-analysis/scripts

# ── 应用级分析 ──
node $SCRIPTS/scan-app-workflows.mjs <应用URL或appId> [--detail] [--output file.md] [--json]
node $SCRIPTS/map-dependencies.mjs --app <应用URL或appId> [--output file.md]
node $SCRIPTS/diagnose-app.mjs <应用URL或appId> [--detail] [--output file.md]

# ── 单工作流分析 ──
node $SCRIPTS/analyze-workflow.mjs <URL或processId> [--output dir]
node $SCRIPTS/extract-workflow-logic.mjs <processId> [--depth N] [--output file.md]
node $SCRIPTS/extract-workflow-logic.mjs --list [--detail]
node $SCRIPTS/extract-workflow-logic.mjs --search <关键词> [--detail]
node $SCRIPTS/get-integration-api-config.mjs <apiId>

# ── 工作表引用分析 ──
node $SCRIPTS/worksheet-references.mjs <worksheetId> [--name "表名"] [--app <appId>] [--detail] [--output file.md] [--json]

# ── 集成中心API搜索 ──
node $SCRIPTS/mingdao-api-search.js --list-connects
node $SCRIPTS/mingdao-api-search.js --connect <关键词> --detail
node $SCRIPTS/mingdao-api-search.js --search <关键词> --detail
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
