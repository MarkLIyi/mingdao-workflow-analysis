#!/usr/bin/env node

/**
 * 明道云工作流逻辑递归提取器 — 完整重建级
 *
 * 提取每个节点的全部内部信息：条件表达式、字段映射、代码块、API配置、
 * 筛选器、通知对象等，输出可用于完整重建工作流的详细文档。
 *
 * 用法:
 *   node extract-workflow-logic.mjs <processId> [--depth N] [--output file.md]
 *   node extract-workflow-logic.mjs --list
 *   node extract-workflow-logic.mjs --search <关键词>
 *
 * 环境变量:
 *   MINGDAO_BASE_URL   明道云地址（默认 https://www.dedlion.com）
 *   MINGDAO_AUTH_TOKEN  认证 token（md_pss_id ...）
 *   MINGDAO_MCP_URL    MCP 地址（用于 --list / --search）
 */

import process from "node:process";
import fs from "node:fs";

// ── 配置 ──

const BASE_URL = process.env.MINGDAO_BASE_URL || "https://www.dedlion.com";
const AUTH_TOKEN = process.env.MINGDAO_AUTH_TOKEN || "md_pss_id 01701c09c02c04f0810970bc06f09009b0c204707d09e043";
const MCP_URL = process.env.MINGDAO_MCP_URL ||
  "https://www.dedlion.com/mcp?HAP-Appkey=681a78e1b8c72330&HAP-Sign=M2NkZGZiMmM5OWIyMTUxMDQ4N2Y2YTAwZTMxNDJmM2Q3NWI5ZmU4MGU4ZDcxZjlhYWI1ZTUyOWJmNDgxYWU2OQ==";
const PROTOCOL_VERSION = "2025-03-26";

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ── API 层 ──

async function apiGet(path, params = {}) {
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const resp = await fetch(url.toString(), {
    headers: { authorization: AUTH_TOKEN, "content-type": "application/json", "x-requested-with": "XMLHttpRequest" },
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).substring(0, 200)}`);
  const json = await resp.json();
  if (json.code === 401) throw new Error("Auth token 过期，请更新 MINGDAO_AUTH_TOKEN");
  return json.data;
}

async function getFlowNodes(processId) {
  await delay(200);
  return apiGet("/api/workflow/flowNode/get", { processId, count: 200 });
}

async function getNodeDetail(processId, nodeId) {
  await delay(200);
  return apiGet("/api/workflow/flowNode/getNodeDetail", { processId, nodeId });
}

let mcpInitialized = false;
async function mcpPost(payload) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": PROTOCOL_VERSION },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`MCP ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}
async function mcpCall(toolName, args = {}) {
  if (!mcpInitialized) {
    await mcpPost({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "wf-extractor", version: "1.0.0" } } });
    await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
    mcpInitialized = true;
  }
  const resp = await mcpPost({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: toolName, arguments: args } });
  const t = resp?.result?.content?.find(c => c.type === "text");
  if (!t) return null;
  try { return JSON.parse(t.text); } catch { return t.text; }
}

// ── 常量映射 ──

const NODE_TYPES = {
  0: "触发", 1: "分支", 2: "分支条件", 3: "填写", 4: "审批",
  6: "更新记录", 7: "获取单条", 8: "发送自定义请求", 9: "获取数据条数", 10: "代码块",
  11: "发邮件", 12: "延时", 13: "获取多条", 14: "代码块",
  16: "子流程调用", 17: "API调用", 18: "调用集成API",
  20: "新增记录", 21: "删除记录", 22: "短信", 25: "查询外部表",
  26: "延时", 27: "站内通知", 28: "界面推送", 29: "调用封装流程",
  30: "运算", 31: "JSON解析", 36: "数据集成", 42: "封装业务流程", 100: "系统",
};

const ACTION_IDS = {
  "1": "新增", "2": "更新", "3": "删除", "4": "查找(单条)",
  "105": "获取条数", "400": "获取多条(全部)", "406": "查找(按筛选器)", "409": "获取数组对象",
  "500": "调用封装业务流程",
};

