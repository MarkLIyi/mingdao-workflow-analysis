# 明道云私有部署安全配置模块深度研究

**模块名称：** 安全配置模块

**作者：** Manus AI

## 1. 核心概念和定义

明道云私有部署的安全配置模块旨在为用户提供一套全面的安全防护措施，确保私有部署环境下的数据安全、系统稳定和业务连续性。它不仅仅是简单的设置，更是一系列最佳实践和技术手段的集合，用于应对各种潜在的安全威胁。该模块通过对访问控制、密码策略、数据加密、备份恢复、漏洞管理、监控预警以及抗DDoS攻击等多个维度的配置与管理，构建起一个多层次、立体化的安全防护体系，帮助用户有效降低安全风险，保护核心资产。

**解决的问题：**

*   **未经授权的访问：** 限制非必要端口的暴露，防止外部恶意探测和攻击。
*   **弱密码风险：** 强制使用强密码策略，并提供数据库密码修改指南，避免因密码简单而被破解。
*   **数据传输安全：** 通过HTTPS加密通信，防止数据在传输过程中被窃听或篡改。
*   **数据丢失风险：** 建立完善的备份机制，确保数据在发生故障时能够及时恢复。
*   **系统漏洞：** 及时更新系统和软件，修补已知安全漏洞，减少攻击面。
*   **安全事件响应：** 建立监控和报警系统，快速发现并响应安全事件。
*   **拒绝服务攻击：** 提供DDoS防护建议，保障业务连续性。

## 2. 完整配置清单

明道云私有部署的安全配置涉及多个方面，以下是详细的配置项、参数、选项及其说明：

### 2.1 限制不必要的访问

**核心概念：** 通过配置防火墙规则、安全组策略等，限制对服务器和存储组件的非必要端口访问，从而缩小攻击面。

**配置项：**

| 配置项/参数 | 说明 | 默认值/选项 | 建议值/最佳实践 |
| :---------- | :--- | :---------- | :-------------- |
| HAP 系统部署依赖管理器端口 | 用于安装、在线升级、重启等功能。 | 38881 | 仅允许授权运维人员访问，部署完成后配置严格访问策略。 |
| 存储组件端口（MySQL） | MySQL数据库服务端口。 | 3306 | 仅允许可信IP访问，避免直接暴露到互联网。 |
| 存储组件端口（MongoDB） | MongoDB数据库服务端口。 | 27017 | 仅允许可信IP访问，避免直接暴露到互联网。 |
| 存储组件端口（Redis） | Redis缓存服务端口。 | 6379 | 仅允许可信IP访问，避免直接暴露到互联网。 |

**操作步骤：**

1.  **识别开放端口：** 了解明道云私有部署所使用的所有对外开放端口，特别是HAP管理器端口（38881）和数据库端口。
2.  **配置防火墙/安全组：** 在服务器操作系统层面或云服务提供商的安全组中，配置入站规则，仅允许特定IP地址或IP段访问上述端口。
    *   **示例（Linux防火墙 UFW）：**
        ```bash
        sudo ufw enable
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        sudo ufw allow from your_ops_ip to any port 38881  # 允许运维IP访问HAP管理器
        sudo ufw allow from trusted_app_server_ip to any port 3306 # 允许应用服务器访问MySQL
        sudo ufw allow from trusted_app_server_ip to any port 27017 # 允许应用服务器访问MongoDB
        sudo ufw allow from trusted_app_server_ip to any port 6379 # 允许应用服务器访问Redis
        sudo ufw status verbose
        ```
    *   **示例（云平台安全组）：** 在阿里云、腾讯云等控制台，找到对应ECS实例的安全组配置，添加入站规则，源IP填写允许访问的IP地址，端口范围填写对应服务端口。

### 2.2 使用强密码

**核心概念：** 采用复杂且定期更换的密码策略，防止暴力破解和字典攻击，保护系统和数据库的认证安全。

**配置项：**

