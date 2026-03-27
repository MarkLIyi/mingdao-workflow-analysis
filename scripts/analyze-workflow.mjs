#!/usr/bin/env node

/**
 * 明道云工作流深度分析器 v2
 * 4阶段管线：递归提取 → 数据模型采集 → 诊断优化 → 简化逻辑蓝图
 *
 * 用法:
 *   node analyze-workflow.mjs <URL或processId> [--output dir]
 *   node analyze-workflow.mjs https://www.dedlion.com/workflowedit/xxx
 *   node analyze-workflow.mjs xxx --output ./reports
 *   node analyze-workflow.mjs id1 id2 id3              # 批量分析
 *
 * 环境变量:
 *   MINGDAO_BASE_URL   明道云地址
 *   MINGDAO_AUTH_TOKEN  认证 token (md_pss_id ...)
 *   MINGDAO_MCP_URL    MCP 地址（用于表结构查询）
 */

import process from "node:process";
import fs from "node:fs";
import path from "node:path";

// ═══════════════════════════════════════════
// 配置
// ═══════════════════════════════════════════

const BASE_URL = process.env.MINGDAO_BASE_URL || "https://www.dedlion.com";
const AUTH_TOKEN = process.env.MINGDAO_AUTH_TOKEN || "md_pss_id 01701c09c02c04f0810970bc06f09009b0c204707d09e043";
const MCP_URL = process.env.MINGDAO_MCP_URL ||
  "https://www.dedlion.com/mcp?HAP-Appkey=1af545f1203db0e1&HAP-Sign=MmY4Nzk5NWIxNmQwOWE0NzFjZDNmNjJlYzUyNzJjNmUzYWY0YmM1YTQwZDdlYmUwNTQ1ODYxODExOTU1N2MxNg==";
const PROTOCOL_VERSION = "2025-03-26";
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════════
// API 层
// ═══════════════════════════════════════════

async function apiGet(apiPath, params = {}) {
  const url = new URL(apiPath, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const resp = await fetch(url.toString(), {
    headers: { authorization: AUTH_TOKEN, "content-type": "application/json", "x-requested-with": "XMLHttpRequest" },
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${(await resp.text()).substring(0, 200)}`);
  const json = await resp.json();
  if (json.code === 401) throw new Error("Auth token 过期，请从浏览器 cookie 获取新的 md_pss_id");
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

// ── MCP 层 ──

let mcpInitialized = false;
async function mcpPost(payload) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": PROTOCOL_VERSION },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`MCP ${res.status}: ${text.substring(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

async function mcpCall(toolName, args = {}) {
  if (!mcpInitialized) {
    await mcpPost({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "wf-analyzer", version: "2.0.0" } } });
    await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
    mcpInitialized = true;
  }
  await delay(200);
  const resp = await mcpPost({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: toolName, arguments: args } });
  const t = resp?.result?.content?.find(c => c.type === "text");
  if (!t) return null;
  try { return JSON.parse(t.text); } catch { return t.text; }
}

// ═══════════════════════════════════════════
// 常量映射
// ═══════════════════════════════════════════

const NODE_TYPES = {
  0: "触发", 1: "分支", 2: "分支条件", 3: "填写", 4: "审批",
  6: "更新记录", 7: "获取单条", 8: "发送自定义请求", 9: "获取数据条数", 10: "代码块",
  11: "发邮件", 12: "延时", 13: "获取多条", 14: "获取关联",
  16: "子流程调用", 17: "API调用", 18: "调用集成API",
  20: "新增记录", 21: "删除记录", 22: "短信", 25: "查询外部表",
  26: "延时", 27: "站内通知", 28: "界面推送", 29: "调用封装流程",
  30: "运算", 31: "JSON解析", 36: "数据集成", 42: "封装业务流程", 100: "系统",
};

const CONDITION_IDS = {
  "1": "等于(=)", "2": "不等于(≠)", "3": "包含", "4": "不包含",
  "5": "为空", "6": "不为空", "7": "大于(>)", "8": "大于等于(>=)",
  "9": "属于(in)", "10": "不属于(not in)", "11": "在范围内", "12": "不在范围内",
  "13": "开头是", "14": "结尾是", "15": "小于(<)", "16": "小于等于(<=)",
  "17": "全等于", "18": "早于", "19": "晚于", "20": "日期范围",
  "33": "数组包含", "44": "正则匹配",
};

const ACTION_IDS = {
  "1": "新增", "2": "更新", "3": "删除", "4": "查找(单条)",
  "105": "获取条数", "400": "获取多条(全部)", "406": "查找(按筛选器)", "409": "获取数组对象",
  "500": "调用封装业务流程",
};

const RESULT_TYPE_IDS = { 3: "满足条件", 4: "其他情况(else)" };

const FIELD_TYPES = {
  2: "文本", 3: "电话", 4: "手机", 5: "邮箱", 6: "数值", 8: "金额",
  9: "单选", 10: "多选", 11: "附件", 14: "关联记录", 15: "日期",
  16: "日期时间", 19: "地区", 21: "自由连接", 22: "分段", 24: "他表字段",
  25: "大写金额", 26: "成员", 27: "部门", 28: "等级", 29: "关联表",
  30: "他表字段", 31: "公式", 32: "文本组合", 33: "自动编号", 34: "子表",
  35: "级联选择", 36: "检查项", 37: "富文本", 38: "签名", 40: "定位",
  41: "嵌入", 42: "条码", 43: "文本识别", 45: "API查询", 46: "查询记录",
  47: "OCR", 48: "组织角色", 49: "API集成", 50: "备注", 10010: "系统字段",
};

const METHODS = { 1: "GET", 2: "POST", 3: "PUT", 4: "DELETE", 5: "PATCH" };

// ═══════════════════════════════════════════
// 格式化工具
// ═══════════════════════════════════════════

function fmtCondition(condGroups) {
  if (!condGroups?.length) return "(无条件/默认)";
  return condGroups.map(group =>
    group.map(c => {
      const field = c.filedValue || c.filedId;
      const src = c.nodeName ? `[${c.nodeName}].${field}` : field;
      const op = CONDITION_IDS[c.conditionId] || `条件${c.conditionId}`;
      const vals = (c.conditionValues || []).map(v => {
        if (v.value != null && v.value !== "") return typeof v.value === "object" ? `"${v.value.value || JSON.stringify(v.value)}"` : `"${v.value}"`;
        if (v.controlName) return `[${v.nodeName || ""}].${v.controlName}`;
        return "(空)";
      });
      return `${src} ${op} ${vals.join(", ") || "(空)"}`;
    }).join(" AND ")
  ).join(" OR ");
}

function fmtNodeFilters(filters) {
  if (!filters?.length) return null;
  const result = [];
  for (const fg of filters) {
    for (const andGroup of (fg.conditions || [])) {
      result.push(andGroup.map(c => {
        const field = c.filedValue || c.filedId;
        const op = CONDITION_IDS[c.conditionId] || `条件${c.conditionId}`;
        const vals = (c.conditionValues || []).map(v => {
          if (v.value != null && v.value !== "") return typeof v.value === "object" ? `"${v.value.value}"` : `"${v.value}"`;
          if (v.controlName) return `[${v.nodeName || ""}].${v.controlName}`;
          return "(空)";
        });
        return `${field} ${op} ${vals.join(", ") || "(空)"}`;
      }).join(" AND "));
    }
  }
  return result;
}

function fmtSorts(sorts, controlMap) {
  if (!sorts?.length) return null;
  return sorts.map(s => {
    const name = controlMap?.[s.controlId]?.name || s.controlId;
    return `${name} ${s.isAsc ? "升序" : "降序"}`;
  });
}

// 全局节点映射
let _globalNodeMap = {};

function fmtFields(fields) {
  if (!fields?.length) return null;
  return fields.map(f => {
    const target = f.desc || f.alias || f.fieldId;
    let source = "";
    if (f.fieldValue?.startsWith?.("$")) {
      const m = f.fieldValue.match(/^\$([^-]+)-([^$]+)\$$/);
      if (m) {
        const rn = _globalNodeMap[m[1]];
        source = `[${rn?.name || rn?.appName || m[1].substring(0,8)}].${rn?._controlMap?.[m[2]]?.name || m[2].substring(0,8)}`;
      } else source = f.fieldValue;
    } else if (f.fieldValue) source = `"${f.fieldValue}"`;
    else if (f.fieldValueName) source = f.nodeName ? `[${f.nodeName}].${f.fieldValueName}` : f.fieldValueName;
    else if (f.fieldValueId) source = `{${f.fieldValueId}}`;
    return { target, source, type: f.type };
  });
}

function fmtAccounts(accounts) {
  return accounts?.map(a => a.roleName || a.entityName).filter(Boolean) || [];
}

// ═══════════════════════════════════════════
// Phase 1: 递归提取
// ═══════════════════════════════════════════

async function extract(processId, maxDepth = 5, _visited = new Set(), _depth = 0) {
  if (_visited.has(processId)) return { id: processId, error: "循环引用", depth: _depth };
  if (_depth > maxDepth) return { id: processId, error: `超过最大深度`, depth: _depth };
  _visited.add(processId);

  console.error(`${"  ".repeat(_depth)}📦 提取: ${processId} (depth=${_depth})`);

  let data;
  try { data = await getFlowNodes(processId); } catch (e) {
    return { id: processId, error: e.message, depth: _depth };
  }
  if (!data?.flowNodeMap) return { id: processId, error: "无节点数据", depth: _depth };

  const { flowNodeMap, startEventId, child } = data;
  const startNode = flowNodeMap[startEventId];

  // 补全每个业务节点的详情
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
        if (detail.hookUrl) node._hookUrl = detail.hookUrl;
        if (detail.controls?.length) {
          node._controlMap = {};
          for (const c of detail.controls) node._controlMap[c.controlId] = { name: c.controlName, alias: c.alias, type: c.type };
        }
        // 自定义请求节点
        if (detail.sendContent && node.typeId === 8) {
          node.sendContent = detail.sendContent;
          node.method = detail.method;
          node.formControls = detail.formControls;
          node.contentType = detail.contentType;
        }
      }
    } catch (e) { /* skip */ }
  }

  // 填充全局映射
  for (const [nid, node] of Object.entries(flowNodeMap)) _globalNodeMap[nid] = node;

  // 构建执行链
  const chain = buildChain(flowNodeMap, startEventId);

  // 递归子流程（含封装业务流程）
  const subProcesses = {};
  for (const n of Object.values(flowNodeMap)) {
    // 标准子流程调用 (typeId=16/29/42)
    if ((n.typeId === 16 || n.typeId === 29 || n.typeId === 42) && n.subProcessId) {
      subProcesses[n.subProcessId] = await extract(n.subProcessId, maxDepth, _visited, _depth + 1);
      subProcesses[n.subProcessId]._calledAs = n.subProcessName || n.name;
    }
    // 封装业务流程调用 (actionId=500，appId 即为封装流程的 processId)
    if (String(n.actionId) === "500" && n.appId && !_visited.has(n.appId)) {
      console.error(`${"  ".repeat(_depth)}  🔗 发现封装业务流程: ${n.appName || n.name} (${n.appId})`);
      subProcesses[n.appId] = await extract(n.appId, maxDepth, _visited, _depth + 1);
      subProcesses[n.appId]._calledAs = n.appName || n.name || "封装业务流程";
    }
  }

  return {
    id: processId, depth: _depth, isChild: !!child,
    name: startNode?.name || "", table: startNode?.appName || "",
    appType: startNode?.appType,
    nodeCount: Object.keys(flowNodeMap).length,
    chain, subProcesses, _flowNodeMap: flowNodeMap,
  };
}

