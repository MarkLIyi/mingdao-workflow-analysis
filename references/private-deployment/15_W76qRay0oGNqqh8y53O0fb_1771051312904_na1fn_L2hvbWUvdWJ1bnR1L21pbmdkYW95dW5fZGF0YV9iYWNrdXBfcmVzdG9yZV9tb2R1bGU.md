# 明道云私有部署数据备份恢复模块详尽指南

## 1. 核心概念和定义

明道云私有部署的数据备份与恢复模块是确保企业数据安全和业务连续性的关键组成部分。它允许用户在系统发生故障、数据损坏或需要迁移时，能够有效地保存和恢复系统数据，最大限度地减少数据丢失和业务中断的风险。

**核心概念：**

*   **数据备份 (Backup)**：指将明道云私有部署系统中的关键数据（包括数据库、文件等）复制到另一个存储介质或位置，以防止原始数据丢失或损坏。备份是数据恢复的基础。
*   **数据恢复 (Restore)**：指在数据丢失或损坏后，利用之前创建的备份数据将系统恢复到正常运行状态的过程。数据恢复是数据备份的最终目的。
*   **私有部署 (Private Deployment)**：指明道云系统部署在企业自己的服务器或云环境中，企业拥有对系统和数据的完全控制权。

**解决的问题：**

*   **数据丢失防护**：应对硬件故障、软件错误、人为误操作、网络攻击等导致的数据丢失风险。
*   **业务连续性保障**：在系统出现问题时，能够快速恢复服务，确保业务不受长时间中断的影响。
*   **数据迁移与升级**：在系统升级、迁移或环境变更时，提供数据平滑过渡的手段。
*   **合规性要求**：满足行业或法规对数据存储和恢复的合规性要求。

## 2. 完整配置清单

明道云私有部署的数据备份恢复主要涉及以下配置项和相关参数：

| 配置项/参数 | 说明 | 示例值/默认值 | 备注 |
| :---------- | :--- | :------------ | :--- |
| **备份目录** | 默认的备份文件生成路径。 | `/data/mingdao/script/volume/data/backup/` | 备份文件将在此目录下以时间戳命名的文件夹中存放。 |
| **挂载路径** | 在 `docker-compose.yaml` 中配置，用于修改备份文件在宿主机上的存放路径。 | `- /backup/:/data/backup/` | 将容器内的 `/data/backup/` 目录挂载到宿主机的 `/backup/` 目录。 |
| **备份数据目录** | 需要备份的核心数据目录，位于宿主机默认数据目录下。 | `/data/mingdao/script/volume/data/` | 包含 `mysql`、`mongodb`、`storage`、`kafka`、`zookeeper`、`redis`、`elasticsearch-8` 等子目录。 |
| **临时容器环境变量** | 恢复数据时，启动临时容器所需的环境变量，用于连接数据库。 | `ENV_MYSQL_HOST="127.0.0.1"`, `ENV_MYSQL_PORT="3306"`, `ENV_MYSQL_USERNAME="root"`, `ENV_MYSQL_PASSWORD="123456"`, `ENV_MONGODB_URI="mongodb://127.0.0.1:27017"`, `ENV_MONGODB_OPTIONS=""` | 这些变量用于临时容器内部连接 MySQL 和 MongoDB 数据库。 |

## 3. 操作步骤详解

明道云私有部署的数据备份和恢复操作可以通过两种主要方式进行：`dump` 方式（不停服务）和文件复制方式（停止服务）。

### 3.1 数据备份

#### 3.1.1 `dump` 方式备份 (v3.7.1+支持，可不停服务操作)

这种方式适用于需要保持服务运行的场景，通过 `docker exec` 命令在运行中的容器内执行备份脚本。

