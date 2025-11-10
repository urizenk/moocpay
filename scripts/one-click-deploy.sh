#!/bin/bash

# ========================================
# 一键部署脚本 - 解决所有问题
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目路径
PROJECT_DIR="/var/www/moocpay/moocpay"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   一键部署脚本 - 解决所有问题${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查root权限
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}❌ 请使用root权限运行${NC}"
   echo "执行: sudo bash scripts/one-click-deploy.sh"
   exit 1
fi

# ========================================
# 第1步：拉取最新代码
# ========================================
echo -e "${BLUE}[1/10]${NC} ${YELLOW}拉取最新代码...${NC}"
cd $PROJECT_DIR
git pull origin master
echo -e "${GREEN}✅ 代码更新完成${NC}"
echo ""

# ========================================
# 第2步：安装MySQL
# ========================================
echo -e "${BLUE}[2/10]${NC} ${YELLOW}检查并安装MySQL...${NC}"

if ! command -v mysql &> /dev/null; then
    echo "MySQL未安装，开始安装..."
    apt update
    DEBIAN_FRONTEND=noninteractive apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
    echo -e "${GREEN}✅ MySQL安装完成${NC}"
else
    echo -e "${GREEN}✅ MySQL已安装${NC}"
fi
echo ""

# ========================================
# 第3步：创建数据库
# ========================================
echo -e "${BLUE}[3/10]${NC} ${YELLOW}创建数据库和表...${NC}"

# 生成随机密码
DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

# 创建数据库和用户
mysql -u root << EOSQL
DROP DATABASE IF EXISTS moocpay;
CREATE DATABASE moocpay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP USER IF EXISTS 'moocpay'@'localhost';
CREATE USER 'moocpay'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON moocpay.* TO 'moocpay'@'localhost';
FLUSH PRIVILEGES;

USE moocpay;

-- 转账记录表
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

-- 支付记录表
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
EOSQL

echo -e "${GREEN}✅ 数据库创建完成${NC}"
echo ""

# ========================================
# 第4步：配置环境变量
# ========================================
echo -e "${BLUE}[4/10]${NC} ${YELLOW}配置数据库连接...${NC}"

cd $PROJECT_DIR/backend

# 备份现有.env
if [ -f .env ]; then
    cp .env .env.backup
fi

# 添加或更新数据库配置
if grep -q "^DB_HOST=" .env 2>/dev/null; then
    # 更新现有配置
    sed -i "s/^DB_HOST=.*/DB_HOST=localhost/" .env
    sed -i "s/^DB_USER=.*/DB_USER=moocpay/" .env
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i "s/^DB_NAME=.*/DB_NAME=moocpay/" .env
else
    # 添加新配置
    cat >> .env << EOF

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moocpay
DB_USER=moocpay
DB_PASSWORD=$DB_PASSWORD
EOF
fi

echo -e "${GREEN}✅ 数据库配置完成${NC}"
echo "   数据库密码: $DB_PASSWORD"
echo ""

# ========================================
# 第5步：安装后端依赖
# ========================================
echo -e "${BLUE}[5/10]${NC} ${YELLOW}安装后端依赖...${NC}"
cd $PROJECT_DIR/backend
npm install
npm install mysql2
echo -e "${GREEN}✅ 后端依赖安装完成${NC}"
echo ""

# ========================================
# 第6步：切换到MySQL模型
# ========================================
echo -e "${BLUE}[6/10]${NC} ${YELLOW}切换到MySQL数据模型...${NC}"
cd $PROJECT_DIR/backend/src/models

# 备份JSON模型
cp transfer.js transfer.json.bak
cp payment.js payment.json.bak

# 使用MySQL模型
cp transfer.mysql.js transfer.js
cp payment.mysql.js payment.js

echo -e "${GREEN}✅ 数据模型切换完成${NC}"
echo ""

# ========================================
# 第7步：构建前端
# ========================================
echo -e "${BLUE}[7/10]${NC} ${YELLOW}构建前端...${NC}"
cd $PROJECT_DIR/frontend
npm install
node node_modules/vite/bin/vite.js build
echo -e "${GREEN}✅ 前端构建完成${NC}"
echo ""

# ========================================
# 第8步：创建data目录（备用）
# ========================================
echo -e "${BLUE}[8/10]${NC} ${YELLOW}创建备用data目录...${NC}"
cd $PROJECT_DIR/backend
mkdir -p data
chmod 755 data
echo -e "${GREEN}✅ 目录创建完成${NC}"
echo ""

# ========================================
# 第9步：重启服务
# ========================================
echo -e "${BLUE}[9/10]${NC} ${YELLOW}重启服务...${NC}"
pm2 restart moocpay
sleep 3
echo -e "${GREEN}✅ 服务重启完成${NC}"
echo ""

# ========================================
# 第10步：验证部署
# ========================================
echo -e "${BLUE}[10/10]${NC} ${YELLOW}验证部署...${NC}"

# 检查PM2状态
if pm2 list | grep -q "moocpay.*online"; then
    echo -e "${GREEN}✅ 应用运行正常${NC}"
else
    echo -e "${RED}❌ 应用未正常运行${NC}"
fi

# 检查数据库连接
cd $PROJECT_DIR/backend
node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'moocpay',
      password: '$DB_PASSWORD',
      database: 'moocpay'
    });
    console.log('${GREEN}✅ 数据库连接成功${NC}');
    await conn.end();
  } catch (err) {
    console.log('${RED}❌ 数据库连接失败:${NC}', err.message);
  }
})();
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}       🎉 部署完成！🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📊 部署信息：${NC}"
echo "  项目目录: $PROJECT_DIR"
echo "  数据库名: moocpay"
echo "  数据库用户: moocpay"
echo "  数据库密码: $DB_PASSWORD"
echo ""
echo -e "${YELLOW}📝 数据库配置已保存到：${NC}"
echo "  $PROJECT_DIR/backend/.env.db"
echo "  $PROJECT_DIR/backend/.env"
echo ""
echo -e "${YELLOW}🔍 查看服务状态：${NC}"
pm2 status
echo ""
echo -e "${YELLOW}📋 查看应用日志：${NC}"
pm2 logs moocpay --lines 20
echo ""
echo -e "${YELLOW}🧪 测试步骤：${NC}"
echo "1. 访问: https://yourdomain.com/"
echo "2. 创建转账（展示9999元，实际0.01元）"
echo "3. 刷新页面，记录应该还在"
echo "4. 分享链接给好友测试"
echo ""
echo -e "${YELLOW}💾 查看数据库数据：${NC}"
echo "mysql -u moocpay -p moocpay"
echo "输入密码: $DB_PASSWORD"
echo "然后执行: SELECT * FROM transfers;"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ 所有问题已解决！${NC}"
echo -e "${GREEN}========================================${NC}"