function buildChain(fnm, startId, visited = new Set()) {
  const steps = [];
  let cur = startId;
  while (cur && cur !== "99" && !visited.has(cur)) {
    visited.add(cur);
    const n = fnm[cur];
    if (!n) break;

    const step = {
      id: n.id, typeId: n.typeId, type: NODE_TYPES[n.typeId] || `?(${n.typeId})`, name: n.name || "",
      _raw: n,
    };

    if (n.appName) { step.table = n.appName; step.appId = n.appId; }
    if (n.actionId) step.action = ACTION_IDS[n.actionId] || n.actionId;
    // 封装业务流程调用 (actionId=500): appId 就是封装流程的 processId
    if (String(n.actionId) === "500" && n.appId) {
      step.subProcessId = n.appId;
      step.subProcessName = n.appName || "封装业务流程";
      step.type = "调用封装业务流程";
    }
    if (n.selectNodeName) step.dataSource = n.selectNodeName;
    if (n._filters) step.filters = fmtNodeFilters(n._filters);
    if (n._sorts) step.sorts = fmtSorts(n._sorts, n._controlMap);
    if (n._limit?.fieldValue) step.limit = n._limit.fieldValue;
    if (n.fields?.length) step.fieldMappings = fmtFields(n.fields);
    if (n.subProcessId) { step.subProcessId = n.subProcessId; step.subProcessName = n.subProcessName || ""; }
    if (n.typeId === 10 || n.typeId === 14) {
      step.code = n.code || "";
      step.language = n.language || (n.typeId === 14 ? "python" : "js");
      if (n.inputDatas?.length) step.inputs = n.inputDatas.map(d => ({
        name: d.name, type: d.type, source: d.nodeName ? `[${d.nodeName}].${d.fieldValueName || d.fieldValueId}` : d.value || d.fieldValueId,
      }));
      if (n.outputDatas?.length) step.outputs = n.outputDatas.map(d => ({ name: d.name, type: d.type }));
    }
    if ([11, 22, 27, 28].includes(n.typeId)) step.recipients = fmtAccounts(n.accounts);
    if (n.typeId === 8) {
      step.url = n.webhookUrl || n.sendContent || "";
      step.method = METHODS[n.method] || ({ 1: "GET", 2: "POST", 3: "PUT", 4: "DELETE" })[n.method] || "POST";
      if (n.formControls?.length) step.formControls = n.formControls;
    }
    if (n.typeId === 17) {
      step.url = n.requestUrl || n.url || "";
      step.method = n.method || "GET";
      if (n.headers?.length) step.headers = n.headers;
      if (n.body) step.body = typeof n.body === "string" ? n.body.substring(0, 500) : JSON.stringify(n.body).substring(0, 500);
    }
    if (n.typeId === 18) {
      if (n.appName) step.apiName = n.appName;
      if (n.templateId) step.templateId = n.templateId;
      if (n.appId) step.integrationApiId = n.appId;
    }
    if (n.typeId === 25) {
      const findFilters = [];
      if (n.findFields?.length) {
        for (const f of n.findFields) {
          const field = f.fieldName || f.fieldId || f.filedId;
          const op = CONDITION_IDS[f.conditionId] || f.conditionId || "=";
          let val = "";
          if (f.values?.length) val = f.values.map(v => v.value || v.controlName || "?").join(", ");
          else if (f.fieldValue) val = f.fieldValue;
          else if (f.conditionValues?.length) val = f.conditionValues.map(v => v.value || v.controlName || "?").join(", ");
          findFilters.push(`${f.nodeName ? `[${f.nodeName}].` : ""}${field} ${op} ${val}`);
        }
      }
      if (findFilters.length) step.filters = findFilters;
      if (n.appId) step.integrationApiId = n.appId;
    }
    if (n.typeId === 30) {
      if (n.formulaValue) step.formula = n.formulaValue;
      if (n.fieldValue) step.fieldValue = n.fieldValue;
    }
    if (n.typeId === 31) {
      if (n.jsonPath) step.jsonPath = n.jsonPath;
    }
    if (n.typeId === 0) {
      if (n.appType === 7) { step.triggerType = "Webhook"; if (n._hookUrl) step.hookUrl = n._hookUrl; }
      else if (n.appType === 5) step.triggerType = "定时";
      else if (n.appType === 6) step.triggerType = "按日期字段";
      else if (n.appType === 1 || n.appType === 0) step.triggerType = "工作表事件";
      else if (n.appType === 8) step.triggerType = "按钮/自定义动作";
      else if (n.appType === 17) step.triggerType = "API触发";
      else if (n.appType === 12) step.triggerType = "子流程(被调用)";
      if (n.assignFieldNames?.length) step.inputFields = n.assignFieldNames;
    }
    if (n.typeId === 2) {
      step.condition = fmtCondition(n.operateCondition);
      step.resultType = RESULT_TYPE_IDS[n.resultTypeId] || n.resultTypeId;
    }
    if (n.typeId === 12 || n.typeId === 26) {
      if (n.time) step.time = n.time;
      if (n.unit) step.unit = n.unit;
    }

    if (n.flowIds?.length) {
      step.branches = n.flowIds.map((fid, i) => {
        const cond = fnm[fid];
        return {
          label: cond?.name || `分支${i + 1}`,
          resultType: RESULT_TYPE_IDS[cond?.resultTypeId] || "",
          condition: cond?.operateCondition?.length ? fmtCondition(cond.operateCondition) : null,
          chain: cond?.nextId ? buildChain(fnm, cond.nextId, new Set(visited)) : [],
        };
      });
      step.gatewayType = n.gatewayType === 2 ? "并行" : "条件互斥";
    }

    steps.push(step);
    cur = n.nextId || null;
  }
  return steps;
}

