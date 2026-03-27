# 明道云私有部署代码块扩展模块研究报告

## 1. 核心概念和定义

明道云私有部署的代码块扩展模块允许用户在工作流节点中集成自定义的JavaScript或Python代码，以实现对业务数据的个性化处理和计算。它解决了HAP默认代码块执行环境（Node.js v10.16.3, Python v3.7.5）版本相对较老的问题，通过扩展执行环境版本，用户可以使用更新的语言特性和库，从而提升代码块的灵活性和功能性。

**代码块节点功能**：在工作流节点内输入一段代码（JavaScript/Python），对流程中的记录数据进行个性化处理计算，得到新的数据内容并输出，供后续节点使用。[^1]

**扩展执行环境版本**：指在明道云私有部署环境中，更新或添加代码块执行时所依赖的编程语言（如Node.js和Python）的版本。这使得用户能够利用更现代的语言特性和更丰富的第三方库来编写代码块，以满足更复杂的业务逻辑需求。[^2]

## 2. 完整配置清单

扩展代码块执行环境版本主要涉及以下配置项：

| 配置项 | 说明 | 示例值 | 备注 |
|---|---|---|---|
| `commandv2.image` | 指定新的代码块执行环境镜像。该镜像包含了Node.js和Python的更新版本。 | `registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-command:node2011-python312` | 默认镜像为`node1018-python36`。[^2] |
| `md.grpc.client.MDCommandService[0].address` | 代码块服务地址配置。 | `static://commandv2:9098` | |
| `md.grpc.client.MDCommandService[0].nodeVersion` | 指定代码块执行环境的Node.js版本。 | `20.11` | 需与镜像中的Node.js版本一致。[^2] |
| `md.grpc.client.MDCommandService[0].pythonVersion` | 指定代码块执行环境的Python版本。 | `3.12` | 需与镜像中的Python版本一致。[^2] |
| `volumes` | 挂载代码块服务扩展配置文件到app服务。 | `- ./volume/workflow/application-www-ext.properties:/usr/local/MDPrivateDeployment/workflow/application-www-ext.properties` | 需要挂载到workflow、workflowconsumer、workflowintegration、workflowplugin四个服务路径。[^2] |

## 3. 操作步骤详解

以下是扩展代码块执行环境版本的详细操作步骤：

1.  **下载新的代码块执行环境镜像**：
    使用`docker pull`命令下载包含新版本Node.js和Python的镜像。例如，下载Node.js 20.11和Python 3.12的镜像：
    ```bash
    docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-command:node2011-python312
    ```
    如果需要离线部署，可以从明道云提供的离线包下载。[^2]

2.  **修改配置文件**：
    在明道云的配置文件中，添加或修改`commandv2`的`image`配置，指向新下载的镜像：
    ```yaml
    commandv2:
      image: registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-command:node2011-python312
    ```
    [^2]

3.  **创建代码块服务扩展配置文件**：
    创建一个名为`application-www-ext.properties`的配置文件，例如在`/data/mingdao/script/volume/workflow/`路径下。文件内容如下，用于指定代码块服务的地址和版本信息：
    ```properties
    md.grpc.client.MDCommandService[0].address=static://commandv2:9098
    md.grpc.client.MDCommandService[0].nodeVersion=20.11
    md.grpc.client.MDCommandService[0].pythonVersion=3.12
    ```
    [^2]

4.  **挂载配置文件**：
    在`app`服务的`volumes`配置中，添加对上述`application-www-ext.properties`文件的挂载。需要确保该文件被挂载到`workflow`、`workflowconsumer`、`workflowintegration`和`workflowplugin`这四个服务的相应路径下：
    ```yaml
    volumes:
      - ./volume/workflow/application-www-ext.properties:/usr/local/MDPrivateDeployment/workflow/application-www-ext.properties
      - ./volume/workflow/application-www-ext.properties:/usr/local/MDPrivateDeployment/workflowconsumer/application-www-ext.properties
      - ./volume/workflow/application-www-ext.properties:/usr/local/MDPrivateDeployment/workflowintegration/application-www-ext.properties
      - ./volume/workflow/application-www-ext.properties:/usr/local/MDPrivateDeployment/workflowplugin/application-www-ext.properties
    ```
    [^2]

5.  **重启服务**：
    完成上述配置后，重启明道云服务，使新的代码块执行环境版本生效。[^2]

## 4. 最佳实践