const CONDITION_IDS = {
  "1": "等于(=)", "2": "不等于(≠)", "3": "包含", "4": "不包含",
  "5": "为空", "6": "不为空", "7": "大于(>)", "8": "大于等于(>=)",
  "9": "属于(in)", "10": "不属于(not in)", "11": "在范围内", "12": "不在范围内",
  "13": "开头是", "14": "结尾是", "15": "小于(<)", "16": "小于等于(<=)",
  "17": "全等于", "18": "早于", "19": "晚于", "20": "日期范围",
  "33": "数组包含", "44": "正则匹配",
};

const RESULT_TYPE_IDS = {
  3: "满足条件时执行", 4: "其他情况(else)",
};

const TRIGGER_TYPES = {
  0: "工作表事件", 1: "工作表事件", 5: "定时触发", 6: "按日期字段",
  7: "Webhook", 8: "按钮/自定义动作", 12: "子流程(被调用)", 17: "API触发", 42: "封装业务流程",
};

// ── 条件/字段 格式化 ──

function fmtCondition(condGroups) {
  if (!condGroups?.length) return "(无条件 / 默认分支)";
  const parts = condGroups.map(group => {
    const andParts = group.map(c => {
      const src = c.nodeName ? `[${c.nodeName}].${c.filedValue || c.filedId}` : c.filedValue || c.filedId;
      const op = CONDITION_IDS[c.conditionId] || `条件${c.conditionId}`;
      const vals = (c.conditionValues || []).map(v => {
        if (v.value != null && v.value !== "") return `"${v.value}"`;
        if (v.controlName) return `[${v.nodeName || ""}].${v.controlName}`;
        if (v.controlId) return `{${v.controlId}}`;
        return "?";
      });
      return `${src} ${op} ${vals.join(", ") || ""}`.trim();
    });
    return andParts.join(" AND ");
  });
  return parts.join("\n    OR ");
}

function fmtFields(fields) {
  if (!fields?.length) return null;
  return fields.map(f => {
    const target = f.alias || f.fieldId;
    let source = "";
    if (f.fieldValue) {
      source = `"${f.fieldValue}"`;
    } else if (f.fieldValueName) {
      const fromNode = f.nodeName || "";
      source = fromNode ? `[${fromNode}].${f.fieldValueName}` : f.fieldValueName;
    } else if (f.fieldValueId) {
      source = `{${f.fieldValueId}}`;
    }
    const typeStr = f.type != null ? ` (type:${f.type})` : "";
    return { target, source, typeStr, isClear: f.isClear };
  });
}

function fmtFindFields(findFields) {
  if (!findFields?.length) return null;
  return findFields.map(f => {
    const field = f.fieldName || f.fieldId || f.filedId;
    const op = CONDITION_IDS[f.conditionId] || f.conditionId || "=";
    let val = "";
    if (f.values?.length) {
      val = f.values.map(v => v.value || v.controlName || v.controlId || "?").join(", ");
    } else if (f.fieldValue) {
      val = f.fieldValue;
    } else if (f.conditionValues?.length) {
      val = f.conditionValues.map(v => v.value || v.controlName || "?").join(", ");
    }
    const src = f.nodeName ? `[${f.nodeName}].${field}` : field;
    return `${src} ${op} ${val}`;
  });
}

// 格式化 getNodeDetail 返回的 filters（结构和 operateCondition 类似但多一层 wrapper）
function fmtNodeFilters(filters) {
  if (!filters?.length) return null;
  const result = [];
  for (const filterGroup of filters) {
    const conditions = filterGroup.conditions || [];
    for (const andGroup of conditions) {
      const parts = andGroup.map(c => {
        const field = c.filedValue || c.filedId;
        const op = CONDITION_IDS[c.conditionId] || `条件${c.conditionId}`;
        const vals = (c.conditionValues || []).map(v => {
          if (v.value != null && v.value !== "") {
            if (typeof v.value === "object") return `"${v.value.value || JSON.stringify(v.value)}"`;
            return `"${v.value}"`;
          }
          if (v.controlName) return `[${v.nodeName || ""}].${v.controlName}`;
          if (v.controlId) return `{${v.controlId}}`;
          return "(空)";
        });
        return `${field} ${op} ${vals.join(", ") || "(空)"}`;
      });
      result.push(parts.join(" AND "));
    }
  }
  return result;
}

