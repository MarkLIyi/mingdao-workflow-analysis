# MongoDB 直写明道云数据库规范

> 来源：kuajing-pipeline 项目实践总结（2026-03-30）
> 适用：明道云私有部署环境，通过 MongoDB 直连绕过 V3 API 进行高性能读写

---

## 1. 系统字段规范

### INSERT 必须字段

MongoDB 直写新增记录时，必须包含以下系统字段，否则明道云前端会"服务异常"：

```javascript
import { randomUUID } from "node:crypto";

const MD_ACCOUNT_ID = "8dde83ca-a99a-400d-84bd-5dbec5c87cfb"; // 真实存在的明道云用户 AccountID

function mdSysInsert(wsid) {
  const now = new Date();
  return {
    rowid: randomUUID(),          // 行 ID，UUID v4 格式字符串
    status: 1,                    // 1=正常, 0=软删除
    wsid,                         // 目标工作表 ID（不含 ws 前缀）
    ctime: now,                   // 创建时间，必须是 Date 对象
    utime: now,                   // 更新时间，必须是 Date 对象
    caid: MD_ACCOUNT_ID,          // 创建人，必须是明道云中真实存在的用户 AccountID
    uaid: MD_ACCOUNT_ID,          // 更新人
    ownerid: MD_ACCOUNT_ID,       // 拥有者
    users: [MD_ACCOUNT_ID],       // 关联用户列表
    owners: [MD_ACCOUNT_ID],      // 拥有者列表
    sharerange: 2,                // 共享范围，Number 类型（不是字符串）
    autoid: 0,                    // 自增 ID
  };
}
```

### UPDATE 必须更新的字段

```javascript
function mdSysUpdate() {
  return {
    utime: new Date(),            // 更新时间
    uaid: MD_ACCOUNT_ID,          // 更新人
  };
}
```

### 系统字段详解

| 字段 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `rowid` | String (UUID) | INSERT | 行唯一标识，明道云前端/API 用此字段定位记录 |
| `status` | Number | INSERT | 1=正常 0=软删除，明道云所有查询默认 `status:1` |
| `wsid` | String | INSERT | 工作表 ID（与集合名去掉 `ws` 前缀一致） |
| `ctime` | Date | INSERT | 创建时间，必须 Date 对象，字符串会导致排序异常 |
| `utime` | Date | INSERT/UPDATE | 更新时间，每次更新必须刷新 |
| `caid` | String | INSERT | 创建人 AccountID，必须是平台中真实用户 |
| `uaid` | String | INSERT/UPDATE | 更新人 AccountID |
| `ownerid` | String | INSERT | 记录拥有者，影响权限判断 |
| `users` | Array | INSERT | 关联用户 ID 列表 |
| `owners` | Array | INSERT | 拥有者 ID 列表 |
| `sharerange` | Number | INSERT | 共享范围，值为数字 2（不是字符串 "2"） |
| `autoid` | Number | INSERT | 自增 ID，新增时设 0 |

**关键：`caid`/`uaid`/`ownerid` 必须是真实存在的用户 ID。** 写 `"user-api"` 等虚构值会导致前端打开记录详情时报"服务异常"。

---

## 2. 数据字段名规则

### 必须使用控制 ID，不能用 alias

明道云 MongoDB 中的数据字段以**控制 ID**（24 位十六进制字符串）为 key：

```javascript
// ✅ 正确：使用控制 ID
{ "69c4e0cf9d794fff1992ee29": "CW7309-090" }

// ❌ 错误：使用 alias
{ "huohao": "CW7309-090" }
```

### 获取 alias → controlId 映射

通过明道云前端 API 获取字段定义：

```bash
curl -s -X POST 'https://www.dedlion.com/wwwapi/Worksheet/GetWorksheetBaseInfo' \
  -H 'AccountId: {AccountID}' \
  -H 'Authorization: md_pss_id {token}' \
  -H 'Content-Type: application/json' \
  --data '{"worksheetId":"工作表ID","getViews":true,"getTemplate":true}'
```

字段映射在响应的 `data.template.controls` 数组中：
```json
{
  "controlId": "69c4e0cf9d794fff1992ee29",
  "controlName": "货号",
  "alias": "huohao",
  "type": 2
}
```

### V3 API 也可以获取字段定义