| 配置项/参数 | 说明 | 默认值/选项 | 建议值/最佳实践 |
| :---------- | :--- | :---------- | :-------------- |
| 服务器登录密码 | 操作系统及SSH登录密码。 | 弱密码（不建议） | 包含大小写字母、数字、特殊字符，长度12位以上，定期更换。 |
| MySQL数据库密码 | MySQL数据库root用户及其他用户的密码。 | 弱密码（不建议） | 包含大小写字母、数字、特殊字符，长度12位以上，定期更换。 |
| Redis数据库密码 | Redis数据库的认证密码。 | 无密码（不建议） | 包含大小写字母、数字、特殊字符，长度12位以上，定期更换。 |
| MongoDB数据库密码 | MongoDB数据库的root用户及hap用户的密码。 | 无认证（不建议） | 包含大小写字母、数字、特殊字符，长度12位以上，定期更换。 |

**操作步骤：**

#### 2.2.1 修改 MySQL 默认密码 [1]

**提示：**

*   下列步骤以 root 密码为 `tC9S86SFWxga` 示例，**实际配置中务必对 root 密码修改**。
*   为确保兼容性，自定义密码时避免使用 "$"、"&"、"!" 或 "@" 等特殊字符，这些字符可能会干扰正则表达式解析，请改用连字符 "-" 或下划线 "_"。
*   操作前建议提前[数据备份](https://docs-pd.mingdao.com/deployment/docker-compose/standalone/data/backup)。

1.  **进入 mingdaoyun-sc 容器，登陆 MySQL：**
    ```bash
    docker exec -it $(docker ps | grep mingdaoyun-sc | awk '{print $1}') bash -c 'mysql -uroot -p123456 -h127.0.0.1'
    ```
    *说明：* `mingdaoyun-sc` 是明道云的服务容器，通过 `docker ps` 命令查找其ID，然后执行进入容器的bash，并使用默认密码 `123456` 登录MySQL。

2.  **修改 MySQL 密码：**
    ```sql
    GRANT ALL ON *.* to root@'%' IDENTIFIED BY 'tC9S86SFWxga';
    FLUSH PRIVILEGES;
    ```
    *说明：* 这条SQL命令将 `root` 用户在所有主机 `%` 上的密码修改为 `tC9S86SFWxga`。`FLUSH PRIVILEGES;` 命令用于刷新权限，使更改立即生效。

3.  **修改 docker-compose.yaml 文件，添加环境变量与端口映射：**
    *   `docker-compose.yaml` 文件默认路径：`/data/mingdao/script/docker-compose.yaml`
    *   在 `app` 服务下新增环境变量 `ENV_MYSQL_PASSWORD` 指定 MySQL 新密码：
        ```yaml
        ENV_MYSQL_PASSWORD: "tC9S86SFWxga"
        ```
        *说明：* `ENV_MYSQL_PASSWORD` 环境变量用于将新的MySQL密码传递给明道云应用服务，确保应用能够使用新密码连接数据库。
    *   在 `sc` 服务下新增端口映射，将容器内的 3306 端口映射出 (如果外部不需要访问 MySQL 则无需添加此端口映射)：
        ```yaml
        - 3306:3306
        ```
        *说明：* 端口映射允许宿主机或其他容器通过宿主机的3306端口访问容器内的MySQL服务。如果不需要外部访问，可以不进行此映射，以增强安全性。

4.  **在安装管理器所在目录下重启微服务生效配置：**
    ```bash
    bash service.sh restartall
    ```
    *说明：* 重启所有微服务，使 `docker-compose.yaml` 中的配置更改生效。

#### 2.2.2 修改 Redis 默认密码 [2]

**提示：**

*   下列步骤以 Redis 的新密码为 `f8K5ZT3aQXTb` 示例，**实际配置中务必对 Redis 密码修改**。
*   为确保兼容性，自定义密码时避免使用 "$"、"&"、"!" 或 "@" 等特殊字符，这些字符可能会干扰正则表达式解析，请改用连字符 "-" 或下划线 "_"。
*   操作前建议提前[数据备份](https://docs-pd.mingdao.com/deployment/docker-compose/standalone/data/backup)。
*   微服务版本需要大于 v3.7.0 以上才可以。

1.  **进入 mingdaoyun-sc 容器，登陆 Redis：**
    ```bash
    docker exec -it $(docker ps | grep mingdaoyun-sc | awk '{print $1}') bash -c 'redis-cli -a 123456'
    ```
    *说明：* 同样进入 `mingdaoyun-sc` 容器，并使用 `redis-cli` 客户端连接Redis服务，`123456` 为默认密码（如果之前设置过）。

2.  **修改 Redis 密码：**
    ```bash
    config set requirepass f8K5ZT3aQXTb
    ```
    *说明：* `config set requirepass` 命令用于设置Redis的认证密码。`f8K5ZT3aQXTb` 是新的密码。

3.  **修改 docker-compose.yaml 文件，添加环境变量与端口映射：**
    *   `docker-compose.yaml` 文件默认路径：`/data/mingdao/script/docker-compose.yaml`
    *   在 `app` 服务下新增环境变量 `ENV_REDIS_PASSWORD` 指定 Redis 新密码：
        ```yaml
        ENV_REDIS_PASSWORD: "f8K5ZT3aQXTb"
        ```
        *说明：* `ENV_REDIS_PASSWORD` 环境变量用于将新的Redis密码传递给明道云应用服务。
    *   在 `sc` 服务下新增端口映射，将容器内的 6379 端口映射出 (如果不需要外部访问则可以不添加端口映射)：
        ```yaml
        - 6379:6379
        ```
        *说明：* 端口映射允许宿主机或其他容器通过宿主机的6379端口访问容器内的Redis服务。如果不需要外部访问，可以不进行此映射。

4.  **在安装管理器所在目录下重启微服务生效配置：**
    ```bash
    bash service.sh restartall
    ```
    *说明：* 重启所有微服务，使 `docker-compose.yaml` 中的配置更改生效。

#### 2.2.3 MongoDB 添加认证 [3]

**提示：**

*   添加认证会创建两个用户，分别为 admin 库的 root 用户 及 所有业务库的 hap 用户。
*   下列步骤以 root 密码为 `hTkfDMYJ7ZLs`，hap 密码为 `tC9S86SFWxga` 示例，**实际配置中务必对 root 与 hap 密码修改**。
*   为确保兼容性，自定义密码时避免使用 "$"、"&"、"!" 或 "@" 等特殊字符，这些字符可能会干扰正则表达式解析，请改用连字符 "-" 或下划线 "_"。
*   操作前建议提前[数据备份](https://docs-pd.mingdao.com/deployment/docker-compose/standalone/data/backup)。
*   微服务版本需要大于 v3.7.0 以上才可以进行此操作。
*   如果[启用了聚合表功能](https://docs-pd.mingdao.com/deployment/docker-compose/standalone/aggregation-table/)，请参考对应文档完成创建聚合表数据库与对应角色和用户，以及调整副本集相关参数。

1.  **连接 MongoDB：**
    ```bash
    docker exec -it $(docker ps | grep mingdaoyun-sc | awk '{print $1}') mongo
    ```
    *说明：* 进入 `mingdaoyun-sc` 容器，并使用 `mongo` 客户端连接MongoDB服务。

2.  **在 mongo shell 中创建 admin 库的 root 用户 及 所有业务库的 hap 用户：**
    ```javascript
    use admin
    db.createUser({user:"root",pwd:"hTkfDMYJ7ZLs",roles:[{role:"root",db:"admin"}]})
    use MDLicense
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"MDLicense"}]})
    use ClientLicense
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"ClientLicense"}]})
    use commonbase
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"commonbase"}]})
    use MDAlert
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"MDAlert"}]})
    use mdactionlog
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdactionlog"}]})
    use mdapproles
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdapproles"}]})
    use mdapprove
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdapprove"}]})
    use mdapps
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdapps"}]})
    use mdattachment
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdattachment"}]})
    use mdcalendar
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdcalendar"}]})
    use mdcategory
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdcategory"}]})
    use MDChatTop
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"MDChatTop"}]})
    use mdcheck
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdcheck"}]})
    use mddossier
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mddossier"}]})
    use mdemail
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdemail"}]})
    use mdform
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdform"}]})
    use MDGroup
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"MDGroup"}]})
    use mdgroups
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdgroups"}]})
    use MDHistory
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"MDHistory"}]})
    use mdIdentification
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdIdentification"}]})
    use mdinbox
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdinbox"}]})
    use mdkc
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdkc"}]})
    use mdmap
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdmap"}]})
    use mdmobileaddress
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdmobileaddress"}]})
    use MDNotification
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"MDNotification"}]})
    use mdpost
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdpost"}]})
    use mdreportdata
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdreportdata"}]})
    use mdroles
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdroles"}]})
    use mdsearch
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdsearch"}]})
    use mdservicedata
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdservicedata"}]})
    use mdsms
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdsms"}]})
    use MDSso
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"MDSso"}]})
    use mdtag
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdtag"}]})
    use mdtransfer
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdtransfer"}]})
    use MDUser
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"MDUser"}]})
    use mdworkflow
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdworkflow"}]})
    use mdworksheet
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdworksheet"}]})
    use mdworkweixin
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdworkweixin"}]})
    use mdwsrows
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"mdwsrows"}]})
    use pushlog
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"pushlog"}]})
    use taskcenter
    db.createUser({user:"hap",pwd:"tC9S86SFWxga",roles:[{role:"readWrite",db:"taskcenter"}]})
    use mdintegration
    db.createUser({user: "hap",pwd: "tC9S86SFWxga",roles: [{role: "readWrite",db: "mdintegration"}]})
    use mdworksheetlog
    db.createUser({user: "hap",pwd: "tC9S86SFWxga",roles: [{role: "readWrite",db: "mdworksheetlog"}]})
    use mdworksheetsearch
    db.createUser({user: "hap",pwd: "tC9S86SFWxga",roles: [{role: "readWrite",db: "mdworksheetsearch"}]})
    use mddatapipeline
    db.createUser({user: "hap",pwd: "tC9S86SFWxga",roles: [{role: "readWrite",db: "mddatapipeline"}]})
    use mdwfplugin
    db.createUser({user: "hap",pwd: "tC9S86SFWxga",roles: [{role: "readWrite",db: "mdwfplugin"}]})
    use mdpayment
    db.createUser({user: "hap",pwd: "tC9S86SFWxga",roles: [{role: "readWrite",db: "mdpayment"}]})
    use mdwfai
    db.createUser({user: "hap",pwd: "tC9S86SFWxga",roles: [{role: "readWrite",db: "mdwfai"}]})
    ```
    *说明：* 这段JavaScript代码在MongoDB中创建了两个用户：`admin`数据库的`root`用户和所有业务数据库的`hap`用户。`root`用户拥有`admin`数据库的`root`角色，而`hap`用户拥有各个业务数据库的`readWrite`角色，确保了权限的最小化原则。

3.  **修改 docker-compose.yaml 文件，添加环境变量与端口映射：**
    *   `docker-compose.yaml` 文件默认路径：`/data/mingdao/script/docker-compose.yaml`
    *   在 `app` 服务下新增环境变量 `ENV_MONGODB_DAEMON_ARGS` 与 `ENV_MONGODB_URI`：
        ```yaml
        ENV_MONGODB_DAEMON_ARGS: "--auth"
        ENV_MONGODB_URI: "mongodb://hap:tC9S86SFWxga@sc:27017"
        ```
        *说明：* `ENV_MONGODB_DAEMON_ARGS: "--auth"` 启用了MongoDB的认证模式，强制客户端连接时提供用户名和密码。`ENV_MONGODB_URI` 指定了MongoDB的连接URI，其中包含了`hap`用户的用户名和密码，以及MongoDB服务的主机和端口。
    *   在 `sc` 服务下新增端口映射，将容器内的 27017 端口映射出 (如果外部不需要访问 mongodb 则无需添加此端口映射)：
        ```yaml
        - 27017:27017
        ```
        *说明：* 端口映射允许宿主机或其他容器通过宿主机的27017端口访问容器内的MongoDB服务。如果不需要外部访问，可以不进行此映射。

4.  **在安装管理器所在目录下重启微服务生效配置：**
    ```bash
    bash service.sh restartall
    ```
    *说明：* 重启所有微服务，使 `docker-compose.yaml` 中的配置更改生效。

### 2.3 加密数据

**核心概念：** 通过启用HTTPS协议，对客户端与服务器之间的数据传输进行加密，防止数据在传输过程中被截获、窃听或篡改。

**配置项：**

| 配置项/参数 | 说明 | 默认值/选项 | 建议值/最佳实践 |
| :---------- | :--- | :---------- | :-------------- |
| HTTPS协议 | 是否启用HTTPS加密。 | 否（HTTP） | 是（HTTPS） |
| SSL/TLS证书 | 用于HTTPS加密的数字证书。 | 无 | 有效的、受信任的SSL/TLS证书。 |

**操作步骤：**

1.  **获取SSL/TLS证书：** 从受信任的证书颁发机构（CA）获取SSL/TLS证书，包括证书文件（.crt或.pem）和私钥文件（.key）。
2.  **配置Web服务器/负载均衡器：** 在承载明道云服务的Web服务器（如Nginx、Apache）或负载均衡器上配置HTTPS。
    *   **示例（Nginx配置）：**
        ```nginx
        server {
            listen 443 ssl;
            server_name your_domain.com;

            ssl_certificate /etc/nginx/ssl/your_domain.com.crt;
            ssl_certificate_key /etc/nginx/ssl/your_domain.com.key;

            # 其他HTTPS相关配置，如TLS版本、加密套件等
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256';
            ssl_prefer_server_ciphers on;

            location / {
                proxy_pass http://your_mingdao_backend_service;
                # 其他代理配置
            }
        }

        server {
            listen 80;
            server_name your_domain.com;
            return 301 https://$host$request_uri;
        }
        ```
        *说明：* 这段Nginx配置强制将所有HTTP请求重定向到HTTPS，并配置了SSL证书和私钥，以及推荐的TLS协议和加密套件，以确保通信安全。
3.  **更新明道云配置：** 如果明道云内部配置需要指定协议，确保更新为HTTPS。

### 2.4 定期备份

**核心概念：** 制定并执行定期的数据备份策略，确保在系统故障、数据损坏或意外删除时能够快速恢复数据，防止数据丢失。

**配置项：**

| 配置项/参数 | 说明 | 默认值/选项 | 建议值/最佳实践 |
| :---------- | :--- | :---------- | :-------------- |
| 备份频率 | 数据备份的执行周期。 | 手动/不定期 | 每日/每周/根据业务需求定制 |
| 备份存储位置 | 备份数据的存放位置。 | 本地磁盘 | 异地存储、云存储、独立备份服务器 |
| 备份保留策略 | 备份数据的保留时长和版本数量。 | 无 | 至少保留7天/30天/根据合规性要求定制 |
| 备份类型 | 全量备份、增量备份、差异备份。 | 全量备份 | 根据数据量和恢复需求选择 |

**操作步骤：**

1.  **单机部署模式下的备份 [4]：**
    *   **可不停服务操作：**
        ```bash
        docker exec -it $(docker ps | grep -E 'mingdaoyun-community|mingdaoyun-hap' | awk '{print $1}') bash -c 'source /entrypoint.sh && backup mysql mongodb file'
        ```
        *说明：* 这条命令进入明道云的服务容器，并执行内置的备份脚本，可以备份MySQL、MongoDB和文件数据。此操作无需停止明道云服务，对业务影响小。
    *   **备份文件存放路径：** 默认备份文件会生成到 `/data/mingdao/script/volume/data/backup/时间戳/` 目录下。如果需要修改备份文件存放路径，可通过在 `docker-compose.yaml` app 服务中新增挂载，例如：
        ```yaml
        volumes:
          - /backup/:/data/backup/
        ```
        *说明：* 通过Docker的卷挂载功能，将容器内的备份目录映射到宿主机的 `/backup/` 目录，方便管理和迁移备份文件。
    *   **压缩备份文件：** 在 `backup` 目录下，执行 `tar -zcvf 20221111184140.tar.gz ./20221201193829` 将 dump 出来的文件进行压缩。
        *说明：* 压缩备份文件可以节省存储空间，并方便传输。`20221111184140.tar.gz` 是压缩后的文件名，`./20221201193829` 是待压缩的备份目录。
    *   **需要备份的数据目录：** `/data/mingdao/script/volume/data/` 目录下，`mysql`、`mongodb`、`storage`、`kafka`、`zookeeper`、`redis`、`elasticsearch-8` 文件夹均为需要备份数据。
    *   **停止 HAP 服务进行数据打包：**
        ```bash
        mkdir -p /backup  && cd /data/mingdao/script/volume/data/ && tar -zcvf /backup/20221111184140.tar.gz ./mysql ./mongodb ./storage ./kafka ./zookeeper ./redis ./elasticsearch-8
        ```
        *说明：* 如果需要对所有数据进行完整打包，可以停止HAP服务，然后将所有相关数据目录打包压缩到 `/backup/` 目录下。这通常用于灾难恢复或系统迁移。

2.  **集群部署模式下的备份：**
    *   需要对 **数据存储服务器** 和 **中间件服务器** 的数据目录进行定期备份。
    *   推荐对这两类服务器进行定期快照。
    *   HAP 实施团队提供的交付文档会说明具体的数据目录和备份策略。

### 2.5 漏洞修复

**核心概念：** 及时关注官方安全公告，定期更新明道云私有部署实例、操作系统及所有依赖软件，修补已知安全漏洞，降低系统被攻击的风险。

**操作步骤：**

1.  **关注官方公告：** 定期查看明道云官方网站、社区或订阅安全公告，获取最新的安全补丁和版本更新信息。
2.  **定期更新明道云实例：** 按照官方指引，对明道云私有部署实例进行定期更新和升级，确保使用最新、最安全的版本。
3.  **操作系统及依赖软件更新：** 及时更新服务器操作系统（如Linux发行版）以及明道云所依赖的各种软件（如Docker、数据库、Java等），修补其安全漏洞。
    *   **示例（Ubuntu系统更新）：**
        ```bash
        sudo apt update
        sudo apt upgrade -y
        sudo apt dist-upgrade -y
        sudo reboot # 必要时重启
        ```

### 2.6 监控与报警

**核心概念：** 部署日志管理和监控系统，实时监测系统运行状态、安全事件和异常行为，并在发现潜在威胁时及时发出警报，以便快速响应和处理。

**配置项：**

| 配置项/参数 | 说明 | 默认值/选项 | 建议值/最佳实践 |
| :---------- | :--- | :---------- | :-------------- |
| 日志收集 | 收集系统、应用、安全日志。 | 默认系统日志 | 集中式日志管理系统（ELK Stack, Grafana Loki） |
| 监控指标 | CPU、内存、磁盘、网络、服务状态、异常登录等。 | 基础系统指标 | 涵盖所有关键组件和安全相关指标 |
| 报警规则 | 触发报警的条件。 | 无 | 异常登录、高风险操作、资源耗尽、服务宕机等 |
| 报警通知方式 | 邮件、短信、微信、钉钉等。 | 无 | 多渠道通知，确保及时触达 |

**操作步骤：**

1.  **部署日志管理系统：** 搭建或使用集中式日志管理系统（如ELK Stack：Elasticsearch, Logstash, Kibana），收集明道云及其依赖组件的所有日志。
2.  **配置监控工具：** 使用Prometheus、Grafana等监控工具，收集服务器资源使用情况、明道云服务状态、数据库连接数等关键指标。
3.  **设置报警规则：** 根据安全需求和业务特点，配置报警规则，例如：
    *   连续多次登录失败。
    *   关键文件被修改。
    *   数据库连接异常。
    *   CPU、内存使用率过高。
    *   服务进程意外停止。
4.  **配置报警通知：** 将报警系统与邮件、短信、微信、钉钉等通知渠道集成，确保报警信息能够及时发送给相关负责人。

### 2.7 DDoS 防护

**核心概念：** 采用分布式拒绝服务（DDoS）防护措施，抵御恶意流量攻击，保障明道云服务的可用性和业务连续性。

**配置项：**

| 配置项/参数 | 说明 | 默认值/选项 | 建议值/最佳实践 |
| :---------- | :--- | :---------- | :-------------- |
| DDoS防护服务 | 是否使用专业的DDoS防护服务。 | 否 | 是（云服务商DDoS高防、CDN） |
| 防火墙规则 | 识别和阻止恶意流量的规则。 | 基础规则 | 针对常见DDoS攻击类型的定制规则 |
| 入侵检测系统（IDS） | 监测网络流量，发现恶意行为。 | 无 | 部署IDS/IPS系统 |

**操作步骤：**

1.  **评估DDoS风险：** 根据业务重要性、历史攻击情况等，评估潜在的DDoS攻击风险。
2.  **选择DDoS防护方案：**
    *   **云服务商DDoS高防：** 如果部署在云平台上，优先考虑使用云服务商提供的DDoS高防服务，通常具有较强的防护能力。
    *   **CDN服务：** 使用CDN（内容分发网络）可以有效分散流量，隐藏源站IP，减轻DDoS攻击对源站的影响。
    *   **硬件/软件防火墙：** 配置专业的硬件防火墙或软件防火墙（如Nginx、HAProxy等）进行流量过滤和限速。
3.  **配置防火墙和IDS：** 部署防火墙和入侵检测系统（IDS），配置规则以识别和阻止恶意流量和攻击行为。
4.  **制定应急响应计划：** 准备DDoS攻击应急响应计划，明确攻击发生时的处理流程、责任人、沟通机制等。

## 3. 最佳实践

1.  **最小权限原则：** 仅授予用户和系统组件所需的最小权限，避免过度授权。
2.  **多层防御：** 构建多层次的安全防护体系，包括网络层、主机层、应用层和数据层，即使某一环节被攻破，其他环节仍能提供保护。
3.  **安全基线：** 建立并定期审计安全基线，确保所有系统配置符合安全标准。
4.  **定期安全审计：** 定期进行安全漏洞扫描、渗透测试和安全审计，发现并修复潜在的安全问题。
5.  **员工安全意识培训：** 对运维人员和普通用户进行安全意识培训，提高其识别和防范网络攻击的能力。
6.  **应急响应计划：** 制定详细的安全事件应急响应计划，包括事件发现、分析、遏制、根除、恢复和总结。

## 4. 常见问题

| 问题 | 可能原因 | 解决方案 |
| :--- | :------- | :------- |
| 38881端口无法访问 | 防火墙限制、端口未开放、服务未启动。 | 检查防火墙规则，确保38881端口对运维IP开放；检查HAP管理器服务状态。 |
| 数据库连接失败 | 密码错误、IP白名单限制、端口未开放。 | 检查`docker-compose.yaml`中的数据库密码是否正确；检查数据库服务器的防火墙/安全组是否允许明道云应用服务器的IP访问；检查数据库服务是否正常运行。 |
| HTTPS配置后无法访问 | 证书配置错误、Nginx/Apache配置错误、端口冲突。 | 检查SSL证书路径和权限；检查Web服务器配置，确保443端口监听正常且重定向规则正确；检查是否有其他服务占用了443端口。 |
| 数据备份失败 | 磁盘空间不足、备份路径权限问题、备份脚本错误。 | 检查服务器磁盘剩余空间；确保备份目录有写入权限；检查备份脚本的语法和执行权限。 |
| 系统运行缓慢或异常 | 资源耗尽、DDoS攻击、恶意程序。 | 检查CPU、内存、磁盘I/O等资源使用情况；检查是否有异常网络流量；运行杀毒软件或安全扫描工具。 |

## 5. 与其他模块的关联

*   **部署运维模块：** 安全配置是部署运维的重要组成部分，合理的安全配置能够保障系统的稳定运行和数据安全。
*   **数据管理模块：** 备份与恢复是数据管理的核心环节，强密码和加密数据则直接关系到数据存储和传输的安全性。
*   **系统管理模块：** 用户权限、角色管理等与安全配置紧密相关，共同构建访问控制体系。

## 6. 实际案例

**案例：** 某企业私有部署明道云后，初期未对数据库进行强密码配置，导致数据库被外部攻击者入侵，数据被勒索。经过紧急处理后，企业采纳了以下安全配置建议：

1.  **限制访问：** 配置防火墙，仅允许内部应用服务器IP访问MySQL、MongoDB、Redis端口，禁止外部直接访问。
2.  **强密码：** 按照文档指引，修改了MySQL、Redis的默认密码，并为MongoDB添加了认证，所有密码均设置为复杂密码。
3.  **数据加密：** 为明道云前端服务配置了HTTPS，确保所有用户访问都通过加密通道进行。
4.  **定期备份：** 每日凌晨自动执行数据备份，并将备份文件同步到异地存储，保留7天。
5.  **监控报警：** 部署了日志监控系统，对数据库异常登录、高CPU使用率等情况设置了实时报警，通过钉钉通知运维人员。

**效果：** 经过上述配置后，系统安全性显著提升，未再发生类似安全事件，业务运行稳定。

## 7. 参考文献

[1] 修改 MySQL 默认密码 | 私有部署. (n.d.). Retrieved February 14, 2026, from https://docs-pd.mingdao.com/deployment/docker-compose/standalone/strongpwd/mysql
[2] 修改 Redis 默认密码 | 私有部署. (n.d.). Retrieved February 14, 2026, from https://docs-pd.mingdao.com/deployment/docker-compose/standalone/strongpwd/redis
[3] MongoDB 添加认证 | 私有部署. (n.d.). Retrieved February 14, 2026, from https://docs-pd.mingdao.com/deployment/docker-compose/standalone/strongpwd/mongodb
[4] 备份 | 私有部署. (n.d.). Retrieved February 14, 2026, from https://docs-pd.mingdao.com/deployment/docker-compose/standalone/data/backup
