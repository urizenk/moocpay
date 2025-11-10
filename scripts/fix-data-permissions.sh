#!/bin/bash

# 修复数据目录权限脚本

echo "开始修复数据目录权限..."

# 进入项目目录
cd /var/www/moocpay/moocpay/backend

# 创建data目录（如果不存在）
if [ ! -d "data" ]; then
    echo "创建data目录..."
    mkdir -p data
fi

# 创建transfers.json（如果不存在）
if [ ! -f "data/transfers.json" ]; then
    echo "创建transfers.json文件..."
    echo "[]" > data/transfers.json
fi

# 创建payments.json（如果不存在）
if [ ! -f "data/payments.json" ]; then
    echo "创建payments.json文件..."
    echo "[]" > data/payments.json
fi

# 创建settings.json（如果不存在）
if [ ! -f "data/settings.json" ]; then
    echo "创建settings.json文件..."
    cat > data/settings.json << 'EOF'
{
  "displayName": "100.00元",
  "actualAmount": 0.1,
  "senderName": "张三",
  "senderAvatar": "https://via.placeholder.com/50x50?text=张三",
  "message": "恭喜发财，大吉大利",
  "createdAt": "2025-11-10T00:00:00.000Z"
}
EOF
fi

# 设置目录权限
echo "设置data目录权限..."
chmod 755 data

# 设置文件权限
echo "设置JSON文件权限..."
chmod 644 data/*.json

# 设置所有者（假设使用root或当前用户）
echo "设置文件所有者..."
chown -R $(whoami):$(whoami) data

# 验证
echo "验证文件..."
ls -la data/

echo "权限修复完成！"
echo ""
echo "文件列表："
ls -lh data/

echo ""
echo "transfers.json 内容："
cat data/transfers.json

echo ""
echo "如果看到'[]'，说明文件正常，可以开始使用。"

