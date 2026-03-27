# 明道云私有部署单机部署模式详尽指南

## 1. 核心概念和定义

明道云私有部署的**单机部署模式**，顾名思义，是指将明道云平台的所有核心服务和依赖组件部署在**一台独立的服务器**上。这种模式旨在为中小型企业、开发测试环境或对部署复杂度、运维成本有严格控制需求的用户提供一个**快速、便捷且资源高效**的部署方案。

与传统的分布式部署（集群模式）相比，单机部署模式通过将多个微服务和其所需的数据存储组件（如MySQL、MongoDB、Redis、Elasticsearch、Kafka、MinIO等）**打包整合**，形成一个或少数几个大型容器镜像。这种设计极大地**简化了部署流程**，用户只需通过简单的命令即可启动整个HAP（明道云应用平台）服务，无需深入了解复杂的微服务架构和组件间的依赖关系。

**解决的问题：**

*   **降低部署门槛：** 对于缺乏专业IT团队或运维经验的用户，单机部署模式提供了一站式的解决方案，避免了多组件独立部署的复杂性。
*   **节约资源成本：** 减少了对多台服务器的需求，从而降低了硬件采购和维护成本。
*   **快速启动与验证：** 适用于快速搭建测试环境、进行功能验证或小规模内部使用场景，能够迅速投入使用。

**架构特点：**

在单机部署模式下，明道云平台通常会启动以下几个核心容器来协同工作：

*   **HAP微服务容器：** 包含了明道云平台的核心业务逻辑，如应用引擎、工作流引擎、用户管理等。
*   **代码块容器：** 负责处理用户在工作流中自定义的代码块逻辑，提供灵活的扩展能力。
*   **存储组件容器：** 这是一个关键的整合容器，内部集成了MySQL（关系型数据库）、MongoDB（非关系型数据库）、Redis（缓存）、Elasticsearch（全文检索）、Kafka（消息队列）和MinIO（对象存储）等所有数据存储和中间件服务。所有数据都将持久化到宿主机上的指定目录，确保数据安全和可恢复性。
*   **文档预览容器：** 提供Office文档（如Word、Excel、PowerPoint）和PDF文件的在线预览功能，增强了平台的文件处理能力。

尽管是单机部署，但HAP私有部署版的单镜像内部依然是一个微服务集合。为了保证容器内各服务进程的可用性，系统内部预置了**健康检查线程**。这意味着当某个微服务出现故障时，系统能够自动检测并尝试恢复，从而在一定程度上缓解了单点故障带来的影响，提升了系统的自愈能力。

## 2. 完整配置清单

明道云私有部署单机模式的配置主要围绕服务器环境准备和Docker Compose部署文件展开。以下是详细的配置项、参数、选项及其说明，旨在帮助用户全面理解和正确配置。

### 2.1 服务器环境参数配置

以下参数以 CentOS 7.9 服务器为例，其他 Linux 发行版可能略有差异，但核心要求一致。

| 配置项 | 说明 | 要求及配置方法 |
| :----- | :----- | :----- |
| **User (用户)** | 运行部署脚本的用户权限。 | 需要 `root` 用户或具有 `root` 权限的用户，因为部署过程涉及到 Docker 操作。 |
| **Selinux (安全系统)** | Linux 安全增强模块。 | 需关闭 Selinux。临时关闭：`setenforce 0`。永久关闭：修改 `/etc/selinux/config` 文件中的 `SELINUX=enforcing` 或 `SELINUX=permissive` 为 `SELINUX=disabled`。 |
| **Firewalld (防火墙)** | Linux 自带的防火墙工具。 | 建议关闭防火墙，以避免与 `iptables` 规则冲突。云服务器可使用安全组规则进行网络控制。临时关闭：`systemctl stop firewalld`（关闭后需重启 Docker 服务）。永久关闭：`systemctl disable firewalld`。 |
| **CPU (处理器)** | 处理器核心数量。 | 最低要求 **8 核**。建议根据并发用户数和业务负载适当增加。 |
| **Memory (内存)** | 服务器内存大小。 | 最低要求 **32G 内存容量**。生产环境建议不低于 **48GB**。 |
| **Docker (环境变量)** | Docker 命令是否可执行。 | 环境变量中需要有 `docker` 命令且可执行成功。通过 RPM 安装会自动添加，二进制安装需手动添加至环境变量。 |
| **Dockerd (环境变量)** | Dockerd 命令是否可执行。 | 环境变量中需要有 `dockerd` 命令且可执行成功。通过 RPM 安装会自动添加，二进制安装需手动添加至环境变量。 |
| **MaxMapCount (虚拟内存区域限制)** | 限制一个进程可以拥有的虚拟内存区域数量，内置 Elasticsearch 启动需要。 | 临时调整：`sysctl -w vm.max_map_count=262144`。永久调整：在 `/etc/sysctl.conf` 文件中增加 `vm.max_map_count=262144`。 |
| **SysFileNr (文件描述符限制)** | 操作系统级别的文件描述符限制。 | 临时调整：`sysctl -w fs.file-max=2048000`。永久调整：在 `/etc/sysctl.conf` 文件中增加 `fs.file-max=2048000`。 |
| **IPv4Forward (IPv4转发)** | Docker 对外提供服务需要开启。 | 临时调整：`sysctl -w net.ipv4.ip_forward=1`。永久调整：在 `/etc/sysctl.conf` 文件中增加 `net.ipv4.ip_forward=1`。 |
| **DockerCgroupDrive (Cgroup驱动)** | Docker 容器 Cgroup 文件描述符限制。 | 如为 `systemd` 时可能出现文件描述符不足问题。永久调整：修改或增加 `/etc/docker/daemon.json` 文件中的配置项 `"exec-opts": ["native.cgroupdriver=cgroupfs"]`。 |
| **DockerdFileNr (Docker文件描述符)** | Docker 内部的文件描述符数量。 | 例如通过 `systemd` 启动 Docker 服务，则在 `docker.service` 文件中设置 `LimitNOFILE=102400`。 |
| **DockerdVersion (Docker版本)** | Docker 运行版本。 | 要求升级 Docker 版本大于等于 `20.10.16`。低于此版本可能产生权限异常或未知异常。 |
| **Umask (文件权限掩码)** | 用于设置用户在创建文件时的默认权限。 | 临时调整：`umask 0022`。永久调整：在 `/etc/profile` 文件中追加 `umask 0022` 一行。 |

