# 🗄️ MySQL 数据库安装和迁移指南

## 🚀 一键安装MySQL（推荐）

在服务器上执行：

```bash
cd /var/www/moocpay/moocpay

# 1. 拉取最新代码
git pull origin master

# 2. 给脚本执行权限
chmod +x scripts/install-mysql.sh

# 3. 执行安装（需要root权限）
sudo bash scripts/install-mysql.sh
```

**脚本会自动完成：**
- ✅ 安装MySQL服务器
- ✅ 创建数据库 `moocpay`
- ✅ 创建用户 `moocpay`（随机密码）
- ✅ 创建所有表结构
- ✅ 安装 `mysql2` 驱动
- ✅ 生成配置文件

---

## 📋 手动安装步骤（如果需要）

### 步骤1：安装MySQL

```bash
# 更新包列表
sudo apt update

# 安装MySQL
sudo apt install mysql-server -y

# 启动MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 检查状态
sudo systemctl status mysql
```

### 步骤2：创建数据库和用户

```bash
# 登录MySQL
sudo mysql -u root

# 执行SQL命令
```

```sql
-- 创建数据库
CREATE DATABASE moocpay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（替换为您的密码）
CREATE USER 'moocpay'@'localhost' IDENTIFIED BY 'your_strong_password';

-- 授权
GRANT ALL PRIVILEGES ON moocpay.* TO 'moocpay'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

### 步骤3：创建表结构

```bash
# 使用moocpay数据库
mysql -u moocpay -p moocpay
```

```sql
-- 创建转账记录表
CREATE TABLE transfers (
  id VARCHAR(36) PRIMARY KEY,
  displayName VARCHAR(50) NOT NULL,
  actualAmount DECIMAL(10, 2) NOT NULL,
  senderName VARCHAR(100) NOT NULL,
  senderAvatar VARCHAR(255),
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  accountStatus VARCHAR(20) NOT NULL DEFAULT 'available',
  theme VARCHAR(20) DEFAULT 'classic',
  receiverOpenId VARCHAR(100),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  receivedAt DATETIME,
  INDEX idx_status (status),
  INDEX idx_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建支付记录表
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  transferId VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  orderId VARCHAR(100),
  prepayId VARCHAR(100),
  transactionId VARCHAR(100),
  error TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  paidAt DATETIME,
  FOREIGN KEY (transferId) REFERENCES transfers(id) ON DELETE CASCADE,
  INDEX idx_transfer (transferId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔧 配置项目使用MySQL

### 步骤1：安装MySQL驱动

```bash
cd /var/www/moocpay/moocpay/backend
npm install mysql2
```

### 步骤2：配置环境变量

编辑 `backend/.env`：

```bash
nano .env
```

添加数据库配置：

```env
# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moocpay
DB_USER=moocpay
DB_PASSWORD=your_password_here
```

### 步骤3：切换到MySQL模型

```bash
cd /var/www/moocpay/moocpay

# 给脚本执行权限
chmod +x scripts/switch-to-mysql.sh

# 执行切换
bash scripts/switch-to-mysql.sh
```

### 步骤4：重启服务

```bash
pm2 restart moocpay
pm2 logs moocpay --lines 30
```

---

## ✅ 验证MySQL数据持久化

### 测试1：创建转账

1. 访问网站创建转账
2. 刷新页面，记录应该还在

### 测试2：检查数据库

```bash
# 登录MySQL
mysql -u moocpay -p moocpay

# 查看转账记录
SELECT * FROM transfers;

# 应该看到刚创建的记录
```

### 测试3：服务器重启

```bash
# 重启服务器
pm2 restart moocpay

# 访问网站
# 之前的转账记录应该还在
```

---

## 📊 MySQL vs JSON对比

| 特性 | JSON文件 | MySQL数据库 |
|------|---------|------------|
| 持久化 | ⚠️ 依赖文件权限 | ✅ 可靠 |
| 并发 | ❌ 可能冲突 | ✅ 支持高并发 |
| 查询 | ❌ 需要全部加载 | ✅ 索引查询快 |
| 事务 | ❌ 不支持 | ✅ 支持ACID |
| 备份 | ⚠️ 手动复制 | ✅ 自动备份 |
| 扩展性 | ❌ 受限 | ✅ 易扩展 |

**生产环境强烈推荐MySQL！** ⭐⭐⭐⭐⭐

---

## 🎯 完整执行流程

### 方式一：一键安装（推荐）

```bash
cd /var/www/moocpay/moocpay && \
git pull origin master && \
chmod +x scripts/*.sh && \
sudo bash scripts/install-mysql.sh && \
cd backend && \
cat .env.db >> .env && \
bash ../scripts/switch-to-mysql.sh && \
pm2 restart moocpay && \
pm2 logs moocpay --lines 20
```

### 方式二：分步安装

```bash
# 1. 拉取代码
cd /var/www/moocpay/moocpay
git pull origin master

# 2. 安装MySQL
sudo bash scripts/install-mysql.sh

# 3. 配置环境变量
cd backend
cat .env.db >> .env
nano .env  # 检查配置

# 4. 切换到MySQL
cd ..
bash scripts/switch-to-mysql.sh

# 5. 重启服务
pm2 restart moocpay
```

---

## 🔍 故障排查

### 问题1：MySQL安装失败

```bash
# 检查MySQL状态
sudo systemctl status mysql

# 重启MySQL
sudo systemctl restart mysql

# 查看错误日志
sudo tail -f /var/log/mysql/error.log
```

### 问题2：数据库连接失败

```bash
# 测试连接
mysql -u moocpay -p moocpay

# 如果失败，检查用户权限
sudo mysql -u root
```

```sql
SHOW GRANTS FOR 'moocpay'@'localhost';
```

### 问题3：表不存在

```bash
# 重新创建表
mysql -u moocpay -p moocpay < scripts/create-tables.sql
```

---

## 📝 数据迁移（如果有JSON数据）

如果您之前有JSON数据想导入MySQL：

```bash
# 创建迁移脚本
cd /var/www/moocpay/moocpay/backend

node << 'EOF'
const fs = require('fs');
const mysql = require('mysql2/promise');

async function migrate() {
  // 读取JSON数据
  const transfers = JSON.parse(fs.readFileSync('data/transfers.json', 'utf8'));
  
  // 连接MySQL
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'moocpay',
    password: process.env.DB_PASSWORD,
    database: 'moocpay'
  });
  
  // 插入数据
  for (const t of transfers) {
    await conn.execute(
      `INSERT INTO transfers (id, displayName, actualAmount, senderName, message, status, accountStatus, theme, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.displayName, t.actualAmount, t.senderName, t.message, t.status, t.accountStatus, t.theme, t.createdAt, t.updatedAt]
    );
  }
  
  console.log(`✅ 成功迁移 ${transfers.length} 条记录`);
  await conn.end();
}

migrate();
EOF
```

---

## 🎉 安装完成后

**您将获得：**
- ✅ 可靠的数据持久化
- ✅ 不会因为权限问题丢失数据
- ✅ 支持高并发访问
- ✅ 数据查询更快
- ✅ 自动备份（配合mysqldump）

**请执行一键安装命令开始！** 🚀