function fmtSorts(sorts, controlMap) {
  if (!sorts?.length) return null;
  return sorts.map(s => {
    const name = controlMap?.[s.controlId]?.name || controlMap?.[s.controlId]?.alias || s.controlId;
    return `${name} ${s.isAsc ? "升序(最旧在前)" : "降序(最新在前)"}`;
  });
}

function fmtLimit(limitObj) {
  if (!limitObj?.fieldValue) return null;
  return limitObj.fieldValue;
}

// 全局节点名+字段映射缓存（在 extractWorkflow 中填充）
let _globalNodeMap = {};

function fmtFieldsDetail(fields) {
  if (!fields?.length) return null;
  return fields.map(f => {
    const target = f.desc || f.alias || f.fieldId;
    let source = "";
    if (f.fieldValue && f.fieldValue.startsWith("$")) {
      // 动态引用格式: $nodeId-controlId$ → 尝试解析为可读名
      const match = f.fieldValue.match(/^\$([^-]+)-([^$]+)\$$/);
      if (match) {
        const [, refNodeId, refCtrlId] = match;
        const refNode = _globalNodeMap[refNodeId];
        const nodeName = refNode?.name || refNode?.appName || refNodeId.substring(0, 8);
        const ctrlName = refNode?._controlMap?.[refCtrlId]?.name || refNode?._controlMap?.[refCtrlId]?.alias || refCtrlId.substring(0, 8);
        source = `[${nodeName}].${ctrlName}`;
      } else {
        source = `动态引用: ${f.fieldValue}`;
      }
    } else if (f.fieldValue) {
      source = `"${f.fieldValue}"`;
    } else if (f.fieldValueName) {
      source = f.nodeName ? `[${f.nodeName}].${f.fieldValueName}` : f.fieldValueName;
    } else if (f.fieldValueId) {
      source = `{${f.fieldValueId}}`;
    }
    const typeStr = f.type != null ? ` (type:${f.type})` : "";
    return { target, source, typeStr, isClear: f.isClear };
  });
}

function fmtAccounts(accounts) {
  if (!accounts?.length) return null;
  return accounts.map(a => a.roleName || a.entityName || a.roleId).filter(Boolean);
}

// ── 递归提取 ──

