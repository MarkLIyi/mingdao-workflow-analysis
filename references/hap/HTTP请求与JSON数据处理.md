# 明道云HAP - HTTP请求与JSON数据处理

## 概述

本文档详细说明明道云HAP平台在处理HTTP请求返回的JSON数据时的特性、常见问题及解决方案。特别是针对复杂嵌套JSON数据在工作流中的处理方法。

---

## 核心特性:JSON字符串序列化

### 特性说明

**明道云在处理HTTP请求返回的复杂嵌套JSON时,为了数据安全和兼容性,会将某些嵌套对象序列化为JSON字符串。这是明道云的特性,不是bug。**

### 具体表现

当HTTP请求节点返回复杂的嵌套JSON数据时,明道云会将深层嵌套的对象或数组转换为JSON字符串:

```json
// 原始API返回的数据
{
  "skuSale": {
    "globalSkuId": 1000286827373232,
    "articleNumber": "IM0594-600",
    "price": {
      "money": {
        "minUnitVal": 43400
      }
    }
  }
}

// 在明道云中实际接收到的数据
{
  "skuSale": "{\"globalSkuId\":1000286827373232,\"articleNumber\":\"IM0594-600\",\"price\":{\"money\":{\"minUnitVal\":43400}}}"
}
```

### 为什么会这样?

1. **数据安全**: 防止恶意数据注入
2. **兼容性**: 确保不同节点之间数据传递的一致性
3. **性能优化**: 减少数据解析的复杂度

---

## 常见问题

### 问题1: Python代码块中无法访问嵌套字段

**症状:**
```python
# 代码
data = input["data"]
sku_id = data['skuSale']['globalSkuId']

# 错误
TypeError: string indices must be integers
```

**原因:** `data['skuSale']` 是字符串,不是字典对象。

### 问题2: 所有嵌套字段值都返回None

**症状:**
```python
# 使用 .get() 方法
sku_id = data.get('skuSale', {}).get('globalSkuId')
# 结果: None (因为 data['skuSale'] 是字符串,不是字典)
```

**原因:** 字符串类型没有 `.get()` 方法,导致返回None。

### 问题3: 字段值显示为 "None" 字符串

**症状:**
在明道云工作表中看到字段值为字符串 `"None"` 而不是空值。

**原因:** Python的 `None` 被转换为字符串输出。

---

## 解决方案

### 方案1: 通用JSON字段解析函数(推荐)

创建一个通用的解析函数,自动检测并解析JSON字符串字段:

```python
import json

def parse_json_field(value):
    """
    解析可能是JSON字符串的字段
    
    参数:
        value: 可能是字符串、字典或其他类型的值
    
    返回:
        解析后的对象,如果无法解析则返回原值
    """
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, ValueError):
            return value
    return value

def safe_get(obj, *keys):
    """
    安全获取嵌套字典或列表中的值,自动处理JSON字符串
    
    参数:
        obj: 源对象(字典或列表)
        *keys: 多级键名或索引
    
    返回:
        获取到的值,如果路径不存在则返回None
    
    示例:
        safe_get(data, 'skuSale', 'globalSkuId')
        safe_get(data, 'priceList', 0, 'minPrice', 'money', 'minUnitVal')
    """
    value = obj
    for key in keys:
        # 关键: 检测到字符串时自动解析
        if isinstance(value, str):
            value = parse_json_field(value)
        
        if isinstance(value, dict):
            value = value.get(key)
        elif isinstance(value, list) and isinstance(key, int):
            value = value[key] if 0 <= key < len(value) else None
        else:
            return None
        
        if value is None:
            return None
    
    return value
```

### 方案2: 预处理整个数据结构

在处理数据前,先递归解析所有JSON字符串字段:

```python
import json

def deep_parse_json(obj):
    """
    递归解析对象中的所有JSON字符串字段
    
    参数:
        obj: 要解析的对象(字典、列表或其他类型)
    
    返回:
        解析后的对象
    """
    if isinstance(obj, str):
        try:
            # 尝试解析JSON字符串
            parsed = json.loads(obj)
            # 递归解析嵌套的JSON字符串
            return deep_parse_json(parsed)
        except (json.JSONDecodeError, ValueError):
            return obj
    elif isinstance(obj, dict):
        return {key: deep_parse_json(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [deep_parse_json(item) for item in obj]
    else:
        return obj

# 使用示例
data = input["data"]
if isinstance(data, str):
    data = json.loads(data)

# 深度解析所有JSON字符串
data = deep_parse_json(data)

# 现在可以正常访问嵌套字段
sku_id = data['skuSale']['globalSkuId']
```

