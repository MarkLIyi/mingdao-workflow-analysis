# 跨境自动采购 — 工作表字段映射

> 自动生成于 V3 API `/api/v3/app/worksheets/{id}` 接口


## 外贸账号 (`626e7072507936edabc2b74c`)
- 应用: 业务 (business)
- 别名: `zhanghaobiao`
- 字段数: 92

| 字段ID | 字段名 | 类型 | 别名 | 选项(key=value) |
|--------|--------|------|------|----------------|
| `626e7072507936edabc2b74d` | 账号 | Text | name |  |
| `626e70d7507936edabc2b758` | 密码 | Text | password |  |
| `626fc64661435a2eff94b675` | 账号状态 | Dropdown | account_status | `6ce938f3-f617-4185-9a6c-8dd8d742f724`=使用中; `bf4f4abe-3ba7-45ac-b2e2-1bc4a292862d`=未使用; `1ecbf41e-457a-4fcd-8e76-ee77f0021995`=封号; `eefe6f97-27b4-4ebd-8d7a-0edf908a9fbe`=注销 |
| `626fc67561435a2eff94b67d` | 销售费率 | Number | rate |  |
| `626fc70061435a2eff94b681` | 挂售中新品 | Number | listing_count |  |
| `626fc70061435a2eff94b683` | 已结束新品 | Number | yjsxp |  |
| `626fc70061435a2eff94b685` | 账号余额 | Number | zhye |  |
| `62712eb961435a2eff94dde1` | 交易中新品 | Number | trade_count |  |
| `62713adb61435a2eff94ddee` | 等级 | Text | dengji |  |
| `6272510e61435a2eff94df2e` | 账号描述 | Text | account_desc |  |
| `62730b9361435a2eff950788` | 有效订单 | Number | yxdd |  |
| `627b76e861435a2eff95f53f` | 提现卡 | Relation | tixianka |  |
| `62dab711cb70d36b42147b6c` | 账号分类 | Dropdown | account_type | `9fc6a458-dc9f-47e0-8cec-31403cb2c842`=跨境采购; `610de861-ac9f-4f0b-813d-d0f8f4734283`=外贸销售 |
| `62e33c83ac137d97afd59b88` | 信用卡信息 | Relation | xykxx |  |
| `62e87557ac137d97afd5a1f1` | 账号ID | Number | zhid |  |
| `62f50d54ac137d97afd5f02a` | 默认支付卡 | Lookup | mrzfk |  |
| `64ce0bd6e53e47d29365a485` | 挂售中更新时间 | DateTime | tbgssjsj |  |
| `658795427b5d9928e78f6b58` | cookie | Text | cookie |  |
| `65d34b23a63b37427cbee06d` | 备注 | Text | beizhu |  |
| `6623aa97da13294957678265` | 账号消息 | Relation | zhxx1 |  |
| `666a36d4284a1075a8958f73` | 可上架状态 | Dropdown | can_up | `3e4e4f6f-1e95-447a-b104-57b4238619cf`=是; `67994cf4-5ecc-44a0-81ab-4c7cdc9b52af`=否 |
| `66878b507d6fcbb32e227c1a` | cookie更新时间 | DateTime | cookie_updated_time |  |
| `6688c9ba7d6fcbb32e228a91` | session | Text | session |  |
| `6690d14f7d6fcbb32e22a300` | 任务间隔 | Text | zxrwjg |  |
| `6694b1547d6fcbb32e2bcb3f` | 并发数 | Text | bingfashu |  |
| `66c7e2a04d03b8734a60f239` | 客服消息更新时间 | DateTime | kfxxgxsj |  |
| `66d27bbc4d03b8734a28e053` | 采购费率 | Number | cgfs |  |
| `66d4fa8a4d03b8734a3c9391` | 芝麻代理 | Relation | zmdl |  |
| `66d65cbd4d03b8734a4ad99c` | 仓库子地址 | Relation | ckzdz |  |
| `66d66bd04d03b8734a4b9e71` | 仓库名 | Lookup | cangkuming | `4e1e55f9-9d52-42ca-8c8e-f8a8ec05c0fd`=伙伴仓（李义）; `9dd96fc5-9951-442e-a5a9-e75d5f9c4a35`=伙伴仓（張力天）; `53ea1d5a-8212-445a-889c-45ad7a3e6fb1`=伙伴仓（尹晶）; `79e66ab3-d075-43dd-a791-699948c4f03e`=伙伴仓（黎雪）; `96fafbd8-26cf-4bb3-a133-7f468089fa08`=伙伴仓（俞谭）; `3809dc3b-eb7d-4bce-9954-3085157d04e1`=伙伴仓（游通文）; `cfb787af-7bc8-4cb4-a39a-1d898bb1f064`=伙伴仓（陈豪公司）; `451fb35f-4598-4605-a3b9-c5cda2ab34b5`=伙伴仓（JIA XUETING）; ...+35 |
| `66d6710d4d03b8734a4bc4a5` | 最近一次提现卡号 | Lookup | zjyctxkh |  |
| `66e44b43ee2bb7630d436d8b` | 账号信息 | Dropdown | zhxx2 | `80f1ab3e-7ac6-4224-b48a-27ba6b0e7e26`=已清除修改; `6ee3178c-7cb1-4564-b9b0-332518003217`=未清除修改 |
| `66ee6cbeb85552f21c7ccad5` | 挂售中最后一次页数 | Number | zhycys |  |
| `66ee6cbeb85552f21c7ccad6` | 挂售中最后一次数据量 | Number | zhycsjl |  |
| `678a53fc3d0942df841fb633` | 注册IP | Text | proxy_ip |  |
| `678f9fe83d0942df84406cb9` | 注册port | Text | proxy_port |  |
| `67adffea3d0942df84e0a0f6` | agent | Text | agent |  |
| `67b45d1a3d0942df84fe9749` | 外贸任务 | Section | zhjbxx |  |
| `687aec920d683e3e0fc2ea54` | 注册手机号备注 | Text | zcsjhbz |  |
| `68b2b89bbe2ffd8cd2aa9be4` | 采购总金额 | Number | zcgje |  |
| `68b398a4be2ffd8cd2ce308d` | 取消采购金额 | Number | zcgqxje |  |
| `68b55413be2ffd8cd2088bb6` | 跨境采购 | Section | zdhcgxg |  |
| `68bae471be2ffd8cd2cd540b` | 挂售中二手 | Number | gszes |  |
| `68bae471be2ffd8cd2cd540c` | 交易中二手 | Number | jyzes |  |
| `68bae4fbbe2ffd8cd2cd67dd` | 已结束二手 | Number | yjses |  |
| `68df84eebe2ffd8cd2afef03` | 罚金支付卡 | Text | fjzfk |  |
| `68e7c973be2ffd8cd29a4652` | 积分余额 | Number | jfye |  |
| `68fd739dbe2ffd8cd2ffc42f` | 可用优惠券 | Number | yhqsl |  |
| `68fec3e2be2ffd8cd22c2e21` | 当前等级 | Text | dqdj |  |
| `68fec3e2be2ffd8cd22c2e22` | 下一等级 | Text | xydj |  |
| `68fec3e2be2ffd8cd22c2e27` | 已用优惠券 | Number | syyhqsl |  |
| `68fec3e2be2ffd8cd22c2e28` | 已用优惠券金额 | Number | syyhqje |  |
| `68fec50abe2ffd8cd22c69a5` | 当前等级情况 | Text | dqdjqk |  |
| `68ff21f6be2ffd8cd239c036` | 邀请码 | Text | yaoqingma |  |
| `6900899ebe2ffd8cd2793385` | 下单类型 | Dropdown | cglx | `b41cb79c-3698-4a24-8e5e-ceeeedefeece`=积分下单; `b9a9b072-34e4-42a8-89f6-5cf20626dfee`=便利店下单 |
| `6900c816be2ffd8cd2838715` | 可下单状态 | Dropdown | sfkxd | `9e4dcbf5-12ad-48da-84d3-2ce776f7bb57`=是; `3a8222c8-573c-4688-ac1f-e0f2b9730317`=否 |
| `69083e6ebe2ffd8cd28a47e9` | 支付异常信息 | Text | zfycxx |  |
| `691dc782be2ffd8cd2a5c2fd` | 最近一次下单时间 | DateTime | sycxdsj |  |
| `692d9250be2ffd8cd2a1b10a` | 注册天数 | DateFormula | syts |  |
| `692ef675be2ffd8cd2b927d0` | 提现明细循环最后一页 | Number | txmxxhzhyy |  |
| `6933f130be2ffd8cd20112ea` | cookie更新天数 | DateFormula | cookiegxts |  |
| `6944f7e5d34f38825dc9e3c4` | 挂售中当前更新页 | Number | wmgsztbyscs__xlc |  |
| `6954c9faa85e62d4dc7c82f4` | 便利店参考金额 | Number | bldcgckje |  |
| `695dd117376f4eb1fc63ce2b` | 挂售/提现参数 | Section |  |  |
| `695dd174376f4eb1fc63d991` | 基本信息 | Section |  |  |
| `695dd3e8376f4eb1fc64140f` | 同步参数 | Divider |  |  |
| `695dd3e8376f4eb1fc641410` | 提现参数 | Divider |  |  |
| `695f9213376f4eb1fce094ae` | 等级信息 | Divider |  |  |
| `69609d46376f4eb1fc3405e0` | 其他信息 | Divider |  |  |
| `6968b823376f4eb1fce896a0` | 基本信息/动态信息更新时间 | DateTime |  |  |
| `6970c96b376f4eb1fcbc2863` | ip_list_text | Text |  |  |
| `6976da81376f4eb1fc26e73b` | 挂售上限 | Number |  |  |
| `697a14eff637c328890179fd` | 待执行上架数量 | Number |  |  |
| `697afbedf637c3288949ba94` | 剩余可分配数量 | Formula |  |  |
| `697c55b5f637c32889bbdcaf` | 系统挂售数量 | Number |  |  |
| `697cb907f637c32889e3aca5` | 优先级范围 | Text |  |  |
| `698450d0f637c3288998b74c` | 商户 | Dropdown |  | `84e65c05-1676-4743-844c-cf8ce237fe73`=蓝文生 |
| `rowid` | 记录ID | Text | rowId |  |
| `ownerid` | 拥有者 | Collaborator | _owner |  |
| `caid` | 创建人 | Collaborator | _createdBy |  |
| `ctime` | 创建时间 | DateTime | _createdAt |  |
| `utime` | 最近修改时间 | DateTime | _updatedAt |  |
| `uaid` | 最近修改人 | Collaborator | _updatedBy |  |
| `wfname` | 流程名称 | Text | _processName |  |
| `wfcuaids` | 节点负责人 | Collaborator | _nodeAssignees |  |
| `wfcaid` | 发起人 | Collaborator | _initiatedBy |  |
| `wfctime` | 发起时间 | DateTime | _initiatedAt |  |
| `wfrtime` | 节点开始时间 | DateTime | _nodeStartedAt |  |
| `wfcotime` | 审批完成时间 | DateTime | _approvalCompletedAt |  |
| `wfdtime` | 截止时间 | DateTime | _dueAt |  |
| `wfftime` | 剩余时间 | DateFormula | _remainingTime |  |
| `wfstatus` | 流程状态 | Dropdown | _processStatus | `pass`=通过; `refuse`=否决; `abort`=中止; `other`=进行中 |