// ═══════════════════════════════════════════
// Phase 1.5: 数据模型采集
// ═══════════════════════════════════════════

function collectTableIds(result) {
  const tables = new Map(); // appId → { name, operations: Set, fields: Map<id, {name, alias, type}> }
  const integrationApiIds = new Set();

  function walk(chain, ctx) {
    for (const step of chain) {
      if (step.appId && step.table) {
        if (!tables.has(step.appId)) tables.set(step.appId, { name: step.table, operations: new Set(), fields: new Map() });
        const entry = tables.get(step.appId);
        if (step.action) entry.operations.add(step.action);
        else if (step.typeId === 7 || step.typeId === 13) entry.operations.add("查询");
        else if (step.typeId === 0) entry.operations.add("触发");
      }
      // 从节点的 _controlMap 收集字段信息
      if (step._raw?._controlMap && step.appId && tables.has(step.appId)) {
        const entry = tables.get(step.appId);
        for (const [cid, cinfo] of Object.entries(step._raw._controlMap)) {
          if (!entry.fields.has(cid)) {
            entry.fields.set(cid, { id: cid, name: cinfo.name, alias: cinfo.alias || "", type: cinfo.type });
          }
        }
      }
      if (step.integrationApiId) integrationApiIds.add(step.integrationApiId);
      if (step.branches) {
        for (const br of step.branches) walk(br.chain, ctx);
      }
    }
  }

  // 也从 flowNodeMap 直接收集（节点可能不在 chain 上但有字段信息）
  function walkFlowNodeMap(fnm) {
    for (const [, node] of Object.entries(fnm)) {
      if (node.appId && node.appName) {
        if (!tables.has(node.appId)) tables.set(node.appId, { name: node.appName, operations: new Set(), fields: new Map() });
        const entry = tables.get(node.appId);
        if (node._controlMap) {
          for (const [cid, cinfo] of Object.entries(node._controlMap)) {
            if (!entry.fields.has(cid)) {
              entry.fields.set(cid, { id: cid, name: cinfo.name, alias: cinfo.alias || "", type: cinfo.type });
            }
          }
        }
      }
    }
  }

  walk(result.chain, "主流程");
  if (result._flowNodeMap) walkFlowNodeMap(result._flowNodeMap);

  for (const [, sp] of Object.entries(result.subProcesses)) {
    walk(sp.chain, `子流程`);
    if (sp._flowNodeMap) walkFlowNodeMap(sp._flowNodeMap);
    const spTables = collectTableIds(sp);
    for (const [id, info] of spTables.tables) {
      if (!tables.has(id)) tables.set(id, info);
      else {
        for (const op of info.operations) tables.get(id).operations.add(op);
        for (const [fid, finfo] of info.fields) {
          if (!tables.get(id).fields.has(fid)) tables.get(id).fields.set(fid, finfo);
        }
      }
    }
    for (const id of spTables.integrationApiIds) integrationApiIds.add(id);
  }

  return { tables, integrationApiIds };
}

async function buildTableSchemas(tableMap) {
  const schemas = {};
  for (const [appId, info] of tableMap) {
    // 先取已从节点 _controlMap 收集到的字段
    const nodeFields = [...info.fields.values()];

    // 尝试通过 MCP 获取完整表结构
    let mcpFields = null;
    try {
      const mcpResult = await mcpCall("get_worksheet_structure", {
        worksheet_id: appId,
        ai_description: `获取表「${info.name}」的字段结构`,
        responseFormat: "json",
      });
      const rawFields = mcpResult?.data?.fields || mcpResult?.fields || [];
      if (rawFields.length > 0) {
        mcpFields = rawFields.map(f => ({
          id: f.id || f.controlId,
          name: f.name || f.controlName,
          alias: f.alias || "",
          type: f.type || f.subType,
          typeName: typeof f.type === "string" ? f.type : (FIELD_TYPES[f.type] || `类型${f.type}`),
        }));
      }
    } catch (e) {
      // MCP 不可用，回退到节点字段
    }

    const fields = mcpFields || nodeFields.map(f => ({
      ...f,
      typeName: FIELD_TYPES[f.type] || `类型${f.type}`,
    }));
    const source = mcpFields ? "MCP" : "节点提取";
    console.error(`  📋 表: ${info.name} (${appId}) — ${fields.length}个字段 (${source})`);
    schemas[appId] = {
      name: info.name,
      operations: [...info.operations],
      fields,
      source,
    };
  }
  return schemas;
}

