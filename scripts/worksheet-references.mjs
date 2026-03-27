#!/usr/bin/env node

/**
 * 明道云工作表引用分析器
 *
 * 分析指定工作表被哪些工作流引用，输出完整的引用关系报告。
 *
 * 用法:
 *   node worksheet-references.mjs <worksheetId> [options]
 *   node worksheet-references.mjs <worksheetId> --name "表名"
 *   node worksheet-references.mjs <worksheetId> --app <appId>
 *   node worksheet-references.mjs <worksheetId> --output report.md
 *   node worksheet-references.mjs <worksheetId> --json
 *
 * 选项:
 *   --name    工作表名称（用于 workflow API，不传则先查询）
 *   --app     应用ID（限定在某个应用内搜索，不传则搜全部）
 *   --output  输出文件路径
 *   --json    以 JSON 格式输出
 *   --detail  显示每个工作流的详细节点引用
 *
 * 环境变量:
 *   MINGDAO_BASE_URL   明道云地址（默认 https://www.dedlion.com）
 *   MINGDAO_AUTH_TOKEN  认证 token（md_pss_id ...）
 *   MINGDAO_ACCOUNT_ID  账号ID
 */

import process from "node:process";
import fs from "node:fs";

// ── 配置 ──

const BASE_URL = process.env.MINGDAO_BASE_URL || "https://www.dedlion.com";
const AUTH_TOKEN = process.env.MINGDAO_AUTH_TOKEN || "md_pss_id 01701c09c02c04f0810970bc06f09009b0c204707d09e043";
const ACCOUNT_ID = process.env.MINGDAO_ACCOUNT_ID || "8dde83ca-a99a-400d-84bd-5dbec5c87cfb";

// ── 触发类型映射 ──

const START_APP_TYPE_MAP = {
  0: "工作表事件",
  1: "工作表事件",
  2: "工作表事件",
  5: "定时触发",
  6: "Webhook",
  7: "子流程",
  8: "按钮触发",
  9: "人员事件",
  10: "邮件触发",
  11: "日期触发",
  12: "审批",
  13: "调用封装",
  17: "定时触发",
  20: "Webhook",
  21: "自定义动作",
  23: "API触发",
  25: "讨论通知",
  45: "封装业务流程",
};

// ── 操作类型映射 ──

const ACTION_MAP = {
  "1": "新增记录",
  "2": "更新记录",
  "3": "删除记录",
  "20": "发送通知",
  "100": "获取单条记录",
  "101": "获取多条记录",
  "102": "获取记录数量",
  "107": "获取汇总",
  "400": "子流程查询",
  "406": "查询工作表",
  "412": "查询并批量更新",
  "421": "查询并更新记录",
  "422": "查询并删除记录",
};

const NODE_TYPE_MAP = {
  0: "触发器",
  1: "分支",
  2: "获取链接记录",
  3: "发送API请求",
  4: "代码块",
  5: "获取单条",
  6: "数据操作",
  7: "查找记录",
  8: "审批",
  9: "运算",
  10: "获取关联",
  11: "发送邮件",
  12: "延时",
  13: "子流程",
  14: "推送/通知",
  15: "获取记录打印",
  16: "子流程",
  17: "接口调用",
  18: "JSON解析",
  19: "业务流程",
  20: "人员审批",
  21: "消息",
  26: "调用集成API",
  29: "调用封装流程",
  42: "封装业务流程",
};

// ── API 层 ──

async function workflowApiPost(path, body) {
  const url = `${BASE_URL}${path}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authorization: AUTH_TOKEN,
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest",
      origin: BASE_URL,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).substring(0, 200)}`);
  const json = await resp.json();
  return json;
}

async function worksheetApiPost(path, body) {
  const url = `${BASE_URL}${path}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authorization: AUTH_TOKEN,
      accountid: ACCOUNT_ID,
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest",
      origin: BASE_URL,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).substring(0, 200)}`);
  const json = await resp.json();
  return json;
}

// ── 获取工作表名称 ──

async function getWorksheetName(worksheetId) {
  try {
    const resp = await worksheetApiPost("/wwwapi/Worksheet/GetWorksheetInfo", {
      worksheetId,
      getTemplate: false,
      getViews: false,
    });
    return resp?.data?.name || null;
  } catch {
    return null;
  }
}

// ── 获取引用关系 ──