## 各类配置项 (`68679c3cc16ffef115013f8a`)
- 应用: 业务 (business)
- 别名: `glpzx`
- 字段数: 22

| 字段ID | 字段名 | 类型 | 别名 | 选项(key=value) |
|--------|--------|------|------|----------------|
| `68679c3cc16ffef115013f8c` | 任务名 | Text |  |  |
| `68679c5fc16ffef11501453d` | 状态 | Dropdown |  | `f01a9c98-c329-4e20-8f6d-345c63e9e546`=开启; `42a8f22d-8bfe-49c0-a19c-67c76cd3945c`=关闭 |
| `68679c70c16ffef11501474e` | 标识 | Text |  |  |
| `688231750d683e3e0f776c46` | 值 | Text |  |  |
| `68f6f6c3be2ffd8cd234f10d` | 数值 | Number |  |  |
| `68fdaf01be2ffd8cd206bfbf` | 采购类型 | Dropdown |  | `b41cb79c-3698-4a24-8e5e-ceeeedefeece`=积分下单; `b9a9b072-34e4-42a8-89f6-5cf20626dfee`=便利店下单 |
| `695e2653376f4eb1fc76cec4` | 说明 | Text |  |  |
| `rowid` | 记录ID | Text | rowId |  |
| `ownerid` | 拥有者 | Collaborator | _owner |  |
| `caid` | 创建人 | Collaborator | _createdBy |  |
| `ctime` | 创建时间 | DateTime | _createdAt |  |
| `utime` | 最近修改时间 | DateTime | _updatedAt |  |
| `uaid` | 最近修改人 | Collaborator | _updatedBy |  |
| `wfname` | 流程名称 | Text | _processName |  |
| `wfcuaids` | 节点负责人 | Collaborator | _nodeAssignees |  |
| `wfcaid` | 发起人 | Collaborator | _initiatedBy |  |
| `wfctime` | 发起时间 | DateTime | _initiatedAt |  |
| `wfrtime` | 节点开始时间 | DateTime | _nodeStartedAt |  |
| `wfcotime` | 审批完成时间 | DateTime | _approvalCompletedAt |  |
| `wfdtime` | 截止时间 | DateTime | _dueAt |  |
| `wfftime` | 剩余时间 | DateFormula | _remainingTime |  |
| `wfstatus` | 流程状态 | Dropdown | _processStatus | `pass`=通过; `refuse`=否决; `abort`=中止; `other`=进行中 |

## 跨境订单 (`65ba14b6a63b37427cbd40f9`)
- 应用: 业务 (business)
- 别名: `dingdanbiao11`
- 字段数: 107