async function fetchIntegrationApiConfigs(apiIds) {
  const configs = {};
  for (const apiId of apiIds) {
    console.error(`  🔗 获取集成API配置: ${apiId}`);
    try {
      await delay(200);
      const flowData = await apiGet("/api/integration/flowNode/get", { processId: apiId });
      const fnm = flowData?.flowNodeMap || {};

      const inputNode = Object.values(fnm).find(n => n.typeId === 23);
      const requestNode = Object.values(fnm).find(n => n.typeId === 8);
      const outputNode = Object.values(fnm).find(n => n.typeId === 21);

      if (!requestNode) { configs[apiId] = { error: "未找到请求配置节点" }; continue; }

      // 输入参数
      let inputs = [];
      if (inputNode) {
        await delay(200);
        const inputDetail = await apiGet("/api/integration/flowNode/getNodeDetail", { processId: apiId, nodeId: inputNode.id, flowNodeType: 23 });
        inputs = (inputDetail?.controls || []).map(c => ({ name: c.controlName, type: c.type, required: c.required }));
      }

      // 请求配置
      await delay(200);
      const reqDetail = await apiGet("/api/integration/flowNode/getNodeDetail", { processId: apiId, nodeId: requestNode.id, flowNodeType: 8 });
      const formulaMap = reqDetail.formulaMap || {};

      let body = reqDetail.body || "";
      let bodyResolved = body;
      for (const ref of (body.match(/\$[^$]+\$/g) || [])) {
        const key = ref.replace(/\$/g, "");
        if (formulaMap[key]?.name) bodyResolved = bodyResolved.replace(ref, `{{${formulaMap[key].name}}}`);
      }

      let urlStr = reqDetail.sendContent || "";
      let urlResolved = urlStr;
      for (const ref of (urlStr.match(/\$[^$]+\$/g) || [])) {
        const key = ref.replace(/\$/g, "");
        if (formulaMap[key]?.name) urlResolved = urlResolved.replace(ref, `{{${formulaMap[key].name}}}`);
      }

      // 输出参数
      let outputs = [];
      if (outputNode) {
        await delay(200);
        const outputDetail = await apiGet("/api/integration/flowNode/getNodeDetail", { processId: apiId, nodeId: outputNode.id, flowNodeType: 21 });
        outputs = (outputDetail?.controls || []).map(c => ({ name: c.controlName, type: c.type, sample: c.value ? String(c.value).substring(0, 100) : "" }));
      }

      configs[apiId] = {
        url: urlResolved, urlRaw: urlStr,
        method: METHODS[reqDetail.method] || `未知(${reqDetail.method})`,
        headers: reqDetail.headers || [],
        body: bodyResolved, bodyRaw: body,
        inputs, outputs,
      };
    } catch (e) {
      console.error(`    ⚠️ 获取失败: ${e.message}`);
      configs[apiId] = { error: e.message };
    }
  }
  return configs;
}

// ═══════════════════════════════════════════
// Phase 2: 自动诊断（保持原有逻辑）
// ═══════════════════════════════════════════

function diagnose(result) {
  const issues = [];
  const allSteps = [];
  const allSubProcesses = [];
  flattenSteps(result.chain, allSteps, "主流程");
  for (const [, sp] of Object.entries(result.subProcesses)) {
    allSubProcesses.push(sp);
    flattenSteps(sp.chain, allSteps, `子流程「${sp._calledAs || sp.id}」`);
  }

  const mainQuerySteps = allSteps.filter(s => s.location === "主流程" && [7, 13].includes(s.step.typeId));
  const batchLimit = mainQuerySteps.find(s => s.step.limit)?.step.limit;

  // 检查1: 重复查询
  const subQueryTables = {};
  for (const s of allSteps) {
    if (!s.location.startsWith("子流程")) continue;
    if (![7, 13, 25].includes(s.step.typeId)) continue;
    const table = s.step.table;
    if (!table) continue;
    const filters = s.step.filters || [];
    const isDynamic = filters.some(f => f.includes("[子流程]") || f.includes("[触发]"));
    if (!isDynamic) {
      if (!subQueryTables[table]) subQueryTables[table] = [];
      subQueryTables[table].push(s);
    }
  }
  for (const [table] of Object.entries(subQueryTables)) {
    issues.push({
      severity: "高", category: "重复查询",
      title: `「${table}」在子流程中被重复查询`,
      detail: `每条记录进入子流程都会查询一次，${batchLimit || "N"}条=${batchLimit || "N"}次相同查询。`,
      suggestion: `上移到主流程，通过参数传入子流程。`,
      impact: `减少 ${batchLimit ? (parseInt(batchLimit) - 1) : "N-1"} 次查询`,
    });
  }

  // 检查2: 冗余并行
  for (const s of allSteps) {
    if (s.step.gatewayType !== "并行") continue;
    const branches = s.step.branches || [];
    if (branches.length < 2) continue;
    const externalCalls = branches.map(br => br.chain.filter(st => [25, 17, 18].includes(st.typeId)));
    const hasMultipleExternals = externalCalls.filter(e => e.length > 0).length > 1;
    if (hasMultipleExternals) {
      const names = externalCalls.flat().map(e => e.name || e.table).join("、");
      const hasConditions = branches.every(br => br.condition);
      if (!hasConditions) {
        issues.push({
          severity: "高", category: "冗余API调用",
          title: `并行分支同时调用多个外部API（${names}）`,
          detail: `并行分支同时执行所有路径，如果数据只属于一个类别，另一个调用浪费。`,
          suggestion: `增加条件判断，改为条件互斥分支。`,
          impact: `减少约50%的外部API调用`,
        });
      }
    }
  }

  // 检查3: 危险删除
  for (const s of allSteps) {
    if (s.step.typeId !== 6 && s.step.typeId !== 21) continue;
    if (s.step.action !== "删除" && s.step.action !== "3") continue;
    issues.push({
      severity: "中", category: "删除安全",
      title: `在${s.location}中直接删除「${s.step.table || ""}」的记录`,
      detail: `删除不可逆，上游判断错误可能误删。`,
      suggestion: `改为状态标记，多次确认后再执行删除。`,
      impact: `避免误删`,
    });
  }

  // 检查4: 外部API无重试
  const externalApiSteps = allSteps.filter(s => [17, 18, 25].includes(s.step.typeId));
  if (externalApiSteps.length > 0) {
    const hasRetry = allSteps.some(s => s.step.typeId === 12 || s.step.typeId === 26);
    if (!hasRetry) {
      issues.push({
        severity: "中", category: "异常处理",
        title: `${externalApiSteps.length}个外部API调用无重试`,
        detail: `外部调用失败后直接跳过。`,
        suggestion: `增加失败重试或错误记录。`,
        impact: `提高成功率`,
      });
    }
  }

  // 检查5: 空分支
  for (const s of allSteps) {
    if (!s.step.gatewayType) continue;
    for (const br of (s.step.branches || [])) {
      if (br.chain.length === 0 && !br.resultType?.includes("else")) {
        issues.push({
          severity: "低", category: "异常处理",
          title: `分支「${br.label}」无后续处理`,
          detail: `在${s.location}中，分支条件不满足时直接结束。`,
          suggestion: `增加日志记录。`,
          impact: `便于排查`,
        });
      }
    }
  }

  // 检查6: 子流程命名
  for (const sp of allSubProcesses) {
    const name = sp._calledAs || "";
    if (!name || name.startsWith("未命名")) {
      issues.push({ severity: "低", category: "可维护性", title: `子流程未命名（${sp.id}）`, detail: `名称为「${name || "空"}」`, suggestion: `重命名为业务用途名称。`, impact: `提高可维护性` });
    }
  }

  // 检查7: 节点过多
  for (const sp of allSubProcesses) {
    if (sp.nodeCount > 25) {
      issues.push({ severity: "低", category: "可维护性", title: `子流程「${sp._calledAs || sp.id}」节点${sp.nodeCount}个`, detail: `节点过多，复杂度高。`, suggestion: `考虑拆分。`, impact: `降低维护难度` });
    }
  }

  // 检查8: 批次量
  if (batchLimit && parseInt(batchLimit) <= 100) {
    issues.push({ severity: "低", category: "性能", title: `批次量${batchLimit}条`, detail: `总量大时覆盖速度可能不够。`, suggestion: `评估是否需增大批次量。`, impact: `及时处理全量数据` });
  }

  const order = { "高": 0, "中": 1, "低": 2 };
  issues.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  return issues;
}

