# 明道云 V3 API 操作参考

> Base URL: `https://www.dedlion.com/api/v3`
> 所有响应 HTTP 200，通过 `success` 和 `error_code` 判断成功。

## 认证

两个应用的 AppKey/Sign：

### 业务应用（外贸订单/跨境订单/跨境采购/账号优惠券/各类配置项/外贸账号）
```
HAP-Appkey: 1af545f1203db0e1
HAP-Sign: MmY4Nzk5NWIxNmQwOWE0NzFjZDNmNjJlYzUyNzJjNmUzYWY0YmM1YTQwZDdlYmUwNTQ1ODYxODExOTU1N2MxNg==
应用ID: b6ad1e87-74b2-4548-be3c-b2e92f5ce36e
```

### 原始数据应用（任务锁/芝麻代理/比价数据）
```
HAP-Appkey: 681a78e1b8c72330
HAP-Sign: M2NkZGZiMmM5OWIyMTUxMDQ4N2Y2YTAwZTMxNDJmM2Q3NWI5ZmU4MGU4ZDcxZjlhYWI1ZTUyOWJmNDgxYWU2OQ==
应用ID: d17e52e1-35dc-4037-b1c2-da1f8509d71e
```

---

## CRUD 操作

### 查询行记录列表

```
POST /api/v3/app/worksheets/{worksheet_id}/rows/list
Content-Type: application/json
HAP-Appkey: {appkey}
HAP-Sign: {sign}

Body:
{
  "pageSize": 50,        // 1-1000
  "pageIndex": 1,
  "filter": { ... },     // 筛选器，见下方
  "sorts": [{"field": "字段ID", "isAsc": true}],
  "fields": ["字段ID1", "字段ID2"],  // 可选，指定返回字段
  "includeTotalCount": true,
  "includeSystemFields": false
}

Response:
{
  "success": true,
  "error_code": 1,
  "data": {
    "rows": [
      {
        "rowId": "uuid",
        "字段ID": "值",
        "下拉字段ID": [{"key": "选项key", "value": "选项文本"}],
        ...
      }
    ],
    "total": 100
  }
}
```

### 获取单条行记录

```
GET /api/v3/app/worksheets/{worksheet_id}/rows/{row_id}
HAP-Appkey: {appkey}
HAP-Sign: {sign}

Response:
{
  "success": true,
  "data": {
    "id": "row_id",
    "字段ID": "值",
    ...
  }
}
```

### 新建行记录

```
POST /api/v3/app/worksheets/{worksheet_id}/rows
Content-Type: application/json

Body:
{
  "fields": [
    {"id": "字段ID", "value": "文本值"},
    {"id": "数值字段", "value": "123"},
    {"id": "下拉字段", "value": "选项key"},           // 单选用key字符串
    {"id": "多选字段", "value": ["key1", "key2"]},     // 多选用key数组
    {"id": "日期字段", "value": "2026-03-27 12:00:00"},
    {"id": "关联字段", "value": ["关联记录rowId"]},
    {"id": "附件字段", "value": [{"name": "文件名.jpg", "url": "https://..."}]}
  ],
  "triggerWorkflow": false  // 是否触发工作流
}

Response:
{
  "success": true,
  "data": {"id": "新记录rowId"}
}
```

### 更新行记录

```
PATCH /api/v3/app/worksheets/{worksheet_id}/rows/{row_id}
Content-Type: application/json

Body:
{
  "fields": [
    {"id": "字段ID", "value": "新值"}
  ],
  "triggerWorkflow": false
}

Response:
{
  "success": true,
  "data": "row_id"
}
```

### 删除行记录

```
DELETE /api/v3/app/worksheets/{worksheet_id}/rows/{row_id}
Content-Type: application/json

Body:
{
  "triggerWorkflow": false,
  "permanent": false
}
```

### 批量更新

```
PATCH /api/v3/app/worksheets/{worksheet_id}/rows/batch
Content-Type: application/json

Body:
{
  "rowIds": ["id1", "id2"],
  "fields": [{"id": "字段ID", "value": "值"}],
  "triggerWorkflow": false
}
```

### 批量删除

```
DELETE /api/v3/app/worksheets/{worksheet_id}/rows/batch
Content-Type: application/json

Body:
{
  "rowIds": ["id1", "id2"],
  "triggerWorkflow": false,
  "permanent": false
}
```

---

## 筛选器格式

### 简单条件
```json
{
  "type": "condition",
  "field": "字段ID或alias",
  "operator": "eq",
  "value": "文本值"
}
```

### 组合条件（AND/OR）
```json
{
  "type": "group",
  "logic": "AND",
  "children": [
    {"type": "condition", "field": "f1", "operator": "eq", "value": "v1"},
    {"type": "condition", "field": "f2", "operator": "gt", "value": "0"}
  ]
}
```