### 2.2 Docker Compose 部署文件配置 (`ops.yaml`)

以下是 `ops.yaml` 配置文件中的主要服务和环境变量，这些配置项直接影响明道云运维平台的行为和连接。

#### 2.2.1 `gateway` 服务配置

`gateway` 服务是运维平台的入口，负责对外暴露服务端口和管理环境变量。

| 配置项 | 说明 | 默认值/示例值 | 备注 |
| :----- | :----- | :----- | :----- |
| `image` | 网关服务使用的 Docker 镜像。 | `registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-gateway:1.1.0` | 建议使用官方提供的最新稳定版本镜像。 |
| `ports` | 容器端口与宿主机端口的映射。 | `"48881:48881"` | 将容器内部的 48881 端口映射到宿主机的 48881 端口，用于访问运维平台。 |
| `environment` | 环境变量配置，影响网关服务及其关联服务的行为。 |
| `TZ` | 时区设置。 | `"Asia/Shanghai"` | 确保日志和时间戳与实际地理位置一致。 |
| `ENV_OPS_TOKEN` | 运维平台的访问认证密钥。 | `"SS9PobGG7SDTpcyfSZ1VVmn3gCmy2P52tYk"` | **首次部署务必调整为强密码**，这是访问运维平台的关键凭证。 |
| `ENV_PROMETHEUS_HOST` | Prometheus 监控服务的主机地址和端口。 | `"hap_1/192.168.1.12:59100"` | **首次部署需调整为部署服务器的实际内网 IP**，端口固定为 `59100`。 |
| `ENV_PROMETHEUS_KAFKA` | Kafka 监控服务地址。 | `"kafka_1/agent:9308"` | 如果使用外部 Kafka 或修改默认配置，需调整。 |
| `ENV_PROMETHEUS_ELASTICSEARCH` | Elasticsearch 监控服务地址。 | `"elasticsearch_1/agent:9114"` | 如果使用外部 Elasticsearch 或修改默认配置，需调整。 |
| `ENV_PROMETHEUS_REDIS` | Redis 监控服务地址。 | `"redis_1/agent:9121"` | 如果使用外部 Redis 或修改默认配置，需调整。 |
| `ENV_PROMETHEUS_MONGODB` | MongoDB 监控服务地址。 | `"mongodb_1/agent:9216"` | 如果使用外部 MongoDB 或修改默认配置，需调整。 |
| `ENV_PROMETHEUS_MYSQL` | MySQL 监控服务地址。 | `"mysql_1/agent:9104"` | 如果使用外部 MySQL 或修改默认配置，需调整。 |
| `ENV_MYSQL_HOST` | MySQL 数据库主机地址。 | `"sc"` | 如果使用外部 MySQL，需修改为实际的 IP 或域名。 |
| `ENV_MYSQL_PORT` | MySQL 数据库端口。 | `"3306"` | 默认端口，如果修改过需调整。 |
| `ENV_MYSQL_USERNAME` | MySQL 数据库用户名。 | `"root"` | 如果修改过需调整。 |
| `ENV_MYSQL_PASSWORD` | MySQL 数据库密码。 | `"123456"` | **务必修改为强密码**。 |
| `ENV_MONGODB_URI` | MongoDB 数据库连接 URI。 | `"mongodb://sc:27017"` | 如果使用外部 MongoDB，需修改为实际的连接 URI。 |
| `ENV_MONGODB_OPTIONS` | MongoDB 连接选项。 | `""` | 可根据需要添加额外的连接选项。 |
| `ENV_REDIS_HOST` | Redis 缓存服务主机地址。 | `"sc"` | 如果使用外部 Redis，需修改为实际的 IP 或域名。 |
| `ENV_REDIS_PORT` | Redis 缓存服务端口。 | `"6379"` | 默认端口，如果修改过需调整。 |
| `ENV_REDIS_PASSWORD` | Redis 缓存服务密码。 | `"123456"` | **务必修改为强密码**。 |
| `ENV_KAFKA_ENDPOINTS` | Kafka 消息队列服务地址。 | `"sc:9092"` | 如果使用外部 Kafka，需修改为实际的地址和端口。 |
| `ENV_ELASTICSEARCH_ENDPOINTS` | Elasticsearch 全文检索服务地址。 | `"sc:9200"` | 如果使用外部 Elasticsearch，需修改为实际的地址和端口。 |
| `ENV_ELASTICSEARCH_PASSWORD` | Elasticsearch 密码。 | `"md:ESPassWD1234"` | **务必修改为强密码**。 |
| `ENV_FLINK_URL` | Flink 服务地址。 | `"http://flink:8081"` | 如果未部署或不需要开放 Flink Web，可注释此环境变量。 |

