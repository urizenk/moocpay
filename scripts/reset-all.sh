#!/bin/bash

echo "=========================================="
echo "🔧 一键修复所有问题"
echo "=========================================="
echo ""

# 新密码（简单好记）
MYSQL_ROOT_PASS="Root123456"
MYSQL_MOOCPAY_PASS="Moocpay123456"

echo "📋 将设置以下密码："
echo "  MySQL root: $MYSQL_ROOT_PASS"
echo "  MySQL moocpay: $MYSQL_MOOCPAY_PASS"
echo ""

# 停止MySQL
echo "1️⃣ 停止MySQL..."
systemctl stop mysql
sleep 2

# 删除旧的safe模式进程
pkill mysqld_safe 2>/dev/null
pkill mysqld 2>/dev/null
sleep 2

# 启动安全模式
echo "2️⃣ 启动MySQL安全模式..."
mysqld_safe --skip-grant-tables &
sleep 5

# 重置root密码
echo "3️⃣ 重置root密码..."
mysql -u root << EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '$MYSQL_ROOT_PASS';
FLUSH PRIVILEGES;
EOF

# 停止安全模式
echo "4️⃣ 停止安全模式..."
pkill mysqld_safe
pkill mysqld
sleep 3

# 正常启动MySQL
echo "5️⃣ 正常启动MySQL..."
systemctl start mysql
sleep 3

# 重置moocpay用户密码
echo "6️⃣ 重置moocpay用户密码..."
mysql -u root -p"$MYSQL_ROOT_PASS" << EOF
-- 删除旧用户（如果存在）
DROP USER IF EXISTS 'moocpay'@'localhost';

-- 创建新用户
CREATE USER 'moocpay'@'localhost' IDENTIFIED BY '$MYSQL_MOOCPAY_PASS';

-- 授权
GRANT ALL PRIVILEGES ON moocpay.* TO 'moocpay'@'localhost';
FLUSH PRIVILEGES;

-- 测试
SELECT user, host FROM mysql.user WHERE user = 'moocpay';
EOF

# 更新.env配置
echo "7️⃣ 更新.env配置..."
cat > /var/www/moocpay/moocpay/backend/.env << EOF
# 微信支付配置
WECHAT_APP_ID=your_test_app_id
WECHAT_APP_SECRET=your_test_app_secret
WECHAT_TOKEN=your_test_token
WECHAT_MCH_ID=your_test_mch_id
WECHAT_API_KEY=your_test_api_key
WECHAT_NOTIFY_URL=https://513761.com/api/payment/callback

# 服务器配置
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://513761.com
SESSION_SECRET=moocpay_session_secret_2025

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moocpay
DB_USER=moocpay
DB_PASSWORD=$MYSQL_MOOCPAY_PASS
EOF

# 重启服务
echo "8️⃣ 重启PM2服务..."
cd /var/www/moocpay/moocpay/backend
pm2 restart moocpay
sleep 2

# 测试
echo ""
echo "9️⃣ 测试创建转账..."
curl -X POST http://localhost:5000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"senderName":"测试用户","displayName":"188.88元","actualAmount":0.01,"message":"恭喜发财"}'

echo ""
echo ""
echo "=========================================="
echo "✅ 修复完成！"
echo "=========================================="
echo ""
echo "📝 新密码信息："
echo "  MySQL root密码: $MYSQL_ROOT_PASS"
echo "  MySQL moocpay密码: $MYSQL_MOOCPAY_PASS"
echo ""
echo "💾 请保存这些密码！"
echo "=========================================="