async function getWorkflowReferences(worksheetId, worksheetName, appId) {
  // 调用 workflow API（返回工作流级别的引用）
  const workflowResp = await workflowApiPost(
    "/api/workflow/worksheetReference/GetWorksheetReferences",
    {
      worksheetId,
      worksheetName: worksheetName || "",
      isRefresh: false,
      appId: appId || "",
    }
  );

  const allRefs = [];

  if (workflowResp?.status === 1 && workflowResp?.data?.data) {
    for (const app of workflowResp.data.data) {
      for (const ref of app.references || []) {
        allRefs.push({
          appId: app.appId,
          appName: app.appName,
          processId: ref.parentId,
          processName: ref.parentName,
          enabled: ref.enabled,
          triggerType: START_APP_TYPE_MAP[ref.startAppType] || `未知(${ref.startAppType})`,
          startAppType: ref.startAppType,
          lastModified: ref.lastModifiedDate,
          nodes: (ref.referenceItems || []).map(item => ({
            nodeId: item.id,
            nodeName: item.name,
            nodeType: NODE_TYPE_MAP[item.type] || `未知(${item.type})`,
            action: ACTION_MAP[item.actionId] || item.actionId || "触发",
            typeNum: item.type,
          })),
        });
      }
    }
  }

  return allRefs;
}

// ── 统计分析 ──

function analyzeReferences(refs) {
  const stats = {
    totalWorkflows: refs.length,
    enabledCount: refs.filter(r => r.enabled).length,
    disabledCount: refs.filter(r => !r.enabled).length,
    byTriggerType: {},
    byAction: {},
    byApp: {},
    totalNodes: 0,
  };

  for (const ref of refs) {
    // 按触发类型
    stats.byTriggerType[ref.triggerType] = (stats.byTriggerType[ref.triggerType] || 0) + 1;

    // 按应用
    const appKey = `${ref.appName}(${ref.appId})`;
    stats.byApp[appKey] = (stats.byApp[appKey] || 0) + 1;

    // 按操作类型
    for (const node of ref.nodes) {
      stats.byAction[node.action] = (stats.byAction[node.action] || 0) + 1;
      stats.totalNodes++;
    }
  }

  return stats;
}

// ── 格式化输出 ──