| 字段ID | 字段名 | 类型 | 别名 | 选项(key=value) |
|--------|--------|------|------|----------------|
| `626e71c7507936edabc2b799` | 货号 | Text | number |  |
| `626f851061435a2eff94b5ff` | cm_Size | Text | cm_size |  |
| `626f851061435a2eff94b601` | 订单状态 | Dropdown | order_status | `e9b3f424-9533-4b59-9529-1738840167ee`=支付成功; `3d42c6a1-4147-4a79-9f0d-d50f18e539ab`=待平台收貨-物流; `7081db2c-a1cb-47d1-a3c0-2d917c5ec86d`=待平台查驗鑑別; `3117f38e-c769-4dee-ad5b-f675a030cf98`=交易成功; `2cbc0f21-6e74-4d22-8ca1-dcd28db1f507`=平台已發起退貨; `52f00291-5b58-4532-9e99-b8cfd17b3fbd`=質檢不通過; `d60f55d0-1fa8-490b-8467-7a95b21c0370`=交易關閉; `6b9871ed-6a23-4e25-9d0d-50532500c326`=待平台收貨; ...+18 |
| `626f851061435a2eff94b603` | 销售时间 | DateTime | sale_time |  |
| `6272803261435a2eff95074a` | 销售价格 | Number | price |  |
| `6273180a61435a2eff9507bb` | 账号 | Text | username |  |
| `6273caf961435a2eff950a65` | eu_Size | Text | eu_size |  |
| `6275380561435a2eff954cfd` | 采购ID | Relation | dewu_order_id |  |
| `6277e02561435a2eff9554af` | 交易状态 | Text | trade_status |  |
| `627e411761435a2eff96047a` | 图片 | Attachment | pic |  |
| `6280b64061435a2eff96772b` | 备注 | Text | remark |  |
| `6281919961435a2eff9679a8` | size_Number | Text |  |  |
| `65ba1cd4a63b37427cbd492b` | global_sku_id | Number |  |  |
| `65baffa0a63b37427cbd4b1b` | 老订单ID | Text |  |  |
| `65d1b7a5a63b37427cbedbaf` | 销售类型 | Dropdown |  | `99e4f428-7c9b-426d-840e-5fb91f1aa1bb`=寄售; `b4e55d25-16d6-4957-963a-d2152471e571`=普通发货; `b5f00f41-e855-4a5b-9071-3fe6bfac81b7`=預售; `c79a83a8-8c30-4617-a56b-cb488737e6aa`=瑕疵; `3b138791-f18c-475e-961f-4d02a666f36d`=现货; `558bc7e4-3942-4b3d-8960-b6b7b89c9408`=预售 |
| `65d1b7a5a63b37427cbedbb0` | 到手价格 | Number |  |  |
| `65d1b7a5a63b37427cbedbb1` | 开始发货时间 | DateTime |  |  |
| `65d1b7a5a63b37427cbedbb2` | 最晚发货时间 | DateTime |  |  |
| `65d1b7a5a63b37427cbedbb3` | 预售天数 | Number |  |  |
| `65d1b93ba63b37427cbedbc0` | 预采购信息 | SubTable |  |  |
| `65d2192da63b37427cbedc6f` | 采购状态 | Dropdown |  | `0176fc22-1775-4735-8852-d63200b74544`=待确认; `3117f38e-c769-4dee-ad5b-f675a030cf98`=等待采购; `2cbc0f21-6e74-4d22-8ca1-dcd28db1f507`=已采购; `0de98110-da1c-4636-80c5-a8bd65136e48`=无需采购; `b256d6e3-788c-4ac1-82b2-90668e8fd235`=订单关闭 |
| `65d2cd7fa63b37427cbedc93` | 发货倒计时 | DateFormula |  |  |
| `65d57b1fa63b37427cbee44f` | 采购支付价格（日币） | Lookup |  |  |
| `65d57b1fa63b37427cbee450` | 利润（日币） | Formula |  |  |
| `65d57b1fa63b37427cbee451` | 利润率 | Formula |  |  |
| `65d6e17fa63b37427cbf3c69` | 订单取消补贴金额 | Number |  |  |
| `65d9ec17a63b37427cbf7163` | 采购物流公司 | Lookup |  |  |
| `65d9ec17a63b37427cbf7164` | 采购物流单号 | Lookup |  |  |
| `65dad573a63b37427cbf7249` | 发送快递状态 | Dropdown |  | `3b055339-bcdf-4439-be0c-d73284866a03`=未发送; `f3b7bd32-dcb5-4d6c-8147-4a5bfdf44ec9`=已发送真实; `d208433b-1ac5-4866-ad03-18e83f0e2149`=已发送虚假 |
| `65dc9efaa63b37427cbf7742` | 退货物流公司 | Text |  |  |
| `65dc9f0ba63b37427cbf7746` | 退货单号 | Text |  |  |
| `65dc9f63a63b37427cbf774a` | 鉴定不通过原因 | Text |  |  |
| `65dc9fb7a63b37427cbf774e` | 鉴定失败图片 | Attachment |  |  |
| `65ded44da63b37427cbf800a` | 产品位置 | Dropdown |  | `1e2caf4c-8dc4-4c4e-b0b5-fe105c121a38`=寄售; `55e9b5c9-36b0-4a48-ae99-f9212479b1da`=平台; `79e9bee6-19c4-4a5f-a444-23e13f86dbc1`=退货中; `d467cd3b-797f-4f84-9a8b-2926641d1ff0`=已退回陈豪; `27b82fa8-57e8-4256-b7ed-a4f10d41d073`=寄售平台; `84aff3d2-905a-40f4-be49-d3dca0e1802f`=西川回国; `a4c89f95-c7a8-4669-9576-a7a3350108e3`=瑕疵销售 |
| `65e03d38a63b37427cbf8563` | 图片地址 | Text |  |  |
| `65e2b520da1329495761037d` | 订单最新状态说明 | Text |  |  |
| `65e3cb9eda13294957612af3` | 支付价格（日币） | Lookup |  |  |
| `65e3e74cda13294957612b00` | 取回单号 | Text |  |  |
| `65e836feda1329495761335d` | 到仓截止时间 | DateTime |  |  |
| `65e967d3da13294957615a91` | 订单状态（采购） | Lookup |  |  |
| `65edaf80da1329495761615d` | 等级 | Rating |  |  |
| `65f3070bda1329495761fccf` | 采购账户 | Text |  |  |
| `660cbdebda13294957650d34` | 虚拟单号 | Text |  |  |
| `660e3a4ada13294957651ddc` | 快递单号修改次数 | Number |  |  |
| `660e7cddda13294957652156` | 虚拟单号快递公司名 | Text |  |  |
| `66164699da1329495765b57f` | 备忘录 | Text |  |  |
| `661898f5da1329495765fb52` | 兜底发货触发时间 | DateTime |  |  |
| `662a80d1da1329495767b00c` | 发货过期 | Lookup |  | `b5650976-cde5-4ad3-af7d-25098a06810a`=是; `8d1388f2-0bb1-49e6-9d14-35ee2cb2dc93`=否 |
| `664fed17710e829fd8f1181b` | 订单尺码原文 | Text |  |  |
| `66fcad61d24a9631682b3ba4` | 采购订单 | Section |  |  |
| `66fcb423d24a9631682b5f55` | 基本信息 | Section |  |  |
| `67a4b4753d0942df84a29748` | 延迟到仓 | Dropdown |  | `02a28ec6-c254-4810-92c7-5e053ee44d75`=已开启 |
| `67c06a153d0942df845d4097` | 订单ID | Text |  |  |
| `67c450283d0942df847b51bb` | 款式（系统内） | Text |  |  |
| `67d8d93a3d0942df849bf329` | 销售次数 | Dropdown |  | `d28ecd2c-704c-494d-b942-c6ccdd0dd6b1`=首次销售; `76c9b1d1-676a-4749-bd5f-d91aa6eab8b1`=二次销售; `8426bf0c-68ab-4daa-8aa0-d06f100b8027`=三次销售 |
| `67d8d93a3d0942df849bf32a` | 异常分类 | Dropdown |  | `f2b76a7c-44c4-4c02-9b59-73ccdfcdfb00`=鉴定—质量问题; `f92fbec2-6b34-483b-ab6c-6e289c512127`=鉴定—使用痕迹; `0902e4ff-6f36-4028-8b43-ac9c58c90ce3`=鉴定—货不对板; `b4c723bd-8d71-46f6-aee1-ef86d8f6b47c`=时效—未按时到仓; `a7179be5-f9b8-4bd6-85ee-193f89f1314e`=报关失败; `7855a434-3cc0-4301-a1e2-0633b0c7699e`=平台取消; `6e4a4242-f540-4260-8380-ebd911f5849a`=卖家取消; `c941668c-0968-48fa-93a9-bc4a6267e9a9`=买家取消; ...+4 |
| `67d8d93a3d0942df849bf32b` | 历史标签 | MultipleSelect |  | `095ad107-ca5e-4ea4-bcce-3d68e5302db1`=选项1; `384b6566-a097-419e-a168-0a9ef608f4c8`=选项2; `ba40caa6-7531-4b11-ba3a-beea52212154`=选项3 |
| `67d8e1063d0942df849c0d71` | 采购订单关联记录 | SubTable |  |  |
| `68427bc85a5d03e1cec34ece` | 预计采购价格 | Number |  |  |
| `68427bd85a5d03e1cec3507e` | 预计利润 | Formula |  |  |
| `68442cfa5a5d03e1cef8f4c3` | 采购货号 | Text |  |  |
| `684440875a5d03e1cefbf384` | 外部SKU_ID | Text |  |  |
| `684440875a5d03e1cefbf385` | 颜色 | Text |  |  |
| `6846c26c08068ca22011ee58` | snk_id | Text |  |  |
| `6847ce4e08068ca22059c74f` | 预计说明 | Text |  |  |
| `685c9e8fc16ffef115c3f966` | 采购地址 | Text |  |  |
| `68649557c16ffef115343c18` | 数值 | Number |  |  |
| `68688482c16ffef1151efdaa` | 30日正利润数量 | Number |  |  |
| `687d0c340d683e3e0ffaf728` | 待定项 | Dropdown |  | `1af693d5-767c-434c-a9f1-9c544554466b`=负利; `319dea10-2cb9-4281-8caf-ea02f6fba29e`=无货; `eee2053b-3c30-4a88-83e9-3367010e060c`=时效; `58d9bc90-b143-4b69-bca4-d87188afbfb0`=异常 |
| `687ddd3b0d683e3e0f0ea85d` | 便利店支付渠道 | Dropdown |  | `53aeea1c-2050-47d9-8b6b-3b2810199f75`=lawson; `9a01df15-0785-4e29-8dd5-8b4ddbc5080d`=famima; `ba03f93c-b4cb-42f7-8a01-79236774b223`=ministop; `adca7257-7d1c-40cf-bacf-f01a3bd67dfb`=yamazaki; `f3314d70-7749-4ee7-9181-46df7994fe71`=secoma |
| `689aae3abe2ffd8cd28c196d` | 隐藏项 | Divider |  |  |
| `68adabe5be2ffd8cd2c640b8` | 交易完成时间 | DateTime |  |  |
| `68ea3088be2ffd8cd2e8079c` | 自动下单备注 | Text |  |  |
| `68f59350be2ffd8cd207e39d` | 他人销售价 | Currency |  |  |
| `68f8588ebe2ffd8cd255d0cc` | 采购物流进度最新时间 | Lookup |  |  |
| `68f85986be2ffd8cd255d244` | 收件地址 | Lookup |  |  |
| `68ff0a88be2ffd8cd23610c5` | 采购支付方式 | Dropdown |  | `778d2cbc-bfe4-4943-a44f-261f393cffb4`=积分支付; `915e4c02-52b5-4eee-85b6-5636d86768c6`=便利店支付; `ec9e1f99-343e-4042-ab52-b6bbd75d8670`=积分+优惠卷支付; `2c14e401-46ad-45ff-a65d-674b3006bc79`=便利店+优惠卷支付 |
| `69007f65be2ffd8cd277a46c` | 采购意见 | Dropdown |  | `3d2940a1-59ea-439b-8bd9-5557f9bfa644`=人工已判断 |
| `691aca1ebe2ffd8cd23cbcf7` | 品牌 | Text |  |  |
| `692d8cbcbe2ffd8cd2a161fe` | 登录备注 | Lookup |  |  |
| `694409e85b4d7325df320e08` | 发送异常次数 | Number |  |  |
| `695c8348376f4eb1fc1b2cbe` | 采购账号 | Lookup |  |  |
| `695c9af1376f4eb1fc22e4d8` | dw_sku_id | Text |  |  |
| `6964e33c376f4eb1fcae4d68` | 订单物流进度 | Lookup |  |  |
| `69663cd0376f4eb1fc1ce9d4` | 账户内物流单号 | Text |  |  |
| `698874d7f637c32889817ae6` | 上架标签 | Text |  |  |
| `698a9d08f637c32889b712ae` | 销售价格-原始 | Number |  |  |
| `698a9d08f637c32889b712af` | 到手价格-原始 | Number |  |  |
| `698d859ff637c328890da627` | 利润率占比所属区间 | FunctionFormula |  |  |
| `698db2eaf637c328892ed734` | 判断是否可挽回 | FunctionFormula |  |  |
| `698dd1ccf637c3288944e0d2` | 货号异常反馈 | Dropdown |  | `84aff3d2-905a-40f4-be49-d3dca0e1802f`=是; `2358e3b2-e2a0-4b3d-b6d7-13f5fdeef385`=不存在 |
| `6992b17af637c32889d6eff8` | 平台时效天数 | DateFormula |  |  |
| `rowid` | 记录ID | Text | rowId |  |
| `ownerid` | 拥有者 | Collaborator | _owner |  |
| `caid` | 创建人 | Collaborator | _createdBy |  |
| `ctime` | 创建时间 | DateTime | _createdAt |  |
| `utime` | 最近修改时间 | DateTime | _updatedAt |  |
| `uaid` | 最近修改人 | Collaborator | _updatedBy |  |
| `wfname` | 流程名称 | Text | _processName |  |
| `wfcuaids` | 节点负责人 | Collaborator | _nodeAssignees |  |
| `wfcaid` | 发起人 | Collaborator | _initiatedBy |  |
| `wfctime` | 发起时间 | DateTime | _initiatedAt |  |
| `wfrtime` | 节点开始时间 | DateTime | _nodeStartedAt |  |
| `wfcotime` | 审批完成时间 | DateTime | _approvalCompletedAt |  |
| `wfdtime` | 截止时间 | DateTime | _dueAt |  |
| `wfftime` | 剩余时间 | DateFormula | _remainingTime |  |
| `wfstatus` | 流程状态 | Dropdown | _processStatus | `pass`=通过; `refuse`=否决; `abort`=中止; `other`=进行中 |