### 运算符

| 运算符 | 说明 | 值格式 |
|--------|------|--------|
| eq | 等于 | 字符串 |
| ne | 不等于 | 字符串 |
| gt | 大于 | 字符串/数字 |
| ge | 大于等于 | 字符串/数字 |
| lt | 小于 | 字符串/数字 |
| le | 小于等于 | 字符串/数字 |
| in | 是其中一个 | 数组 `["v1","v2"]` |
| notin | 不是任意一个 | 数组 |
| contains | 包含 | 字符串 |
| notcontains | 不包含 | 字符串 |
| concurrent | 同时包含 | 数组 |
| belongsto | 属于 | 字符串 |
| notbelongsto | 不属于 | 字符串 |
| startswith | 开头是 | 字符串 |
| notstartswith | 开头不是 | 字符串 |
| endswith | 结尾是 | 字符串 |
| notendswith | 结尾不是 | 字符串 |
| between | 在范围内 | `["min","max"]` |
| notbetween | 不在范围内 | `["min","max"]` |
| isempty | 为空 | 无需value |
| isnotempty | 不为空 | 无需value |

### 筛选器规则

- 最多支持两层嵌套（`group -> group -> condition`）
- 一个 group 的 children 只能全是 group 或全是 condition，不能混合
- 特殊 AccountID: `user-self`(当前用户), `user-sub`(下属), `user-workflow`(工作流), `user-api`(API)

### 下拉/选项字段筛选

**关键**: 选项字段（Dropdown/SingleSelect/MultipleSelect）必须用 **option key**（UUID）筛选，不能用文本值。

```json
// 正确 ✅
{"type": "condition", "field": "采购状态ID", "operator": "in", "value": ["3117f38e-c769-4dee-ad5b-f675a030cf98"]}

// 错误 ❌
{"type": "condition", "field": "采购状态ID", "operator": "eq", "value": "等待采购"}
```

### 响应中的下拉字段格式

返回的下拉字段值是数组格式：
```json
"fieldId": [{"key": "3117f38e-...", "value": "等待采购"}]
```

读取时需要取 `[0].key` 或 `[0].value`。

---

## V3 字段类型对照表

| Type | Code | 描述 | 允许API创建 | 允许API查询 |
|------|------|------|:-----------:|:-----------:|
| Text | 2 | 文本 | ✓ | ✓ |
| PhoneNumber | 3 | 手机 | - | ✓ |
| LandlinePhone | 4 | 座机 | - | ✓ |
| Email | 5 | 邮箱 | - | ✓ |
| Number | 6 | 数值 | ✓ | ✓ |
| Certificate | 7 | 证件 | - | ✓ |
| Currency | 8 | 金额 | - | ✓ |
| SingleSelect | 9 | 单选 | ✓ | ✓ |
| MultipleSelect | 10 | 多选 | ✓ | ✓ |
| Dropdown | 11 | 下拉 | - | ✓ |
| Attachment | 14 | 附件 | ✓ | ✓ |
| Date | 15 | 日期 | ✓ | ✓ |
| DateTime | 16 | 时间 | ✓ | ✓ |
| Region | 19/23/24 | 地区 | - | ✓ |
| DynamicLink | 21 | 自由链接 | - | ✓ |
| Divider | 22 | 分段 | - | - |
| AmountInWords | 25 | 大写金额 | - | ✓ |
| Collaborator | 26 | 成员 | ✓ | ✓ |
| Department | 27 | 部门 | - | ✓ |
| Rating | 28 | 等级 | - | ✓ |
| Relation | 29 | 关联记录 | ✓ | ✓ |
| Lookup | 30 | 他表字段 | - | ✓ |
| Formula | 31 | 公式 | - | ✓ |
| Concatenate | 32 | 文本拼接 | - | ✓ |
| AutoNumber | 33 | 自动编号 | - | ✓ |
| SubTable | 34 | 子表 | - | ✓ |
| CascadingSelect | 35 | 级联选择 | - | ✓ |
| Checkbox | 36 | 检查框 | - | ✓ |
| Rollup | 37 | 汇总 | - | ✓ |
| DateFormula | 38 | 公式（日期） | - | ✓ |
| CodeScan | 39 | 扫码 | - | ✓ |
| Location | 40 | 定位 | - | ✓ |
| RichText | 41 | 富文本 | - | ✓ |
| Signature | 42 | 签名 | - | ✓ |
| OCR | 43 | 文字识别 | - | ✓ |
| Role | 44 | 角色 | - | ✓ |
| Embed | 45 | 嵌入 | - | - |
| Time | 46 | 时间 | ✓ | ✓ |
| Barcode | 47 | 条码 | - | ✓ |
| OrgRole | 48 | 组织角色 | - | ✓ |
| Button | 49 | API查询(按钮) | - | - |
| APIQuery | 50 | API查询(下拉) | - | - |
| QueryRecord | 51 | 查询记录 | - | - |
| Section | 52 | 标签页 | - | - |
| FunctionFormula | 53 | 函数公式 | - | ✓ |
| Array | 10000003 | 数组 (工作流) | - | - |
| Object | 10000006 | 对象 (工作流) | - | - |
| SimpleArray | 10000007 | 普通数组 (工作流) | - | - |
| ObjectArray | 10000008 | 对象数组 (工作流) | - | - |