1.  **执行备份命令**：
    在宿主机上执行以下命令，将 MySQL、MongoDB 和文件数据备份到默认备份目录。
    ```bash
    docker exec -it $(docker ps | grep -E 'mingdaoyun-community|mingdaoyun-hap' | awk '{print $1}') bash -c 'source /entrypoint.sh && backup mysql mongodb file'
    ```
    *   `$(docker ps | grep -E 'mingdaoyun-community|mingdaoyun-hap' | awk '{print $1}')`：用于获取明道云容器的 ID。
    *   `source /entrypoint.sh`：加载容器内的环境变量和函数。
    *   `backup mysql mongodb file`：执行备份命令，指定备份 MySQL、MongoDB 和文件数据。

2.  **备份文件存放路径**：
    默认情况下，备份文件会生成到容器内的 `/data/backup/` 目录下，该目录通常映射到宿主机的 `/data/mingdao/script/volume/data/backup/` 路径下，并以当前时间戳命名文件夹，例如 `20221111184140/`。

3.  **修改备份文件存放路径 (可选)**：
    如果需要将备份文件存放到宿主机的其他路径（例如 `/backup/`），可以通过修改 `docker-compose.yaml` 文件中的 `app` 服务配置，新增挂载卷来实现：
    ```yaml
    volumes:
      - /backup/:/data/backup/
    ```
    修改后，备份文件将直接生成到宿主机的 `/backup/` 目录下。

4.  **压缩备份文件 (可选)**：
    为了节省存储空间和方便传输，可以在备份完成后对备份目录进行压缩。例如，在 `/backup/` 目录下执行：
    ```bash
    tar -zcvf 20221111184140.tar.gz ./20221201193829
    ```
    这将把 `20221201193829` 文件夹压缩为 `20221111184140.tar.gz`。

#### 3.1.2 停止 HAP 服务备份 (文件复制方式)

这种方式需要停止 HAP 服务，直接打包宿主机上的数据目录，适用于需要完整数据快照或进行系统维护的场景。

1.  **确定需要备份的数据目录**：
    明道云私有部署的核心数据位于宿主机的 `/data/mingdao/script/volume/data/` 目录下，包括 `mysql`、`mongodb`、`storage`、`kafka`、`zookeeper`、`redis`、`elasticsearch-8` 等文件夹。

2.  **停止 HAP 服务**：
    在执行备份前，需要停止所有 HAP 服务，以确保数据的一致性。
    ```bash
    bash ./service.sh stopall
    ```

3.  **打包数据**：
    将上述数据目录打包成一个压缩文件。例如，打包到 `/backup/` 目录下：
    ```bash
    mkdir -p /backup && cd /data/mingdao/script/volume/data/ && tar -zcvf /backup/20221111184140.tar.gz ./mysql ./mongodb ./storage ./kafka ./zookeeper ./redis ./elasticsearch-8
    ```
    *   `mkdir -p /backup`：创建备份目录。
    *   `cd /data/mingdao/script/volume/data/`：进入数据目录。
    *   `tar -zcvf ...`：将指定的数据目录打包并压缩。

### 3.2 数据恢复

数据恢复操作通常需要停止 HAP 服务，并根据备份方式选择相应的恢复步骤。

#### 3.2.1 准备工作

在进行数据恢复前，需要完成以下准备工作：

1.  **停止 HAP 服务**：
    在管理器根目录执行 `bash ./service.sh stopall`，确保所有 HAP 服务已停止。

2.  **上传备份文件**：
    将备份的 `20221111184140.tar.gz` 文件上传到数据还原服务器的指定目录，例如 `/backup/`。

3.  **移除当前环境下的原数据 (安全起见)**：
    为了避免数据冲突，建议先将当前环境下的原数据进行备份或移动，待恢复成功后再彻底删除。
    ```bash
    time=$(date +%Y%m%d%H%M%S) && mkdir -p /backup/$time/ && mv /data/mingdao/script/volume/data/* /backup/$time/
    ```
    *   此命令会将 `/data/mingdao/script/volume/data/` 下的所有数据移动到 `/backup/` 目录下以当前时间戳命名的文件夹中。

#### 3.2.2 `dump` 方式备份的恢复

如果备份是使用 `dump` 方式生成的，恢复步骤如下：