async function extractWorkflow(processId, maxDepth = 5, _visited = new Set(), _depth = 0) {
  if (_visited.has(processId)) return { id: processId, error: "循环引用", depth: _depth };
  if (_depth > maxDepth) return { id: processId, error: `超过最大深度 ${maxDepth}`, depth: _depth };

  _visited.add(processId);
  console.error(`${"  ".repeat(_depth)}📦 提取: ${processId} (depth=${_depth})`);

  let data;
  try { data = await getFlowNodes(processId); } catch (e) {
    return { id: processId, error: e.message, depth: _depth };
  }
  if (!data?.flowNodeMap) return { id: processId, error: "无节点数据", depth: _depth };

  const { flowNodeMap, startEventId, child } = data;

  const startNode = flowNodeMap[startEventId];
  const triggerInfo = startNode ? { name: startNode.name, table: startNode.appName || "" } : {};

  // 为每个业务节点补全详情（filters, sorts, numberFieldValue, fields, controls）
  const detailTypes = new Set([0, 6, 7, 8, 9, 10, 13, 14, 16, 17, 18, 20, 21, 25, 27, 29, 42]);
  for (const [nid, node] of Object.entries(flowNodeMap)) {
    if (!detailTypes.has(node.typeId)) continue;
    try {
      const detail = await getNodeDetail(processId, nid);
      if (detail) {
        if (detail.filters?.length) node._filters = detail.filters;
        if (detail.sorts?.length) node._sorts = detail.sorts;
        if (detail.numberFieldValue) node._limit = detail.numberFieldValue;
        if (detail.fields?.length && !node.fields?.length) node.fields = detail.fields;
        // Webhook 触发节点
        if (detail.hookUrl) node._hookUrl = detail.hookUrl;
        if (detail.controls?.length && node.typeId === 0 && node.appType === 7) {
          node._webhookParams = detail.controls.map(c => ({ name: c.controlName, type: c.type }));
        }
        // 自定义请求节点补全
        if (detail.sendContent && node.typeId === 8) {
          node.sendContent = detail.sendContent;
          node.method = detail.method;
          node.formControls = detail.formControls;
          node.contentType = detail.contentType;
        }
        if (detail.controls?.length) node._controls = detail.controls;
        // 构建 controlId → controlName 映射
        if (detail.controls?.length) {
          node._controlMap = {};
          for (const c of detail.controls) {
            node._controlMap[c.controlId] = { name: c.controlName, alias: c.alias, type: c.type };
          }
        }
      }
    } catch (e) {
      console.error(`${"  ".repeat(_depth)}  ⚠️ getNodeDetail失败: ${nid} - ${e.message}`);
    }
  }

  // 填充全局节点映射（用于解析动态引用）
  for (const [nid, node] of Object.entries(flowNodeMap)) {
    _globalNodeMap[nid] = node;
  }

  // 构建完整执行链（含节点内部信息）
  const chain = buildChain(flowNodeMap, startEventId);

  // 递归子流程（含封装业务流程）
  const subProcesses = {};
  const spNodes = Object.values(flowNodeMap).filter(n => (n.typeId === 16 || n.typeId === 29 || n.typeId === 42) && n.subProcessId);
  for (const sp of spNodes) {
    subProcesses[sp.subProcessId] = await extractWorkflow(sp.subProcessId, maxDepth, _visited, _depth + 1);
    subProcesses[sp.subProcessId]._calledAs = sp.subProcessName || sp.name;
  }
  // 封装业务流程调用 (actionId="500"，appId 即为封装流程的 processId)
  const wrappedNodes = Object.values(flowNodeMap).filter(n => String(n.actionId) === "500" && n.appId && !_visited.has(n.appId));
  for (const wn of wrappedNodes) {
    console.error(`${"  ".repeat(_depth)}  🔗 发现封装业务流程: ${wn.appName || wn.name} (${wn.appId})`);
    subProcesses[wn.appId] = await extractWorkflow(wn.appId, maxDepth, _visited, _depth + 1);
    subProcesses[wn.appId]._calledAs = wn.appName || wn.name || "封装业务流程";
  }

  return { id: processId, depth: _depth, isChild: !!child, triggerInfo, startEventId,
    nodeCount: Object.keys(flowNodeMap).length, chain, subProcesses, _flowNodeMap: flowNodeMap };
}

// ── 执行链（含完整节点内部信息） ──