```bash
curl -s -X GET 'https://www.dedlion.com/api/v3/app/worksheets/{worksheetId}' \
  -H 'HAP-Appkey: {appkey}' \
  -H 'HAP-Sign: {sign}'
```

---

## 3. 字段类型匹配

| 明道云字段类型 | type 值 | MongoDB 存储类型 | 错误示例 |
|---|---|---|---|
| 文本 | 2 | String | - |
| 数值 | 6 | Number | ❌ String `"100"` |
| 日期时间 | 16 | **Date 对象** | ❌ String `"2026-03-30 08:00"` |
| 选项（单选/多选） | 11 | String（选项 key UUID） | - |
| 用户字段 | 26 | String（AccountID） | ❌ 虚构值 |
| sharerange | - | **Number** | ❌ String `"2"` |

### 日期字段特别重要

如果同一个字段混合存储了 Date 对象和字符串，明道云前端排序会完全错乱：

```javascript
// ✅ 正确
{ "692ba061be2ffd8cd27fdcdf": new Date("2026-03-30T08:00:00+08:00") }

// ❌ 错误：字符串格式
{ "692ba061be2ffd8cd27fdcdf": "2026-03-30 08:00:00" }
```

字符串转 Date 的安全方式：
```javascript
const dateStr = "2026-03-30 08:00:00"; // 中国时间
const dateObj = new Date(dateStr.replace(" ", "T") + "+08:00");
```

---

## 4. 常见错误与排查

| 前端表现 | MongoDB 原因 | 排查方法 |
|---|---|---|
| 列表正常但点开详情"服务异常" | `caid`/`ownerid` 不是真实用户 ID | `db.collection.findOne({rowid:"xxx"})` 看 caid 值 |
| 排序错乱 | 日期字段存了 String 而非 Date | `db.collection.find({字段:{$type:"string"}}).count()` |
| 列表有行但字段全空 | 用了 alias 而非 controlId | 检查字段 key 是否为 24 位 hex |
| 记录的"日志"tab 无操作记录 | MongoDB 直写不产生审计日志 | 正常现象，需通过 V3 API 写才有日志 |
| 新增的记录在列表看不到 | 缺少 `wsid` 或 `status` 字段 | 检查文档是否有 wsid 和 status=1 |
| 筛选/统计不准确 | 缺少 `keywords` 等索引字段 | 对比 V3 写入的文档结构 |

---

## 5. 完整使用示例

### 批量新增记录

```javascript
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";

const MD_ACCOUNT_ID = "8dde83ca-a99a-400d-84bd-5dbec5c87cfb";
const WSID = "69c4e0cf9d794fff1992ee1e"; // 工作表 ID
const COLLECTION = "ws" + WSID;           // MongoDB 集合名

function mdSysInsert(wsid) {
  const now = new Date();
  return {
    rowid: randomUUID(), status: 1, wsid,
    ctime: now, utime: now,
    caid: MD_ACCOUNT_ID, uaid: MD_ACCOUNT_ID, ownerid: MD_ACCOUNT_ID,
    sharerange: 2, autoid: 0,
    users: [MD_ACCOUNT_ID], owners: [MD_ACCOUNT_ID],
  };
}

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const db = client.db("mdwsrows");

const docs = items.map(item => ({
  ...mdSysInsert(WSID),
  "69c4e0cf9d794fff1992ee29": item.huohao,      // 控制 ID
  "69c4e0cf9d794fff1992ee34": Number(item.price), // 数值类型
  "69c4e0cf9d794fff1992ee55": new Date(),          // 日期类型
}));

await db.collection(COLLECTION).insertMany(docs, { ordered: false });
```

### 批量更新记录

```javascript
function mdSysUpdate() {
  return { utime: new Date(), uaid: MD_ACCOUNT_ID };
}

const ops = rowIds.map(rowid => ({
  updateOne: {
    filter: { rowid },
    update: { $set: {
      "692ba061be2ffd8cd27fdcdf": new Date(),  // 日期字段用 Date 对象
      "693f6477be2ffd8cd24b311d": 12345,        // 数值字段用 Number
      ...mdSysUpdate(),                          // 更新 utime + uaid
    }},
  },
}));

await db.collection(COLLECTION).bulkWrite(ops, { ordered: false });
```

