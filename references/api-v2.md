---
name: mingdao-api-v2
description: |
  明道云 API V2 工作表操作技能。提供 getFilterRows、addRow、editRow、deleteRow 等接口的使用方法和参数说明。
  适用于：查询工作表记录、新增/更新/删除记录、批量操作。比 MCP 更稳定，推荐用于生产环境。
  触发关键词：明道云API、V2接口、getFilterRows、工作表查询、明道云直接请求
version: 1.0.0
---

# 明道云 API V2 工作表操作

## 概述

明道云私有部署（PD）版本的 HTTP REST API，用于工作表数据的增删改查。相比 MCP 协议，API V2 更稳定可靠，推荐在生产脚本中使用。

## 基础信息

| 项目 | 值 |
|---|---|
| Base URL | `https://www.dedlion.com/api/v2/open/worksheet` |
| 请求方式 | POST（所有接口） |
| Content-Type | `application/json` |
| 鉴权 | body 中传 `appKey` + `sign` |

## 鉴权参数

每个请求的 body 中必须包含：

```json
{
  "appKey": "应用授权的 AppKey",
  "sign": "应用授权的 Sign（BASE64 编码）"
}
```

**已有应用的鉴权信息：**

| 应用 | AppKey | 用途 |
|---|---|---|
| 业务 (BIZ) | `1af545f1203db0e1` | 账户表、任务表 |
| 原始数据 (DATA) | `681a78e1b8c72330` | 比价数据、挂售表、SKU 信息 |

Sign 值较长，存放在环境变量或 memory 中，参见 `reference_credentials.md`。

---

## 接口一览

### 1. getFilterRows — 分页查询记录

**URL**: `POST /api/v2/open/worksheet/getFilterRows`

**请求参数**:

```json
{
  "appKey": "string",
  "sign": "string",
  "worksheetId": "工作表ID",
  "viewId": "视图ID（可选，不传返回全部）",
  "pageSize": 1000,
  "pageIndex": 1,
  "sortId": "排序字段ID（可选）",
  "isAsc": true,
  "filters": [
    {
      "controlId": "字段ID",
      "dataType": 2,
      "spliceType": 1,
      "filterType": 1,
      "value": "精确值"
    }
  ]
}
```

**filters 参数说明**:

| 参数 | 说明 |
|---|---|
| `controlId` | 字段 ID |
| `dataType` | 字段类型编号：2=文本, 6=数值, 11=下拉, 16=日期, 26=成员, 29=关联记录 |
| `spliceType` | 拼接方式：1=AND, 2=OR |
| `filterType` | 筛选方式 |
| `value` | 单值匹配（文本/数值） |
| `values` | 多值匹配（下拉/多选用数组） |

**常用 filterType**:

| filterType | 含义 | 适用类型 |
|---|---|---|
| 1 | 等于 | 文本、数值 |
| 2 | 等于（选项） | 下拉、多选（用 `values` 数组） |
| 3 | 包含 | 文本 |
| 4 | 不包含 | 文本 |
| 5 | 不等于 | 文本、数值 |
| 6 | 为空 | 所有类型 |
| 7 | 不为空 | 所有类型 |
| 11 | 在范围内 | 数值 |
| 13 | 大于 | 数值 |
| 14 | 大于等于 | 数值 |
| 15 | 小于 | 数值 |
| 16 | 小于等于 | 数值 |

**返回格式**:

```json
{
  "data": {
    "rows": [
      {
        "rowid": "uuid",
        "ctime": "2026-01-01 12:00:00",
        "字段别名": "值",
        ...
      }
    ],
    "total": 1259
  },
  "success": true,
  "error_code": 1
}
```

> **注意**: 返回的字段 key 是**字段别名**（如 `sell_id`、`price`），不是字段 ID。

**Node.js 示例**:

```javascript
async function getFilterRows({ worksheetId, filters = [], pageSize = 1000, pageIndex = 1 }) {
  const res = await fetch("https://www.dedlion.com/api/v2/open/worksheet/getFilterRows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appKey: "681a78e1b8c72330",
      sign: "M2NkZGZi...(完整sign)...OQ==",
      worksheetId,
      pageSize,
      pageIndex,
      filters,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`API error: ${data.error_code}`);
  return { rows: data.data.rows, total: data.data.total };
}

// 示例：查询挂售表中业务类型=外贸且账户=xxx的记录
const { rows, total } = await getFilterRows({
  worksheetId: "6937d2e8be2ffd8cd2532a58",
  filters: [
    { controlId: "6937d4d5be2ffd8cd2533ef4", dataType: 11, spliceType: 1, filterType: 2, values: ["d2e77cbc-af63-48b2-a648-5739dea611e1"] },
    { controlId: "669f0dde7d6fcbb32e64cfd5", dataType: 2, spliceType: 1, filterType: 1, value: "account@example.com" },
  ],
});
```