function buildChain(fnm, startId, visited = new Set()) {
  const steps = [];
  let cur = startId;
  while (cur && cur !== "99" && !visited.has(cur)) {
    visited.add(cur);
    const n = fnm[cur];
    if (!n) break;

    const step = {
      id: n.id,
      typeId: n.typeId,
      type: NODE_TYPES[n.typeId] || `?(${n.typeId})`,
      name: n.name || "",
    };

    // ── 通用属性 ──
    if (n.appName) { step.table = n.appName; step.appId = n.appId; }
    if (n.actionId) step.action = ACTION_IDS[n.actionId] || n.actionId;
    if (n.selectNodeName) step.dataSource = `来自节点「${n.selectNodeName}」`;
    if (n.desc) step.desc = n.desc;

    // ── getNodeDetail 补全的数据 ──
    if (n._filters) step.nodeFilters = fmtNodeFilters(n._filters);
    if (n._sorts) step.nodeSorts = fmtSorts(n._sorts, n._controlMap);
    if (n._limit) step.nodeLimit = fmtLimit(n._limit);
    if (n.fields?.length) {
      const detailed = fmtFieldsDetail(n.fields);
      if (detailed) step.fieldMappings = detailed;
    }

    // ── 按类型提取详细信息 ──

    // 触发节点
    if (n.typeId === 0) {
      if (n.assignFieldNames?.length) step.inputFields = n.assignFieldNames;
      if (n.triggers) step.triggers = n.triggers;
      if (n.executeType) step.executeType = n.executeType;
      // Webhook 触发 → hookUrl 和接收参数
      if (n.appType === 7 || n.name?.includes("Webhook")) {
        step.triggerType = "Webhook";
        // hookUrl 来自 getNodeDetail
        if (n._hookUrl) step.hookUrl = n._hookUrl;
        if (n._webhookParams?.length) step.webhookParams = n._webhookParams;
      }
      // 定时触发
      if (n.appType === 5) step.triggerType = "定时";
      // 工作表事件
      if (n.appType === 1 || n.appType === 0) step.triggerType = "工作表事件";
      // 按钮/自定义动作
      if (n.appType === 8) step.triggerType = "按钮/自定义动作";
      // API 触发
      if (n.appType === 17) step.triggerType = "API触发";
    }

    // 分支条件
    if (n.typeId === 2) {
      step.condition = fmtCondition(n.operateCondition);
      step.resultType = RESULT_TYPE_IDS[n.resultTypeId] || n.resultTypeId;
    }

    // 数据操作节点（新增/更新/删除）
    if ([6, 20, 21].includes(n.typeId)) {
      const fieldMappings = fmtFields(n.fields);
      if (fieldMappings) step.fieldMappings = fieldMappings;
      if (n.errorFields?.length) step.errorFields = n.errorFields;
    }

    // 查询节点
    if ([7, 13, 14].includes(n.typeId)) {
      step.resultType = n.resultTypeId;
      step.executeType = n.executeType;
      const filters = fmtFindFields(n.findFields);
      if (filters) step.filters = filters;
      if (n.sorts?.length) step.sorts = n.sorts;
      if (n.isAdd != null) step.isAdd = n.isAdd;
    }

    // 获取数据条数
    if (n.typeId === 9) {
      if (n.formulaValue) step.formula = n.formulaValue;
    }

    // 获取多条（数组对象）
    if (n.typeId === 13) {
      if (n.execute != null) step.execute = n.execute;
    }

    // 代码块 (typeId=10 JS代码块, typeId=14 Python代码块)
    if (n.typeId === 10 || (n.typeId === 14 && n.code)) {
      step.code = n.code || "";
      step.language = n.language || (n.typeId === 14 ? "python" : "javascript");
      if (n.inputDatas?.length) step.inputs = n.inputDatas.map(d => ({
        name: d.name, type: d.type, source: d.nodeName ? `[${d.nodeName}].${d.fieldValueName || d.fieldValueId}` : d.value || d.fieldValueId,
      }));
      if (n.outputDatas?.length) step.outputs = n.outputDatas.map(d => ({ name: d.name, type: d.type }));
    }

    // 发送自定义请求 (typeId=8, webhook调用)
    if (n.typeId === 8) {
      step.url = n.webhookUrl || n.sendContent || "";
      step.method = ({ 1: "GET", 2: "POST", 3: "PUT", 4: "DELETE" })[n.method] || "POST";
      if (n.formControls?.length) step.formControls = n.formControls;
      if (n.contentType) step.contentType = n.contentType;
      // getNodeDetail 补充的数据
      if (n._filters) step.filters = fmtNodeFilters(n._filters);
    }

    // API 调用
    if (n.typeId === 17) {
      step.url = n.requestUrl || n.url || "";
      step.method = n.method || n.requestMethod || "GET";
      if (n.headers?.length) step.headers = n.headers;
      if (n.body) step.body = typeof n.body === "string" ? n.body.substring(0, 500) : JSON.stringify(n.body).substring(0, 500);
      if (n.contentType) step.contentType = n.contentType;
      if (n.formControls?.length) step.formControls = n.formControls;
    }

    // 调用集成中心 API
    if (n.typeId === 18) {
      if (n.appName) step.apiName = n.appName;
      if (n.templateId) step.templateId = n.templateId;
      if (n.params?.length) step.params = n.params;
    }

    // 子流程调用
    if (n.typeId === 16 || n.typeId === 29 || n.typeId === 42) {
      if (n.subProcessId) { step.subProcessId = n.subProcessId; step.subProcessName = n.subProcessName || ""; }
      if (n.fields?.length) {
        step.paramMappings = fmtFields(n.fields);
      }
    }

    // 通知
    if ([11, 22, 27, 28].includes(n.typeId)) {
      const recipients = fmtAccounts(n.accounts);
      if (recipients) step.recipients = recipients;
      if (n.title) step.title = n.title;
      if (n.content) step.content = n.content;
      if (n.templateId) step.templateId = n.templateId;
    }

    // 延时
    if (n.typeId === 12 || n.typeId === 26) {
      if (n.time) step.time = n.time;
      if (n.unit) step.unit = n.unit;
    }

    // 运算/公式
    if (n.typeId === 30) {
      if (n.formulaValue) step.formula = n.formulaValue;
      if (n.fieldValue) step.fieldValue = n.fieldValue;
    }

    // JSON 解析
    if (n.typeId === 31) {
      if (n.jsonPath) step.jsonPath = n.jsonPath;
    }

    // 查询外部表
    if (n.typeId === 25) {
      const filters = fmtFindFields(n.findFields);
      if (filters) step.filters = filters;
    }

    // ── 分支节点 ──
    if (n.flowIds?.length) {
      step.branches = n.flowIds.map((fid, i) => {
        const condNode = fnm[fid];
        const branchInfo = {
          label: condNode?.name || `分支${i + 1}`,
          resultType: RESULT_TYPE_IDS[condNode?.resultTypeId] || "",
        };
        // 提取分支条件
        if (condNode?.operateCondition?.length) {
          branchInfo.condition = fmtCondition(condNode.operateCondition);
        }
        const branchNext = condNode?.nextId;
        branchInfo.chain = branchNext ? buildChain(fnm, branchNext, new Set(visited)) : [];
        return branchInfo;
      });
      step.gatewayType = n.gatewayType === 2 ? "并行" : "条件互斥";
    }

    steps.push(step);
    cur = n.nextId || null;
  }
  return steps;
}