1.  **解压备份压缩包**：
    在 `/backup/` 目录下解压之前上传的备份文件。
    ```bash
    tar -zxvf 20221111184140.tar.gz
    ```

2.  **启动临时容器并挂载数据目录**：
    启动一个临时容器，并挂载宿主机的数据目录和备份目录，以便在容器内进行数据恢复操作。注意替换 `ENV_MYSQL_PASSWORD` 等敏感信息。
    ```bash
    docker run -it --rm --entrypoint bash \
      -e ENV_MYSQL_HOST="127.0.0.1" \
      -e ENV_MYSQL_PORT="3306" \
      -e ENV_MYSQL_USERNAME="root" \
      -e ENV_MYSQL_PASSWORD="123456" \
      -e ENV_MONGODB_URI="mongodb://127.0.0.1:27017" \
      -e ENV_MONGODB_OPTIONS="" \
      -v /data/mingdao/script/volume/data/:/data/ \
      -v /backup/:/data/backup/ \
      registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-sc:3.2.0
    ```
    进入容器后，创建必要的数据目录：
    ```bash
    mkdir -p /data/{logs,mysql,mongodb,storage}
    mkdir -p /data/storage/data
    ```

3.  **临时容器内启动 MySQL 服务端**：
    在临时容器内启动 MySQL 服务，用于数据还原。
    ```bash
    source /entrypoint.sh && mysqlStartup &
    ```

4.  **重建 MySQL 数据库**：
    执行 MySQL 数据库的恢复命令。如有重要数据，请务必提前备份。
    ```bash
    source /entrypoint.sh && restore mysql /data/backup/20221111184140/mysql
    ```

5.  **临时容器内启动 MongoDB 服务端**：
    在临时容器内启动 MongoDB 服务，用于数据还原。启动后会自动创建索引，索引创建完成后需手动按回车键。
    ```bash
    source /entrypoint.sh && mongodbStartup &
    ```

6.  **重建 MongoDB 数据库**：
    执行 MongoDB 数据库的恢复命令。如有重要数据，请务必提前备份。
    ```bash
    source /entrypoint.sh && restore mongodb /data/backup/20221111184140/mongodb
    ```

7.  **重建文件数据**：
    文件数据的恢复需要根据微服务版本进行。如果新部署的微服务版本是 5.2.0+ (filev2:5.2.0+ 使用 minio + file 模式)，需要手动启动容器内的 MinIO 服务并创建 bucket。
    
    1.  **添加 `sc` 的 host 解析**：
        ```bash
        echo '127.0.0.1 sc' >> /etc/hosts
        ```
    2.  **启动 MinIO**：
        ```bash
        source /entrypoint.sh && minioStartup &
        ```
    3.  **创建 bucket**：
        ```bash
        source /entrypoint.sh && fileInit &
        ```
    4.  **还原文件数据**：
        ```bash
        source /entrypoint.sh && restore file /data/backup/20221111184140/file
        ```

8.  **执行 `exit`，退出临时容器**。

9.  **清理 Redis 缓存数据**：
    为了确保数据一致性，需要清理 Redis 缓存。
    ```bash
    mv /data/mingdao/script/volume/data/redis/dump.rdb /data/mingdao/script/volume/data/redis/dump.rdb.bak
    ```

10. **重启 HAP 服务**：
    在管理器根目录下执行 `bash ./service.sh startall`，启动所有 HAP 服务。

#### 3.2.3 文件复制方式备份的恢复

如果备份是直接打包数据目录生成的，恢复步骤如下：

1.  **解压备份压缩包到数据目录**：
    将原备份的压缩包上传至当前服务器，并直接解压到 `/data/mingdao/script/volume/data/` 目录下。
    ```bash
    tar -zxvf /backup/20221111184140.tar.gz -C /data/mingdao/script/volume/data/
    ```

2.  **清理 Redis 缓存数据**：
    为了确保数据一致性，需要清理 Redis 缓存。
    ```bash
    mv /data/mingdao/script/volume/data/redis/dump.rdb /data/mingdao/script/volume/data/redis/dump.rdb.bak
    ```

