#!/bin/bash

# MySQL安装和配置脚本
# 适用于 Ubuntu/Debian 系统

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    MySQL 自动安装配置脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}请使用root权限运行此脚本${NC}"
   echo "使用: sudo bash install-mysql.sh"
   exit 1
fi

# 更新系统
echo -e "${YELLOW}[1/7] 更新系统包...${NC}"
apt update

# 安装MySQL
echo -e "${YELLOW}[2/7] 安装MySQL服务器...${NC}"
DEBIAN_FRONTEND=noninteractive apt install -y mysql-server

# 启动MySQL服务
echo -e "${YELLOW}[3/7] 启动MySQL服务...${NC}"
systemctl start mysql
systemctl enable mysql

# 创建数据库和用户
echo -e "${YELLOW}[4/7] 创建数据库和用户...${NC}"

# 生成随机密码
DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

# 执行SQL命令
mysql -u root << EOF
-- 创建数据库
CREATE DATABASE IF NOT EXISTS moocpay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS 'moocpay'@'localhost' IDENTIFIED BY '$DB_PASSWORD';

-- 授权
GRANT ALL PRIVILEGES ON moocpay.* TO 'moocpay'@'localhost';
FLUSH PRIVILEGES;

-- 使用数据库
USE moocpay;

-- 创建转账记录表
CREATE TABLE IF NOT EXISTS transfers (
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
CREATE TABLE IF NOT EXISTS payments (
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
  INDEX idx_status (status),
  INDEX idx_order (orderId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建设置表
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  keyName VARCHAR(50) UNIQUE NOT NULL,
  keyValue TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认设置
INSERT INTO settings (keyName, keyValue, createdAt, updatedAt) VALUES
('displayName', '100.00元', NOW(), NOW()),
('actualAmount', '0.1', NOW(), NOW()),
('senderName', '张三', NOW(), NOW()),
('message', '恭喜发财，大吉大利', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();
EOF

# 保存数据库配置
echo -e "${YELLOW}[5/7] 保存数据库配置...${NC}"
CONFIG_FILE="/var/www/moocpay/moocpay/backend/.env.db"
cat > $CONFIG_FILE << EOF
# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moocpay
DB_USER=moocpay
DB_PASSWORD=$DB_PASSWORD
EOF

echo -e "${GREEN}数据库配置已保存到: $CONFIG_FILE${NC}"

# 安装Node.js MySQL驱动
echo -e "${YELLOW}[6/7] 安装MySQL驱动...${NC}"
cd /var/www/moocpay/moocpay/backend
npm install mysql2 --save

# 显示配置信息
echo -e "${YELLOW}[7/7] 安装完成！${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    MySQL 安装成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "数据库信息："
echo "  数据库名: moocpay"
echo "  用户名: moocpay"
echo "  密码: $DB_PASSWORD"
echo ""
echo "配置文件已保存到："
echo "  $CONFIG_FILE"
echo ""
echo "请将以下配置添加到 backend/.env 文件："
echo ""
cat $CONFIG_FILE
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. 编辑 /var/www/moocpay/moocpay/backend/.env"
echo "2. 添加上面的数据库配置"
echo "3. 执行数据库连接测试"
echo ""
echo -e "${GREEN}========================================${NC}"