---

## 字段值写入格式

| 字段类型 | 写入value格式 | 示例 |
|----------|--------------|------|
| Text(2) | 字符串 | `"hello"` |
| Number(6) | 字符串数字 | `"12345"` |
| Dropdown(11) | 选项key | `"3117f38e-..."` |
| MultiSelect(10) | key数组 | `["k1","k2"]` |
| Date(15) | 日期字符串 | `"2026-03-27"` |
| DateTime(16) | 日期时间 | `"2026-03-27 12:00:00"` |
| Relation(29) | rowId数组 | `["rowId1"]` |
| Attachment(14) | 文件数组 | `[{"name":"a.jpg","url":"..."}]` |
| Checkbox(36) | `"1"`或`"0"` | `"1"` |
| Collaborator(26) | 成员accountId数组 | `["accountId1"]` |
| RichText(41) | HTML字符串 | `"<p>内容</p>"` |
| SubTable(34) | 子表行数组 | `[{"字段ID":"值"}]` |

---

## API 调用限制

| 接口类型 | 单个IP的QPS | 请求体大小 |
|----------|:-----------:|:----------:|
| addRow | 50 | 16MB |
| addRows（批量新增） | 50 | 16MB |
| editRow | 50 | 16MB |
| editRows（批量编辑） | 50 | 16MB |
| deleteRow | 50 | 16MB |
| getFilterRowsTotalNum | 50 | / |
| getFilterRows | 50 | / |
| 其他接口 | 不限制 | / |
| **私有部署** | **不限制** | **25MB** |

---

## 常见错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 失败 |
| 1 | 成功 |
| 51 | 请求限流 |
| 10000 | 拒绝访问，IP受限 |
| 10001 | 参数错误 |
| 10002 | 参数值错误 |
| 10005 | 数据操作无权限 |
| 10006 | 数据已存在 |
| 10007 | 数据不存在或已删除 |
| 10101 | 令牌不存在 |
| 10102 | 签名不合法 |
| 10105 | 用户访问令牌失效 |
| 100005 | 字段值重复 |
| 100006 | 选项数量已达上限 |
| 100007 | 附件数量已达上限 |
| 430013 | 应用未找到工作表 |
| 430014 | 工作表字段权限不足 |
| 430017 | 应用附件上传量不足 |
| 430019 | 必填字段值为空 |
| 430020 | 子表数据错误 |
| 430021 | 数据不满足业务规则 |
| 430022 | 工作表不存在 |
| 90000 | 请求次数超出限制 |
| 99999 | 数据操作异常 |

---

## Node.js 调用模板

```javascript
const BASE_URL = "https://www.dedlion.com/api/v3";

async function v3Request(method, path, body, appKey, sign) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      "HAP-Appkey": appKey,
      "HAP-Sign": sign,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30000),
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.success) throw new Error(`V3 API Error: ${data.error_code} - ${data.error_msg}`);
  return data.data;
}

// 查询
async function queryRows(wsId, filter, sorts, pageSize, appKey, sign) {
  return v3Request("POST", `/app/worksheets/${wsId}/rows/list`, {
    pageSize: pageSize || 50,
    pageIndex: 1,
    filter,
    sorts,
    includeTotalCount: true,
  }, appKey, sign);
}

// 更新
async function updateRow(wsId, rowId, fields, appKey, sign) {
  return v3Request("PATCH", `/app/worksheets/${wsId}/rows/${rowId}`, {
    fields,
    triggerWorkflow: false,
  }, appKey, sign);
}

// 新增
async function createRow(wsId, fields, appKey, sign) {
  return v3Request("POST", `/app/worksheets/${wsId}/rows`, {
    fields,
    triggerWorkflow: false,
  }, appKey, sign);
}

// 删除
async function deleteRow(wsId, rowId, appKey, sign) {
  return v3Request("DELETE", `/app/worksheets/${wsId}/rows/${rowId}`, {
    triggerWorkflow: false,
    permanent: false,
  }, appKey, sign);
}
```
