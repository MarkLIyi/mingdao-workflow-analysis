# 跨境自动采购 — 业务配置与数据映射

## 两个应用的表分布

### 业务应用 (AppKey: `1af545f1203db0e1`)

| 表名 | 表ID | 用途 |
|------|------|------|
| 外贸账号 | `626e7072507936edabc2b74c` | 采购账号管理（积分/便利店） |
| 各类配置项 | `68679c3cc16ffef115013f8a` | 系统配置（store_pay_limit等） |
| 跨境订单 | `65ba14b6a63b37427cbd40f9` | 销售订单（待采购的源数据） |
| 跨境采购 | `65ba14b6a63b37427cbd40f7` | 采购记录（支付成功后回写） |
| 账号优惠券 | `69706dee376f4eb1fca607ad` | 优惠券管理 |

### 原始数据应用 (AppKey: `681a78e1b8c72330`)

| 表名 | 表ID | 用途 |
|------|------|------|
| 任务锁 | `64b0afb1b973e9c378b0b17c` | 防止并发执行 |
| 芝麻代理 | `63edb8ac1c190a21fe376ad3` | 日本代理IP |
| 比价数据 | `6290caed1e00e6d0665284c4` | SNK商品信息（snk_id, 尺码映射） |

---

## 关键字段ID映射

### 任务锁 (`64b0afb1b973e9c378b0b17c`) — 原始数据app

| 用途 | 字段ID | 字段名 | 类型 |
|------|--------|--------|------|
| 标题 | `64b0afb1b973e9c378b0b17d` | 名称 | Text |
| alias标识 | `64b0b01ab973e9c378b0b188` | alias | Text |
| 单次任务状态 | `64b0b01ab973e9c378b0b189` | 单次任务状态 | Dropdown |
| 流程开关 | `64d435ace53e47d293662c06` | 流程开关 | Dropdown |
| 执行开始时间 | `66e53cb5d7659ba366271cbf` | 执行开始时间 | DateTime |

**选项值**:
- 单次任务状态: `61ffb626-2dde-4699-95fe-91c263a3ddb0`=已结束, `50f295d7-8c7b-4864-bc98-49788573c0e7`=执行中
- 流程开关: `2e3f3433-6508-44c5-809f-264dc5c390ae`=开, `a9f1058e-ce59-4c78-a6bb-3a7253449e3f`=关

### 芝麻代理 (`63edb8ac1c190a21fe376ad3`) — 原始数据app

| 用途 | 字段ID | 字段名 |
|------|--------|--------|
| IP | `63edb8ac1c190a21fe376ad4` | IP |
| port | `63edb8de1c190a21fe376aee` | port |
| 国家 | `63edba351c190a21fe376b6b` | 国家 |
| snk价格请求状态 | `6688a0107d6fcbb32e2278dc` | snk价格请求状态 |

**筛选**: 国家 in ["国外"] AND snk价格请求状态 in ["正常"]

### 各类配置项 (`68679c3cc16ffef115013f8a`) — 业务app

| 用途 | 字段ID | 字段名 |
|------|--------|--------|
| 标识 | `68679c3cc16ffef115013f8b` | 标识 |
| 值 | `68679d1bc16ffef11501491e` | 值 |
| 数值 | `68679d7cc16ffef115014b57` | 数值 |
| 状态 | `68679e12c16ffef115014f27` | 状态 |

**关键配置项**:
- `auto_point_order` — 自动积分下单开关
- `store_pay_limit` — 便利店/积分的价格分界线
- `bld_auto_md` — 默认便利店门店

### 跨境订单 (`65ba14b6a63b37427cbd40f9`) — 业务app

| 用途 | 字段ID | 字段名 | 类型 |
|------|--------|--------|------|
| 订单ID | `67c06a153d0942df845d4097` | 订单ID | Text |
| 货号 | `626e71c7507936edabc2b799` | 货号 | Text |
| cm_Size | `626f851061435a2eff94b5ff` | cm_Size | Text |
| size_Number | `6281919961435a2eff9679a8` | size_Number | Text |
| eu_size | `6273caf961435a2eff950a65` | eu_size | Text |
| 订单状态 | `626f851061435a2eff94b601` | 订单状态 | Dropdown |
| 采购状态 | `65d2192da63b37427cbedc6f` | 采购状态 | Dropdown |
| 待定项 | `687d0c340d683e3e0ffaf728` | 待定项 | Dropdown |
| 预计采购价格 | `68427bc85a5d03e1cec34ece` | 预计采购价格 | Number |
| 采购账户 | `65f3070bda1329495761fccf` | 采购账户 | Text |
| 销售时间 | `626f851061435a2eff94b603` | 销售时间 | DateTime |
| 最晚发货时间 | `6848e0965a5d03e1ce10bea1` | 最晚发货时间 | DateTime |
| 自动下单备注 | `68ea3088be2ffd8cd2e8079c` | 自动下单备注 | Text |
| 采购支付方式 | `68ff0a88be2ffd8cd23610c5` | 采购支付方式 | Dropdown |
| 采购门店 | `687ddd3b0d683e3e0f0ea85d` | 采购门店 | Dropdown |
| global_sku_id | `66420c3b284a1075a89bbab1` | global_sku_id | Text |
| snk_id | `6846c26c08068ca22011ee58` | snk_id | Text |
| 预计利润 | `6848f6f55a5d03e1ce11c3b2` | 预计利润 | Number |
| 采购ID(关联) | `6275380561435a2eff954cfd` | 采购ID | Relation |