### 软删除记录

```javascript
await db.collection(COLLECTION).updateOne(
  { rowid: targetRowId },
  { $set: { status: 0, ...mdSysUpdate() } },
);
```

---

## 6. 数据修复方法

### 修复缺少系统字段的记录

```javascript
const ACCOUNT = "8dde83ca-a99a-400d-84bd-5dbec5c87cfb";

// 找到所有直写的记录（没有 wsid）
await collection.updateMany(
  { wsid: { $exists: false } },
  { $set: {
    wsid: "工作表ID",
    caid: ACCOUNT, uaid: ACCOUNT, ownerid: ACCOUNT,
    users: [ACCOUNT], owners: [ACCOUNT],
    sharerange: 2,
  }},
);
```

### 修复 caid/ownerid 为虚构值

```javascript
await collection.updateMany(
  { $or: [{ caid: "user-api" }, { ownerid: "user-api" }, { ownerid: "user-undefined" }] },
  { $set: {
    caid: ACCOUNT, uaid: ACCOUNT, ownerid: ACCOUNT,
    users: [ACCOUNT], owners: [ACCOUNT], sharerange: 2,
  }},
);
```

### 修复字符串日期为 Date 对象

```javascript
const FIELD = "692ba061be2ffd8cd27fdcdf"; // 执行时间字段
const docs = await collection.find({ [FIELD]: { $type: "string" } }).toArray();
const ops = docs.map(d => ({
  updateOne: {
    filter: { _id: d._id },
    update: { $set: { [FIELD]: new Date(d[FIELD].replace(" ", "T") + "+08:00") } },
  },
}));
if (ops.length > 0) await collection.bulkWrite(ops, { ordered: false });
```

### 修复 alias 字段名为控制 ID

```javascript
const ALIAS_MAP = {
  "huohao": "69c4e0cf9d794fff1992ee29",
  "action_type": "69c4e0cf9d794fff1992ee4b",
  // ... 完整映射
};

const docs = await collection.find({ wsid: { $exists: false } }).toArray();
const ops = docs.map(doc => {
  const setFields = {};
  const unsetFields = {};
  for (const [alias, controlId] of Object.entries(ALIAS_MAP)) {
    if (doc[alias] !== undefined) {
      setFields[controlId] = doc[alias];
      unsetFields[alias] = "";
    }
  }
  return { updateOne: { filter: { _id: doc._id }, update: { $set: setFields, $unset: unsetFields } } };
});
await collection.bulkWrite(ops, { ordered: false });
```

---

## 7. V3 API vs MongoDB 直写对比

| 维度 | V3 API | MongoDB 直写 |
|---|---|---|
| **写入速度** | ~200ms/条（HTTP 请求） | ~1ms/条（bulkWrite） |
| **批量性能** | 50 条/批，有 sleep 间隔 | 1000+ 条/批，无间隔 |
| **系统字段** | 自动补全（caid/ctime 等） | **需手动补全** |
| **操作日志** | 自动生成（前端可查） | **无**（绕过应用层） |
| **字段名** | 支持 alias 和 controlId | **必须用 controlId** |
| **类型转换** | 自动（字符串→Date/Number） | **需手动确保正确类型** |
| **频率限制** | 有（V3 API 限频） | 无 |
| **前端兼容** | 完全兼容 | 需补全系统字段才兼容 |
| **适用场景** | 少量写入（<100 条） | **批量写入（100+ 条）** |
| **工作流触发** | 可配置触发 | **不触发工作流** |

### 选择建议

| 场景 | 推荐方式 |
|---|---|
| 归档/日志类大批量写入 | MongoDB 直写 |
| 用户可见的业务表少量更新 | V3 API |
| 高频状态回写（100+条/轮） | MongoDB 直写 |
| 需要审计日志的操作 | V3 API |
| 读操作（任何场景） | MongoDB 直连（最快） |

---

## 8. MongoDB 集合命名规则

明道云的 MongoDB 集合名 = `ws` + 工作表 ID：

```
工作表 ID: 69c4e0cf9d794fff1992ee1e
集合名:    ws69c4e0cf9d794fff1992ee1e
数据库名:  mdwsrows
```

连接字符串格式：
```
mongodb://user:pass@host:27017/mdwsrows?authSource=admin
```
