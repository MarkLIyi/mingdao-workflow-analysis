/**
 * 明道云 MongoDB 通用只读客户端
 * 按 worksheetId 查询任意明道云工作表，自动处理 collection 命名和 status 过滤
 *
 * 环境变量:
 *   MONGO_URI  — MongoDB 连接串（必须）
 *
 * 用法:
 *   import { connectMongo, find, findOne, count, aggregate, distinct, closeMongo } from "./mingdao-mongo.mjs";
 *   await connectMongo();
 *   const rows = await find("worksheetId", { fieldId: "value" }, { limit: 10 });
 *   await closeMongo();
 *
 * CLI 测试:
 *   node mingdao-mongo.mjs --test <worksheetId> [--limit N] [--filter '{"fieldId":"value"}']
 */

import { MongoClient } from "mongodb";

const DEFAULT_DB = "mdwsrows";

let _client = null;
let _db = null;

// ── 连接管理 ──

export async function connectMongo(uri, dbName) {
  if (_db) return _db;
  const mongoUri = uri || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("[MONGO] MONGO_URI 未设置");

  _client = new MongoClient(mongoUri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  });
  await _client.connect();
  _db = _client.db(dbName || DEFAULT_DB);
  console.log(`[MONGO] 已连接 ${dbName || DEFAULT_DB}`);
  return _db;
}

export async function closeMongo() {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
    console.log("[MONGO] 已断开");
  }
}

export function getDb() {
  if (!_db) throw new Error("[MONGO] 未连接，请先调用 connectMongo()");
  return _db;
}

// ── 辅助 ──

export function collectionName(worksheetId) {
  return worksheetId.startsWith("ws") ? worksheetId : `ws${worksheetId}`;
}

function buildFilter(filter, options) {
  const base = options?.includeDeleted ? {} : { status: 1 };
  return { ...base, ...filter };
}

function getCollection(worksheetId) {
  return getDb().collection(collectionName(worksheetId));
}

// ── 通用查询 ──

/**
 * 查询多条记录
 * @param {string} worksheetId — 工作表ID（自动加 ws 前缀）
 * @param {object} [filter={}] — MongoDB 查询条件（字段ID作key）
 * @param {object} [options] — { sort, limit, skip, projection, includeDeleted }
 * @returns {Promise<object[]>}
 */
export async function find(worksheetId, filter = {}, options = {}) {
  const col = getCollection(worksheetId);
  let cursor = col.find(buildFilter(filter, options));
  if (options.projection) cursor = cursor.project(options.projection);
  if (options.sort) cursor = cursor.sort(options.sort);
  if (options.skip) cursor = cursor.skip(options.skip);
  if (options.limit) cursor = cursor.limit(options.limit);
  return cursor.toArray();
}

/**
 * 查询单条记录
 */
export async function findOne(worksheetId, filter = {}, options = {}) {
  const col = getCollection(worksheetId);
  return col.findOne(buildFilter(filter, options));
}

/**
 * 计数
 */
export async function count(worksheetId, filter = {}, options = {}) {
  const col = getCollection(worksheetId);
  return col.countDocuments(buildFilter(filter, options));
}

/**
 * 聚合查询
 * @param {string} worksheetId
 * @param {object[]} pipeline — MongoDB aggregation pipeline
 * @param {object} [options] — { allowDiskUse: true, ... }
 */
export async function aggregate(worksheetId, pipeline, options = {}) {
  const col = getCollection(worksheetId);
  return col.aggregate(pipeline, { allowDiskUse: true, ...options }).toArray();
}

/**
 * 获取字段的去重值列表
 */
export async function distinct(worksheetId, fieldId, filter = {}, options = {}) {
  const col = getCollection(worksheetId);
  return col.distinct(fieldId, buildFilter(filter, options));
}

// ── CLI 测试模式 ──

async function cliTest() {
  const args = process.argv.slice(2);
  const testIdx = args.indexOf("--test");
  if (testIdx === -1) {
    console.log("用法: node mingdao-mongo.mjs --test <worksheetId> [--limit N] [--filter '{...}']");
    process.exit(0);
  }

  const worksheetId = args[testIdx + 1];
  if (!worksheetId) { console.error("请提供 worksheetId"); process.exit(1); }

  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) || 5 : 5;

  const filterIdx = args.indexOf("--filter");
  let filter = {};
  if (filterIdx !== -1) {
    try { filter = JSON.parse(args[filterIdx + 1]); } catch { console.error("--filter JSON 解析失败"); process.exit(1); }
  }

  await connectMongo();

  const total = await count(worksheetId, filter);
  console.log(`\n[TEST] 工作表 ${worksheetId} (${collectionName(worksheetId)})`);
  console.log(`[TEST] 匹配记录数: ${total}`);

  const rows = await find(worksheetId, filter, { limit });
  console.log(`[TEST] 返回 ${rows.length} 条 (limit=${limit}):\n`);

  for (const row of rows) {
    const rowId = row.rowid || row._id?.toString();
    const keys = Object.keys(row).filter(k => !["_id", "status", "rowid", "version", "ctime", "utime"].includes(k));
    console.log(`  rowId: ${rowId}`);
    for (const k of keys.slice(0, 8)) {
      const v = row[k];
      const display = typeof v === "string" && v.length > 60 ? v.slice(0, 60) + "..." : v;
      console.log(`    ${k}: ${JSON.stringify(display)}`);
    }
    if (keys.length > 8) console.log(`    ... +${keys.length - 8} more fields`);
    console.log();
  }

  await closeMongo();
}

// 直接运行时进入 CLI 模式
const isMain = process.argv[1]?.endsWith("mingdao-mongo.mjs");
if (isMain) cliTest().catch(e => { console.error(e); process.exit(1); });
