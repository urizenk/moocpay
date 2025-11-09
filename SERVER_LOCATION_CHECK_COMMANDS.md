# 服务器部署位置确认命令

## 1. 检查项目可能存在的位置

### 检查 /opt/moocpay 目录（脚本默认路径）
```bash
# 检查目录是否存在
ls -la /opt/moocpay

# 如果存在，查看目录结构
ls -la /opt/moocpay/
```

### 检查 /var/www/moocpay 目录（文档示例路径）
```bash
# 检查目录是否存在
ls -la /var/www/moocpay

# 如果存在，查看目录结构
ls -la /var/www/moocpay/
```

### 检查 /var/www/moocpay/moocpay 目录（您提到的路径）
```bash
# 检查目录是否存在
ls -la /var/www/moocpay/moocpay

# 如果存在，查看目录结构
ls -la /var/www/moocpay/moocpay/
```

## 2. 搜索项目中可能的关键文件

### 搜索 package.json 文件（确定项目根目录）
```bash
# 在 /opt 目录下搜索
find /opt -name "package.json" -path "*/moocpay/*" 2>/dev/null

# 在 /var/www 目录下搜索
find /var/www -name "package.json" -path "*/moocpay/*" 2>/dev/null

# 在整个系统中搜索（可能需要较长时间）
find / -name "package.json" -path "*/moocpay/*" 2>/dev/null
```

### 搜索 server.js 文件（后端入口文件）
```bash
# 在 /opt 目录下搜索
find /opt -name "server.js" -path "*/moocpay/*" 2>/dev/null

# 在 /var/www 目录下搜索
find /var/www -name "server.js" -path "*/moocpay/*" 2>/dev/null
```

## 3. 检查正在运行的 Node.js 应用

### 查看当前运行的 Node.js 进程
```bash
# 查看所有 Node.js 进程
ps aux | grep node

# 查看进程的详细信息
ps -ef | grep node

# 使用 PM2 查看运行的进程（如果使用了 PM2）
pm2 list
```

### 查看进程的工作目录
```bash
# 找到 Node.js 进程的 PID 后，查看其工作目录
pwdx <PID>

# 例如，如果 PID 是 12345
pwdx 12345
```

## 4. 检查 Nginx 配置（如果使用了 Nginx）

### 查看 Nginx 配置文件
```bash
# 查看 Nginx 主配置
cat /etc/nginx/nginx.conf

# 查看站点配置
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-enabled/default

# 查找包含 moocpay 的配置
grep -r "moocpay" /etc/nginx/
```

## 5. 检查系统服务

### 查看系统服务
```bash
# 查看所有服务
systemctl list-units --type=service --state=running

# 查找可能相关的服务
systemctl list-units | grep moocpay
systemctl list-units | grep node
```

## 6. 检查端口占用

### 检查常用端口占用情况
```bash
# 检查 3000 端口（前端开发服务器）
netstat -tlnp | grep :3000

# 检查 5000 端口（后端 API 服务器）
netstat -tlnp | grep :5000

# 检查 80 和 443 端口（HTTP/HTTPS）
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

## 7. 检查最近访问的目录

### 查看当前用户的命令历史
```bash
# 查看命令历史中包含 cd 的命令
history | grep cd

# 查看命令历史中包含 moocpay 的命令
history | grep moocpay
```

## 8. 综合查找脚本

### 创建一个综合查找脚本
```bash
# 创建查找脚本
cat > find_moocpay.sh << 'EOF'
#!/bin/bash

echo "=== 查找 moocpay 项目 ==="

echo "1. 检查 /opt/moocpay 目录..."
if [ -d "/opt/moocpay" ]; then
    echo "找到 /opt/moocpay 目录"
    ls -la /opt/moocpay/
else
    echo "未找到 /opt/moocpay 目录"
fi

echo "2. 检查 /var/www/moocpay 目录..."
if [ -d "/var/www/moocpay" ]; then
    echo "找到 /var/www/moocpay 目录"
    ls -la /var/www/moocpay/
else
    echo "未找到 /var/www/moocpay 目录"
fi

echo "3. 检查 /var/www/moocpay/moocpay 目录..."
if [ -d "/var/www/moocpay/moocpay" ]; then
    echo "找到 /var/www/moocpay/moocpay 目录"
    ls -la /var/www/moocpay/moocpay/
else
    echo "未找到 /var/www/moocpay/moocpay 目录"
fi

echo "4. 搜索 package.json 文件..."
find /opt /var/www -name "package.json" -path "*/moocpay/*" 2>/dev/null

echo "5. 查看运行的 Node.js 进程..."
ps aux | grep node | grep -v grep

echo "6. 检查 PM2 进程..."
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "PM2 未安装"
fi

echo "=== 查找完成 ==="
EOF

# 给脚本执行权限
chmod +x find_moocpay.sh

# 运行脚本
./find_moocpay.sh
```

## 执行建议

1. 首先运行第1部分的命令，检查最常见的三个位置
2. 如果没有找到，运行第2部分的搜索命令
3. 检查第3-7部分的运行状态和配置
4. 或者直接运行第8部分的综合查找脚本

这些命令应该能帮助您确定项目在服务器上的实际部署位置。