*   **版本兼容性**：明道云支持多版本切换使用，如果不想使用老版本，也可以彻底切换到新版本。在升级前，务必测试代码块在新环境中的兼容性，避免因版本差异导致的问题。[^2]
*   **依赖库扩展**：对于代码块依赖库的扩展，依然参考“如何扩展代码块依赖库”文档，但需注意路径调整，例如`python3.6`改成`python3.12`、`node-10.18.0`改成`node-20.11`。[^2]
*   **参数命名规范**：在代码块中输出参数时，参数名必须使用英文命名，避免使用中文或特殊字符，以防止不兼容出错。[^1]
*   **代码片段库**：充分利用代码片段库功能，将常用的代码块片段保存起来，方便团队成员或自己下次直接使用，提高开发效率。[^1]
*   **AI生成代码**：利用明道云集成的AI能力，根据功能需求描述自动生成代码，这可以大大简化代码块的编写过程，并确保代码符合规范。[^1]
*   **错误处理与重试**：代码块执行失败时，系统默认会自动重试1次。对于关键业务流程，可以根据需要取消自动重试功能，以便在第一次失败时及时发现并处理问题。[^1]

## 5. 常见问题

*   **问题**：代码块执行环境版本升级后，旧的代码块无法正常运行。
    **解决方案**：检查旧代码块所依赖的库和语法是否与新版本环境兼容。可能需要对代码进行适当修改或调整依赖库路径。如果存在兼容性问题，可以考虑使用多版本共存模式，或者彻底切换到新版本前进行充分测试。[^2]

*   **问题**：代码块输出参数在后续节点中无法识别或使用。
    **解决方案**：确保代码块的输出参数名使用英文命名，并且输出格式符合`output = {参数名1:参数值1,参数名2: 参数值2}`的规范。同时，只有在代码块节点测试成功并保存后，后续节点才能使用其输出参数。[^1]

*   **问题**：如何调试代码块？
    **解决方案**：明道云代码块节点提供了测试功能，可以在编写代码后点击测试按钮，并填写测试值来验证代码的执行结果和输出。[^1]

*   **问题**：代码块执行超时或内存占用过高导致失败。
    **解决方案**：优化代码逻辑，减少不必要的计算和资源消耗。明道云私有部署支持自定义工作流代码块执行允许使用的最大内存和超时时间，可以根据实际需求进行调整。[^2]

## 6. 与其他模块的关联

代码块扩展模块主要与以下模块关联：

*   **工作流**：代码块作为工作流中的一个节点，与其他节点协同工作，实现复杂的业务逻辑自动化。例如，可以接收“获取多条数据”节点的数据进行处理，并将处理结果传递给“更新记录”或“发送通知”等节点。[^1]
*   **API集成**：代码块可以用于调用外部API，支持WebService SOAP协议，参数格式支持XML/JSON/Form-Data，请求方式支持GET/POST/PUT/DELETE，从而实现与第三方系统的集成。[^1]
*   **AI能力**：明道云集成了AI能力，可以根据用户输入的功能需求描述自动生成代码块代码，大大提高了开发效率。[^1]

## 7. 实际案例

### 案例一：根据身份证号获取性别和出生日期（JavaScript）

**场景**：在工作流中，需要根据用户输入的身份证号自动提取其性别和出生日期。

**代码块配置**：

*   **输入参数**：`IDCard` (类型：文本)
*   **代码**：
    ```javascript
    var idcard = input.IDCard;
    var birthday = idcard.substr(6, 4) + '-' + idcard.substr(10, 2) + '-' + idcard.substr(12, 2);
    var sex = '女';
    if (idcard.substr(16, 1) % 2 == 1) {
        sex = '男';
    }
    output = { birthday: birthday, sex: sex };
    ```
*   **输出参数**：`birthday` (类型：文本), `sex` (类型：文本)

**逻辑解释**：代码通过字符串截取的方式从身份证号中提取出生日期和性别信息。身份证号的第7-14位是出生日期，第17位是性别（奇数代表男性，偶数代表女性）。[^1]

### 案例二：根据身份证号获取出生日期（Python）

**场景**：与案例一类似，但使用Python语言实现。

**代码块配置**：

*   **输入参数**：`IDcard` (类型：文本)
*   **代码**：
    ```python
    idcard = input["IDcard"]
    birthday = idcard[6:10] + '-' + idcard[10:12] + '-' + idcard[12:14]
    output = {'birthday': birthday}
    ```
*   **输出参数**：`birthday` (类型：文本)

**逻辑解释**：Python代码同样通过字符串切片从身份证号中提取出生日期信息。Python中访问输入参数使用`input["参数名"]`格式，输出参数使用字典格式。[^1]

## 参考文献

[^1]: [工作流节点--代码块节点 | 明道云](https://help.mingdao.com/workflow/node-code-block)
[^2]: [如何扩展代码块执行环境版本 | 私有部署](https://docs-pd.mingdao.com/faq/codeextensionversion)