#### 2.2.2 其他服务配置

`ops.yaml` 文件中还包含了 `prometheus`、`agent` 和 `nodeagent` 等服务的配置，它们主要用于监控和数据采集，通常继承 `gateway` 服务中定义的公共环境变量 (`&common_env`)。

| 服务名 | 说明 | 镜像 | 备注 |
| :----- | :----- | :----- | :----- |
| `prometheus` | Prometheus 监控服务。 | `registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-prometheus:1.1.0` | 负责数据采集和存储。 |
| `agent` | 运维代理服务。 | `registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-agent:1.1.0` | 负责与各个组件进行交互，采集监控数据。 |
| `nodeagent` | 节点代理服务。 | `registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-nodeagent:1.0.0` | 负责采集宿主机系统层面的监控数据。 |

#### 2.2.3 网络配置

`ops.yaml` 文件中定义了一个外部网络 `script_default`，用于 Docker Compose 内部服务间的通信。

| 配置项 | 说明 | 备注 |
| :----- | :----- | :----- |
| `networks.script_default.external` | 指定 `script_default` 网络为外部网络。 | 确保 Docker Compose 能够连接到已存在的 Docker 网络，实现服务间的互联互通。 |

**重要提示：** 在实际部署中，特别是生产环境，务必根据实际情况修改 `ENV_OPS_TOKEN`、数据库密码等敏感信息，并根据服务器的实际内网 IP 调整 `ENV_PROMETHEUS_HOST`。

## 3. 操作步骤详解

本节将详细介绍明道云私有部署单机模式的完整操作流程，包括环境准备、软件安装、服务部署和初始化配置。请务必按照步骤操作，确保部署成功。

### 3.1 环境准备

在开始部署之前，请确保您的 Linux 服务器满足以下最低配置要求，并已完成必要的环境参数调整。本指南以 CentOS 7.9 为例，其他 Linux 发行版请参考对应文档进行操作。

1.  **服务器硬件要求**：
    *   **CPU**：最低 8 核。
    *   **内存**：最低 32G 内存容量（生产环境建议不低于 48GB）。
    *   **磁盘**：40G 系统盘（除外），40G 数据盘（建议独立挂载）。

2.  **端口检查**：确保服务器的 `8880`、`38880`、`38881` 端口未被占用，且服务器与客户端之间的端口连通性正常。对于正式环境，建议通过安全策略（如云服务商的安全组规则）对 `38880`、`38881` 端口进行访问控制，这两个端口对应部分运维管理功能。

3.  **Selinux 关闭**：
    *   **临时关闭**：执行命令 `setenforce 0`。
    *   **永久关闭**：编辑 `/etc/selinux/config` 文件，将 `SELINUX=enforcing` 或 `SELINUX=permissive` 修改为 `SELINUX=disabled`，然后重启服务器使配置生效。

4.  **Firewalld 关闭**：
    *   **临时关闭**：执行命令 `systemctl stop firewalld`。**注意**：关闭防火墙后需要重启 Docker 服务，否则规则可能会丢失导致网络异常。
    *   **永久关闭**：执行命令 `systemctl disable firewalld`。