---

## 最佳实践

### 1. 在Python代码块中处理HTTP响应

**推荐做法:**

```python
import json
from datetime import datetime

# 步骤1: 获取输入数据
data = input["data"]

# 步骤2: 解析JSON(如果是字符串)
if isinstance(data, str):
    data = json.loads(data) if data and data.strip() else None

# 步骤3: 提取列表(处理不同的数据结构)
if data is None:
    data = []
elif isinstance(data, dict):
    data = (
        data.get('data', {}).get('list', []) or
        data.get('list', []) or
        data.get('items', []) or
        []
    )
elif not isinstance(data, list):
    data = []

# 步骤4: 定义安全访问函数
def parse_json_field(value):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except:
            return value
    return value

def safe_get(obj, *keys):
    value = obj
    for key in keys:
        if isinstance(value, str):
            value = parse_json_field(value)
        
        if isinstance(value, dict):
            value = value.get(key)
        elif isinstance(value, list) and isinstance(key, int):
            value = value[key] if 0 <= key < len(value) else None
        else:
            return None
        
        if value is None:
            return None
    
    return value

# 步骤5: 提取字段
result = []
for item in data:
    extracted = {
        'sku_id': safe_get(item, 'skuSale', 'globalSkuId'),
        'article_number': safe_get(item, 'skuSale', 'articleNumber'),
        'price': safe_get(item, 'skuSale', 'price', 'money', 'minUnitVal'),
        'min_price': safe_get(item, 'priceList', 0, 'minPrice', 'money', 'minUnitVal'),
    }
    result.append(extracted)

# 步骤6: 输出结果
output = {
    'result_list': result,
    'total_count': len(result),
    'success': True
}
```

### 2. 错误处理

**始终包含完整的错误处理:**

```python
try:
    # 数据处理逻辑
    data = input["data"]
    if isinstance(data, str):
        data = json.loads(data)
    
    # ... 处理数据 ...
    
    output = {
        'success': True,
        'result': result
    }
    
except json.JSONDecodeError as e:
    # JSON解析错误
    output = {
        'success': False,
        'error': f'JSON解析失败: {str(e)}',
        'result': []
    }
    
except Exception as e:
    # 其他错误
    output = {
        'success': False,
        'error': f'处理失败: {str(e)}',
        'result': []
    }
```

### 3. 空值处理

**避免None值导致的问题:**

```python
def safe_get(obj, *keys, default=None):
    """增加默认值参数"""
    value = obj
    for key in keys:
        if isinstance(value, str):
            value = parse_json_field(value)
        
        if isinstance(value, dict):
            value = value.get(key)
        elif isinstance(value, list) and isinstance(key, int):
            value = value[key] if 0 <= key < len(value) else None
        else:
            return default
        
        if value is None:
            return default
    
    return value if value is not None else default

# 使用示例
price = safe_get(item, 'price', 'money', 'minUnitVal', default=0)
name = safe_get(item, 'name', default='未知')
```

---

## 实际案例

### 案例1: 处理电商API返回的商品数据

**场景:** 从第三方电商平台API获取商品列表,需要提取SKU信息、价格、销量等字段。

**问题:** API返回的数据中,`skuSale`、`priceInfo`等字段在明道云中被序列化为JSON字符串。

**解决方案:**

