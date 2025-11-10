#!/bin/bash

# 修复.env配置文件
echo "🔧 修复.env配置..."

cat > /var/www/moocpay/moocpay/backend/.env << 'EOF'
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
DB_PASSWORD=Moocpay@2025

# Redis配置（如果使用Redis）
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# JWT配置（如果使用JWT认证）
# JWT_SECRET=your_jwt_secret_key
# JWT_EXPIRES_IN=24h
EOF

echo "✅ .env文件已修复"
echo ""
echo "📝 配置内容："
cat /var/www/moocpay/moocpay/backend/.env
echo ""
echo "🔄 重启服务..."
cd /var/www/moocpay/moocpay/backend
pm2 restart moocpay

sleep 2

echo ""
echo "✅ 完成！测试创建转账..."
curl -X POST http://localhost:5000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"senderName":"测试","displayName":"100.00元","actualAmount":0.01,"message":"测试"}' \
  | jq .

echo ""
echo "✅ 修复完成！"

