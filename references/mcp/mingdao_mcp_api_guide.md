# 明道云 MCP 接口使用指南

本文档总结了明道云 MCP 服务器的常用接口及其工作方式，帮助智能体快速、准确地通过 MCP 与明道云交互，获取应用、工作表、字段和数据信息。

## 1. 基础认知

用户配置了两个明道云服务器 `mingdao-yuanshi` (原始数据应用) 和 `mingdao-yewu` (业务应用)。工具调用方式是通过 `manus-mcp-cli tool call <tool_name> --server <server_name> --input '<json_args>'` 命令进行调用。大部分接口的 `ai_description` 参数要求用用户的语言回答（例如中文），必须提供且要有意义。

## 2. 核心接口工作方式

### 2.1 获取应用与工作表信息

获取应用信息的接口为 `get_app_info`。该接口的功能是获取应用信息，包括应用下所有的分组、工作表和自定义页面。调用时需要传入 `ai_description` 参数来描述获取应用信息的意图。接口返回 JSON 结构，包含 `sections` 数组，每个 section 包含 `items` 数组。在 `items` 中，`type=0` 表示工作表，`type=1` 表示自定义页面，`type=2` 表示子分组。

获取应用下工作表列表的接口为 `get_app_worksheets_list`。该接口支持返回 Markdown 格式。可选参数包括 `responseFormat`（'json' 默认，或 'md' Markdown 表格）和 `worksheets`（限定返回的特定工作表 ID 列表）。

### 2.2 获取工作表字段结构

获取工作表配置及其控件（字段）信息的接口为 `get_worksheet_structure`。必须传入 `worksheet_id` 和 `ai_description` 参数。返回结果中，`data.fields` 是字段列表，每个字段包含 `id`、`name`、`alias`、`type` 等信息；`data.views` 是视图列表。在查询和修改数据时，通常需要先调用此接口了解字段的 `id` 或 `alias` 以及字段类型。

### 2.3 获取表内数据

获取工作表记录列表的接口为 `get_record_list`。必须传入的参数包括 `worksheet_id`、`pageIndex`（从 1 开始）和 `pageSize`（最大 1000）。可选参数包括 `fields`（指定返回字段）、`filter`（定义数据查询条件）和 `ai_description`。返回结果中，`data.rows` 包含记录数组，`data.total` 包含总记录数。记录的键通常是字段的 `id` 或 `alias`。

获取工作表记录的透视表汇总数据的接口为 `get_record_pivot_data`。必须传入的参数包括 `worksheet_id` 和 `values`（汇总字段列表，如 `{"field": "rowid", "aggregation": "COUNT"}`）。可选参数包括 `columns`（维度字段列表）。该接口返回透视结果数组。

### 2.4 数据操作 (增删改)

明道云 MCP 提供了完整的数据操作能力。创建新记录使用 `create_record`，需传入 `worksheet_id` 和 `fields` 数组。更新单条记录使用 `update_record`，需传入 `worksheet_id`、`row_id` 和 `fields` 数组。批量更新记录使用 `batch_update_records`，需传入 `worksheet_id`、`rowIds` 数组和 `fields` 数组。批量删除记录使用 `batch_delete_records`，需传入 `worksheet_id` 和 `rowIds` 数组。

## 3. 字段类型与值格式规范

在进行数据过滤 (`filter`) 或数据写入 (`create_record`/`update_record`) 时，不同字段类型的 `value` 格式不同，具体规范如下表所示：

| 字段类型 | 过滤条件 (filter) 示例 | 写入值格式示例 | 说明 |
| --- | --- | --- | --- |
| 文本/数字 (`Text`/`Number`) | `{"operator": "eq", "value": "test"}` | `"test"` 或 `123` | 直接传字符串或数字 |
| 选项 (`Dropdown`/`SingleSelect`/`MultipleSelect`) | `{"operator": "in", "value": ["选项值"]}` | `["Option1"]` | 必须使用数组包裹选项值 |
| 关联记录 (`Relation`) | `{"operator": "belongsto", "value": ["id1"]}` | `["id1", "id2"]` | 传递记录 ID 的数组 |
| 附件 (`Attachment`) | 不支持 | `[{"name":"文件.png", "url":"url或base64"}]` | 传包含 name 和 url 的对象数组 |

## 4. 最佳实践

在使用明道云 MCP 接口时，遵循以下最佳实践可以提高效率和准确性：

首先，总是先通过 `get_worksheet_structure` 获取表结构，了解字段 ID 和类型，然后再通过 `get_record_list` 获取或过滤数据。这种“先结构，后数据”的模式能避免因字段名错误导致的问题。

其次，构建过滤条件时，`filter` 对象必须包含 `type: "group"` 和 `logic: "AND"|"OR"`。对于选项字段，必须将值放在数组中，即使只有一个选项。

此外，在获取大量数据时，必须使用 `pageIndex` 和 `pageSize` 循环获取，并注意 `pageSize` 最大为 1000。

最后，如果任务目标只是统计数量或求和，应优先使用 `get_record_pivot_data` 接口，这比拉取大量明细数据到本地进行计算要高效得多。