function formatMarkdown(worksheetId, worksheetName, refs, stats, showDetail) {
  const lines = [];

  lines.push(`# 工作表引用分析报告`);
  lines.push(``);
  lines.push(`- **工作表**: ${worksheetName || "未知"}`);
  lines.push(`- **worksheetId**: \`${worksheetId}\``);
  lines.push(`- **分析时间**: ${new Date().toLocaleString("zh-CN")}`);
  lines.push(``);

  // 汇总
  lines.push(`## 汇总`);
  lines.push(``);
  lines.push(`| 指标 | 数值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 关联工作流总数 | ${stats.totalWorkflows} |`);
  lines.push(`| 已启用 | ${stats.enabledCount} |`);
  lines.push(`| 已禁用 | ${stats.disabledCount} |`);
  lines.push(`| 引用节点总数 | ${stats.totalNodes} |`);
  lines.push(``);

  // 按触发类型
  lines.push(`## 按触发类型分布`);
  lines.push(``);
  lines.push(`| 触发类型 | 工作流数 |`);
  lines.push(`|----------|----------|`);
  for (const [type, count] of Object.entries(stats.byTriggerType).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${type} | ${count} |`);
  }
  lines.push(``);

  // 按操作类型
  lines.push(`## 按操作类型分布`);
  lines.push(``);
  lines.push(`| 操作类型 | 节点数 |`);
  lines.push(`|----------|--------|`);
  for (const [action, count] of Object.entries(stats.byAction).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${action} | ${count} |`);
  }
  lines.push(``);

  // 工作流清单
  lines.push(`## 关联工作流清单`);
  lines.push(``);

  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const statusIcon = ref.enabled ? "✅" : "⛔";
    lines.push(`### ${i + 1}. ${statusIcon} ${ref.processName}`);
    lines.push(``);
    lines.push(`- **processId**: \`${ref.processId}\``);
    lines.push(`- **触发类型**: ${ref.triggerType}`);
    lines.push(`- **所属应用**: ${ref.appName}`);
    lines.push(`- **最后修改**: ${ref.lastModified}`);
    lines.push(`- **引用节点数**: ${ref.nodes.length}`);
    lines.push(`- **编辑链接**: ${BASE_URL}/workflowedit/${ref.processId}`);

    if (showDetail && ref.nodes.length > 0) {
      lines.push(``);
      lines.push(`| 节点名称 | 节点类型 | 操作 |`);
      lines.push(`|----------|----------|------|`);
      for (const node of ref.nodes) {
        lines.push(`| ${node.nodeName} | ${node.nodeType} | ${node.action} |`);
      }
    }
    lines.push(``);
  }

  // 风险提示
  lines.push(`## 风险分析`);
  lines.push(``);

  // 写操作工作流
  const writeWorkflows = refs.filter(r =>
    r.nodes.some(n => ["新增记录", "更新记录", "删除记录", "查询并更新记录", "查询并删除记录", "查询并批量更新"].includes(n.action))
  );
  if (writeWorkflows.length > 0) {
    lines.push(`### 写操作工作流 (${writeWorkflows.length}个)`);
    lines.push(``);
    lines.push(`以下工作流会修改此表数据，修改表结构时需特别注意：`);
    lines.push(``);
    for (const wf of writeWorkflows) {
      const writeActions = wf.nodes.filter(n =>
        ["新增记录", "更新记录", "删除记录", "查询并更新记录", "查询并删除记录", "查询并批量更新"].includes(n.action)
      );
      lines.push(`- **${wf.processName}**: ${writeActions.map(n => n.action).join(", ")}`);
    }
    lines.push(``);
  }

  // 触发器类工作流
  const triggerWorkflows = refs.filter(r =>
    r.nodes.some(n => n.action === "触发")
  );
  if (triggerWorkflows.length > 0) {
    lines.push(`### 以此表为触发源 (${triggerWorkflows.length}个)`);
    lines.push(``);
    lines.push(`以下工作流由此表的事件触发，表结构变更可能导致触发失败：`);
    lines.push(``);
    for (const wf of triggerWorkflows) {
      lines.push(`- **${wf.processName}** (${wf.triggerType})`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

// ── CLI ──

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`用法: node worksheet-references.mjs <worksheetId> [options]

选项:
  --name <name>    工作表名称
  --app <appId>    限定应用ID
  --output <file>  输出到文件
  --json           JSON 格式输出
  --detail         显示详细节点引用
  --help           帮助信息

示例:
  node worksheet-references.mjs 692b9f0fbe2ffd8cd27fb2b7
  node worksheet-references.mjs 692b9f0fbe2ffd8cd27fb2b7 --name "货号任务-执行" --detail
  node worksheet-references.mjs 692b9f0fbe2ffd8cd27fb2b7 --app d17e52e1-35dc-4037-b1c2-da1f8509d71e --output report.md`);
    process.exit(0);
  }

  const worksheetId = args[0];
  let worksheetName = null;
  let appId = "";
  let outputFile = null;
  let jsonOutput = false;
  let showDetail = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) { worksheetName = args[++i]; }
    else if (args[i] === "--app" && args[i + 1]) { appId = args[++i]; }
    else if (args[i] === "--output" && args[i + 1]) { outputFile = args[++i]; }
    else if (args[i] === "--json") { jsonOutput = true; }
    else if (args[i] === "--detail") { showDetail = true; }
  }

  // 自动获取表名
  if (!worksheetName) {
    console.log(`📋 查询工作表名称...`);
    worksheetName = await getWorksheetName(worksheetId);
    if (worksheetName) {
      console.log(`   → ${worksheetName}`);
    } else {
      console.log(`   → 未找到，继续分析...`);
    }
  }

  // 获取引用关系
  console.log(`🔍 查询工作流引用...`);
  const refs = await getWorkflowReferences(worksheetId, worksheetName, appId);
  console.log(`   → 找到 ${refs.length} 个关联工作流`);

  if (refs.length === 0) {
    console.log(`\n没有找到引用此工作表的工作流。`);
    process.exit(0);
  }

  // 统计分析
  const stats = analyzeReferences(refs);

  // 输出
  if (jsonOutput) {
    const result = { worksheetId, worksheetName, stats, workflows: refs };
    const output = JSON.stringify(result, null, 2);
    if (outputFile) {
      fs.writeFileSync(outputFile, output);
      console.log(`\n📄 JSON 报告已保存到: ${outputFile}`);
    } else {
      console.log(output);
    }
  } else {
    const md = formatMarkdown(worksheetId, worksheetName, refs, stats, showDetail);
    if (outputFile) {
      fs.writeFileSync(outputFile, md);
      console.log(`\n📄 报告已保存到: ${outputFile}`);
    } else {
      console.log(`\n${md}`);
    }
  }
}

main().catch(err => {
  console.error(`❌ 错误: ${err.message}`);
  process.exit(1);
});