function flattenSteps(chain, result, location) {
  for (const step of chain) {
    result.push({ step, location });
    if (step.branches) for (const br of step.branches) flattenSteps(br.chain, result, location);
  }
}

// ═══════════════════════════════════════════
// Phase 4: 简化逻辑蓝图生成
// ═══════════════════════════════════════════

function generateBlueprint(result, schemas, apiConfigs) {
  const lines = [];
  const name = result._calledAs || result.name || result.id;

  lines.push(`# 简化逻辑蓝图: ${name}\n`);

  // 一、业务目标
  lines.push("## 一、业务目标\n");
  const triggerDesc = describeTrigger(result);
  const actionSummary = describeActions(result);
  lines.push(`${triggerDesc}，${actionSummary}\n`);

  // 二、涉及数据源
  lines.push("## 二、涉及数据源\n");
  lines.push("### 工作表\n");
  lines.push("| 表名 | 表ID | 操作 | 字段数 |");
  lines.push("|------|------|------|--------|");
  for (const [appId, schema] of Object.entries(schemas)) {
    if (schema.error) {
      lines.push(`| ${schema.name} | \`${appId}\` | ${schema.operations?.join(", ") || "-"} | ⚠️${schema.error} |`);
    } else {
      lines.push(`| ${schema.name} | \`${appId}\` | ${schema.operations?.join(", ") || "-"} | ${schema.fields?.length || 0} |`);
    }
  }
  lines.push("");

  // 详细字段清单
  for (const [appId, schema] of Object.entries(schemas)) {
    if (!schema.fields?.length) continue;
    lines.push(`#### ${schema.name} (\`${appId}\`)\n`);
    lines.push("| 字段名 | 别名 | 类型 | 字段ID |");
    lines.push("|--------|------|------|--------|");
    for (const f of schema.fields) {
      lines.push(`| ${f.name} | ${f.alias || "-"} | ${f.typeName} | \`${f.id}\` |`);
    }
    lines.push("");
  }

  // 集成中心API
  if (Object.keys(apiConfigs).length) {
    lines.push("### 集成中心API\n");
    for (const [apiId, config] of Object.entries(apiConfigs)) {
      if (config.error) {
        lines.push(`#### API \`${apiId}\` — ⚠️${config.error}\n`);
        continue;
      }
      lines.push(`#### API \`${apiId}\`\n`);
      lines.push(`- **URL**: \`${config.url}\``);
      lines.push(`- **Method**: ${config.method}`);
      if (config.headers?.length) {
        lines.push("- **Headers**:");
        for (const h of config.headers) lines.push(`  - \`${h.key || h.name}\`: \`${h.value}\``);
      }
      if (config.body) {
        lines.push("- **Body**:");
        lines.push("```json");
        try { lines.push(JSON.stringify(JSON.parse(config.body), null, 2)); } catch { lines.push(config.body); }
        lines.push("```");
      }
      if (config.inputs?.length) {
        lines.push("- **输入**: " + config.inputs.map(p => `${p.name}${p.required ? "(必填)" : ""}`).join(", "));
      }
      if (config.outputs?.length) {
        lines.push("- **输出**: " + config.outputs.map(p => p.name).join(", "));
      }
      lines.push("");
    }
  }

  // 三、最简执行步骤
  lines.push("## 三、最简执行步骤\n");
  lines.push("```");
  const pseudoSteps = generatePseudoCode(result);
  lines.push(pseudoSteps);
  lines.push("```\n");

  // 四、配置常量表
  lines.push("## 四、配置常量表\n");
  lines.push("```javascript");
  lines.push("const CONFIG = {");
  lines.push(`  mcpUrl: process.env.MINGDAO_MCP_URL || "${MCP_URL}",`);
  lines.push(`  mcpProtocol: "${PROTOCOL_VERSION}",`);
  lines.push("  worksheets: {");
  for (const [appId, schema] of Object.entries(schemas)) {
    const safeName = (schema.name || "").replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
    lines.push(`    ${safeName}: "${appId}",  // ${schema.name}`);
  }
  lines.push("  },");

  // 外部API
  const externalUrls = collectExternalUrls(result);
  if (externalUrls.length) {
    lines.push("  externalApis: {");
    for (const u of externalUrls) {
      lines.push(`    // ${u.name}: "${u.url}",`);
    }
    lines.push("  },");
  }
  lines.push("  requestDelay: 200,");
  lines.push("  batchSize: 100,");
  lines.push("};");
  lines.push("```\n");

  // 五、MCP调用模板
  lines.push("## 五、MCP调用模板\n");
  const mcpTemplates = generateMcpTemplates(result, schemas);
  lines.push(mcpTemplates);

  return lines.join("\n");
}

function describeTrigger(result) {
  const step0 = result.chain[0];
  if (!step0) return "手动触发";
  if (step0.triggerType === "定时") return "定时触发";
  if (step0.triggerType === "按日期字段") return `按日期字段触发（绑定表「${result.table || "?"}」）`;
  if (step0.triggerType === "Webhook") return "通过 Webhook 触发";
  if (step0.triggerType === "工作表事件") return `当「${result.table || "?"}」工作表记录变更时触发`;
  if (step0.triggerType === "按钮/自定义动作") return "通过按钮/自定义动作触发";
  if (step0.triggerType === "API触发") return "通过 API 触发";
  return `触发方式: ${step0.triggerType || "未知"}`;
}

function describeActions(result) {
  const actions = [];
  const allSteps = [];
  flattenSteps(result.chain, allSteps, "主");
  for (const [, sp] of Object.entries(result.subProcesses)) flattenSteps(sp.chain, allSteps, "子");

  const queries = allSteps.filter(s => [7, 13].includes(s.step.typeId));
  const updates = allSteps.filter(s => s.step.typeId === 6);
  const creates = allSteps.filter(s => s.step.typeId === 20);
  const deletes = allSteps.filter(s => s.step.typeId === 21 || (s.step.typeId === 6 && s.step.action === "删除"));
  const externals = allSteps.filter(s => [8, 17, 18, 25].includes(s.step.typeId));
  const codes = allSteps.filter(s => s.step.typeId === 10 || s.step.typeId === 14);

  if (queries.length) actions.push(`查询${queries.length}次`);
  if (externals.length) actions.push(`调用${externals.length}个外部API/集成`);
  if (updates.length) actions.push(`更新${updates.length}处`);
  if (creates.length) actions.push(`新增${creates.length}处`);
  if (deletes.length) actions.push(`删除${deletes.length}处`);
  if (codes.length) actions.push(`执行${codes.length}个代码块`);

  return actions.join("，") || "无明显数据操作";
}