## 跨境采购 (`65ba14b6a63b37427cbd40f7`)
- 应用: 业务 (business)
- 别名: `cgdd1`
- 字段数: 93

| 字段ID | 字段名 | 类型 | 别名 | 选项(key=value) |
|--------|--------|------|------|----------------|
| `626e71e4507936edabc2b7c0` | 货号 | Text | number |  |
| `6273ca1961435a2eff950a41` | eu | Text | eu_size |  |
| `6273ca1961435a2eff950a43` | 销售价格（日币） | Number | price |  |
| `6275380561435a2eff954cfe` | 订单表 | Relation | dingdan_link |  |
| `62762c0a61435a2eff954d54` | 订单状态-日语 | Text | dewu_order_status |  |
| `6276fe6761435a2eff954db3` | 采购时间 | DateTime | buy_time |  |
| `628b451e3a2c8939f15aa167` | 图片 | Attachment | pic |  |
| `62a992e27b71ed66623a9f62` | cm | Text | cm_size |  |
| `62a992e27b71ed66623a9f63` | p_sku_id | Number | sku_id |  |
| `62ce1d1bd44b9632e51fd981` | size_id | Text |  |  |
| `65bc52aaa63b37427cbe08d0` | order_id | Number | snk_order_id |  |
| `65d20461a63b37427cbedc5e` | 卖家物流公司 | Text |  |  |
| `65d20461a63b37427cbedc5f` | 卖家物流单号 | Text |  |  |
| `65d578e5a63b37427cbee43b` | 应付金额（日币） | Number | pay_amount |  |
| `65d578e5a63b37427cbee43c` | 物流费（日币） | Number | express_fee |  |
| `65d578e5a63b37427cbee43d` | 服务费（日币） | Number | service_fee |  |
| `65d579efa63b37427cbee446` | 支付卡 | Text | pay_card |  |
| `65d80826a63b37427cbf6bf5` | 备注 | Text |  |  |
| `65d93fa0a63b37427cbf6f93` | 卖家物流进度 | Text |  |  |
| `65d93fa0a63b37427cbf6f94` | 卖家物流进度更新时间 | DateTime |  |  |
| `65d945d3a63b37427cbf6faa` | 订单物流公司 | Text |  |  |
| `65d945d3a63b37427cbf6fab` | 订单物流单号 | Text | order_express_no |  |
| `65d945d3a63b37427cbf6fac` | 卖家发货信息 | Divider |  |  |
| `65d9ed24a63b37427cbf7180` | 订单物流进度(等待删除) | Text |  |  |
| `65d9ed24a63b37427cbf7181` | 订单物流进度最新时间 | DateTime |  |  |
| `65e80104da13294957613225` | 订单物流上网时间 | DateTime |  |  |
| `65e801afda13294957613229` | 采购到上网时间 | DateFormula |  |  |
| `65e96aa5da13294957615ac5` | 支付时间 | DateTime |  |  |
| `65e96aa5da13294957615ac6` | 支付类型 | Dropdown |  | `9941e0f5-6241-48d6-a342-2b68df43fac6`=コンビニ払い; `6d31beca-943e-41c0-9bbc-6b11ec0ce5f0`=クレジットカード決済(一括払い); `052fa11e-3016-49a6-8f00-6b9b4f813137`=PayPay決済; `c608d8ad-1184-46c2-ab7c-7c2ffbe7f252`=全額ポイント決済; `5cee8b87-cfe1-4f5c-a4f5-e4d96aabe49c`=Amazon支付; `65f63fb2-f87a-44bd-b381-ffb486fd5a43`=货到付款 |
| `65e9a99dda13294957615b14` | 便利店名称 | Text | store_name |  |
| `65e9a99dda13294957615b15` | 支付凭证号 | Text | pay_voucher_id |  |
| `65e9a99dda13294957615b16` | 截止支付时间 | DateTime | final_pay_time |  |
| `65e9ce4fda13294957615ba6` | 统一支付表 | Relation |  |  |
| `65ee9f1ada1329495761b056` | 结算状态 | Dropdown |  | `64308b04-03c6-4196-9c72-4a1a78f75b4e`=待结算; `6121e2a9-d35d-493a-8b69-76edfbac2266`=已结算; `8656a6bb-c61e-45cf-b269-5a195f53fd6f`=无需结算 |
| `65eea7a3da1329495761ba1e` | 退款渠道 | Dropdown |  | `a4239d5a-e634-48e8-b71b-14f2b9b53849`=信用卡; `c8a47dd8-84cf-4ebc-9451-0784e983bce5`=账户 |
| `6606122bda13294957647ebf` | 发货过期 | Dropdown |  | `b5650976-cde5-4ad3-af7d-25098a06810a`=是; `8d1388f2-0bb1-49e6-9d14-35ee2cb2dc93`=否 |
| `6618c90fda1329495765fe93` | 销售订单状态 | Lookup |  | `e9b3f424-9533-4b59-9529-1738840167ee`=支付成功; `3d42c6a1-4147-4a79-9f0d-d50f18e539ab`=待平台收貨-物流; `7081db2c-a1cb-47d1-a3c0-2d917c5ec86d`=待平台查驗鑑別; `3117f38e-c769-4dee-ad5b-f675a030cf98`=交易成功; `2cbc0f21-6e74-4d22-8ca1-dcd28db1f507`=平台已發起退貨; `52f00291-5b58-4532-9e99-b8cfd17b3fbd`=質檢不通過; `d60f55d0-1fa8-490b-8467-7a95b21c0370`=交易關閉; `6b9871ed-6a23-4e25-9d0d-50532500c326`=待平台收貨; ...+18 |
| `6639dfd9465de97af0f8ebee` | 大概退款时间 | Text |  |  |
| `664ac531465de97af0fa9ef4` | 系统物流更新执行时间 | DateTime |  |  |
| `66d2bdbd4d03b8734a2b07ff` | 订单内消息 | Text |  |  |
| `66d2c97f4d03b8734a2b3be4` | 订单列表 | Relation |  |  |
| `671bae5ed24a96316831404c` | 物流状态 | Dropdown |  | `93d2e11a-9d76-41ec-b00d-6a29f390dd1e`=异常 |
| `6739f864d24a96316854b8b0` | 未分配通知 | Dropdown |  | `68e8e711-dbef-4be6-a217-1bf520b9e824`=未通知; `c5a96cc6-ce2c-4321-9268-199de66dca6e`=已通知 |
| `67b9951b3d0942df8423f0db` | 采购账号 | Text | buy_account |  |
| `68089527c21237fa2689ba30` | 通知消息 | Relation |  |  |
| `6878f82a35318194e8cb6511` | 官网采购订单ID | Text | offical_order_id |  |
| `687aea1a0d683e3e0fc2b253` | 注册手机号 | Text | register_phone_num |  |
| `6881df230d683e3e0f6d7f99` | 便利店支付渠道 | Dropdown |  | `cb798b3b-6771-43e1-8708-12f50958611f`=lawson; `a30ebea2-f867-4712-af9b-e0dbe98f3ef6`=famima; `87aca921-7cd8-44d1-b83a-67e9e2e7f7c0`=ministop; `5d0d369a-ad75-4469-9a69-9e06655ac5a8`=yamazaki; `e80f0e3c-ea81-43a8-aa56-759e031a0015`=secoma |
| `688234430d683e3e0f77cffb` | 同步来源 | Text |  |  |
| `689048b5be2ffd8cd2d67bf2` | 积分支付金额 | Number |  |  |
| `689ab365be2ffd8cd28cfc17` | 隐藏项 | Divider |  |  |
| `68a2f150be2ffd8cd2e8019c` | 收件地址 | Text | address |  |
| `68a2fc98be2ffd8cd2ea3a9e` | 订单到仓截止时间 | Lookup |  |  |
| `68ae8ef4be2ffd8cd2eecb48` | 财务核对标记 | Checkbox |  |  |
| `68b93b04be2ffd8cd29102ea` | 订单购买时图片 | Attachment | order_pic |  |
| `68b93c07be2ffd8cd2912752` | 产品名 | Text |  |  |
| `68de2bf2be2ffd8cd2904af2` | 是否支付账单生成 | Dropdown |  | `cb218293-43e9-43c6-a884-6bb086b615cf`=新生成 |
| `68f0de06be2ffd8cd29c4e8c` | 支付Id | Text |  |  |
| `68f1dc65be2ffd8cd2b92f8a` | 品牌 | Text |  |  |
| `68f64b5dbe2ffd8cd227e7bb` | 采购状态（支付账单） | Text |  |  |
| `68f6563abe2ffd8cd2288da0` | 支付账单 | Relation |  |  |
| `68f65e1fbe2ffd8cd22909c7` | 是否多笔订单 | Dropdown |  | `290a8012-650f-4928-aad6-a112592e3482`=是 |
| `68f89152be2ffd8cd25b8eaf` | carry_普通 | Number |  |  |
| `68f89152be2ffd8cd25b8eb0` | carry_闪电 | Number |  |  |
| `68fcbe2dbe2ffd8cd2e33db7` | 优惠券使用金额 | Number |  |  |
| `68ff09f8be2ffd8cd236002d` | 支付方式 | Dropdown |  | `2e06dc91-d258-45d8-bd1d-d7f445645b76`=积分支付; `7925794e-8be1-45bf-a068-21b6e151a96a`=便利店支付; `81edb45b-ab54-4b82-a704-2020842819f6`=积分+优惠卷支付; `09f27d71-d955-4d9b-a8b6-2642acd28b63`=便利店+优惠卷支付 |
| `691d595abe2ffd8cd2917713` | 便利店支付金额 | Formula | store_pay_amount |  |
| `691ff6dfbe2ffd8cd2f895ab` | 支付凭证号完整 | Text | pay_voucher_origin_id |  |
| `692d8869be2ffd8cd2a1254a` | 登录备注 | Text |  |  |
| `694e4e63a85e62d4dc3edfca` | 物流实际配送营业所 | Text |  |  |
| `6964db9a376f4eb1fcac0df7` | 订单物流进度 | Text |  |  |
| `69ac16e7cf0c04f2a1125501` | 账号 | Lookup |  |  |
| `69ae7958cf0c04f2a1667b57` | snk_id | Text |  |  |
| `69ae7f04cf0c04f2a16724d5` | 订单状态-英语 | Text |  |  |
| `69af606ecf0c04f2a17bd590` | 订单总金额 | Formula |  |  |
| `69afc12dcf0c04f2a18292e2` | 订单结束时图片 | Attachment | finish_pic |  |
| `69afc98bcf0c04f2a183295c` | 订单状态-中文 | Text |  |  |
| `69b3d9dd9d794fff19565ae2` | 销售账号 | Lookup |  |  |
| `rowid` | 记录ID | Text | rowId |  |
| `ownerid` | 拥有者 | Collaborator | _owner |  |
| `caid` | 创建人 | Collaborator | _createdBy |  |
| `ctime` | 创建时间 | DateTime | _createdAt |  |
| `utime` | 最近修改时间 | DateTime | _updatedAt |  |
| `uaid` | 最近修改人 | Collaborator | _updatedBy |  |
| `wfname` | 流程名称 | Text | _processName |  |
| `wfcuaids` | 节点负责人 | Collaborator | _nodeAssignees |  |
| `wfcaid` | 发起人 | Collaborator | _initiatedBy |  |
| `wfctime` | 发起时间 | DateTime | _initiatedAt |  |
| `wfrtime` | 节点开始时间 | DateTime | _nodeStartedAt |  |
| `wfcotime` | 审批完成时间 | DateTime | _approvalCompletedAt |  |
| `wfdtime` | 截止时间 | DateTime | _dueAt |  |
| `wfftime` | 剩余时间 | DateFormula | _remainingTime |  |
| `wfstatus` | 流程状态 | Dropdown | _processStatus | `pass`=通过; `refuse`=否决; `abort`=中止; `other`=进行中 |

