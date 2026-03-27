/**
 * @skill mingdao-api-search
 * @version 1.0.0
 * @description 查询明道云集成中心的所有业务接口，按连接分组展示，支持关键词搜索和参数详情查看。
 *              通过明道云内置 API 获取所有连接（Connection）及其下属的 API 列表，
 *              包含接口名称、请求 URL、HTTP 方法、输入参数、输出字段等信息。
 *
 * @input
 *   环境变量（必须）：
 *     DEDLION_TOKEN      - 明道云 md_pss_id cookie 值（登录后从浏览器 Cookie 获取）
 *     DEDLION_COMPANY_ID - 明道云 companyId（从 localStorage.currentProjectId 获取）
 *
 *   环境变量（可选）：
 *     DEDLION_BASE_URL   - 明道云域名，默认 https://www.dedlion.com
 *
 *   CLI 参数 / stdin JSON 字段：
 *     listConnects  {boolean} 可选 - 仅列出所有连接名称和 API 数量，不获取 API 列表
 *     connect       {string}  可选 - 按连接名称过滤（模糊匹配）
 *     search        {string}  可选 - 按 API 名称或 URL 关键词搜索
 *     detail        {boolean} 可选 - 是否获取输入/输出参数详情，默认 false
 *
 * @output JSON (stdout)
 *   {
 *     "success": true,
 *     "total": 13,
 *     "connections": [
 *       {
 *         "id": "xxx",
 *         "name": "飞书相关接口",
 *         "description": "...",
 *         "apiCount": 38,
 *         "apis": [
 *           {
 *             "id": "xxx",
 *             "name": "获取用户信息",
 *             "enabled": true,
 *             "url": "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
 *             "method": "POST",
 *             "inputs": [{ "name": "app_id", "type": "文本", "required": false, "desc": "" }],
 *             "outputs": [{ "name": "code", "type": "数字" }]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * @error JSON (stdout, success=false)
 *   { "success": false, "error": { "code": "AUTH_FAILED|FETCH_ERROR", "message": "..." } }
 *
 * @auth
 *   获取 DEDLION_TOKEN：在浏览器登录 https://www.dedlion.com 后，
 *     打开 DevTools → Application → Cookies → 复制 md_pss_id 的值
 *   获取 DEDLION_COMPANY_ID：DevTools → Application → Local Storage →
 *     https://www.dedlion.com → 复制 currentProjectId 的值
 *
 * @usage
 *   # 列出所有连接
 *   node scripts/mingdao-api-search.js --list-connects
 *
 *   # 查看飞书连接下的所有 API（含参数详情）
 *   node scripts/mingdao-api-search.js --connect 飞书 --detail
 *
 *   # 搜索关键词
 *   node scripts/mingdao-api-search.js --search 用户 --detail
 *
 *   # stdin JSON 方式（适合 agent 调用）
 *   echo '{"connect":"飞书","detail":true}' | node scripts/mingdao-api-search.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

// ── Load .env ────────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=\s][^=]*)\s*=\s*(.*)/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
  });
}

// ── Parse input ──────────────────────────────────────────────────────────────

async function getInput() {
  // If CLI args provided, use them; otherwise read JSON from stdin
  if (process.argv.length <= 2 && !process.stdin.isTTY) {
    return new Promise(resolve => {
      let buf = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', d => buf += d);
      process.stdin.on('end', () => {
        try { resolve(JSON.parse(buf.trim())); } catch { resolve({}); }
      });
    });
  }
  const args = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list-connects')  { p.listConnects = true; continue; }
    if (args[i] === '--detail')         { p.detail = true; continue; }
    if (args[i] === '--connect' && args[i+1])  { p.connect = args[++i]; continue; }
    if (args[i] === '--search'  && args[i+1])  { p.search  = args[++i]; continue; }
  }
  return p;
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

const BASE_URL   = (process.env.DEDLION_BASE_URL || 'https://www.dedlion.com').replace(/\/$/, '');
const TOKEN      = process.env.DEDLION_TOKEN      || '';
const COMPANY_ID = process.env.DEDLION_COMPANY_ID || '';

const COMMON_HEADERS = {
  'Content-Type':    'application/json',
  'Authorization':   `md_pss_id ${TOKEN}`,
  'X-Requested-With': 'XMLHttpRequest',
};

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = BASE_URL + urlPath;
    const u = new URL(fullUrl);
    const lib = u.protocol === 'https:' ? https : http;
    const bodyStr = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: {
        ...COMMON_HEADERS,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };
    const req = lib.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.code === 401 || parsed.message === '账号失效') {
            reject(new Error('AUTH_FAILED: DEDLION_TOKEN 已失效，请重新获取 md_pss_id cookie'));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`PARSE_ERROR: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function get(urlPath) { return request('GET', urlPath, null); }
function post(urlPath, body) { return request('POST', urlPath, body); }

// ── Method + type maps ───────────────────────────────────────────────────────

const METHOD_MAP = { 1: 'GET', 2: 'POST', 3: 'PUT', 4: 'DELETE', 5: 'PATCH' };
const TYPE_MAP   = {
  2: '文本', 6: '数字', 9: '日期', 16: '富文本',
  10000003: '对象数组', 10000007: '数组', 10000008: 'JSON对象',
};
function typeName(t) { return TYPE_MAP[t] || `type_${t}`; }

// ── API helpers ──────────────────────────────────────────────────────────────

async function getConnections() {
  const r = await post('/api/integration/v1/package/getList', {
    companyId: COMPANY_ID, pageIndex: 1, pageSize: 200, type: 1,
  });
  if (r.status !== 1) throw new Error(`getList failed: ${r.msg}`);
  return r.data;
}

async function getApiList(connectId) {
  const r = await post('/api/integration/v1/package/getApiList', {
    companyId: COMPANY_ID, pageIndex: 1, pageSize: 10000,
    keyword: '', relationId: connectId,
  });
  if (r.status !== 1) throw new Error(`getApiList failed: ${r.msg}`);
  return r.data;
}

async function getApiDetail(processId) {
  const nodeResp = await get(`/api/integration/flowNode/get?processId=${processId}`);
  if (nodeResp.status !== 1) return null;

  const nodes   = Object.values(nodeResp.data.flowNodeMap || {});
  const inputN  = nodes.find(n => n.typeId === 23);
  const apiN    = nodes.find(n => n.typeId === 8);
  const outputN = nodes.find(n => n.typeId === 21);

  const inputs = (inputN && inputN.controls || []).map(c => ({
    name:     c.controlName,
    type:     typeName(c.type),
    required: !!c.required,
    desc:     c.desc || '',
  }));

  // URL/method lives in getNodeDetail for the type-8 node
  let url = '', method = '';
  if (apiN) {
    try {
      const nd = await get(`/api/integration/flowNode/getNodeDetail?processId=${processId}&nodeId=${apiN.id}&flowNodeType=8`);
      if (nd.status === 1 && nd.data) {
        url    = (nd.data.sendContent || '').replace(/\$[^$]+\$/g, '{param}');
        method = METHOD_MAP[nd.data.method] || String(nd.data.method || '');
      }
    } catch { /* leave empty */ }
  }

  // Output params: try getNodeDetail for type-21 node
  let outputs = [];
  if (outputN) {
    try {
      const nd = await get(`/api/integration/flowNode/getNodeDetail?processId=${processId}&nodeId=${outputN.id}&flowNodeType=21`);
      if (nd.status === 1 && nd.data && nd.data.controls) {
        outputs = nd.data.controls
          .filter(c => c.processVariableType !== 1) // exclude response-header fields
          .map(c => ({ name: c.controlName, type: typeName(c.type) }));
      }
    } catch { /* leave empty */ }
  }

  return { url, method, inputs, outputs };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN)      fail('AUTH_MISSING', '请设置 DEDLION_TOKEN 环境变量（md_pss_id cookie 值）');
  if (!COMPANY_ID) fail('AUTH_MISSING', '请设置 DEDLION_COMPANY_ID 环境变量（currentProjectId 值）');

  const params = await getInput();
  const { listConnects, connect, search, detail } = params;

  // 1. Get all connections
  const connections = await getConnections();

  // 2. Filter connections by name
  const filtered = connect
    ? connections.filter(c => c.name.includes(connect))
    : connections;

  if (listConnects) {
    out({ success: true, total: filtered.length, connections: filtered.map(c => ({
      id: c.id, name: c.name, description: c.explain || '', apiCount: c.apiCount,
    }))});
    return;
  }

  // 3. Fetch APIs for each connection
  const result = [];
  for (const conn of filtered) {
    const apis = await getApiList(conn.id);

    // Filter by search keyword
    const matchedApis = search
      ? apis.filter(a => a.name.includes(search))
      : apis;

    const apiList = [];
    for (const api of matchedApis) {
      const entry = {
        id:      api.id,
        name:    api.name,
        enabled: !!api.enabled,
      };

      if (detail) {
        try {
          const d = await getApiDetail(api.id);
          if (d) {
            entry.url     = d.url;
            entry.method  = d.method;
            entry.inputs  = d.inputs;
            entry.outputs = d.outputs;
          }
        } catch {
          // Skip detail on error, still include basic info
        }
      }
      apiList.push(entry);
    }

    if (matchedApis.length > 0 || !search) {
      result.push({
        id:          conn.id,
        name:        conn.name,
        description: conn.explain || '',
        apiCount:    conn.apiCount,
        apis:        apiList,
      });
    }
  }

  out({ success: true, total: result.length, connections: result });
}

function out(data) { process.stdout.write(JSON.stringify(data, null, 2) + '\n'); }
function fail(code, message) {
  out({ success: false, error: { code, message } });
  process.exit(1);
}

main().catch(e => fail('FETCH_ERROR', e.message));