**订单状态选项**:
- `5d8e38f5-b3ad-4c86-b23c-9847d48ead27` = 待发货
- `099ac880-0c6c-4ec4-93cf-39c035b75f7b` = 卖家已发货
- `c6aba028-dd01-4af4-825a-688bbf944e21` = 待平台发货
- `3117f38e-c769-4dee-ad5b-f675a030cf98` = 交易成功

**采购状态选项**:
- `3117f38e-c769-4dee-ad5b-f675a030cf98` = 等待采购
- `2cbc0f21-6e74-4d22-8ca1-dcd28db1f507` = 已采购
- `0176fc22-1775-4735-8852-d63200b74544` = 待确认
- `0de98110-da1c-4636-80c5-a8bd65136e48` = 无需采购

**待定项选项**:
- `1af693d5-767c-434c-a9f1-9c544554466b` = 负利
- `319dea10-2cb9-4281-8caf-ea02f6fba29e` = 无货
- `58d9bc90-b143-4b69-bca4-d87188afbfb0` = 异常

**采购支付方式选项**:
- `778d2cbc-bfe4-4943-a44f-261f393cffb4` = 积分支付
- `915e4c02-52b5-4eee-85b6-5636d86768c6` = 便利店支付
- `ec9e1f99-343e-4042-ab52-b6bbd75d8670` = 积分+优惠卷支付
- `2c14e401-46ad-45ff-a65d-674b3006bc79` = 便利店+优惠卷支付

### 外贸账号 (`626e7072507936edabc2b74c`) — 业务app

| 用途 | 字段ID | 字段名 | 类型 |
|------|--------|--------|------|
| 账号 | `626e7072507936edabc2b74d` | 账号 | Text |
| 账号状态 | `626fc64661435a2eff94b675` | 账号状态 | Dropdown |
| cookie | `658795427b5d9928e78f6b58` | cookie | Text |
| 账号分类 | `62dab711cb70d36b42147b6c` | 账号分类 | Dropdown |
| 可下单状态 | `sfkxd` (alias) / 字段名 | 可下单状态 | Dropdown |
| 下单类型 | 需查 | 下单类型 | Dropdown |
| 可用优惠券 | `yhqsl` (alias) | 可用优惠券 | Number |
| 注册天数 | `syts` (alias) | 注册天数 | Number |
| 便利店参考金额 | `bldcgckje` (alias) | 便利店参考金额 | Number |
| 注册IP | 需查 | 注册IP | Text |
| 注册port | 需查 | 注册port | Text |
| 积分余额 | `jfye` (alias) | 积分余额 | Number |
| 使用最新下单时间 | `sycxdsj` (alias) | 使用最新下单时间 | DateTime |
| 优惠券使用数量 | `syyhqsl` (alias) | 使用优惠券数量 | Number |
| 支付异常信息 | `zfycxx` (alias) | 支付异常信息 | Text |

**账号状态选项**:
- `6ce938f3-f617-4185-9a6c-8dd8d742f724` = 使用中
- `bf4f4abe-3ba7-45ac-b2e2-1bc4a292862d` = 未使用

**账号分类选项**:
- `9fc6a458-dc9f-47e0-8cec-31403cb2c842` = 跨境采购
- `610de861-ac9f-4f0b-813d-d0f8f4734283` = 外贸销售

### 账号优惠券 (`69706dee376f4eb1fca607ad`) — 业务app

| 用途 | 字段ID | 字段名 |
|------|--------|--------|
| 账户名 | `69706dee376f4eb1fca607ae` | 账户 |
| 优惠券ID | `69706e0e376f4eb1fca609a6` | 优惠券ID |
| 金额 | `69706e0e376f4eb1fca609a7` | 金额 |
| 抵扣比例 | `69706f88376f4eb1fca61fab` | 抵扣比例 |
| 使用状态 | `697072a7376f4eb1fca646a2` | 使用状态 |
| 使用金额 | `697072a7376f4eb1fca646a3` | 使用金额 |
| 优惠券最大金额 | `69706f88376f4eb1fca61fad` | 优惠券最大金额(attrs) |

**使用状态选项**:
- `06dee053-9c86-414d-9866-ed353fe2cf78` = 未使用
- `8d46a777-e338-4440-afdd-ebba73bc0381` = 已使用

### 比价数据 (`6290caed1e00e6d0665284c4`) — 原始数据app