```python
import json
from datetime import datetime

# 获取HTTP请求返回的数据
data = input["data"]

# 解析JSON字符串
if isinstance(data, str):
    data = json.loads(data)

# 提取列表
if isinstance(data, dict):
    items = data.get('data', {}).get('list', []) or data.get('list', [])
else:
    items = data if isinstance(data, list) else []

# 定义解析函数
def parse_json_field(value):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except:
            return value
    return value

def safe_get(obj, *keys):
    value = obj
    for key in keys:
        if isinstance(value, str):
            value = parse_json_field(value)
        
        if isinstance(value, dict):
            value = value.get(key)
        elif isinstance(value, list) and isinstance(key, int):
            value = value[key] if 0 <= key < len(value) else None
        else:
            return None
        
        if value is None:
            return None
    
    return value

# 提取字段
result = []
for item in items:
    # 提取时间戳并转换为日期
    timestamp = safe_get(item, 'skuSale', 'createTime')
    create_time = None
    if timestamp:
        try:
            dt = datetime.fromtimestamp(timestamp / 1000)
            create_time = dt.strftime('%Y-%m-%d %H:%M:%S')
        except:
            pass
    
    extracted = {
        'global_sku_id': safe_get(item, 'skuSale', 'globalSkuId'),
        'article_number': safe_get(item, 'skuSale', 'articleNumber'),
        'sku_prop': safe_get(item, 'skuSale', 'skuProp'),
        'create_time': create_time,
        'my_price': safe_get(item, 'skuSale', 'price', 'money', 'minUnitVal'),
        'suggest_price': safe_get(item, 'priceInfo', 'suggestPrice', 'money', 'minUnitVal'),
        'min_price': safe_get(item, 'priceList', 0, 'minPrice', 'money', 'minUnitVal'),
        'sales_30d': safe_get(item, 'salesData', 'sales30d'),
    }
    result.append(extracted)

# 输出
output = {
    'result_list': result,
    'total_count': len(result),
    'success': True,
    'is_empty': len(result) == 0,
    'message': f'成功提取{len(result)}条数据' if result else '没有可提取的数据'
}
```

---

## 调试技巧

### 1. 检查数据类型

在处理前先检查数据类型:

```python
data = input["data"]

print(f"数据类型: {type(data)}")

if isinstance(data, str):
    print("数据是字符串,需要解析")
    data = json.loads(data)

if isinstance(data, dict):
    print(f"字典的键: {list(data.keys())}")
    
    # 检查嵌套字段的类型
    if 'skuSale' in data:
        print(f"skuSale的类型: {type(data['skuSale'])}")
```

### 2. 使用测试数据

在Python代码块中添加测试模式:

```python
# 测试模式开关
TEST_MODE = False

if TEST_MODE:
    # 使用测试数据
    input = {
        "data": '{"list":[{"skuSale":"{\\"globalSkuId\\":123}"}]}'
    }

# 正常处理逻辑
data = input["data"]
# ...
```

### 3. 记录中间结果

在关键步骤记录数据状态:

```python
data = input["data"]
print(f"步骤1 - 原始数据类型: {type(data)}")

if isinstance(data, str):
    data = json.loads(data)
    print(f"步骤2 - 解析后类型: {type(data)}")

items = data.get('list', [])
print(f"步骤3 - 列表长度: {len(items)}")

if items:
    print(f"步骤4 - 第一条数据的键: {list(items[0].keys())}")
```

---

## 注意事项

### 1. 性能考虑

- **避免重复解析**: 对同一字段多次访问时,先解析一次并保存
- **批量处理**: 对大量数据使用列表推导式而不是循环

```python
# ❌ 不推荐: 重复解析
for item in items:
    sku_id = safe_get(item, 'skuSale', 'globalSkuId')
    article = safe_get(item, 'skuSale', 'articleNumber')  # skuSale被解析两次

# ✅ 推荐: 先解析再访问
for item in items:
    sku_sale = parse_json_field(item.get('skuSale'))
    if sku_sale:
        sku_id = sku_sale.get('globalSkuId')
        article = sku_sale.get('articleNumber')
```

### 2. 数据验证

- **始终验证数据类型**: 不要假设数据一定是预期的类型
- **处理空值**: 使用默认值避免None导致的错误
- **边界检查**: 访问数组元素前检查索引是否有效

### 3. 错误提示

- **提供清晰的错误信息**: 帮助快速定位问题
- **记录失败的数据**: 便于后续分析

```python
failed_items = []

for idx, item in enumerate(items):
    try:
        extracted = extract_fields(item)
        result.append(extracted)
    except Exception as e:
        failed_items.append({
            'index': idx,
            'error': str(e),
            'data': str(item)[:100]  # 只记录前100个字符
        })

output = {
    'result_list': result,
    'total_count': len(result),
    'failed_count': len(failed_items),
    'failed_items': failed_items,
    'success': len(failed_items) == 0
}
```

---

## 总结

1. **明道云的JSON字符串序列化是正常特性**,不是bug
2. **使用 `parse_json_field()` 和 `safe_get()` 函数**可以优雅地处理这个特性
3. **始终包含错误处理和数据验证**,确保代码的健壮性
4. **在开发时使用调试技巧**,快速定位问题

通过正确理解和处理这个特性,可以在明道云中流畅地处理各种复杂的API数据。
