#!/bin/bash

# 检查服务器更新状态

echo "========================================"
echo "   检查服务器文件更新状态"
echo "========================================"
echo ""

# 1. 检查Git状态
echo "📦 [1/5] Git状态:"
cd /var/www/moocpay/moocpay
git log --oneline -1
echo ""

# 2. 检查TransferPage.vue文件内容
echo "📄 [2/5] TransferPage.vue 是否包含微信判断:"
if grep -q "isWechat()" /var/www/moocpay/moocpay/frontend/src/pages/TransferPage.vue; then
    echo "✅ 包含微信判断逻辑"
else
    echo "❌ 不包含微信判断逻辑 - 文件未更新！"
fi
echo ""

# 3. 检查构建后的dist文件时间
echo "🏗️ [3/5] 前端构建时间:"
ls -lh /var/www/moocpay/moocpay/frontend/dist/index.html | awk '{print $6, $7, $8, $9}'
echo ""

# 4. 检查PM2状态
echo "🚀 [4/5] PM2运行状态:"
pm2 list | grep moocpay
echo ""

# 5. 检查最新的构建文件
echo "📦 [5/5] 最新JS文件:"
ls -lt /var/www/moocpay/moocpay/frontend/dist/assets/*.js | head -1
echo ""

echo "========================================"
echo "   检查完成"
echo "========================================"

