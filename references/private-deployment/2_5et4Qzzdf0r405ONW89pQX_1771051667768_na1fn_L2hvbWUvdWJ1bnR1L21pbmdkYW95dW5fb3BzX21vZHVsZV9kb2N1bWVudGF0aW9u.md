# 明道云私有部署运维管理模块深度研究

## 1. 核心概念和定义

明道云私有部署版运维平台是一款面向企业级用户的智能运维管理工具，专注于为私有化环境提供全栈监控、智能诊断与精细化运维能力。它支持在本地服务器及公有云/私有云环境中灵活部署，以零侵入方式保障企业数据主权与合规性，同时降低运维复杂度，助力运维团队高效管理基础设施和应用，提升运维效率和系统稳定性。

**主要功能包括：**

*   **系统资源监控**：内置多维度实时监控面板，全方位覆盖服务器资源（CPU、内存、磁盘、网络）性能等核心指标，支持细粒度数据钻取与历史趋势分析，为系统优化提供精准依据。
*   **智能告警联动**：基于业务场景自定义阈值规则，支持邮件、企业微信、钉钉、Webhook 等多通道告警推送，助力实现异常及时响应，帮助快速定位根因，缩短故障恢复周期。
*   **数据库性能优化**：针对 MongoDB 慢查询场景，支持自动分析绝大多数查询，生成索引优化建议，支持一键创建索引，降低数据库运维门槛。
*   **日志全生命周期管理** (开发中)：提供可视化日志归档策略配置，支持按时间维度自动化清理冗余数据，实现日志存储资源的高效利用。

## 2. 完整配置清单

### 2.1 部署相关配置

| HAP 部署模式 | 运维平台部署方案 |
| --- | --- |
| 单机模式 | 基于 Docker Compose |
| 集群模式 | 基于 Kubernetes |

**部署服务器资源要求：**

*   部署服务器需预留 CPU、内存资源在 2C、4G 以上，磁盘可用空间不小于 50G。
*   为减少部署复杂度，建议基于 HAP 现有服务器进行部署运维平台。
*   如需要将运维平台独立部署在独立一台服务器，可以参考环境变量清单，通过环境变量将相关组件的连接信息传递给 `agent` 服务。

**组件相关要求：**

1.  **MySQL 用户权限**：
    *   `SELECT` 权限：允许读取数据库中的表和数据
    *   `SHOW DATABASES` 权限：允许查看所有数据库
    *   `PROCESS` 权限：允许查看其他用户的线程，以获取性能数据
    *   `REPLICATION CLIENT` 权限：用于访问复制状态和信息
2.  **MongoDB 用户权限**：建议使用 root 角色权限。如果需要最小权限，参考以下创建用户授权语句：
    ```javascript
    use admindb.createUser({
        user: "opsuser",
        pwd: "your_secure_password",
        roles: [
            { role: "clusterMonitor", db: "admin" },
            { role: "readAnyDatabase", db: "admin" },
            { role: "clusterManager", db: "admin" },
            { role: "dbAdmin", db: "mdwsrows" },
            { role: "readWrite", db: "mdwsrows" },
            { role: "dbAdmin", db: "mdservicedata" },
            { role: "readWrite", db: "mdservicedata" },
            { role: "dbAdmin", db: "mdworksheet" },
            { role: "readWrite", db: "mdworksheet" },
            { role: "dbAdmin", db: "mdworkflow" },
            { role: "readWrite", db: "mdworkflow" }
        ]
    })
    ```
3.  **Redis 权限**：需具备 `读取` Redis 数据的权限。
4.  **Kafka 权限**：如果有认证则需具备 `读取 Kafka 元数据` 的权限。
5.  **Elasticsearch 权限**：用户需具备 `读取写入索引` 的权限。
6.  **Flink 服务地址**：需允许运维平台内网环境访问。

### 2.2 环境变量配置

HAP 私有部署版容器内使用的环境变量含义如下：

