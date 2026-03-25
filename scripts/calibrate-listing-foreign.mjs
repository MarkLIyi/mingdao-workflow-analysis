#!/usr/bin/env node

/**
 * 校准系统挂售中-外贸
 *
 * 从明道云工作流提取的完整业务逻辑，用独立脚本实现。
 * 原工作流 ID: 6944f290063a4bbf0780bebf + 子流程 694796196436ebbd45a77437
 *
 * 业务目标：
 *   定时校准外贸挂售商品是否仍在售，通过SNK外部API查询尺码列表验证，
 *   有结果则更新校准时间，无结果则删除挂售记录。
 *
 * 用法：
 *   node calibrate-listing-foreign.mjs              # 正式执行
 *   node calibrate-listing-foreign.mjs --dry-run    # 只查询不写入
 *   node calibrate-listing-foreign.mjs --limit 10   # 限制处理条数
 */

import process from "node:process";

// ═══════════════════════════════════════════
// 配置
// ═══════════════════════════════════════════

const CONFIG = {
  // 明道云 MCP
  mcpUrl: process.env.MINGDAO_MCP_URL || "https://www.dedlion.com/mcp?HAP-Appkey=681a78e1b8c72330&HAP-Sign=M2NkZGZiMmM5OWIyMTUxMDQ4N2Y2YTAwZTMxNDJmM2Q3NWI5ZmU4MGU4ZDcxZjlhYWI1ZTUyOWJmNDgxYWU2OQ==",
  mcpProtocol: "2025-03-26",

  // SNK 外部 API
  snkApiUrl: "http://xz.bmxgj.cn/sys/sell/commonMethod",

  // 工作表 ID
  worksheets: {
    listing: "6937d2e8be2ffd8cd2532a58",    // 挂售表-新逻辑
    priceData: "6290caed1e00e6d0665284c4",   // 比价数据
    proxy: "63edb8ac1c190a21fe376ad3",       // 芝麻代理
  },

  // 限流
  requestDelay: 200,  // ms
  batchSize: 100,     // 每批处理条数
};

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx !== -1 ? parseInt(process.argv[idx + 1]) || CONFIG.batchSize : CONFIG.batchSize;
})();

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

// ═══════════════════════════════════════════
// MCP 通信层
// ═══════════════════════════════════════════

let mcpInitialized = false;

