#!/bin/bash
###
 # @Author: 123 1217776571@qq.com
 # @Date: 2025-11-10 02:24:20
 # @LastEditors: 123 1217776571@qq.com
 # @LastEditTime: 2025-11-10 02:24:29
 # @FilePath: \moocpay\scripts\fix-permissions-and-deploy.sh
 # @Description: 
 # 123dot
 # Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
### 

# 云服务器部署脚本
# 修复权限问题并重新部署应用

echo "开始修复权限问题并重新部署..."

# 进入前端目录
cd /var/www/moocpay/moocpay/frontend

# 修复node_modules权限
echo "修复node_modules权限..."
sudo chown -R $USER:$USER node_modules
sudo chmod -R 755 node_modules

# 修复npm权限
echo "修复npm权限..."
sudo chown -R $USER:$USER ~/.npm
sudo chmod -R 755 ~/.npm

# 清理并重新安装依赖
echo "清理并重新安装前端依赖..."
rm -rf node_modules
npm install

# 构建前端
echo "构建前端应用..."
npm run build

# 进入后端目录
cd ../backend

# 修复后端权限
echo "修复后端权限..."
sudo chown -R $USER:$USER node_modules
sudo chmod -R 755 node_modules

# 清理并重新安装依赖
echo "清理并重新安装后端依赖..."
rm -rf node_modules
npm install

# 重启PM2服务
echo "重启PM2服务..."
pm2 restart moocpay

# 检查服务状态
echo "检查服务状态..."
pm2 status

echo "部署完成！"