| 环境变量名 | 说明 |
| --- | --- |
| ENV_SERVERID | 实例编号，每个实例不能相同，从1开始（仅精简/标准集群） |
| ENV_MINGDAO_PROTO | 协议，支持设置 http、https |
| ENV_MINGDAO_HOST | 访问地址，如：hap.domain.com（如果使用域名请先配置代理） |
| ENV_MINGDAO_PORT | 端口，如：80 |
| ENV_MINGDAO_SUBPATH | 子路径，如：`https://www.domain.com/hap` ，则设置为 /hap |
| ENV_MINGDAO_INTRANET_ENDPOINT | `ENV_MINGDAO_HOST:ENV_MINGDAO_PORT` 对应的内网地址，如：`192.168.1.1:8880`，集群模式下需配置 |
| ENV_MINGDAO_WORKWXAPI | 企业微信 API 接口 host，默认：`https://qyapi.weixin.qq.com`，如果使用的是私有部署版企业微信，可修改此参数 |
| ENV_MINGDAO_FEISHUAPI | 飞书 API 接口 host，默认：`https://open.feishu.cn/open-apis`，如果使用的是私有部署版飞书，可修改此参数 |
| ENV_DOCPREVIRE_ENDPOINTS | 文档预览服务地址，默认：`doc:8000`，如果集群模式下是多个实例则使用英文逗号分隔 |
| ENV_WEB_ENDPOINTS | Web 前端站点地址（二次开发场景下需要），如：`192.168.1.1:81,192.168.1.1:82` |
| ENV_MONGODB_URI | MongoDB连接地址，如：`mongodb://192.168.1.1:27017,192.168.1.2:27017,192.168.1.3:27017` |
| ENV_MONGODB_OPTIONS | MongoDB uri 参数，需以?开头 |
| ENV_MONGODB_CACHEGB | MongoDB 允许最大使用内存 |
| ENV_MYSQL_HOST | MySQL地址，如：`192.168.2.1` 【VIP】 |
| ENV_MYSQL_PORT | MySQL端口，默认：3306 |
| ENV_MYSQL_USERNAME | MySQL用户名，默认：root |
| ENV_MYSQL_PASSWORD | MySQL密码，可为空，默认：123456 |
| ENV_REDIS_HOST | 【Redis 主从或单机模式】Redis 地址，如：`192.168.3.1` 【VIP】 |
| ENV_REDIS_PORT | 【Redis 主从或单机模式】Redis 端口，默认：6379 |
| ENV_REDIS_PASSWORD | 【Redis 主从或单机模式】Redis 密码，可为空，默认：123456 |
| ENV_REDIS_MAXMEMORY | 【Redis 单机模式】允许最大使用内存，如：`5gb`，超过使用 LRU 算法清理，默认无限制 |
| ENV_REDIS_SENTINEL_ENDPOINTS | 【Redis 哨兵模式】哨兵地址，多个使用英文逗号分隔 |
| ENV_REDIS_SENTINEL_MASTER | 【Redis 哨兵模式】master 名称 |
| ENV_REDIS_SENTINEL_PASSWORD | 【Redis 哨兵模式】连接密码 |
| ENV_KAFKA_ENDPOINTS | Kafka连接地址，如：`192.168.1.4:9092,192.168.1.5:9092,192.168.1.6:9092` |
| ENV_KAFKA_SECURITY_PROTOCOL | Kafka安全协议，支持 `Plaintext`(默认)、`SaslPlaintext` |
| ENV_KAFKA_SASL_MECHANISM | 仅在 `ENV_KAFKA_SECURITY_PROTOCOL` 为 `SaslPlaintext` 时使用 ，固定值：`PLAIN` |
| ENV_KAFKA_SASL_USERNAME | 仅在 `ENV_KAFKA_SECURITY_PROTOCOL` 为 `SaslPlaintext` 时使用 ，认证用户名 |
| ENV_KAFKA_SASL_PASSWORD | 仅在 `ENV_KAFKA_SECURITY_PROTOCOL` 为 `SaslPlaintext` 时使用 ，认证密码 |
| ENV_ELASTICSEARCH_ENDPOINTS | Elasticsearch连接地址，，如：`http://192.168.1.4:9200,http://192.168.1.5:9200,http://192.168.1.6:9200` |
| ENV_ELASTICSEARCH_PASSWORD | Elasticsearch连接认证，可为空，格式：`username:password` |
| ENV_FILE_ENDPOINTS | 文件存储服务地址，如：`192.168.1.12:9000,192.168.1.13:9000,192.168.1.14:9000,192.168.1.15:9000` |
| ENV_FILE_ACCESSKEY | 文件存储服务 ACCESSKEY |
| ENV_FILE_SECRETKEY | 文件存储服务 SECRETKEY |
| ENV_FILECACHE_EXPIRE | 缩略图缓存是否过期服务，默认 `true` |
| ENV_FILE_DELETE_ENABLE_PHYSICAL | 是否开启文件物理删除，默认 `false` |
| ENV_FILE_DELETE_BEFORE_DAYS | 仅在 `ENV_FILE_DELETE_ENABLE_PHYSICAL` 为 `true` 时使用，物理删除多少天前的文件，默认：7 |
| ENV_FILE_DELETE_TASK_CRON | 仅在 `ENV_FILE_DELETE_ENABLE_PHYSICAL` 为 `true` 时使用，定时认证执行时间，默认：`0 0 1 * * ?` 每天凌晨1点 |
| ENV_FILE_UPLOAD_TOKEN_EXPIRE_MINUTES | 文件上传 Token 过期时间，默认：120 ，单位：分 |
| ENV_FILE_DOWNLOAD_TOKEN_EXPIRE_MINUTES | 文件下载地址中的 Token 过期时间，默认：60，单位：分 |
| ENV_FLINK_URL | Flink 连接地址 |
| ENV_FRAME_OPTIONS | IFrame 引用策略，支持：ALLOWALL、SAMEORIGIN【默认】、DENY、ALLOW-FROM uri |
| ENV_WEB_ENDPOINTS | 前端服务地址，多个使用英文逗号分隔 |
| ENV_CDN_URI | CDN 地址，如：[http://hapcdn.domain.com]() |
| ENV_WORKFLOW_CONSUMER_THREADS | 工作流消息队列的消费线程数，默认：3 |
| ENV_WORKFLOW_ROUTER_CONSUMER_THREADS | 工作流慢消息队列的消费线程数，默认：3 |
| ENV_WORKFLOW_WEBHOOK_TIMEOUT | 工作流中 Webhook 执行接口的超时时间，单位秒，默认：10 |
| ENV_WORKFLOW_COMMAND_TIMEOUT | 工作流中代码块执行超时时间，单位秒，默认：10 |
| ENV_WORKFLOW_COMMAND_MAXMEMORY | 工作流中代码块执行允许最大使用内存，单位：M，默认：64 |
| ENV_WORKFLOW_GRPC_TIMEOUT | 工作流服务调用其他服务接口超时时长，默认：180，单位：秒 |
| ENV_WORKFLOW_PARALLELISM_THREADS | 工作流并行消费线程池大小，单位秒，默认：10 |
| ENV_WORKFLOW_TRIGER_DELAY_SECONDS | 工作表事件触发工作流延迟秒数，单位秒，默认：5 |
| ENV_WORKFLOW_IP_BLOCKLIST | 工作流发送自定义请求、API集成调用外部接口， IP 黑名单，多个使用英文逗号分隔 |
| ENV_WORKSHEET_EXCEL_IMPORT_THREADS | 工作表导入 Excel 处理线程数，默认：3 |
| ENV_WORKSHEET_REFRESH_ROWS_MINUTES | 工作表数据校准时间间隔，默认：120 |
| ENV_WORKSHEET_CONSUMER_THREADS | 工作表消费线程数，默认：2 |
| ENV_SESSION_TIMEOUT_MINUTES | 会话过期时间，单位分，默认：10080 |
| ENV_SESSION_DISABLE_REFRESH | 活跃时是否自动刷新会话有效期，默认：`ENV_SESSION_TIMEOUT_MINUTES` 值 |
| ENV_SESSION_PORTAL_TIMEOUT_MINUTES | 外部门户会话过期时间，单位分，默认：10080 |
| ENV_WPS_CONVERT_APPID | WPS PDF 转换服务 appId |
| ENV_WPS_CONVERT_APPSECRET | WPS PDF 转换服务 appSecret |
| ENV_WPS_PREVIEW_APPID | WPS 文档编辑预览服务 appId |
| ENV_WPS_PREVIEW_APPSECRET | WPS 文档编辑预览服务 appSecret |
| ENV_OCR_SENDFILE | 是否以 base64 编码发送文件。默认：false，通过 HAP 文件地址读取文件 |
| ENV_OCR_API_PROXY | 是否启用正向代理调用文字识别服务接口 |
| ENV_SOCKET_POLLING | Socket 连接是否使用轮询模式，默认：false（长连接） |
| ENV_DISABLE_IPV6 | 是否禁用容器内 Nginx 的 IPv6 端口监听。默认值：false |
| ENV_INIT_SERVICE_WAITMS | 容器在启动时等待存储组件准备就绪的时间，单位：毫秒，默认值：120000 |
| ENV_FLINK_S3_BUCKET | 定义 datapipeline 服务使用的 S3 存储桶。默认值：mdoc。 若修改 Flink 使用的默认存储桶，此配置也需同步更新。 |

## 3. 操作步骤详解

### 3.1 部署运维平台

根据部署模式（单机或集群），选择相应的部署方案：

*   **单机模式**：基于 Docker Compose 部署。
*   **集群模式**：基于 Kubernetes 部署。

**部署前准备：**

1.  **服务器资源**：确保部署服务器预留 CPU、内存资源在 2C、4G 以上，磁盘可用空间不小于 50G。
2.  **部署位置**：为减少部署复杂度，建议基于 HAP 现有服务器进行部署运维平台。如需独立部署，请参考环境变量清单，通过环境变量将相关组件的连接信息传递给 `agent` 服务。

**组件权限配置：**

在部署运维平台之前，需要为运维平台访问的各个组件配置相应的权限。以下是详细的权限要求：

1.  **MySQL 用户权限**：
    *   `SELECT` 权限：允许读取数据库中的表和数据。
    *   `SHOW DATABASES` 权限：允许查看所有数据库。
    *   `PROCESS` 权限：允许查看其他用户的线程，以获取性能数据。
    *   `REPLICATION CLIENT` 权限：用于访问复制状态和信息。

2.  **MongoDB 用户权限**：建议使用 `root` 角色权限。如果需要最小权限，请参考以下创建用户授权语句：
    ```javascript
    use admindb.createUser({
        user: "opsuser",
        pwd: "your_secure_password",
        roles: [
            { role: "clusterMonitor", db: "admin" },
            { role: "readAnyDatabase", db: "admin" },
            { role: "clusterManager", db: "admin" },
            { role: "dbAdmin", db: "mdwsrows" },
            { role: "readWrite", db: "mdwsrows" },
            { role: "dbAdmin", db: "mdservicedata" },
            { role: "readWrite", db: "mdservicedata" },
            { role: "dbAdmin", db: "mdworksheet" },
            { role: "readWrite", db: "mdworksheet" },
            { role: "dbAdmin", db: "mdworkflow" },
            { role: "readWrite", db: "mdworkflow" }
        ]
    })
    ```

3.  **Redis 权限**：需具备 `读取` Redis 数据的权限。

4.  **Kafka 权限**：如果有认证则需具备 `读取 Kafka 元数据` 的权限。

5.  **Elasticsearch 权限**：用户需具备 `读取写入索引` 的权限。

6.  **Flink 服务地址**：需允许运维平台内网环境访问。

### 3.2 监控配置

运维平台的监控能力基于 Prometheus 和 Grafana 构建，通过 Exporter 机制实现数据采集。

**监控对象与 Exporter 组件对应关系：**

| 监控对象 | Exporter 组件 |
| --- | --- |
| 主机系统 | Node Exporter |
| 消息队列 | Kafka Exporter |
| 搜索引擎 | Elasticsearch Exporter |
| 缓存服务 | Redis Exporter |
| 关系数据库 | MySQL Exporter |
| 文档数据库 | MongoDB Exporter |

**监控数据流程：**

1.  **数据采集**：Prometheus Server 根据预设配置周期性地从各 Exporter 端点拉取数据，确保数据的实时性与准确性。
2.  **数据存储**：Prometheus TSDB（时间序列数据库）高效存储采集到的监控数据，支持数据压缩与快速查询。
3.  **数据可视化**：Grafana 提供丰富的可视化组件，支持多维度仪表盘定制和数据分析，帮助用户直观展示和洞察监控数据。

### 3.3 告警配置

1.  **统一管理**：通过 Grafana 配置告警规则，实现对异常情况的实时监控和自动告警。
2.  **基于 PromQL**：告警规则利用 PromQL 查询 Prometheus 中的监控数据，构建灵活的告警规则。
3.  **多渠道支持**：系统支持邮件、钉钉、企业微信、Webhook 等多种告警通知方式，确保运维人员能够第一时间获取异常信息并及时响应。

## 4. 最佳实践

*   **资源规划**：根据实际业务负载和未来增长预期，合理规划部署服务器的 CPU、内存和磁盘资源，避免资源瓶颈。
*   **权限最小化**：为数据库用户配置最小必要权限，提高系统安全性。
*   **独立部署**：如果条件允许，建议将运维平台独立部署在单独的服务器上，以避免与业务系统争抢资源，并提高运维平台的稳定性。
*   **告警阈值优化**：根据历史数据和业务特点，精细化配置告警阈值，减少误报，确保告警的有效性。
*   **多渠道告警**：配置多种告警通知渠道（邮件、微信、钉钉、Webhook），确保关键告警能够及时触达运维人员。
*   **定期数据归档**：对于日志和监控数据，根据业务需求和合规性要求，制定合理的归档策略，定期清理冗余数据，释放存储空间。
*   **版本升级策略**：在进行版本升级前，务必仔细阅读官方文档，了解升级注意事项和兼容性，并在测试环境中进行充分验证。

## 5. 常见问题

*   **问题1：运维平台无法正常启动或访问。**
    *   **解决方案**：检查部署服务器的资源是否满足要求（CPU、内存、磁盘空间），检查相关组件（MySQL, MongoDB, Redis, Kafka, Elasticsearch, Flink）的连接配置和权限是否正确，查看日志文件获取详细错误信息。
*   **问题2：监控数据不显示或不准确。**
    *   **解决方案**：检查 Prometheus Server 是否能正常拉取数据，检查各个 Exporter 组件是否正常运行，检查 Grafana 的数据源配置和仪表盘查询语句是否正确。
*   **问题3：告警无法正常发送。**
    *   **解决方案**：检查 Grafana 的告警规则配置是否正确，检查告警通知渠道（邮件、微信、钉钉、Webhook）的配置是否有效，检查网络连通性。
*   **问题4：数据库慢查询过多，影响系统性能。**
    *   **解决方案**：利用运维平台的数据库性能优化功能，分析慢查询日志，根据索引优化建议创建或优化索引。同时，检查数据库服务器的资源使用情况，考虑扩容或优化数据库配置。

## 6. 与其他模块的关联

运维管理模块与明道云私有部署的多个核心模块紧密关联，共同保障系统的稳定运行和高效管理：

*   **与核心业务模块关联**：运维平台监控 HAP 核心业务模块（如工作流、工作表、用户管理等）的资源使用情况和性能指标，确保业务的正常运行。
*   **与数据存储模块关联**：运维平台监控并优化 MongoDB、MySQL、Redis、Elasticsearch 等数据存储组件的性能，保障数据读写效率和存储安全。
*   **与消息队列模块关联**：运维平台监控 Kafka 消息队列的运行状态，确保消息的可靠传输和处理。
*   **与文件存储模块关联**：运维平台监控 MinIO 等文件存储服务的状态，保障文件上传下载的正常进行。
*   **与二次开发模块关联**：二次开发过程中，运维平台可以提供性能监控和日志分析，帮助开发者定位和解决问题。

## 7. 实际案例

**案例：某企业部署明道云私有部署版后，通过运维平台优化系统性能。**

**背景**：该企业初期部署明道云私有部署版后，发现系统在高峰期响应缓慢，用户体验不佳。

**操作步骤**：

1.  **部署运维平台**：企业按照文档指引，在独立服务器上部署了明道云运维平台，并配置了对 HAP 核心组件的监控。
2.  **系统资源监控**：通过运维平台的监控面板，发现高峰期数据库服务器的 CPU 和内存使用率持续高企，同时伴有大量的 MongoDB 慢查询。
3.  **数据库性能优化**：运维平台自动分析了慢查询日志，并给出了索引优化建议。运维人员根据建议，为 MongoDB 的几个关键集合创建了复合索引。
4.  **告警配置**：配置了数据库 CPU 使用率超过 80% 和慢查询数量超过阈值时触发告警，并通过企业微信通知运维团队。
5.  **效果**：索引优化后，系统响应速度显著提升，高峰期 CPU 和内存使用率恢复正常水平，用户体验得到极大改善。告警机制也确保了运维团队能及时发现并处理潜在问题。

**最佳实践体现**：

*   **独立部署运维平台**：避免了运维平台自身对业务系统的性能影响。
*   **利用数据库性能优化功能**：精准定位并解决了性能瓶颈。
*   **配置有效告警**：实现了对关键指标的实时监控和快速响应。
*   **持续监控与优化**：通过运维平台持续观察系统性能，确保系统长期稳定高效运行。