5.  **Docker 安装**：
    *   请参考 Docker 官方文档，根据您的 Linux 发行版安装 Docker。例如，对于 CentOS，可以参考 [Docker 官方安装指南](https://docs.docker.com/engine/install/centos/)。
    *   **重要提示**：自 Docker v29 (及 containerd v2.1.5) 起，容器默认继承 systemd 的 `LimitNOFILE` 配置，可能导致容器内最大文件打开数 (`ulimit -n`) 骤降至 1024。这可能导致 HAP 内部数据库、中间件等服务因无法打开足够的文件句柄而启动失败或崩溃。**请务必将此限制调整至 102400 或以上**。具体调整方法请参考 [调整 LimitNOFILE 限制](https://docs-pd.mingdao.com/deployment/env#dockerdfilenr)。

6.  **环境参数调整**：
    *   **MaxMapCount**：限制一个进程可以拥有的虚拟内存区域数量，内置 Elasticsearch 启动需要。执行 `sysctl -w vm.max_map_count=262144` 临时调整，或在 `/etc/sysctl.conf` 文件中增加 `vm.max_map_count=262144` 永久调整。
    *   **SysFileNr**：操作系统级别的文件描述符限制。执行 `sysctl -w fs.file-max=2048000` 临时调整，或在 `/etc/sysctl.conf` 文件中增加 `fs.file-max=2048000` 永久调整。
    *   **IPv4Forward**：Docker 对外提供服务需要开启。执行 `sysctl -w net.ipv4.ip_forward=1` 临时调整，或在 `/etc/sysctl.conf` 文件中增加 `net.ipv4.ip_forward=1` 永久调整。
    *   **DockerCgroupDrive**：Docker 容器 Cgroup 文件描述符限制。修改或增加 `/etc/docker/daemon.json` 文件中的配置项 `"exec-opts": ["native.cgroupdriver=cgroupfs"]`。
    *   **DockerdFileNr**：Docker 内部的文件描述符数量。例如通过 systemd 启动 Docker 服务，则在 `docker.service` 文件中设置 `LimitNOFILE=102400`。
    *   **DockerdVersion**：确保 Docker 版本大于等于 `20.10.16`。如果低于此版本，请升级 Docker。
    *   **Umask**：用于设置用户在创建文件时的默认权限。执行 `umask 0022` 临时调整，或在 `/etc/profile` 文件中追加 `umask 0022` 一行永久调整。

### 3.2 手动安装部署步骤

以下是手动安装明道云私有部署单机模式的详细步骤：

1.  **下载 HAP 私有部署版镜像**：
    执行以下命令拉取所需的 Docker 镜像：
    ```bash
docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-hap:7.1.1
docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-sc:3.2.0
docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-command:node1018-python36
docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-doc:2.0.0
    ```

2.  **下载管理器**：
    执行以下命令下载明道云私有部署管理器：
    ```bash
wget https://pdpublic.mingdao.com/private-deployment/7.1.1/mingdaoyun_private_deployment_captain_linux_amd64.tar.gz
    ```

3.  **解压管理器**：
    下载完成后，解压管理器压缩包：
    ```bash
tar -zxvf mingdaoyun_private_deployment_captain_linux_amd64.tar.gz
    ```

4.  **启动管理器**：
    进入解压后的管理器目录，并以 root 权限启动管理器。**请确保管理器一直处于运行状态**。
    ```bash
bash ./service.sh start
    ```

5.  **访问并初始化 HAP 系统**：
    管理器启动成功后，在浏览器中通过 `http://{服务器IP}:38881` 进行访问。根据页面提示，完成 HAP 系统的访问地址设置及初始化。初始化过程大约持续 3~5 分钟。

6.  **申请并绑定密钥，创建管理员账户**：
    初始化完成后，在当前页面中申请并绑定密钥，然后创建管理员账户即可进入 HAP 工作台。

### 3.3 运维平台部署步骤 (基于 Docker Compose)

如果您需要部署运维平台来监控和管理明道云私有部署，可以按照以下步骤进行：

1.  **拉取运维平台相关镜像**：
    ```bash
docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-gateway:1.1.0
docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-prometheus:1.1.0
docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-agent:1.1.0
docker pull registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-nodeagent:1.0.0
    ```

2.  **创建 `ops.yaml` 配置文件**：
    创建一个名为 `ops.yaml` 的文件，并复制以下内容。**请务必根据您的实际情况修改 `ENV_OPS_TOKEN`、`ENV_PROMETHEUS_HOST` 以及所有数据库相关的密码**。
    ```bash
cat > /data/mingdao/script/ops.yaml <<\EOF
version: '3'
services:
  gateway:
    image: registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-gateway:1.1.0
    ports:
      - "48881:48881"
    environment: &common_env
      TZ: "Asia/Shanghai"
      ENV_OPS_TOKEN: "YOUR_SECURE_TOKEN"    # 首次部署务必调整，此环境变量值是后续运维平台的访问认证密钥
      ENV_PROMETHEUS_HOST: "YOUR_SERVER_IP:59100"         # 首次部署需调整为部署服务器的实际内网 IP，端口固定 59100
      ENV_PROMETHEUS_KAFKA: "kafka_1/agent:9308"
      ENV_PROMETHEUS_ELASTICSEARCH: "elasticsearch_1/agent:9114"
      ENV_PROMETHEUS_REDIS: "redis_1/agent:9121"
      ENV_PROMETHEUS_MONGODB: "mongodb_1/agent:9216"
      ENV_PROMETHEUS_MYSQL: "mysql_1/agent:9104"
      # 如果使用了外部组件或修改过默认密码，请调整下方相关环境变量值
      ENV_MYSQL_HOST: "sc"
      ENV_MYSQL_PORT: "3306"
      ENV_MYSQL_USERNAME: "root"
      ENV_MYSQL_PASSWORD: "YOUR_MYSQL_PASSWORD"
      ENV_MONGODB_URI: "mongodb://sc:27017"
      ENV_MONGODB_OPTIONS: ""
      ENV_REDIS_HOST: "sc"
      ENV_REDIS_PORT: "6379"
      ENV_REDIS_PASSWORD: "YOUR_REDIS_PASSWORD"
      ENV_KAFKA_ENDPOINTS: "sc:9092"
      ENV_ELASTICSEARCH_ENDPOINTS: "sc:9200"
      ENV_ELASTICSEARCH_PASSWORD: "YOUR_ELASTICSEARCH_PASSWORD"
      ENV_FLINK_URL: "http://flink:8081"                      # 如果未部署或不需要开放 Flink Web 则注释此环境变量
  prometheus:
    image: registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-prometheus:1.1.0
    environment: *common_env
    volumes:
      - ./volume/data/:/data/
  agent:
    image: registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-agent:1.1.0
    environment: *common_env
  nodeagent:
    image: registry.cn-hangzhou.aliyuncs.com/mdpublic/ops-nodeagent:1.0.0
    environment: *common_env
    volumes:
      - /:/host:ro,rslave
    network_mode: host
    pid: host
networks:
  script_default:
    external: true
EOF
    ```
    **请注意**：将 `YOUR_SECURE_TOKEN` 替换为您的安全令牌，`YOUR_SERVER_IP` 替换为您的服务器实际内网 IP，并将 `YOUR_MYSQL_PASSWORD`、`YOUR_REDIS_PASSWORD`、`YOUR_ELASTICSEARCH_PASSWORD` 替换为您的实际密码。

3.  **启动运维平台服务**：
    在 `ops.yaml` 文件所在的目录执行以下命令启动服务：
    ```bash
docker-compose -f /data/mingdao/script/ops.yaml up -d
    ```

4.  **停止运维平台服务**：
    如果需要停止运维平台服务，执行以下命令：
    ```bash
docker-compose -f /data/mingdao/script/ops.yaml down
    ```

5.  **访问运维平台**：
    运维平台启动成功后，通过浏览器访问 `http://部署服务器IP:48881`。登录时需要使用 `ops.yaml` 中 `ENV_OPS_TOKEN` 环境变量设置的值作为登录 Token。

## 4. 最佳实践

为了确保明道云私有部署单机模式的稳定、高效运行，并最大化其价值，以下是一些推荐的配置方案、使用技巧和注意事项。

### 4.1 服务器资源配置建议

*   **内存优先**：尽管最低要求为32GB内存，但考虑到HAP内部集成了多个微服务和数据存储组件（MySQL、MongoDB、Redis、Elasticsearch、Kafka、MinIO），**强烈建议生产环境内存配置不低于48GB**，以应对高并发和大数据量处理场景。内存不足是导致系统性能瓶颈和不稳定的常见原因。
*   **CPU与并发数匹配**：根据实际并发用户数和业务负载选择合适的CPU核心数。对于100以内并发用户，8核CPU可能足够；对于200-300并发用户，建议提升至16核甚至32核。
*   **独立数据盘**：建议将数据存储（如 `/data/mingdao` 目录）挂载到独立的**高性能数据盘**上，而不是系统盘。这有助于提高I/O性能，并方便后续的数据备份、恢复和扩容。
*   **操作系统选择**：推荐使用 Debian 10+ 或 CentOS 7.9+ 等主流 Linux 发行版，并保持系统更新，以获得更好的兼容性和安全性。

### 4.2 环境配置与安全性

*   **Selinux与Firewalld**：按照操作步骤中的说明，务必**永久关闭** Selinux 和 Firewalld。如果需要网络安全防护，应在云服务商的安全组或硬件防火墙层面进行配置，避免与系统自带防火墙冲突。
*   **Docker版本**：确保 Docker 版本符合要求（`>=20.10.16`），并定期关注 Docker 官方更新，及时升级到稳定版本，以修复潜在的安全漏洞和性能问题。
*   **文件描述符限制**：`MaxMapCount`、`SysFileNr` 和 `DockerdFileNr` 等文件描述符限制是影响系统稳定性的关键参数。务必按照文档要求进行永久性调整，并重启相关服务以确保生效。
*   **敏感信息管理**：`ENV_OPS_TOKEN`、数据库密码等敏感信息在 `ops.yaml` 配置文件中**务必修改为强密码**，并定期更换。避免使用默认或弱密码，以防范未授权访问。
*   **端口安全**：`38880` 和 `38881` 端口用于运维管理功能，`48881` 端口用于运维平台访问。在生产环境中，应通过网络安全策略（如安全组）限制这些端口的访问来源，仅允许可信IP地址访问。

### 4.3 运维与监控

*   **运维平台部署**：强烈建议部署运维平台（基于 Docker Compose），它提供了系统监控、告警、备份与恢复等功能，对于保障系统稳定运行至关重要。
*   **日志管理**：定期检查 Docker 容器日志和系统日志，及时发现并解决潜在问题。可以考虑集成专业的日志管理工具（如 ELK Stack）进行集中管理和分析。
*   **数据备份**：制定完善的数据备份策略，定期对数据库和文件存储进行备份，并验证备份数据的可用性。这是应对数据丢失风险的最后一道防线。
*   **性能监控**：利用运维平台提供的监控功能，实时关注 CPU、内存、磁盘I/O、网络流量等关键指标，以及各个微服务的运行状态。当出现异常时，及时进行排查和优化。

### 4.4 升级与维护

*   **版本更新**：明道云私有部署版会定期发布新版本，包含功能改进、性能优化和安全补丁。建议关注官方发布，并在测试环境验证后，及时升级到最新版本。
*   **离线包下载**：对于网络受限的环境，可以提前下载 HAP 私有部署版镜像的离线包，以便快速部署和升级。
*   **服务启停**：熟悉 `service.sh` 脚本和 `docker-compose` 命令，掌握服务的正确启停顺序和方法，避免因操作不当导致数据损坏或服务中断。

遵循这些最佳实践，将有助于您构建一个稳定、安全、高效的明道云私有部署单机环境。

## 5. 常见问题

在明道云私有部署单机模式的部署和运行过程中，用户可能会遇到一些常见问题。本节将列出这些问题及其相应的解决方案。

### 5.1 Docker 相关问题

*   **问题：Docker 服务无法启动或运行异常。**
    *   **可能原因：** Docker 安装不完整、配置错误、与系统环境冲突（如 Selinux 或 Firewalld 未关闭）、文件描述符限制过低等。
    *   **解决方案：**
        1.  **检查 Docker 安装**：确保 Docker 已正确安装并启动。可以通过 `systemctl status docker` 命令查看服务状态。
        2.  **检查 Selinux 和 Firewalld**：确认 Selinux 和 Firewalld 已按照 [环境准备](#31-环境准备) 中的说明关闭。
        3.  **调整文件描述符限制**：检查并调整 `MaxMapCount`、`SysFileNr` 和 `DockerdFileNr` 等参数，确保其符合要求。
        4.  **查看 Docker 日志**：使用 `journalctl -u docker.service` 或 `cat /var/log/docker.log`（如果配置了日志文件）查看详细错误信息。

*   **问题：容器启动失败，提示文件句柄不足。**
    *   **可能原因：** Docker 默认的文件描述符限制（`LimitNOFILE`）过低，尤其是在 Docker v29 及更高版本中。
    *   **解决方案：** 按照 [环境准备](#31-环境准备) 中关于 `DockerdFileNr` 的说明，将 Docker 服务的 `LimitNOFILE` 调整至 `102400` 或以上，并重启 Docker 服务。

### 5.2 访问与初始化问题

*   **问题：无法通过 `http://{服务器IP}:38881` 访问明道云管理器。**
    *   **可能原因：** 端口未开放、管理器服务未启动、IP 地址或端口输入错误、网络连通性问题。
    *   **解决方案：**
        1.  **检查端口**：确保服务器的 `38881` 端口已开放，并且没有被其他服务占用。可以使用 `netstat -tulnp | grep 38881` 命令检查。
        2.  **检查管理器服务**：确认明道云管理器已通过 `bash ./service.sh start` 命令启动，并且处于运行状态。
        3.  **检查防火墙/安全组**：如果服务器有防火墙或云服务商有安全组，请确保 `38881` 端口已允许外部访问。
        4.  **检查 IP 地址**：确认输入的服务器 IP 地址是正确的。

*   **问题：HAP 系统初始化失败或卡住。**
    *   **可能原因：** 服务器资源不足、依赖组件（如数据库）未正常启动、网络问题、配置错误。
    *   **解决方案：**
        1.  **检查服务器资源**：确保 CPU 和内存资源充足，符合推荐配置。
        2.  **检查 Docker 容器状态**：使用 `docker ps -a` 命令查看所有容器的运行状态，确认所有 HAP 相关的容器都已正常启动。
        3.  **查看容器日志**：使用 `docker logs <容器ID或名称>` 命令查看具体容器的日志，找出初始化失败的原因。
        4.  **重启服务**：尝试停止所有服务 (`bash ./service.sh stopall`) 后重新启动 (`bash ./service.sh start`)。

### 5.3 运维平台访问问题

*   **问题：无法通过 `http://部署服务器IP:48881` 访问运维平台。**
    *   **可能原因：** 运维平台服务未启动、端口未开放、`ops.yaml` 配置错误、网络问题。
    *   **解决方案：**
        1.  **检查运维平台服务**：确认运维平台已通过 `docker-compose -f /data/mingdao/script/ops.yaml up -d` 命令启动。
        2.  **检查端口**：确保服务器的 `48881` 端口已开放，并且没有被其他服务占用。
        3.  **检查 `ops.yaml` 配置**：确认 `ENV_PROMETHEUS_HOST` 已正确配置为服务器的实际内网 IP，并且 `ENV_OPS_TOKEN` 等敏感信息已正确设置。

*   **问题：登录运维平台时 Token 认证失败。**
    *   **可能原因：** 输入的 Token 不正确，或者 `ops.yaml` 中的 `ENV_OPS_TOKEN` 未正确设置。
    *   **解决方案：** 确认登录时使用的 Token 与 `ops.yaml` 文件中 `ENV_OPS_TOKEN` 环境变量的值完全一致。如果忘记，可以修改 `ops.yaml` 文件中的 `ENV_OPS_TOKEN` 为新值，然后重启运维平台服务。

### 5.4 性能问题

*   **问题：明道云平台运行缓慢或响应迟钝。**
    *   **可能原因：** 服务器资源不足（CPU、内存、磁盘I/O）、数据库性能瓶颈、网络延迟、配置未优化。
    *   **解决方案：**
        1.  **升级服务器配置**：根据 [推荐服务器配置](#21-服务器环境参数配置) 检查并升级服务器的 CPU、内存和磁盘性能，特别是内存，建议不低于 48GB。
        2.  **优化数据库**：检查数据库的运行状态和性能指标，进行必要的优化，如索引优化、慢查询分析等。
        3.  **检查网络**：确保服务器与客户端之间的网络连接稳定，没有高延迟或丢包。
        4.  **查看日志**：通过运维平台或直接查看容器日志，分析是否有异常报错或性能警告。

### 5.5 数据持久化问题

*   **问题：重启服务器或容器后数据丢失。**
    *   **可能原因：** 数据未正确挂载到宿主机目录，或者挂载目录权限不足。
    *   **解决方案：** 确保在部署时，数据存储组件的容器卷已正确映射到宿主机的持久化目录，并且宿主机目录具有正确的读写权限。例如，HAP 的数据通常会持久化到 `/data/mingdao` 目录下。

## 6. 与其他模块的关联

明道云私有部署的单机部署模式虽然将所有核心服务集成在一台服务器上，但其内部依然是基于微服务架构。这意味着各个功能模块之间依然保持着相对独立的职责，并通过内部通信协同工作。理解这些关联有助于更好地运维和扩展系统。

### 6.1 与HAP核心微服务模块的关联

单机部署模式的核心是HAP微服务容器，它集成了明道云平台的所有业务逻辑。这些微服务包括但不限于：

*   **应用引擎**：负责解析和执行用户创建的无代码/低代码应用逻辑。
*   **工作流引擎**：处理自动化工作流的触发、执行和监控。
*   **用户与权限管理**：管理用户账户、角色、权限等，确保系统安全。
*   **表单与数据管理**：负责表单的创建、数据收集、存储和查询。

这些微服务通过内部网络进行通信，共同支撑明道云平台的各项功能。单机部署模式通过Docker Compose将这些微服务打包在一个统一的环境中，简化了部署，但其内部的微服务协作机制并未改变。

### 6.2 与数据存储和中间件模块的关联

单机部署模式将所有数据存储和中间件服务（MySQL、MongoDB、Redis、Elasticsearch、Kafka、MinIO）集成在一个容器中。这些组件为HAP核心微服务提供数据持久化、缓存、搜索、消息传递和文件存储等基础服务：

*   **MySQL/MongoDB**：作为主要的数据存储，分别用于存储关系型数据（如用户配置、应用元数据）和非关系型数据（如日志、文档内容）。
*   **Redis**：提供高性能的缓存服务，加速数据访问，减轻数据库压力，并支持会话管理。
*   **Elasticsearch**：提供强大的全文检索能力，支持用户在海量数据中快速查找信息。
*   **Kafka**：作为消息队列，用于实现微服务之间的异步通信、数据同步和事件驱动架构，提高系统的解耦性和吞吐量。
*   **MinIO**：提供兼容S3协议的对象存储服务，用于存储用户上传的文件、图片、附件等。

这些组件是HAP平台正常运行的基石，它们的稳定性和性能直接影响到整个明道云平台的可用性和响应速度。

### 6.3 与代码块和文档预览模块的关联

*   **代码块容器**：当用户在工作流中定义了自定义代码块时，HAP核心微服务会调用代码块容器来执行这些代码。这使得明道云平台具有更强的扩展性和灵活性，能够满足特定的业务逻辑需求。
*   **文档预览容器**：HAP平台在处理文件上传和管理时，会与文档预览容器协同工作，提供Office文档和PDF文件的在线预览功能。这提升了用户体验，使得用户无需下载文件即可查看内容。

### 6.4 与运维平台模块的关联

虽然运维平台是独立部署的（通常也采用Docker Compose），但它与单机部署的明道云平台紧密关联：

*   **监控数据采集**：运维平台中的 `agent` 和 `nodeagent` 服务会采集明道云平台各个微服务和宿主机的运行指标（CPU、内存、网络、磁盘I/O等），并将数据发送给 `prometheus` 进行存储和分析。
*   **告警与日志**：运维平台可以配置告警规则，当明道云平台出现异常时及时通知管理员。同时，它也可以集成日志管理功能，集中收集和分析明道云平台的运行日志。
*   **远程管理**：通过运维平台，管理员可以对明道云平台进行远程启停、配置修改等操作，实现便捷的运维管理。

总而言之，单机部署模式下的明道云平台是一个高度集成的系统，各个模块之间通过明确的接口和协议协同工作，共同提供稳定、高效的无代码/低代码应用开发和运行环境。

## 7. 实际案例

明道云私有部署的单机部署模式因其部署简便、资源需求相对较低的特点，非常适合以下几种实际应用场景。

### 7.1 小型企业内部管理系统

**场景描述：**

一家员工人数在50人以内的小型贸易公司，希望搭建一套内部管理系统，用于管理客户关系（CRM）、销售订单、库存以及员工考勤。公司IT预算有限，没有专业的运维团队，对系统的稳定性有一定要求，但对高可用性（如集群故障转移）的需求不高。

**单机部署的适用性：**

*   **成本效益**：只需一台服务器即可运行整个明道云平台，大大降低了硬件采购和运维成本。
*   **部署简便**：无需复杂的集群规划和配置，通过简单的几步操作即可完成部署，非专业IT人员也能快速上手。
*   **满足基本需求**：对于并发用户数不高的场景，单机部署模式足以提供稳定可靠的服务，满足日常的业务管理需求。
*   **数据本地化**：所有数据存储在公司内部服务器，符合数据安全和合规性要求。

**配置示例（基于推荐配置）**：

*   **服务器配置**：8核CPU / 48GB内存 / 60GB系统盘 / 200GB数据盘 (Debian 12)
*   **部署方式**：手动安装，并部署运维平台进行日常监控。
*   **关键配置调整**：
    *   `ENV_OPS_TOKEN`：设置为公司内部安全的Token。
    *   数据库密码：修改为强密码。
    *   端口开放：仅在公司内网开放 `38881` 和 `48881` 端口，对外通过VPN或反向代理访问。

### 7.2 开发与测试环境

**场景描述：**

一个软件开发团队正在基于明道云平台进行二次开发或集成测试。团队成员需要一个独立的、隔离的明道云实例，以便进行功能开发、Bug复现和性能测试，而不会影响到生产环境。开发人员希望能够快速搭建和销毁环境。

**单机部署的适用性：**

*   **快速搭建**：Docker Compose 部署方式使得环境搭建非常迅速，开发人员可以在几分钟内启动一个完整的明道云实例。
*   **资源隔离**：每个开发人员可以在自己的开发机或虚拟机上部署一个独立的实例，互不干扰。
*   **易于管理**：环境配置集中在 `ops.yaml` 文件中，方便版本控制和团队协作。
*   **成本低廉**：利用现有开发机或虚拟机资源即可，无需额外采购昂贵的测试服务器。

**配置示例**：

*   **服务器配置**：8核CPU / 32GB内存 / 40GB系统盘 / 100GB数据盘 (Debian 12 或 Ubuntu Server)
*   **部署方式**：手动安装，可选择不部署运维平台以进一步简化。
*   **关键配置调整**：
    *   `ENV_OPS_TOKEN` 和数据库密码可设置为开发测试环境的默认值，但仍建议保持一定安全性。
    *   可根据测试需求，调整 `ops.yaml` 中各组件的资源限制。

### 7.3 教育与培训演示环境

**场景描述：**

某教育机构或企业内部培训部门需要为学员提供一个明道云平台的实践环境，用于教学演示、学员操作练习。环境需要易于分发、快速重置，并且能够支持一定数量的学员同时进行基础操作。

**单机部署的适用性：**

*   **环境一致性**：通过统一的 Docker Compose 配置，可以确保所有学员获得一致的实践环境。
*   **快速重置**：当学员操作失误或需要重新开始时，可以快速停止并重新启动容器，恢复到初始状态。
*   **资源利用率高**：一台配置适中的服务器可以支持多个学员轮流使用或进行轻量级操作。
*   **易于演示**：教师可以轻松地在单机环境中进行功能演示，无需担心复杂的部署问题。

**配置示例**：

*   **服务器配置**：16核CPU / 64GB内存 / 60GB系统盘 / 200GB数据盘 (Debian 12)
*   **部署方式**：手动安装，并部署运维平台以便监控学员使用情况。
*   **关键配置调整**：
    *   根据学员数量和操作复杂度，适当调整服务器资源。
    *   可预先配置好演示数据，方便学员直接上手。

这些案例展示了明道云私有部署单机模式在不同场景下的灵活性和实用性，帮助用户根据自身需求做出明智的部署决策。
