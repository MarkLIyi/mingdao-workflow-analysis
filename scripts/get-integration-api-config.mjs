#!/usr/bin/env node

/**
 * 明道云集成中心 API 配置提取器
 *
 * 给定集成中心 API 的 processId (即 appId)，自动提取完整的请求配置：
 * URL、Method、Headers、Body（含动态参数解析）、输入/输出参数。
 *
 * 用法：
 *   node get-integration-api-config.mjs <apiId>              # 提取单个 API 配置
 *   node get-integration-api-config.mjs <apiId> --raw        # 输出原始 JSON
 *   node get-integration-api-config.mjs --connect <connectId> # 列出连接下所有 API
 *
 * 环境变量：
 *   MINGDAO_BASE_URL    明道云地址（默认 https://www.dedlion.com）
 *   MINGDAO_AUTH_TOKEN   认证 token（md_pss_id ...）
 *
 * API 发现路径：
 *   /api/integration/flowNode/get?processId={apiId}
 *     → 返回 flowNodeMap，找 typeId=8 的节点（API请求参数）
 *   /api/integration/flowNode/getNodeDetail?processId={apiId}&nodeId={nodeId}&flowNodeType=8
 *     → 返回 sendContent(URL), method, headers, body, formulaMap
 */

import process from "node:process";

const BASE_URL = process.env.MINGDAO_BASE_URL || "https://www.dedlion.com";
const AUTH_TOKEN = process.env.MINGDAO_AUTH_TOKEN || "md_pss_id 01701c09c02c04f0810970bc06f09009b0c204707d09e043";

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const METHODS = { 1: "GET", 2: "POST", 3: "PUT", 4: "DELETE", 5: "PATCH" };

async function apiGet(path, params = {}) {
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const resp = await fetch(url.toString(), {
    headers: { authorization: AUTH_TOKEN, "content-type": "application/json", "x-requested-with": "XMLHttpRequest" },
  });
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  const json = await resp.json();
  if (json.code === 401) throw new Error("Auth token 过期");
  return json.data;
}

/**
 * 提取集成中心 API 的完整请求配置
 */
async function getApiConfig(apiId) {
  // Step 1: 获取 API 的节点列表
  await delay(200);
  const flowData = await apiGet("/api/integration/flowNode/get", { processId: apiId });
  const fnm = flowData?.flowNodeMap || {};

  // 找关键节点
  const inputNode = Object.values(fnm).find(n => n.typeId === 23);  // 输入参数
  const requestNode = Object.values(fnm).find(n => n.typeId === 8); // API请求参数
  const outputNode = Object.values(fnm).find(n => n.typeId === 21); // 输出参数

  if (!requestNode) throw new Error(`API ${apiId} 未找到请求配置节点 (typeId=8)`);

  // Step 2: 获取输入参数详情
  let inputs = [];
  if (inputNode) {
    await delay(200);
    const inputDetail = await apiGet("/api/integration/flowNode/getNodeDetail", {
      processId: apiId, nodeId: inputNode.id, flowNodeType: 23,
    });
    inputs = (inputDetail?.controls || []).map(c => ({
      name: c.controlName, desc: c.desc, type: c.type, required: c.required,
    }));
  }

  // Step 3: 获取请求配置详情（URL、Method、Headers、Body）
  await delay(200);
  const reqDetail = await apiGet("/api/integration/flowNode/getNodeDetail", {
    processId: apiId, nodeId: requestNode.id, flowNodeType: 8,
  });

  const formulaMap = reqDetail.formulaMap || {};

  // 解析 body 中的动态引用 $nodeId-controlId$ → 参数名
  let body = reqDetail.body || "";
  let bodyResolved = body;
  const refs = body.match(/\$[^$]+\$/g) || [];
  for (const ref of refs) {
    const key = ref.replace(/\$/g, "");
    const formula = formulaMap[key];
    if (formula?.name) {
      bodyResolved = bodyResolved.replace(ref, `{{${formula.name}}}`);
    }
  }

  // 解析 sendContent (URL) 中的动态引用
  let urlStr = reqDetail.sendContent || "";
  let urlResolved = urlStr;
  const urlRefs = urlStr.match(/\$[^$]+\$/g) || [];
  for (const ref of urlRefs) {
    const key = ref.replace(/\$/g, "");
    const formula = formulaMap[key];
    if (formula?.name) {
      urlResolved = urlResolved.replace(ref, `{{${formula.name}}}`);
    }
  }

  // Step 4: 获取输出参数详情
  let outputs = [];
  if (outputNode) {
    await delay(200);
    const outputDetail = await apiGet("/api/integration/flowNode/getNodeDetail", {
      processId: apiId, nodeId: outputNode.id, flowNodeType: 21,
    });
    outputs = (outputDetail?.controls || []).map(c => ({
      name: c.controlName, type: c.type, sampleValue: c.value ? String(c.value).substring(0, 100) : "",
    }));
  }

  return {
    apiId,
    url: urlResolved,
    urlRaw: urlStr,
    method: METHODS[reqDetail.method] || `未知(${reqDetail.method})`,
    headers: reqDetail.headers || [],
    body: bodyResolved,
    bodyRaw: body,
    inputs,
    outputs,
    formulaMap,
  };
}

/**
 * 渲染可读报告
 */
function renderConfig(config) {
  const lines = [];
  lines.push(`# API: ${config.apiId}\n`);
  lines.push(`- **URL**: \`${config.url}\``);
  lines.push(`- **Method**: ${config.method}`);

  if (config.headers.length) {
    lines.push("- **Headers**:");
    for (const h of config.headers) lines.push(`  - \`${h.key || h.name}\`: \`${h.value}\``);
  }

  lines.push(`- **Body**:`);
  lines.push("```json");
  try {
    lines.push(JSON.stringify(JSON.parse(config.body), null, 2));
  } catch {
    lines.push(config.body);
  }
  lines.push("```");

  if (config.inputs.length) {
    lines.push("\n## 输入参数\n");
    lines.push("| 参数名 | 类型 | 必填 | 说明 |");
    lines.push("|--------|------|------|------|");
    for (const p of config.inputs) {
      lines.push(`| ${p.name} | ${p.type} | ${p.required ? "是" : "否"} | ${p.desc || ""} |`);
    }
  }

  if (config.outputs.length) {
    lines.push("\n## 输出参数\n");
    lines.push("| 参数名 | 类型 | 示例值 |");
    lines.push("|--------|------|--------|");
    for (const p of config.outputs) {
      lines.push(`| ${p.name} | ${p.type} | ${p.sampleValue || ""} |`);
    }
  }

  return lines.join("\n");
}

// ── 主入口 ──

async function main() {
  const args = process.argv.slice(2);
  const raw = args.includes("--raw");

  const apiId = args.find(a => !a.startsWith("-"));
  if (!apiId) {
    console.error("用法:");
    console.error("  node get-integration-api-config.mjs <apiId>");
    console.error("  node get-integration-api-config.mjs <apiId> --raw");
    console.error("");
    console.error("apiId = 集成中心 API 的 ID（在 typeId=25 节点的 appId 字段中）");
    process.exit(1);
  }

  const config = await getApiConfig(apiId);

  if (raw) {
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.log(renderConfig(config));
  }
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