3.  **重启 HAP 服务**：
    在管理器根目录下执行 `bash ./service.sh startall`，启动所有 HAP 服务。

## 4. 最佳实践

*   **备份前磁盘空间检查**：在执行备份操作前，务必检查当前磁盘的可用空间。建议剩余空间至少为已使用空间的一倍及以上，以避免备份过程中因磁盘空间不足导致失败。
*   **定期备份的重要性**：制定并严格执行定期备份策略，例如每日、每周或每月备份，以确保在发生数据丢失时能够及时恢复到最新状态。
*   **备份文件存放路径的修改**：为了方便管理和防止数据丢失，建议将备份文件存放到宿主机上的独立目录，并通过 `docker-compose.yaml` 配置挂载，而不是使用默认的容器内路径。
*   **集群部署模式下的备份注意事项**：在集群部署模式下，需要对 **数据存储服务器** 和 **中间件服务器** 的数据目录进行定期备份，并推荐对这两类服务器进行定期快照，以提供多重保障。
*   **恢复前的原数据处理**：在进行数据恢复前，务必将当前环境下的原数据进行妥善处理（例如移动到其他位置或备份），切勿直接删除，以防恢复失败后无法回滚。
*   **临时容器的环境变量配置**：在 `dump` 方式恢复时，启动临时容器需要配置正确的数据库连接环境变量，确保容器能够正确连接到数据库服务。
*   **版本兼容性**：在进行恢复操作时，需要注意备份数据和当前部署的明道云版本兼容性。特别是文件服务在 5.2.0+ 版本后引入 MinIO，恢复步骤会有所不同。

## 5. 常见问题

*   **备份失败**：
    *   **磁盘空间不足**：检查宿主机磁盘空间是否满足备份要求。
    *   **容器未运行或命令错误**：确认明道云容器正常运行，并检查备份命令是否正确。
    *   **权限问题**：确保执行备份命令的用户具有足够的权限访问相关目录和文件。
*   **恢复失败**：
    *   **备份文件损坏或不完整**：检查备份文件的完整性和可用性。
    *   **数据库连接失败**：检查临时容器中的数据库连接环境变量是否正确，以及数据库服务是否正常启动。
    *   **版本不兼容**：确认备份数据与当前明道云版本兼容，特别是文件服务 MinIO 的配置。
    *   **索引创建问题**：在 MongoDB 恢复过程中，如果索引创建失败或未手动确认，可能导致恢复不完整。
*   **数据不一致**：
    *   **未停止服务进行备份/恢复**：在文件复制方式备份和所有恢复操作中，务必停止 HAP 服务，以避免数据不一致。
    *   **Redis 缓存未清理**：恢复后务必清理 Redis 缓存，以确保系统加载最新数据。

## 6. 与其他模块的关联

数据备份恢复模块与明道云私有部署的多个核心模块紧密关联，共同保障系统的稳定运行和数据安全：

*   **部署运维模块**：备份恢复是部署运维的重要组成部分，运维人员需要定期执行备份操作，并在必要时进行数据恢复，以维护系统的健康状态。
*   **存储组件**：明道云私有部署依赖多种存储组件，包括 MySQL (关系型数据库)、MongoDB (文档型数据库)、MinIO (文件存储)、Redis (缓存)、Elasticsearch (搜索) 等。备份恢复模块需要对这些组件的数据进行全面备份和精确恢复。
*   **版本升级模块**：在进行明道云版本升级前，通常需要进行数据备份，以防升级过程中出现意外，确保可以回滚到之前的稳定状态。

## 7. 实际案例

### 7.1 场景：不停服务进行每日数据备份

**需求**：某企业希望在不中断明道云服务的情况下，每天凌晨 2 点自动备份 MySQL、MongoDB 和文件数据，并将备份文件存放到宿主机的 `/data/mingdao_backup/` 目录下。

**配置步骤**：