async function mcpPost(payload) {
  const res = await fetch(CONFIG.mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": CONFIG.mcpProtocol,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`MCP ${res.status}: ${text.substring(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

async function mcpCall(toolName, args) {
  if (!mcpInitialized) {
    await mcpPost({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: CONFIG.mcpProtocol, capabilities: {}, clientInfo: { name: "calibrate-listing", version: "1.0.0" } } });
    await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
    mcpInitialized = true;
  }
  await delay(CONFIG.requestDelay);
  const resp = await mcpPost({
    jsonrpc: "2.0", id: Date.now(), method: "tools/call",
    params: { name: toolName, arguments: args },
  });
  const content = resp?.result?.content;
  if (!content?.length) return null;
  const t = content.find(c => c.type === "text");
  if (!t) return null;
  try { return JSON.parse(t.text); } catch { return t.text; }
}

// ═══════════════════════════════════════════
// 数据查询函数
// ═══════════════════════════════════════════

/**
 * 查询挂售表 — 筛选：业务类型=外贸，排序：校准时间升序，限制条数
 * 对应主流程节点 [获取多条] 查询工作表
 */
async function queryListings(limit) {
  log(`📋 查询挂售表（业务类型=外贸, 限${limit}条, 按校准时间升序）`);
  const result = await mcpCall("get_record_list", {
    worksheet_id: CONFIG.worksheets.listing,
    pageSize: limit,
    pageIndex: 1,
    filter: { field: "ywlx", operator: "eq", value: "外贸" },
    ai_description: "获取外贸类型的挂售记录",
  });
  let rows = result?.data?.rows || result?.rows || [];
  // 按校准时间升序排序（最旧的优先）
  rows.sort((a, b) => {
    const ta = a.jzsj ? new Date(a.jzsj).getTime() : 0;
    const tb = b.jzsj ? new Date(b.jzsj).getTime() : 0;
    return ta - tb;
  });
  log(`  → 获取到 ${rows.length} 条记录`);
  return rows;
}

/**
 * 查询芝麻代理 — 筛选：国家=国外 AND snk价格请求状态=正常
 * 对应子流程节点 [获取单条] 代理
 */
async function getProxy() {
  log(`🔌 查询芝麻代理（国家=国外, 状态=正常）`);
  const result = await mcpCall("get_record_list", {
    worksheet_id: CONFIG.worksheets.proxy,
    pageSize: 50,
    pageIndex: 1,
    ai_description: "获取代理配置列表",
  });
  const allRows = result?.data?.rows || result?.rows || [];
  // 在代码中筛选：国家=国外 AND snk价格请求状态=正常
  const rows = allRows.filter(r => {
    const country = Array.isArray(r.country) ? r.country.map(c => c.value) : [r.country];
    const status = Array.isArray(r.snkjgqqzt) ? r.snkjgqqzt.map(c => c.value) : [r.snkjgqqzt];
    return country.includes("国外") && status.includes("正常");
  });
  if (!rows.length) throw new Error("未找到可用代理（国外+正常）");
  const proxy = rows[0];
  const ip = proxy.IP || proxy.ip || "";
  const port = proxy.port || "";
  log(`  → 代理: ${ip}:${port}`);
  return { ip, port };
}

/**
 * 查询比价数据 — 筛选：global_sku_id 匹配
 * 对应子流程节点 [获取单条] 查询工作表
 */
async function getPriceData(globalSkuId) {
  const result = await mcpCall("get_record_list", {
    worksheet_id: CONFIG.worksheets.priceData,
    pageSize: 1,
    pageIndex: 1,
    filter: { field: "global_sku_id", operator: "eq", value: String(globalSkuId) },
    ai_description: "查询比价数据匹配sku",
  });
  const rows = result?.data?.rows || result?.rows || [];
  return rows[0] || null;
}

// ═══════════════════════════════════════════
// 外部 API 调用
// ═══════════════════════════════════════════

/**
 * 调用 SNK 外部 API
 * 对应子流程节点 [查询外部表] 鞋子/衣服
 */
async function callSnkApi(params) {
  await delay(CONFIG.requestDelay);
  try {
    const resp = await fetch(CONFIG.snkApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!resp.ok) return { status: "error", message: `HTTP ${resp.status}` };
    return await resp.json();
  } catch (e) {
    return { status: "error", message: e.message };
  }
}

/**
 * 查询鞋子尺码列表
 * 对应: snk接口 → 单尺码列表-非账户
 * 实际请求: POST commonMethod → 代理GET https://snkrdunk.com/v1/listing/{number}/sizes/{size_number}
 */
async function checkShoeSizes(number, sizeNumber, ip, port) {
  return callSnkApi({
    ip, port,
    method: "get",
    url: `https://snkrdunk.com/v1/listing/${number}/sizes/${sizeNumber}`,
  });
}

/**
 * 查询衣服尺码列表
 * 对应: snk接口 → 衣服单尺码列表数据
 * 实际请求: POST commonMethod → 代理GET https://snkrdunk.com/v1/apparels/{snk_id}/sizes/{snk_size_id}/listings
 */
async function checkClothSizes(snkId, sizeId, ip, port) {
  return callSnkApi({
    ip, port,
    method: "get",
    url: `https://snkrdunk.com/v1/apparels/${snkId}/sizes/${sizeId}/listings`,
  });
}

// ═══════════════════════════════════════════
// 写入操作
// ═══════════════════════════════════════════

/**
 * 更新校准时间为当前时间
 * 对应子流程节点 [更新记录] — 字段映射: jzsj ← 系统.当前时间
 */
async function updateCalibrationTime(rowId) {
  if (DRY_RUN) { log(`  [DRY-RUN] 跳过更新 ${rowId}`); return; }
  await mcpCall("update_record", {
    worksheet_id: CONFIG.worksheets.listing,
    row_id: rowId,
    fields: { jzsj: new Date().toISOString() },
    ai_description: "更新校准时间",
  });
}

/**
 * 删除挂售记录
 * 对应子流程节点 [更新记录] 删除记录
 */
async function deleteListingRecord(rowId) {
  if (DRY_RUN) { log(`  [DRY-RUN] 跳过删除 ${rowId}`); return; }
  await mcpCall("delete_record", {
    worksheet_id: CONFIG.worksheets.listing,
    row_id: rowId,
    ai_description: "删除无尺码数据的挂售记录",
  });
}

// ═══════════════════════════════════════════
// 主流程
// ═══════════════════════════════════════════

async function main() {
  log(`${"═".repeat(50)}`);
  log(`🚀 校准系统挂售中-外贸${DRY_RUN ? " [DRY-RUN模式]" : ""}`);
  log(`${"═".repeat(50)}`);

  const stats = { total: 0, updated: 0, deleted: 0, skipped: 0, noPrice: 0, error: 0 };

  // Step 1: 查询代理（只查1次，优化点）
  const proxy = await getProxy();

  // Step 2: 查询挂售记录
  const listings = await queryListings(LIMIT);
  stats.total = listings.length;

  if (!listings.length) {
    log("📭 没有需要校准的记录");
    return stats;
  }

  // Step 3: 逐条处理
  for (let i = 0; i < listings.length; i++) {
    const record = listings[i];
    const rowId = record.rowId;
    const globalSkuId = record.global_sku_id;
    const snkNumber = record.snk_number || record.huohao || "";

    log(`\n[${i + 1}/${listings.length}] SKU=${globalSkuId} 货号=${snkNumber} rowId=${rowId}`);

    try {
      // Step 3a: 查询比价数据
      const priceData = await getPriceData(globalSkuId);

      if (!priceData) {
        // 对应工作流: 分支2(else) → 通知告警
        log(`  ⚠️ 比价数据中无匹配 → 跳过（原工作流此处发送站内通知）`);
        stats.noPrice++;
        continue;
      }

      const snkId = priceData.snk_snk_id || priceData.snk_id;
      const dewuNumber = priceData.snkhh || priceData.huohao || snkNumber;
      const sizeNumber = priceData.size_number || record.cmsize || "";

      log(`  📊 比价: snk_id=${snkId} 货号=${dewuNumber} 尺码=${sizeNumber} 品类=${priceData.pinlei || "未知"}`);

      // Step 3b: 条件判断 snk_id 是否存在
      // 对应工作流: [查询工作表].snk_id >= (非空) OR snk_id == "0"
      const hasSnkId = snkId != null && snkId !== "" && snkId !== undefined;

      if (!hasSnkId) {
        log(`  ⚠️ snk_id 不存在 → 跳过（通知告警）`);
        stats.noPrice++;
        continue;
      }

      // Step 3c: 并行调用鞋子API和衣服API
      // 对应工作流: 并行分支 gatewayType=2
      log(`  🔗 调用外部API: 鞋子(number=${dewuNumber}, size=${sizeNumber}) + 衣服(snk_id=${snkId}, size=${sizeNumber})`);
      const [shoeResult, clothResult] = await Promise.all([
        checkShoeSizes(dewuNumber, sizeNumber, proxy.ip, proxy.port),
        checkClothSizes(snkId, sizeNumber, proxy.ip, proxy.port),
      ]);

      log(`  📡 鞋子API返回: status=${shoeResult.status} message=${shoeResult.message || ""} items=${Array.isArray(shoeResult.items) ? shoeResult.items.length : "N/A"}`);
      log(`  📡 衣服API返回: status=${clothResult.status} message=${clothResult.message || ""} items=${Array.isArray(clothResult.items) ? clothResult.items.length : "N/A"}`);

      // Step 3d: 判断结果
      let hasData = false;

      // 鞋子线: status=success → 检查 items 数量
      if (shoeResult.status === "success") {
        const items = shoeResult.items || [];
        const count = Array.isArray(items) ? items.length : 0;
        if (count > 0) {
          log(`  👟 鞋子: ${count}条尺码数据`);
          hasData = true;
        }
      }

      // 衣服线: status=success → 检查 items 数量
      if (clothResult.status === "success") {
        const items = clothResult.items || [];
        const count = Array.isArray(items) ? items.length : 0;
        if (count > 0) {
          log(`  👕 衣服: ${count}条尺码数据`);
          hasData = true;
        }
      }

      // Step 3e: 根据结果更新或删除
      if (hasData) {
        // 有数据 → 更新校准时间 jzsj = 当前时间
        await updateCalibrationTime(rowId);
        log(`  ✅ 更新校准时间`);
        stats.updated++;
      } else {
        // 无数据 → 删除记录
        await deleteListingRecord(rowId);
        log(`  🗑️ 删除记录（鞋子:${shoeResult.status} 衣服:${clothResult.status}）`);
        stats.deleted++;
      }

    } catch (e) {
      log(`  ❌ 错误: ${e.message}`);
      stats.error++;
    }
  }

  // 汇总
  log(`\n${"═".repeat(50)}`);
  log(`📊 执行完成:`);
  log(`  总计: ${stats.total} | 更新: ${stats.updated} | 删除: ${stats.deleted}`);
  log(`  跳过: ${stats.skipped} | 无比价: ${stats.noPrice} | 错误: ${stats.error}`);
  log(`${"═".repeat(50)}`);

  return stats;
}

main().catch(err => { log(`❌ 致命错误: ${err.message}`); process.exit(1); });