function generatePseudoCode(result) {
  const lines = [];
  let indent = 0;
  const pad = () => "  ".repeat(indent);

  function walkSteps(chain, isInLoop = false) {
    for (const step of chain) {
      if (step.typeId === 100 || step.typeId === 2) continue;

      if (step.typeId === 0) {
        // 触发
        lines.push(`${pad()}// 触发: ${step.triggerType || "未知"} → 表「${step.table || "?"}」`);
        continue;
      }

      if (step.branches) {
        if (step.gatewayType === "并行") {
          lines.push(`${pad()}// 并行执行:`);
          lines.push(`${pad()}await Promise.all([`);
          indent++;
          for (const br of step.branches) {
            lines.push(`${pad()}(async () => {  // ${br.label}`);
            indent++;
            walkSteps(br.chain, isInLoop);
            indent--;
            lines.push(`${pad()}})()`);
          }
          indent--;
          lines.push(`${pad()}]);`);
        } else {
          for (let i = 0; i < step.branches.length; i++) {
            const br = step.branches[i];
            const keyword = i === 0 ? "if" : br.resultType?.includes("else") ? "} else {" : "} else if";
            if (keyword === "} else {") {
              lines.push(`${pad()}${keyword}  // ${br.label}`);
            } else if (i === 0) {
              lines.push(`${pad()}${keyword} (${br.condition || "条件"}) {  // ${br.label}`);
            } else {
              lines.push(`${pad()}${keyword} (${br.condition || "条件"}) {  // ${br.label}`);
            }
            indent++;
            walkSteps(br.chain, isInLoop);
            indent--;
          }
          lines.push(`${pad()}}`);
        }
        continue;
      }

      if (step.subProcessId) {
        lines.push(`${pad()}// 调子流程「${step.subProcessName}」`);
        const sp = result.subProcesses?.[step.subProcessId];
        if (sp && step.dataSource) {
          lines.push(`${pad()}for (const record of ${step.dataSource || "records"}) {`);
          indent++;
          walkSteps(sp.chain, true);
          indent--;
          lines.push(`${pad()}}`);
        } else if (sp) {
          walkSteps(sp.chain, isInLoop);
        }
        continue;
      }

      // 普通节点
      let desc = "";
      if ([7, 13].includes(step.typeId)) {
        const filterDesc = step.filters?.length ? ` 筛选: ${step.filters[0]}` : "";
        const limitDesc = step.limit ? ` 限${step.limit}条` : "";
        desc = `${pad()}const ${varName(step.name)} = await query("${step.table || "?"}");${filterDesc}${limitDesc}`;
      } else if (step.typeId === 6 || step.typeId === 20) {
        desc = `${pad()}await ${step.action === "删除" ? "deleteRecord" : step.typeId === 20 ? "createRecord" : "updateRecord"}("${step.table || "?"}");`;
        if (step.fieldMappings?.length) {
          desc += `  // ${step.fieldMappings.slice(0, 3).map(f => `${f.target}←${f.source}`).join(", ")}`;
        }
      } else if (step.typeId === 21) {
        desc = `${pad()}await deleteRecord("${step.table || "?"}");`;
      } else if (step.typeId === 25 || step.typeId === 18) {
        desc = `${pad()}const ${varName(step.name)} = await callIntegrationApi("${step.apiName || step.table || "?"}");`;
      } else if (step.typeId === 8) {
        desc = `${pad()}const ${varName(step.name)} = await fetch("${step.url || "?"}", { method: "${step.method || "POST"}" });`;
      } else if (step.typeId === 17) {
        desc = `${pad()}const ${varName(step.name)} = await fetch("${step.url || "?"}", { method: "${step.method || "GET"}" });`;
      } else if (step.typeId === 10 || step.typeId === 14) {
        desc = `${pad()}// 代码块「${step.name}」(${step.language || "js"}) — 见原代码`;
      } else if ([27, 11, 22, 28].includes(step.typeId)) {
        desc = `${pad()}// 通知: ${step.recipients?.join(", ") || "?"} — ${step.name}`;
      } else if (step.typeId === 12 || step.typeId === 26) {
        desc = `${pad()}await delay(${step.time || "?"});  // ${step.unit || ""}`;
      } else if (step.typeId === 30) {
        desc = `${pad()}const result = ${step.formula || step.fieldValue || "计算"};  // ${step.name}`;
      } else if (step.typeId === 31) {
        desc = `${pad()}const parsed = jsonPath(data, "${step.jsonPath || "?"}");  // ${step.name}`;
      } else if (step.typeId === 9) {
        desc = `${pad()}const count = await getCount("${step.table || "?"}");  // ${step.name}`;
      } else {
        desc = `${pad()}// [${step.type}] ${step.name}`;
      }
      lines.push(desc);
    }
  }

  walkSteps(result.chain);
  return lines.join("\n");
}

function varName(name) {
  if (!name) return "result";
  // 简化中文名为拼音首字母风格变量名
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "").substring(0, 20) || "result";
}

function collectExternalUrls(result) {
  const urls = [];
  const allSteps = [];
  flattenSteps(result.chain, allSteps, "主");
  for (const [, sp] of Object.entries(result.subProcesses)) flattenSteps(sp.chain, allSteps, "子");

  for (const s of allSteps) {
    if (s.step.url && (s.step.typeId === 8 || s.step.typeId === 17)) {
      urls.push({ name: s.step.name, url: s.step.url });
    }
  }
  return urls;
}

function generateMcpTemplates(result, schemas) {
  const lines = [];
  const allSteps = [];
  flattenSteps(result.chain, allSteps, "主");
  for (const [, sp] of Object.entries(result.subProcesses)) flattenSteps(sp.chain, allSteps, "子");

  // 收集唯一的 MCP 操作模式
  const ops = new Map();
  for (const s of allSteps) {
    if ([7, 13].includes(s.step.typeId) && s.step.appId) {
      const key = `query_${s.step.appId}`;
      if (!ops.has(key)) {
        ops.set(key, {
          type: "query", name: s.step.name, table: s.step.table, appId: s.step.appId,
          filters: s.step.filters, sorts: s.step.sorts, limit: s.step.limit,
        });
      }
    }
    if (s.step.typeId === 6 && s.step.appId && s.step.action !== "删除") {
      const key = `update_${s.step.appId}`;
      if (!ops.has(key)) {
        ops.set(key, { type: "update", name: s.step.name, table: s.step.table, appId: s.step.appId, fieldMappings: s.step.fieldMappings });
      }
    }
    if (s.step.typeId === 20 && s.step.appId) {
      const key = `create_${s.step.appId}`;
      if (!ops.has(key)) {
        ops.set(key, { type: "create", name: s.step.name, table: s.step.table, appId: s.step.appId, fieldMappings: s.step.fieldMappings });
      }
    }
    if ((s.step.typeId === 21 || (s.step.typeId === 6 && s.step.action === "删除")) && s.step.appId) {
      const key = `delete_${s.step.appId}`;
      if (!ops.has(key)) {
        ops.set(key, { type: "delete", name: s.step.name, table: s.step.table, appId: s.step.appId });
      }
    }
  }

  if (ops.size === 0) {
    lines.push("_(无 MCP 操作)_\n");
    return lines.join("\n");
  }

  lines.push("```javascript");
  lines.push("// ── MCP 通信层（复用模板） ──\n");
  lines.push(`let mcpInitialized = false;`);
  lines.push(`async function mcpCall(toolName, args) {`);
  lines.push(`  if (!mcpInitialized) {`);
  lines.push(`    await mcpPost({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: CONFIG.mcpProtocol, capabilities: {}, clientInfo: { name: "workflow-script", version: "1.0.0" } } });`);
  lines.push(`    await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });`);
  lines.push(`    mcpInitialized = true;`);
  lines.push(`  }`);
  lines.push(`  await delay(CONFIG.requestDelay);`);
  lines.push(`  const resp = await mcpPost({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: toolName, arguments: args } });`);
  lines.push(`  const t = resp?.result?.content?.find(c => c.type === "text");`);
  lines.push(`  if (!t) return null;`);
  lines.push(`  try { return JSON.parse(t.text); } catch { return t.text; }`);
  lines.push(`}\n`);

  for (const [, op] of ops) {
    if (op.type === "query") {
      lines.push(`// ${op.name} → 查询「${op.table}」`);
      lines.push(`async function query${sanitize(op.table)}() {`);
      lines.push(`  return mcpCall("get_record_list", {`);
      lines.push(`    worksheet_id: CONFIG.worksheets.${sanitize(op.table)},`);
      if (op.limit) lines.push(`    pageSize: ${op.limit},`);
      else lines.push(`    pageSize: CONFIG.batchSize,`);
      lines.push(`    pageIndex: 1,`);
      if (op.filters?.length) lines.push(`    // 筛选: ${op.filters[0]}`);
      if (op.sorts?.length) lines.push(`    // 排序: ${op.sorts[0]}`);
      lines.push(`  });`);
      lines.push(`}\n`);
    }
    if (op.type === "update") {
      lines.push(`// ${op.name} → 更新「${op.table}」`);
      lines.push(`async function update${sanitize(op.table)}(rowId, fields) {`);
      lines.push(`  return mcpCall("update_record", {`);
      lines.push(`    worksheet_id: CONFIG.worksheets.${sanitize(op.table)},`);
      lines.push(`    row_id: rowId,`);
      lines.push(`    fields,`);
      if (op.fieldMappings?.length) {
        lines.push(`    // 字段映射: ${op.fieldMappings.slice(0, 3).map(f => `${f.target}←${f.source}`).join(", ")}`);
      }
      lines.push(`  });`);
      lines.push(`}\n`);
    }
    if (op.type === "create") {
      lines.push(`// ${op.name} → 新增「${op.table}」`);
      lines.push(`async function create${sanitize(op.table)}(fields) {`);
      lines.push(`  return mcpCall("create_record", {`);
      lines.push(`    worksheet_id: CONFIG.worksheets.${sanitize(op.table)},`);
      lines.push(`    fields,`);
      lines.push(`  });`);
      lines.push(`}\n`);
    }
    if (op.type === "delete") {
      lines.push(`// ${op.name} → 删除「${op.table}」`);
      lines.push(`async function delete${sanitize(op.table)}(rowId) {`);
      lines.push(`  return mcpCall("delete_record", {`);
      lines.push(`    worksheet_id: CONFIG.worksheets.${sanitize(op.table)},`);
      lines.push(`    row_id: rowId,`);
      lines.push(`  });`);
      lines.push(`}\n`);
    }
  }

  lines.push("```");
  return lines.join("\n");
}