// ── 渲染完整报告 ──

function renderReport(result) {
  const lines = [];
  const name = result._calledAs || result.triggerInfo?.name || result.id;

  lines.push(`# ${result.isChild ? "子流程" : "工作流"}: ${name}`);
  lines.push("");
  lines.push(`> Process ID: \`${result.id}\``);
  lines.push(`> 节点数: ${result.nodeCount} | 嵌套深度: ${result.depth}`);
  if (result.error) { lines.push(`> ⚠️ ${result.error}`); return lines.join("\n"); }
  lines.push("");

  if (!result.isChild && result.triggerInfo) {
    lines.push("## 触发方式");
    lines.push(`- 名称: ${result.triggerInfo.name}`);
    if (result.triggerInfo.table) lines.push(`- 绑定工作表: ${result.triggerInfo.table}`);
    lines.push("");
  }

  lines.push("## 完整执行逻辑");
  lines.push("");
  renderSteps(result.chain, lines, "");
  lines.push("");

  // 子流程展开
  for (const [, sp] of Object.entries(result.subProcesses)) {
    lines.push("---");
    lines.push("");
    lines.push(renderReport(sp));
    lines.push("");
  }

  // 调用关系图
  if (Object.keys(result.subProcesses).length) {
    lines.push("## 子流程调用关系");
    lines.push("");
    lines.push("```");
    lines.push(renderTree(result, ""));
    lines.push("```");
  }

  return lines.join("\n");
}