---

### 2. addRow — 新增单条记录

**URL**: `POST /api/v2/open/worksheet/addRow`

```json
{
  "appKey": "string",
  "sign": "string",
  "worksheetId": "工作表ID",
  "controls": [
    { "controlId": "字段ID", "value": "值" }
  ],
  "triggerWorkflow": true
}
```

**controls 字段值格式**:

| 字段类型 | value 格式 |
|---|---|
| 文本框 | `"字符串"` |
| 数值 | `"123.45"`（字符串形式的数字） |
| 下拉(单选) | `"选项key"`（如 `"d2e77cbc-..."`) |
| 多选 | `'["key1","key2"]'`（JSON 字符串） |
| 日期 | `"2026-01-01 12:00:00"` |
| 关联记录 | `"rowId1,rowId2"`（逗号分隔） |

---

### 3. editRow — 更新单条记录

**URL**: `POST /api/v2/open/worksheet/editRow`

```json
{
  "appKey": "string",
  "sign": "string",
  "worksheetId": "工作表ID",
  "rowId": "记录ID",
  "controls": [
    { "controlId": "字段ID", "value": "新值" }
  ],
  "triggerWorkflow": false
}
```

---

### 4. deleteRow — 删除记录

**URL**: `POST /api/v2/open/worksheet/deleteRow`

```json
{
  "appKey": "string",
  "sign": "string",
  "worksheetId": "工作表ID",
  "rowId": "记录ID"
}
```

---

### 5. 批量操作

#### addRows — 批量新增

**URL**: `POST /api/v2/open/worksheet/addRows`

```json
{
  "appKey": "string",
  "sign": "string",
  "worksheetId": "工作表ID",
  "rows": [
    { "controls": [{ "controlId": "字段ID", "value": "值" }] },
    { "controls": [{ "controlId": "字段ID", "value": "值" }] }
  ],
  "triggerWorkflow": false
}
```

#### editRows — 批量更新

**URL**: `POST /api/v2/open/worksheet/editRows`

```json
{
  "appKey": "string",
  "sign": "string",
  "worksheetId": "工作表ID",
  "rows": [
    { "rowId": "id1", "controls": [{ "controlId": "字段ID", "value": "值" }] },
    { "rowId": "id2", "controls": [{ "controlId": "字段ID", "value": "值" }] }
  ],
  "triggerWorkflow": false
}
```

#### deleteRows — 批量删除

**URL**: `POST /api/v2/open/worksheet/deleteRows`

```json
{
  "appKey": "string",
  "sign": "string",
  "worksheetId": "工作表ID",
  "rowIds": ["id1", "id2", "id3"]
}
```

---

## 分页查询模板

完整的分页拉取全量数据模板：

```javascript
async function fetchAll(worksheetId, filters = []) {
  const allRows = [];
  let pageIndex = 1;

  while (true) {
    const { rows } = await getFilterRows({ worksheetId, filters, pageSize: 1000, pageIndex });
    allRows.push(...rows);
    if (rows.length < 1000) break;
    pageIndex++;
    await new Promise(r => setTimeout(r, 200)); // 防频率限制
  }

  return allRows;
}
```

---

## MCP vs API V2 对比

| 特性 | MCP | API V2 |
|---|---|---|
| 稳定性 | 大数据量时不稳定 | 稳定 |
| 返回字段 key | 字段 ID | 字段别名 |
| 鉴权 | URL 参数 | body 参数 |
| 连接状态 | 有状态（需 init） | 无状态 |
| 批量写入 | 支持 | 支持 |
| 推荐场景 | AI 交互、小量查询 | 生产脚本、批量操作 |

---

## 常见工作表 ID 速查

| 工作表 | ID | 所属应用 |
|---|---|---|
| 挂售表-新逻辑 | `6937d2e8be2ffd8cd2532a58` | 原始数据 |
| 比价数据 | `6290caed1e00e6d0665284c4` | 原始数据 |
| 执行任务-执行 | `6936448bbe2ffd8cd232ab96` | 原始数据 |
| 执行任务-历史 | `693679c2be2ffd8cd236a001` | 原始数据 |
| 账户表 | `626e7072507936edabc2b74c` | 业务 |
| 跨境校准ID数据 | `6938ff23be2ffd8cd267212e` | 原始数据 |
| 跨境无法鉴定货号 | `693a61bcbe2ffd8cd27f4d8c` | 原始数据 |

---

## 注意事项

1. **pageSize 上限**: 单页最多 1000 条，超过需分页
2. **频率限制**: 建议请求间隔 200ms+，避免被限流
3. **超时**: 建议设置 30s 超时，大表查询可能较慢
4. **triggerWorkflow**: 批量写入时建议设为 `false`，避免触发大量工作流
5. **字段别名 vs ID**: API V2 返回用别名，MCP 返回用 ID。写入时统一用 `controlId`（字段 ID）