## 账号优惠券 (`69706dee376f4eb1fca607ad`)
- 应用: 业务 (business)
- 别名: `zhyhq`
- 字段数: 23

| 字段ID | 字段名 | 类型 | 别名 | 选项(key=value) |
|--------|--------|------|------|----------------|
| `69706dee376f4eb1fca607ae` | 账户 | Text |  |  |
| `69706e0e376f4eb1fca609a6` | 优惠券ID | Text |  |  |
| `69706e0e376f4eb1fca609a7` | 优惠券最大金额 | Text |  |  |
| `69706f88376f4eb1fca61fab` | 抵扣比例 | Text |  |  |
| `69706f88376f4eb1fca61fad` | 优惠券使用说明 | Text |  |  |
| `697072a7376f4eb1fca646a2` | 使用状态 | Dropdown |  | `06dee053-9c86-414d-9866-ed353fe2cf78`=未使用; `8d46a777-e338-4440-afdd-ebba73bc0381`=已使用 |
| `697072a7376f4eb1fca646a3` | 使用商品金额 | Number |  |  |
| `697072a7376f4eb1fca646a4` | 使用优惠券金额 | Number |  |  |
| `rowid` | 记录ID | Text | rowId |  |
| `ownerid` | 拥有者 | Collaborator | _owner |  |
| `caid` | 创建人 | Collaborator | _createdBy |  |
| `ctime` | 创建时间 | DateTime | _createdAt |  |
| `utime` | 最近修改时间 | DateTime | _updatedAt |  |
| `uaid` | 最近修改人 | Collaborator | _updatedBy |  |
| `wfname` | 流程名称 | Text | _processName |  |
| `wfcuaids` | 节点负责人 | Collaborator | _nodeAssignees |  |
| `wfcaid` | 发起人 | Collaborator | _initiatedBy |  |
| `wfctime` | 发起时间 | DateTime | _initiatedAt |  |
| `wfrtime` | 节点开始时间 | DateTime | _nodeStartedAt |  |
| `wfcotime` | 审批完成时间 | DateTime | _approvalCompletedAt |  |
| `wfdtime` | 截止时间 | DateTime | _dueAt |  |
| `wfftime` | 剩余时间 | DateFormula | _remainingTime |  |
| `wfstatus` | 流程状态 | Dropdown | _processStatus | `pass`=通过; `refuse`=否决; `abort`=中止; `other`=进行中 |