function renderSteps(chain, lines, indent) {
  let num = 1;
  for (const step of chain) {
    // 跳过系统节点
    if (step.typeId === 100) continue;
    // 分支条件节点不单独渲染（已内联到分支节点中）
    if (step.typeId === 2) continue;

    const prefix = `${indent}### ${num}. [${step.type}] ${step.name}`;

    if (step.branches) {
      // ── 分支节点 ──
      lines.push(`${indent}### ${num}. [${step.gatewayType}分支] ${step.name}`);
      lines.push("");
      for (let bi = 0; bi < step.branches.length; bi++) {
        const br = step.branches[bi];
        lines.push(`${indent}#### 分支 ${bi + 1}: ${br.label} ${br.resultType ? `(${br.resultType})` : ""}`);
        if (br.condition) {
          lines.push(`${indent}- **条件**: ${br.condition}`);
        }
        lines.push("");
        if (br.chain.length) {
          renderSteps(br.chain, lines, indent);
        } else {
          lines.push(`${indent}_(无后续节点)_`);
          lines.push("");
        }
      }
    } else if (step.subProcessId) {
      // ── 子流程调用 ──
      lines.push(prefix);
      lines.push(`- **调用子流程**: 「${step.subProcessName}」`);
      lines.push(`- **子流程ID**: \`${step.subProcessId}\``);
      if (step.dataSource) lines.push(`- **数据来源**: ${step.dataSource}`);
      if (step.paramMappings) {
        lines.push("- **参数传递**:");
        for (const f of step.paramMappings) {
          lines.push(`  - \`${f.target}\` ← ${f.source}${f.typeStr}`);
        }
      }
      lines.push("");
    } else {
      // ── 普通节点 ──
      lines.push(prefix);
      if (step.table) lines.push(`- **工作表**: ${step.table} (\`${step.appId || ""}\`)`);
      if (step.action) lines.push(`- **操作**: ${step.action}`);
      if (step.dataSource) lines.push(`- **数据来源**: ${step.dataSource}`);
      if (step.desc) lines.push(`- **描述**: ${step.desc}`);

      // 触发类型
      if (step.triggerType) lines.push(`- **触发类型**: ${step.triggerType}`);
      if (step.hookUrl) lines.push(`- **Webhook URL**: \`${step.hookUrl}\``);
      if (step.webhookParams?.length) {
        lines.push(`- **Webhook接收参数**: ${step.webhookParams.map(p => p.name).join(", ")}`);
      }

      // 输入参数
      if (step.inputFields) lines.push(`- **输入参数**: ${step.inputFields.join(", ")}`);

      // 筛选条件（来自 getNodeDetail）
      if (step.nodeFilters?.length) {
        lines.push("- **筛选条件**:");
        for (const f of step.nodeFilters) lines.push(`  - ${f}`);
      }
      // 筛选条件（来自 flowNode/get 的 findFields）
      if (step.filters) {
        if (!step.nodeFilters?.length) lines.push("- **筛选条件**:");
        for (const f of step.filters) lines.push(`  - ${f}`);
      }

      // 排序规则
      if (step.nodeSorts?.length) {
        lines.push("- **排序规则**:");
        for (const s of step.nodeSorts) lines.push(`  - ${s}`);
      }

      // 限制条数
      if (step.nodeLimit) {
        lines.push(`- **限制条数**: ${step.nodeLimit}`);
      }

      // 字段映射
      if (step.fieldMappings) {
        lines.push("- **字段映射**:");
        for (const f of step.fieldMappings) {
          const clear = f.isClear ? " ⚠️清空" : "";
          lines.push(`  - \`${f.target}\` ← ${f.source}${f.typeStr}${clear}`);
        }
      }

      // 代码块
      if (step.code != null && (step.typeId === 10 || step.typeId === 14)) {
        lines.push(`- **语言**: ${step.language}`);
        if (step.inputs?.length) {
          lines.push("- **输入变量**:");
          for (const inp of step.inputs) lines.push(`  - \`${inp.name}\` (${inp.type}) ← ${inp.source}`);
        }
        if (step.outputs?.length) {
          lines.push("- **输出变量**:");
          for (const out of step.outputs) lines.push(`  - \`${out.name}\` (${out.type})`);
        }
        lines.push("- **代码**:");
        lines.push("```" + step.language);
        lines.push(step.code);
        lines.push("```");
      }

      // 发送自定义请求
      if (step.typeId === 8) {
        lines.push(`- **URL**: \`${step.url}\``);
        lines.push(`- **Method**: ${step.method}`);
        if (step.formControls?.length) {
          lines.push("- **参数**:");
          for (const fc of step.formControls) lines.push(`  - \`${fc.name}\` = ${fc.value || ""}`);
        }
      }

      // API 调用
      if (step.typeId === 17) {
        lines.push(`- **URL**: \`${step.url}\``);
        lines.push(`- **Method**: ${step.method}`);
        if (step.contentType) lines.push(`- **Content-Type**: ${step.contentType}`);
        if (step.headers?.length) {
          lines.push("- **Headers**:");
          for (const h of step.headers) lines.push(`  - \`${h.name}\`: \`${h.value}\``);
        }
        if (step.body) {
          lines.push("- **Body**:");
          lines.push("```json");
          lines.push(step.body);
          lines.push("```");
        }
        if (step.formControls?.length) {
          lines.push("- **表单参数**:");
          for (const fc of step.formControls) lines.push(`  - \`${fc.name}\` = ${fc.value}`);
        }
      }

      // 集成中心 API
      if (step.typeId === 18) {
        if (step.apiName) lines.push(`- **接口名**: ${step.apiName}`);
        if (step.templateId) lines.push(`- **模板ID**: ${step.templateId}`);
        if (step.params?.length) {
          lines.push("- **请求参数**:");
          for (const p of step.params) lines.push(`  - \`${p.name || p.id}\` = ${p.value || ""}`);
        }
      }

      // 通知
      if (step.recipients) lines.push(`- **通知对象**: ${step.recipients.join(", ")}`);
      if (step.title) lines.push(`- **标题**: ${step.title}`);
      if (step.content) lines.push(`- **内容**: ${step.content.substring(0, 200)}`);

      // 延时
      if (step.time) lines.push(`- **等待**: ${step.time} ${step.unit || ""}`);

      // 运算
      if (step.formula) lines.push(`- **公式**: \`${step.formula}\``);

      // JSON解析
      if (step.jsonPath) lines.push(`- **JSONPath**: \`${step.jsonPath}\``);

      // 排序
      if (step.sorts?.length) {
        lines.push("- **排序**:");
        for (const s of step.sorts) lines.push(`  - ${s.fieldId} ${s.isAsc ? "ASC" : "DESC"}`);
      }

      lines.push("");
    }
    num++;
  }
}