function sanitize(name) {
  if (!name) return "Unknown";
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "").substring(0, 20) || "Unknown";
}

// ═══════════════════════════════════════════
// 渲染报告（Phase 3 — 保持原有逻辑）
// ═══════════════════════════════════════════

function renderExtraction(result) {
  const lines = [];
  const name = result._calledAs || result.name || result.id;
  lines.push(`# ${result.isChild ? "子流程" : "工作流"}: ${name}`);
  lines.push(`> Process ID: \`${result.id}\` | 节点数: ${result.nodeCount} | 深度: ${result.depth}`);
  if (result.error) { lines.push(`> ⚠️ ${result.error}`); return lines.join("\n"); }
  lines.push("");

  if (!result.isChild) {
    lines.push("## 触发方式");
    lines.push(`- 名称: ${result.name}`);
    if (result.table) lines.push(`- 绑定表: ${result.table}`);
    lines.push("");
  }

  lines.push("## 完整执行逻辑\n");
  renderSteps(result.chain, lines, "");

  for (const [, sp] of Object.entries(result.subProcesses)) {
    lines.push("\n---\n");
    lines.push(renderExtraction(sp));
  }

  if (Object.keys(result.subProcesses).length) {
    lines.push("\n## 调用关系\n```");
    lines.push(renderTree(result, ""));
    lines.push("```");
  }
  return lines.join("\n");
}

function renderSteps(chain, lines, indent) {
  let num = 1;
  for (const step of chain) {
    if (step.typeId === 100 || step.typeId === 2) continue;

    if (step.branches) {
      lines.push(`${indent}### ${num}. [${step.gatewayType}分支] ${step.name}\n`);
      for (let i = 0; i < step.branches.length; i++) {
        const br = step.branches[i];
        lines.push(`${indent}#### 分支 ${i+1} ${br.resultType ? `(${br.resultType})` : ""}`);
        if (br.condition) lines.push(`${indent}- **条件**: ${br.condition}`);
        lines.push("");
        if (br.chain.length) renderSteps(br.chain, lines, indent);
        else lines.push(`${indent}_(无后续节点)_\n`);
      }
    } else if (step.subProcessId) {
      lines.push(`${indent}### ${num}. [子流程调用] ${step.name}`);
      lines.push(`- 调用: 「${step.subProcessName}」(\`${step.subProcessId}\`)`);
      if (step.dataSource) lines.push(`- 数据源: 「${step.dataSource}」`);
      if (step.fieldMappings?.length) {
        lines.push("- 参数:");
        for (const f of step.fieldMappings) lines.push(`  - \`${f.target}\` ← ${f.source}`);
      }
      lines.push("");
    } else {
      lines.push(`${indent}### ${num}. [${step.type}] ${step.name}`);
      if (step.table) lines.push(`- 工作表: ${step.table} (\`${step.appId || ""}\`)`);
      if (step.action) lines.push(`- 操作: ${step.action}`);
      if (step.dataSource) lines.push(`- 数据源: 「${step.dataSource}」`);
      if (step.triggerType) lines.push(`- 触发类型: ${step.triggerType}`);
      if (step.hookUrl) lines.push(`- Webhook URL: \`${step.hookUrl}\``);
      if (step.inputFields) lines.push(`- 输入参数: ${step.inputFields.join(", ")}`);
      if (step.filters?.length) { lines.push("- 筛选条件:"); for (const f of step.filters) lines.push(`  - ${f}`); }
      if (step.sorts?.length) { lines.push("- 排序:"); for (const s of step.sorts) lines.push(`  - ${s}`); }
      if (step.limit) lines.push(`- 限制条数: ${step.limit}`);
      if (step.fieldMappings?.length) {
        lines.push("- 字段映射:");
        for (const f of step.fieldMappings) lines.push(`  - \`${f.target}\` ← ${f.source}${f.type != null ? ` (type:${f.type})` : ""}`);
      }
      if (step.recipients?.length) lines.push(`- 通知对象: ${step.recipients.join(", ")}`);
      if (step.typeId === 10 || step.typeId === 14) {
        lines.push(`- 语言: ${step.language}`);
        if (step.inputs?.length) {
          lines.push("- 输入变量:");
          for (const inp of step.inputs) lines.push(`  - \`${inp.name}\` (${inp.type}) ← ${inp.source}`);
        }
        if (step.outputs?.length) {
          lines.push("- 输出变量:");
          for (const out of step.outputs) lines.push(`  - \`${out.name}\` (${out.type})`);
        }
        lines.push("- 代码:\n```" + step.language + "\n" + step.code + "\n```");
      }
      if (step.typeId === 8) {
        lines.push(`- URL: \`${step.url}\``);
        lines.push(`- Method: ${step.method}`);
        if (step.formControls?.length) {
          lines.push("- 参数:");
          for (const fc of step.formControls) lines.push(`  - \`${fc.name}\` = ${fc.value || ""}`);
        }
      }
      if (step.typeId === 17) {
        lines.push(`- URL: \`${step.url}\``);
        lines.push(`- Method: ${step.method}`);
        if (step.headers?.length) {
          lines.push("- Headers:");
          for (const h of step.headers) lines.push(`  - \`${h.name}\`: \`${h.value}\``);
        }
        if (step.body) lines.push("- Body:\n```json\n" + step.body + "\n```");
      }
      if (step.typeId === 18) {
        if (step.apiName) lines.push(`- 接口名: ${step.apiName}`);
        if (step.integrationApiId) lines.push(`- API ID: \`${step.integrationApiId}\``);
      }
      if (step.typeId === 25) {
        if (step.integrationApiId) lines.push(`- 外部表API ID: \`${step.integrationApiId}\``);
      }
      if (step.formula) lines.push(`- 公式: \`${step.formula}\``);
      if (step.jsonPath) lines.push(`- JSONPath: \`${step.jsonPath}\``);
      if (step.time) lines.push(`- 等待: ${step.time} ${step.unit || ""}`);
      if (step._raw?.assignFieldNames) lines.push(`- 输入参数: ${step._raw.assignFieldNames.join(", ")}`);
      lines.push("");
    }
    num++;
  }
}