## 任务锁 (`64b0afb1b973e9c378b0b17c`)
- 应用: 原始数据 (rawdata)
- 别名: `rwspz`
- 字段数: 34

| 字段ID | 字段名 | 类型 | 别名 | 选项(key=value) |
|--------|--------|------|------|----------------|
| `64b0afb1b973e9c378b0b17d` | 配置名 | Text |  |  |
| `64b0afb1b973e9c378b0b17e` | 备注 | Text |  |  |
| `64b0b01ab973e9c378b0b188` | alias | Text |  |  |
| `64b0b01ab973e9c378b0b189` | 单次任务状态 | Dropdown |  | `50f295d7-8c7b-4864-bc98-49788573c0e7`=执行中; `61ffb626-2dde-4699-95fe-91c263a3ddb0`=已结束 |
| `64b0b01ab973e9c378b0b18a` | 定时任务触发次数 | Number |  |  |
| `64b0b0d2b973e9c378b0b19a` | 阈值 | Number |  |  |
| `64c25c6b264714dc2f304d30` | 检测状态 | Dropdown |  | `ea4f430a-aa2d-4312-a9ef-9916a74b2820`=检测成功; `9dced0bf-ea7d-42b2-8fc1-2843dcc5b26d`=检测失败 |
| `64d435ace53e47d293662c06` | 流程开关 | Dropdown |  | `2e3f3433-6508-44c5-809f-264dc5c390ae`=开; `dac1063e-8635-45c3-8685-17c925899130`=关 |
| `64d43859e53e47d293662c20` | 定时任务频率 | Number |  |  |
| `66712ec6284a1075a896f315` | 系统排队数量 | Number |  |  |
| `66e4361fee2bb7630d422625` | 单次循环并发数量 | Number |  |  |
| `66e4361fee2bb7630d422626` | 每小时执行任务数 | Formula |  |  |
| `66e4361fee2bb7630d422627` | 每天执行任务数 | Formula |  |  |
| `66e4e77fee2bb7630d4ad89b` | 每日目标更新数量 | Number |  |  |
| `66e53cb5d7659ba366271cbf` | 开始时间 | DateTime |  |  |
| `66e53cb5d7659ba366271cc0` | 结束时间 | DateTime |  |  |
| `66e53cb5d7659ba366271cc1` | 最近一次执行时长 | DateFormula |  |  |
| `66e691bf025db3d9cd9ae956` | 额外系数 | Number |  |  |
| `67f3ad0d1d07edb9963f0255` | 最近一次流程执行时间 | DateTime |  |  |
| `rowid` | 记录ID | Text | rowId |  |
| `ownerid` | 拥有者 | Collaborator | _owner |  |
| `caid` | 创建人 | Collaborator | _createdBy |  |
| `ctime` | 创建时间 | DateTime | _createdAt |  |
| `utime` | 最近修改时间 | DateTime | _updatedAt |  |
| `uaid` | 最近修改人 | Collaborator | _updatedBy |  |
| `wfname` | 流程名称 | Text | _processName |  |
| `wfcuaids` | 节点负责人 | Collaborator | _nodeAssignees |  |
| `wfcaid` | 发起人 | Collaborator | _initiatedBy |  |
| `wfctime` | 发起时间 | DateTime | _initiatedAt |  |
| `wfrtime` | 节点开始时间 | DateTime | _nodeStartedAt |  |
| `wfcotime` | 审批完成时间 | DateTime | _approvalCompletedAt |  |
| `wfdtime` | 截止时间 | DateTime | _dueAt |  |
| `wfftime` | 剩余时间 | DateFormula | _remainingTime |  |
| `wfstatus` | 流程状态 | Dropdown | _processStatus | `pass`=通过; `refuse`=否决; `abort`=中止; `other`=进行中 |