function renderTree(result, indent) {
  const name = result._calledAs || result.triggerInfo?.name || result.id;
  const lines = [`${indent}${name} (${result.nodeCount}节点)`];
  const entries = Object.entries(result.subProcesses || {});
  for (let i = 0; i < entries.length; i++) {
    const [, sp] = entries[i];
    const isLast = i === entries.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    const childIndent = indent + (isLast ? "    " : "│   ");
    const spName = sp._calledAs || sp.id;
    lines.push(`${indent}${prefix}${spName} (${sp.nodeCount}节点)`);
    if (Object.keys(sp.subProcesses || {}).length) {
      for (const [, child] of Object.entries(sp.subProcesses)) {
        lines.push(renderTree(child, childIndent));
      }
    }
  }
  return lines.join("\n");
}

// ── 列表 ──

async function listWorkflows(search) {
  const data = await mcpCall("get_workflow_list", {});
  let workflows = data?.data?.processes || data?.processes || (Array.isArray(data) ? data : []);
  if (search) workflows = workflows.filter(w => w.name?.includes(search) || w.id?.includes(search));
  console.log(`\n共 ${workflows.length} 个工作流${search ? ` (搜索: "${search}")` : ""}:\n`);
  for (const w of workflows) {
    const trigger = TRIGGER_TYPES[w.type] || w.type || "?";
    console.log(`${w.id} | ${w.name || ""} | ${trigger}`);
  }
}

// ── 主入口 ──

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list") || args.includes("-l")) { await listWorkflows(); return; }
  if (args.includes("--search") || args.includes("-s")) {
    const idx = Math.max(args.indexOf("--search"), args.indexOf("-s"));
    await listWorkflows(args[idx + 1]); return;
  }

  const processId = args.find(a => !a.startsWith("-"));
  if (!processId) {
    console.error("用法:");
    console.error("  node extract-workflow-logic.mjs <processId>");
    console.error("  node extract-workflow-logic.mjs <processId> --output report.md");
    console.error("  node extract-workflow-logic.mjs --list");
    console.error("  node extract-workflow-logic.mjs --search <关键词>");
    process.exit(1);
  }

  const depthIdx = args.indexOf("--depth");
  const maxDepth = depthIdx !== -1 ? parseInt(args[depthIdx + 1]) || 5 : 5;
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  console.error(`\n🔍 递归提取: ${processId} (最大深度: ${maxDepth})\n`);

  const result = await extractWorkflow(processId, maxDepth);
  const report = renderReport(result);

  if (outputFile) {
    fs.writeFileSync(outputFile, report);
    console.error(`\n💾 已保存: ${outputFile}`);
  }

  console.log(report);
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
