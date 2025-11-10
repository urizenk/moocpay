#!/bin/bash

# ========================================
# 一键修复所有问题脚本
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/var/www/moocpay/moocpay"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   一键修复所有问题${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ========================================
# 第1步：检查MySQL状态
# ========================================
echo -e "${BLUE}[1/8]${NC} ${YELLOW}检查MySQL状态...${NC}"

if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL运行正常${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL未运行，正在启动...${NC}"
    systemctl start mysql
    echo -e "${GREEN}✅ MySQL已启动${NC}"
fi

# 检查数据库是否存在
if mysql -u root -e "USE moocpay;" 2>/dev/null; then
    echo -e "${GREEN}✅ 数据库moocpay存在${NC}"
else
    echo -e "${RED}❌ 数据库moocpay不存在，需要先运行 one-click-deploy.sh${NC}"
    exit 1
fi
echo ""

# ========================================
# 第2步：读取数据库密码
# ========================================
echo -e "${BLUE}[2/8]${NC} ${YELLOW}读取数据库配置...${NC}"

cd $PROJECT_DIR/backend

if grep -q "^DB_PASSWORD=" .env; then
    DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2)
    echo -e "${GREEN}✅ 数据库密码: ${DB_PASSWORD}${NC}"
else
    echo -e "${RED}❌ .env文件中没有DB_PASSWORD，需要先运行 one-click-deploy.sh${NC}"
    exit 1
fi
echo ""

# ========================================
# 第3步：测试数据库连接
# ========================================
echo -e "${BLUE}[3/8]${NC} ${YELLOW}测试数据库连接...${NC}"

if mysql -u moocpay -p"$DB_PASSWORD" moocpay -e "SELECT 1;" 2>/dev/null; then
    echo -e "${GREEN}✅ 数据库连接成功${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
fi
echo ""

# ========================================
# 第4步：确认MySQL模型文件存在
# ========================================
echo -e "${BLUE}[4/8]${NC} ${YELLOW}检查MySQL模型文件...${NC}"

if [ -f "$PROJECT_DIR/backend/src/models/transfer.mysql.js" ]; then
    echo -e "${GREEN}✅ transfer.mysql.js 存在${NC}"
else
    echo -e "${RED}❌ transfer.mysql.js 不存在${NC}"
    exit 1
fi

if [ -f "$PROJECT_DIR/backend/src/models/payment.mysql.js" ]; then
    echo -e "${GREEN}✅ payment.mysql.js 存在${NC}"
else
    echo -e "${RED}❌ payment.mysql.js 不存在${NC}"
    exit 1
fi
echo ""

# ========================================
# 第5步：切换到MySQL模型
# ========================================
echo -e "${BLUE}[5/8]${NC} ${YELLOW}切换到MySQL模型...${NC}"

cd $PROJECT_DIR/backend/src/models

# 备份当前模型（如果是JSON模型）
if grep -q "fs.promises" transfer.js 2>/dev/null; then
    echo "  备份JSON模型..."
    cp transfer.js transfer.json.backup
    cp payment.js payment.json.backup
fi

# 使用MySQL模型
echo "  使用MySQL模型..."
cp transfer.mysql.js transfer.js
cp payment.mysql.js payment.js

echo -e "${GREEN}✅ 模型切换完成${NC}"
echo ""

# ========================================
# 第6步：初始化MySQL表（如果需要）
# ========================================
echo -e "${BLUE}[6/8]${NC} ${YELLOW}检查并初始化数据表...${NC}"

# 检查表是否存在
TABLE_COUNT=$(mysql -u moocpay -p"$DB_PASSWORD" moocpay -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='moocpay' AND table_name IN ('transfers', 'payments');")

if [ "$TABLE_COUNT" -eq 2 ]; then
    echo -e "${GREEN}✅ 数据表已存在${NC}"
else
    echo "  创建数据表..."
    mysql -u moocpay -p"$DB_PASSWORD" moocpay << 'EOSQL'
-- 转账记录表
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

-- 支付记录表
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
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOSQL
    echo -e "${GREEN}✅ 数据表创建完成${NC}"
fi
echo ""

# ========================================
# 第7步：重启后端服务
# ========================================
echo -e "${BLUE}[7/8]${NC} ${YELLOW}重启后端服务...${NC}"

cd $PROJECT_DIR/backend
pm2 restart moocpay
sleep 2

if pm2 list | grep -q "moocpay.*online"; then
    echo -e "${GREEN}✅ 后端服务重启成功${NC}"
else
    echo -e "${RED}❌ 后端服务重启失败${NC}"
    pm2 logs moocpay --lines 20
    exit 1
fi
echo ""

# ========================================
# 第8步：验证MySQL连接
# ========================================
echo -e "${BLUE}[8/8]${NC} ${YELLOW}验证MySQL数据存储...${NC}"

# 等待服务启动
sleep 3

# 检查日志中是否有MySQL错误
if pm2 logs moocpay --lines 50 --nostream | grep -qi "mysql.*error\|econnrefused"; then
    echo -e "${RED}❌ 检测到MySQL连接错误${NC}"
    pm2 logs moocpay --lines 20
else
    echo -e "${GREEN}✅ MySQL连接正常${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}       🎉 修复完成！🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📊 当前状态：${NC}"
pm2 status
echo ""
echo -e "${YELLOW}💾 数据库信息：${NC}"
echo "  数据库: moocpay"
echo "  用户: moocpay"
echo "  密码: $DB_PASSWORD"
echo ""
echo -e "${YELLOW}🧪 测试步骤：${NC}"
echo "1. 访问: https://513761.com/"
echo "2. 创建转账（会自动保存到MySQL）"
echo "3. 刷新页面，转账记录应该还在 ✅"
echo "4. 分享链接，在微信打开，应该看到收款页面 ✅"
echo ""
echo -e "${YELLOW}📋 查看数据库数据：${NC}"
echo "mysql -u moocpay -p\"$DB_PASSWORD\" moocpay -e 'SELECT id, displayName, actualAmount, status FROM transfers;'"
echo ""
echo -e "${GREEN}========================================${NC}"

