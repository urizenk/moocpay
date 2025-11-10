#!/bin/bash

# 切换到MySQL数据库脚本

echo "=========================================="
echo "    切换到MySQL数据库"
echo "=========================================="

cd /var/www/moocpay/moocpay/backend/src/models

# 备份原文件
echo "[1/4] 备份JSON模型文件..."
cp transfer.js transfer.js.bak
cp payment.js payment.js.bak

# 替换为MySQL模型
echo "[2/4] 切换到MySQL模型..."
cp transfer.mysql.js transfer.js
cp payment.mysql.js payment.js

# 更新server.js导入
echo "[3/4] 更新服务器配置..."
cd ..

# 在server.js中添加数据库连接测试
cat > test-db-connection.js << 'EOF'
const { testConnection } = require('./config/database');

async function test() {
  const success = await testConnection();
  if (success) {
    console.log('✅ 数据库连接测试通过');
    process.exit(0);
  } else {
    console.log('❌ 数据库连接失败，请检查配置');
    process.exit(1);
  }
}

test();
EOF

# 测试数据库连接
echo "[4/4] 测试数据库连接..."
node test-db-connection.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 切换成功！"
    echo ""
    echo "下一步："
    echo "1. pm2 restart moocpay"
    echo "2. 测试创建转账"
    echo "3. 检查数据是否保存到MySQL"
    echo ""
else
    echo ""
    echo "❌ 切换失败！"
    echo "请检查 backend/.env 中的数据库配置"
    echo ""
    # 恢复备份
    cd models
    cp transfer.js.bak transfer.js
    cp payment.js.bak payment.js
fi