function renderTree(result, indent) {
  const name = result._calledAs || result.name || result.id;
  const lines = [`${indent}${name} (${result.nodeCount}节点)`];
  for (const [, sp] of Object.entries(result.subProcesses)) {
    lines.push(`${indent}└── ${sp._calledAs || sp.id} (${sp.nodeCount}节点)`);
    if (Object.keys(sp.subProcesses || {}).length)
      for (const [, child] of Object.entries(sp.subProcesses))
        lines.push(renderTree(child, indent + "    "));
  }
  return lines.join("\n");
}

function renderDiagnosis(issues) {
  const lines = [];
  lines.push("# 诊断报告\n");
  if (issues.length === 0) { lines.push("未发现明显问题。\n"); return lines.join("\n"); }

  lines.push(`共发现 **${issues.length}** 个问题：高=${issues.filter(i=>i.severity==="高").length} 中=${issues.filter(i=>i.severity==="中").length} 低=${issues.filter(i=>i.severity==="低").length}\n`);
  lines.push("| # | 严重度 | 类别 | 问题 | 预期收益 |");
  lines.push("|---|--------|------|------|----------|");
  issues.forEach((issue, i) => {
    const sev = issue.severity === "高" ? "🔴 高" : issue.severity === "中" ? "🟡 中" : "🔵 低";
    lines.push(`| ${i+1} | ${sev} | ${issue.category} | ${issue.title} | ${issue.impact} |`);
  });
  lines.push("");
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const sev = issue.severity === "高" ? "🔴" : issue.severity === "中" ? "🟡" : "🔵";
    lines.push(`## ${sev} 问题 ${i+1}: ${issue.title}\n`);
    lines.push(`- **现状**: ${issue.detail}`);
    lines.push(`- **建议**: ${issue.suggestion}`);
    lines.push(`- **预期收益**: ${issue.impact}\n`);
  }
  return lines.join("\n");
}

function renderOptimization(result, issues) {
  const name = result._calledAs || result.name || result.id;
  const lines = [];
  lines.push(`# 「${name}」优化方案\n`);
  lines.push("## 现有流程概述\n```");
  lines.push(renderFlowSummary(result, ""));
  lines.push("```\n");

  if (!issues.length) { lines.push("未发现需要优化的问题。\n"); return lines.join("\n"); }

  lines.push("## 优化方案\n");
  lines.push("| # | 优化项 | 优先级 | 预期收益 |");
  lines.push("|---|--------|--------|----------|");
  issues.forEach((issue, i) => {
    lines.push(`| ${i+1} | ${issue.suggestion.substring(0, 50)} | ${issue.severity} | ${issue.impact} |`);
  });

  const high = issues.filter(i => i.severity === "高");
  const mid = issues.filter(i => i.severity === "中");

  if (high.length) {
    lines.push("\n### 高优先级\n");
    high.forEach((issue, i) => { lines.push(`**${i+1}. ${issue.title}**\n现状：${issue.detail}\n方案：${issue.suggestion}\n`); });
  }
  if (mid.length) {
    lines.push("### 中优先级\n");
    mid.forEach((issue, i) => { lines.push(`**${i+1}. ${issue.title}**\n方案：${issue.suggestion}\n`); });
  }

  return lines.join("\n");
}

function renderFlowSummary(result, indent) {
  const lines = [];
  const name = result._calledAs || result.name || result.id;
  lines.push(`${indent}${result.isChild ? "子流程" : "工作流"}: ${name} (${result.nodeCount}节点)`);
  for (const step of result.chain) {
    if (step.typeId === 100 || step.typeId === 2) continue;
    let desc = `${indent}  → [${step.type}] ${step.name}`;
    if (step.table) desc += ` (${step.table})`;
    if (step.filters?.length) desc += ` 筛选: ${step.filters[0]}`;
    if (step.limit) desc += ` 限制:${step.limit}条`;
    if (step.subProcessId) desc += ` → 调子流程「${step.subProcessName}」`;
    if (step.branches) desc += ` [${step.gatewayType} ${step.branches.length}路]`;
    lines.push(desc);
  }
  for (const [, sp] of Object.entries(result.subProcesses)) lines.push(renderFlowSummary(sp, indent + "  "));
  return lines.join("\n");
}

// ═══════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════

function parseId(input) {
  const match = input.match(/workflowedit\/([a-f0-9]+)/);
  return match ? match[1] : input.replace(/[^a-f0-9]/g, "");
}

async function main() {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : null;
  const ids = args.filter((a, i) => !a.startsWith("--") && (outputIdx === -1 || (i !== outputIdx && i !== outputIdx + 1)));

  if (!ids.length) {
    console.error("用法:");
    console.error("  node analyze-workflow.mjs <URL或processId>");
    console.error("  node analyze-workflow.mjs <URL> --output ./reports");
    console.error("  node analyze-workflow.mjs <id1> <id2> <id3>  # 批量");
    process.exit(1);
  }

  for (const rawId of ids) {
    const processId = parseId(rawId);
    console.error(`\n${"═".repeat(60)}`);
    console.error(`🔍 分析工作流: ${processId}`);
    console.error(`${"═".repeat(60)}\n`);

    // Phase 1: 递归提取
    console.error("📦 Phase 1: 递归提取...\n");
    _globalNodeMap = {};
    const result = await extract(processId);
    if (result.error) { console.error(`❌ 提取失败: ${result.error}`); continue; }

    // Phase 1.5: 数据模型采集
    console.error("\n📊 Phase 1.5: 数据模型采集...\n");
    const { tables, integrationApiIds } = collectTableIds(result);
    console.error(`  发现 ${tables.size} 张工作表, ${integrationApiIds.size} 个集成API\n`);

    const schemas = await buildTableSchemas(tables);
    const apiConfigs = await fetchIntegrationApiConfigs(integrationApiIds);

    // Phase 2: 自动诊断
    console.error("\n🔍 Phase 2: 自动诊断...\n");
    const issues = diagnose(result);
    console.error(`  发现 ${issues.length} 个问题\n`);

    // Phase 3: 生成报告
    console.error("📝 Phase 3: 生成报告...\n");
    const extractionReport = renderExtraction(result);
    const diagnosisReport = renderDiagnosis(issues);
    const optimizationReport = renderOptimization(result, issues);

    // Phase 4: 简化逻辑蓝图
    console.error("🧩 Phase 4: 生成简化逻辑蓝图...\n");
    const blueprint = generateBlueprint(result, schemas, apiConfigs);

    const fullReport = [
      extractionReport,
      "\n---\n",
      diagnosisReport,
      "\n---\n",
      optimizationReport,
      "\n---\n",
      blueprint,
    ].join("\n");

    // 输出
    if (outputDir) {
      fs.mkdirSync(outputDir, { recursive: true });
      const name = result._calledAs || result.name || processId;
      const safeName = name.replace(/[\/\\:*?"<>|]/g, "_");
      const filePath = path.join(outputDir, `${safeName}-分析报告.md`);
      fs.writeFileSync(filePath, fullReport);
      console.error(`💾 报告已保存: ${filePath}`);
    }

    console.log(fullReport);
  }
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