## 芝麻代理 (`63edb8ac1c190a21fe376ad3`)
- 应用: 原始数据 (rawdata)
- 别名: `dlip`
- 字段数: 40

| 字段ID | 字段名 | 类型 | 别名 | 选项(key=value) |
|--------|--------|------|------|----------------|
| `63edb9591c190a21fe376adf` | IP | Text | ip |  |
| `63edb9591c190a21fe376ae0` | port | Text | port |  |
| `63edb9591c190a21fe376ae1` | 城市 | Text | diqu |  |
| `63edb9591c190a21fe376ae2` | 到期时间 | DateTime | dqsj |  |
| `63edb9591c190a21fe376ae3` | 账号IP请求状态 | Dropdown | request_status | `26705c70-61d5-4d0c-a526-b32a1a77e50c`=正常; `9c918d59-353e-4a6c-9cf0-7b6aa601e80d`=异常; `0b31e5ec-7aa9-4f0b-a643-b8e0d2613934`=高频正常; `a8a92165-9643-4f06-85e7-3edc1e9ab134`=低频正常; `b3ee18ee-c6f6-43fc-933e-551782688d8d`=异常不可逆; `2ce6b8d6-ebe8-4ef6-b9c6-45f4a39d94bd`=临时禁用 |
| `63edcbf31c190a21fe376af5` | 更新时间 | DateTime | gxsj |  |
| `63f6c399bc44bcf3552a3f8f` | 国家 | Dropdown | country | `65733b45-cfd8-4e17-929b-00f7d704f66d`=国内; `f9ce4548-c975-4052-920d-dff84908803a`=国外; `80ba30ca-78a3-4b1c-b8f8-24a6efbafb94`=以色列 |
| `6567f003f26824a841b3e736` | 使用备注 | Text | sybz |  |
| `6588c3c87b5d9928e78fab2c` | 关联账号 | Text | account |  |
| `65d710dda63b37427cbf6422` | 最后更新时间 | DateTime | zhgxsj |  |
| `6614f71cda132949576596e4` | 代理拉取监测情况 | Dropdown | dllqjcqk | `f372a36f-beea-4c0d-b9d4-d2c1ffa8df15`=正常; `ceb2d3c4-aaf4-465a-81e3-b202a23186b7`=异常 |
| `6669110c284a1075a8956043` | 账号封禁时间 | DateTime | zhfjsj |  |
| `6685e1487d6fcbb32e227491` | snk价格请求状态 | Dropdown | snkjgqqzt | `c09af781-0c15-4a00-8a62-076586cc9868`=正常; `6a321a99-a7f6-4973-afea-50dd62e4a561`=异常; `606cb8f8-01b9-4551-8850-e9dedc6a43e5`=异常不可逆 |
| `668783eb7d6fcbb32e227bcd` | 最后一次使用时间 | DateTime | last_use_time |  |
| `66d4fa8a4d03b8734a3c9392` | 关联账号 | Relation | account_link |  |
| `66f18b65c11188d4ac73c2eb` | 临时禁用解封时间 | DateTime | release_time |  |
| `67cd61ed3d0942df841fc904` | ADS浏览器登录 | Dropdown | adsllqdl | `3b3f069a-a8d5-43e0-9156-9e8479ca2ca8`=ADS浏览器登录 |
| `67cd625c3d0942df841fd353` | ADS使用情况 | Dropdown | adssyqk | `3b3f069a-a8d5-43e0-9156-9e8479ca2ca8`=封过账号; `bed7c3a4-e0f3-4d9a-ad06-10b1516fbfc1`=正常 |
| `67cd975e3d0942df84238574` | 备注 | Text | beizhu |  |
| `67d4e2b43d0942df8491d5b7` | 是否续费 | Dropdown | sfxf | `fb5d7594-b989-4ff3-a319-08d422223519`=已续费; `d780cf19-93d5-47e9-bc56-1b6777c37a2b`=未续费; `a2d66158-02b6-4f6f-8bd3-d7e44c7d0af7`=选项3 |
| `688b3a6fbe2ffd8cd21c03e0` | 使用账号 | Text | syzh |  |
| `69a26253cf0c04f2a1b08386` | 代理账号 | Text |  |  |
| `69a26253cf0c04f2a1b08387` | 代理密码 | Text |  |  |
| `69a41729cf0c04f2a13df9be` | 代理类型 | Text |  |  |
| `69bcea479d794fff19a6604e` | 描述 | Text |  |  |
| `rowid` | 记录ID | Text | rowId |  |
| `ownerid` | 拥有者 | Collaborator | _owner |  |
| `caid` | 创建人 | Collaborator | _createdBy |  |
| `ctime` | 创建时间 | DateTime | _createdAt |  |
| `utime` | 最近修改时间 | DateTime | _updatedAt |  |
| `uaid` | 最近修改人 | Collaborator | _updatedBy |  |
| `wfname` | 流程名称 | Text | _processName |  |
| `wfcuaids` | 节点负责人 | Collaborator | _nodeAssignees |  |
| `wfcaid` | 发起人 | Collaborator | _initiatedBy |  |
| `wfctime` | 发起时间 | DateTime | _initiatedAt |  |
| `wfrtime` | 节点开始时间 | DateTime | _nodeStartedAt |  |
| `wfcotime` | 审批完成时间 | DateTime | _approvalCompletedAt |  |
| `wfdtime` | 截止时间 | DateTime | _dueAt |  |
| `wfftime` | 剩余时间 | DateFormula | _remainingTime |  |
| `wfstatus` | 流程状态 | Dropdown | _processStatus | `pass`=通过; `refuse`=否决; `abort`=中止; `other`=进行中 |