| 用途 | 字段ID | 字段名 |
|------|--------|--------|
| 得物货号 | `6290caed1e00e6d0665284c5` | 得物货号 |
| global_sku_id | `6290df071e00e6d06652882f` | global_sku_id |
| snk_id | `6290df071e00e6d066528831` | snk_id |
| cm_size | `6290df071e00e6d06652882e` | cm_size |
| size_number/size_id | `62ce1d1bd44b9632e51fd97b` | size_number/size_id |

---

## 外部API列表

所有SNK API通过代理服务 `http://xz.bmxgj.cn/sys/sell/commonMethod` 调用。

| API | 用途 | method | SNK URL 模板 |
|-----|------|--------|-------------|
| 鞋子listing | 查询鞋子尺码价格 | GET | `snkrdunk.com/v1/listing/{number}/sizes/{sizeNumber}` |
| 服饰listing | 查询非鞋子尺码价格 | GET | `snkrdunk.com/v1/apparels/{snkId}/sizes/{sizeId}/listings` |
| 买家手续费 | 获取commission | GET | `snkrdunk.com/v1/commission-rates/buyer?price=...` |
| 积分支付购买 | 积分下单 | POST | `snkrdunk.com/v1/listing/{number}/items/{itemId}/buy` |
| 便利店创建鞋子订单 | 便利店下单(鞋) | POST | `snkrdunk.com/v1/listing/{number}/items/{itemId}/buy` |
| 便利店创建服饰订单 | 便利店下单(非鞋) | POST | `snkrdunk.com/v1/apparels/{snkId}/items/{itemId}/buy` |
| 便利店支付 | 支付CVS订单 | PUT | `snkrdunk.com/v1/order/{orderId}/payments` |
| 账户积分 | 查询积分余额 | GET | `snkrdunk.com/v2/points/available-points` |
| 账户余额 | 查询余额 | GET | `snkrdunk.com/v2/balances/available-balances` |
| 优惠券列表 | 查询优惠券 | GET | `snkrdunk.com/v1/accounts/coupons?page=1&perPage=50&...` |
| 订单详情 | 获取SNK订单信息 | GET | `snkrdunk.com/v1/orders/{orderId}` |

另外还有：
- **订单详情(旧版)**: `http://xz.bmxgj.cn/sys/dewu/getOrderDetail` — POST `{ip, port, id, cookie}`
- **截图服务**: `http://xzf.dedlion.com/screenshot_server/screenshot` — POST `{order_id, cookie}`

---

## 业务流程关键选项值汇总

脚本中需要用到的所有 option key：

```javascript
const OPTION_KEYS = {
  // 任务锁
  taskStatus_running: "50f295d7-8c7b-4864-bc98-49788573c0e7",
  taskStatus_done: "61ffb626-2dde-4699-95fe-91c263a3ddb0",
  taskSwitch_on: "2e3f3433-6508-44c5-809f-264dc5c390ae",

  // 跨境订单 - 订单状态
  orderStatus_pending: "5d8e38f5-b3ad-4c86-b23c-9847d48ead27",    // 待发货
  orderStatus_sellerShipped: "099ac880-0c6c-4ec4-93cf-39c035b75f7b", // 卖家已发货

  // 跨境订单 - 采购状态
  purchaseStatus_waiting: "3117f38e-c769-4dee-ad5b-f675a030cf98",   // 等待采购
  purchaseStatus_done: "2cbc0f21-6e74-4d22-8ca1-dcd28db1f507",     // 已采购

  // 跨境订单 - 待定项
  pending_loss: "1af693d5-767c-434c-a9f1-9c544554466b",            // 负利
  pending_noStock: "319dea10-2cb9-4281-8caf-ea02f6fba29e",         // 无货
  pending_error: "58d9bc90-b143-4b69-bca4-d87188afbfb0",           // 异常

  // 跨境订单 - 采购支付方式
  payType_point: "778d2cbc-bfe4-4943-a44f-261f393cffb4",
  payType_cvs: "915e4c02-52b5-4eee-85b6-5636d86768c6",
  payType_pointCoupon: "ec9e1f99-343e-4042-ab52-b6bbd75d8670",
  payType_cvsCoupon: "2c14e401-46ad-45ff-a65d-674b3006bc79",

  // 外贸账号 - 可下单状态
  canOrder_yes: "9e4dcbf5-12ad-48da-84d3-2ce776f7bb57",
  canOrder_no: "3a8222c8-573c-4688-ac1f-e0f2b9730317",

  // 外贸账号 - 账号分类
  accountType_crossBorder: "9fc6a458-dc9f-47e0-8cec-31403cb2c842",

  // 外贸账号 - 账号状态
  accountStatus_active: "6ce938f3-f617-4185-9a6c-8dd8d742f724",
  accountStatus_unused: "bf4f4abe-3ba7-45ac-b2e2-1bc4a292862d",

  // 优惠券 - 使用状态
  couponStatus_unused: "06dee053-9c86-414d-9866-ed353fe2cf78",
  couponStatus_used: "8d46a777-e338-4440-afdd-ebba73bc0381",
};
```