1.  **修改 `docker-compose.yaml` 文件**：
    在 `app` 服务的 `volumes` 部分添加挂载配置，将容器内的 `/data/backup/` 目录映射到宿主机的 `/data/mingdao_backup/` 目录。
    ```yaml
    # ... 其他配置
    services:
      app:
        # ... 其他配置
        volumes:
          - /data/mingdao_backup/:/data/backup/
        # ...
    ```
    修改后，需要重启明道云服务使配置生效。

2.  **创建定时任务 (Cron Job)**：
    在宿主机上创建 Cron Job，每天凌晨 2 点执行备份命令。
    ```bash
    # 编辑 crontab
    crontab -e
    
    # 添加以下行，每天凌晨 2 点执行备份
    0 2 * * * docker exec -it $(docker ps | grep -E 'mingdaoyun-community|mingdaoyun-hap' | awk '{print $1}') bash -c 'source /entrypoint.sh && backup mysql mongodb file' >> /var/log/mingdaoyun_backup.log 2>&1
    ```
    *   `>> /var/log/mingdaoyun_backup.log 2>&1`：将命令输出重定向到日志文件，方便查看备份结果和排查问题。

### 7.2 场景：系统故障后进行数据恢复

**需求**：明道云私有部署系统因硬件故障导致数据丢失，需要使用最近的备份文件 `20221111184140.tar.gz` (dump 方式生成) 进行数据恢复。

**恢复步骤**：

1.  **停止 HAP 服务**：
    ```bash
    bash ./service.sh stopall
    ```

2.  **上传备份文件**：
    将 `20221111184140.tar.gz` 上传到服务器的 `/backup/` 目录。

3.  **移除原数据**：
    ```bash
    time=$(date +%Y%m%d%H%M%S) && mkdir -p /backup/$time/ && mv /data/mingdao/script/volume/data/* /backup/$time/
    ```

4.  **解压备份文件**：
    ```bash
    cd /backup/
    tar -zxvf 20221111184140.tar.gz
    ```

5.  **启动临时容器并恢复数据**：
    ```bash
    docker run -it --rm --entrypoint bash \
      -e ENV_MYSQL_HOST="127.0.0.1" \
      -e ENV_MYSQL_PORT="3306" \
      -e ENV_MYSQL_USERNAME="root" \
      -e ENV_MYSQL_PASSWORD="123456" \
      -e ENV_MONGODB_URI="mongodb://127.0.0.1:27017" \
      -e ENV_MONGODB_OPTIONS="" \
      -v /data/mingdao/script/volume/data/:/data/ \
      -v /backup/:/data/backup/ \
      registry.cn-hangzhou.aliyuncs.com/mdpublic/mingdaoyun-sc:3.2.0
    
    # 在容器内执行以下命令
    mkdir -p /data/{logs,mysql,mongodb,storage}
    mkdir -p /data/storage/data
    source /entrypoint.sh && mysqlStartup &
    source /entrypoint.sh && restore mysql /data/backup/20221111184140/mysql
    source /entrypoint.sh && mongodbStartup &
    # 索引创建完成后手动按回车
    source /entrypoint.sh && restore mongodb /data/backup/20221111184140/mongodb
    
    # 如果是 5.2.0+ 版本，需要先启动 MinIO 并创建 bucket
    # echo '127.0.0.1 sc' >> /etc/hosts
    # source /entrypoint.sh && minioStartup &
    # source /entrypoint.sh && fileInit &
    
    source /entrypoint.sh && restore file /data/backup/20221111184140/file
    exit
    ```

6.  **清理 Redis 缓存**：
    ```bash
    mv /data/mingdao/script/volume/data/redis/dump.rdb /data/mingdao/script/volume/data/redis/dump.rdb.bak
    ```

7.  **重启 HAP 服务**：
    ```bash
    bash ./service.sh startall
    ```

## 参考文献

[1] [备份 | 私有部署](https://docs-pd.mingdao.com/deployment/docker-compose/standalone/data/backup)
[2] [还原 | 私有部署](https://docs-pd.mingdao.com/deployment/docker-compose/standalone/data/restore)