## 比价数据 (`6290caed1e00e6d0665284c4`)
- 应用: 原始数据 (rawdata)
- 别名: `bjsj_data`
- 字段数: 49

| 字段ID | 字段名 | 类型 | 别名 | 选项(key=value) |
|--------|--------|------|------|----------------|
| `6290caed1e00e6d06652858c` | 得物货号 | Text | huohao |  |
| `6290caed1e00e6d06652858d` | eu_size | Text | eu_size |  |
| `6290caed1e00e6d06652858e` | cm_size | Text | cm_size |  |
| `6295b6874930daf69d03f808` | dw_sku_id | Number | sku_id |  |
| `6295f4574930daf69d040a0e` | size_number/size_id | Number | size_number |  |
| `640c14f9902db3e540ddf39f` | 备注 | Text | beizhu |  |
| `66c1490e885ca63130876539` | 基本信息 | Relation | base_info_link |  |
| `66cafff64d03b8734a964257` | global_sku_id | Number | global_sku_id |  |
| `66cc168a4d03b8734aaddb5a` | 尺码标签 | Text | cmbq |  |
| `66e6a444025db3d9cd9bc405` | 定价最低值 | Number | decision_min |  |
| `66e6a444025db3d9cd9bc406` | 最高限价-poizon | Number | decision_max |  |
| `67d2e3513d0942df8481a0af` | other_size | Text | other_size |  |
| `67f4cecd1d07edb99641f7d4` | 尺码比较 | Dropdown | cmbj | `fc0c73f3-432d-4030-b9b4-2053a6e00f37`=不相等; `431eee07-cfd9-40cc-9c39-609f27706a9d`=相等; `696af712-d634-41a5-9f85-3f5233d36861`=异常 |
| `6832a50f5a5d03e1ce2c9700` | snk货号 | Text | snkhh |  |
| `6834337c5a5d03e1ce5cc3f8` | snk_id | Text | snk_snk_id |  |
| `68372a5f5a5d03e1cebcd0d4` | 得物颜色 | Text | dwys |  |
| `68372acb5a5d03e1cebce3f2` | snk颜色 | Text | snkys |  |
| `68662cebc16ffef115d4c539` | new_global_sku_id | Text | new_global_sku_id |  |
| `692ffb90be2ffd8cd2c95d24` | global_spu_id | Number | global_spu_id |  |
| `692ffb90be2ffd8cd2c95d25` | dw_spu_id | Number | dw_spu_id |  |
| `692ffb90be2ffd8cd2c95d26` | 品类 | Text | pinlei |  |
| `692ffb90be2ffd8cd2c95d27` | 品牌 | Text | pinpai2 |  |
| `692ffb90be2ffd8cd2c95d28` | 货号标签 | Text | hhbq |  |
| `692ffc06be2ffd8cd2c95f61` | 得物标题 | Text | dwbt |  |
| `692ffc06be2ffd8cd2c95f62` | snk大标题 | Text | snkdbt |  |
| `692ffc06be2ffd8cd2c95f63` | snk小标题 | Text | snkxbt |  |
| `692ffd49be2ffd8cd2c96fd1` | 款式 | Text | kuanshi |  |
| `692ffd49be2ffd8cd2c96fd2` | logo_url | Text | logo_url |  |
| `69699777376f4eb1fc2d0c1c` | 尺码是否一致 | FunctionFormula | cmsfyz |  |
| `697c9da7f637c32889d88abf` | SNK交易记录更新时间 | DateTime | tongbuTime |  |
| `69819332f637c3288983c6a2` | 上架标签 | MultipleSelect | sjbq | `94326856-9da2-4e1d-a5ef-44a99df2ae39`=跨境黑名单; `0501766d-32d3-44d0-b562-e068361740ef`=外贸黑名单 |
| `6985481af637c32889f5ff0a` | 跨境交易记录更新时间 | DateTime | kjjyjlgxsj |  |
| `69858c2ef637c328890c04cf` | 去重状态 | Dropdown | qzzt | `ce9b6c6b-1d2d-4de5-8d44-3403e9c2c809`=处理中; `51fb6848-cbb0-4c53-8ffb-f50566cf5b21`=已入库; `af798dca-e85c-491a-9e93-b88326f5f621`=重复数据 |
| `69858c2ef637c328890c04d0` | 去重时间 | DateTime | qzsj |  |
| `rowid` | 记录ID | Text | rowId |  |
| `ownerid` | 拥有者 | Collaborator | _owner |  |
| `caid` | 创建人 | Collaborator | _createdBy |  |
| `ctime` | 创建时间 | DateTime | _createdAt |  |
| `utime` | 最近修改时间 | DateTime | _updatedAt |  |
| `uaid` | 最近修改人 | Collaborator | _updatedBy |  |
| `wfname` | 流程名称 | Text | _processName |  |
| `wfcuaids` | 节点负责人 | Collaborator | _nodeAssignees |  |
| `wfcaid` | 发起人 | Collaborator | _initiatedBy |  |
| `wfctime` | 发起时间 | DateTime | _initiatedAt |  |
| `wfrtime` | 节点开始时间 | DateTime | _nodeStartedAt |  |
| `wfcotime` | 审批完成时间 | DateTime | _approvalCompletedAt |  |
| `wfdtime` | 截止时间 | DateTime | _dueAt |  |
| `wfftime` | 剩余时间 | DateFormula | _remainingTime |  |
| `wfstatus` | 流程状态 | Dropdown | _processStatus | `pass`=通过; `refuse`=否决; `abort`=中止; `other`=进行中 |