# 服务器更新命令 - 针对实际部署路径

## 1. 生产环境更新命令

### Linux 服务器

项目实际部署路径：`/var/www/moocpay/moocpay`

#### 方法一：使用同步脚本（推荐）

```bash
# 进入项目目录
cd /var/www/moocpay/moocpay

# 从 GitHub 同步最新代码
./scripts/sync-from-github.sh master production

# 如果脚本不在当前目录，可能需要先从 GitHub 拉取脚本
git pull origin master
./scripts/sync-from-github.sh master production
```

#### 方法二：手动更新

```bash
# 进入项目目录
cd /var/www/moocpay/moocpay

# 拉取最新代码
git pull origin master

# 安装后端依赖
cd backend
npm install

# 安装前端依赖并构建
cd ../frontend
npm install
npm run build

# 返回项目根目录
cd ..

# 重启应用（使用 PM2）
pm2 restart moocpay-backend

# 或者如果没有使用 PM2，直接重启 Node.js 进程
# 需要先找到进程 ID，然后 kill 并重启
```

### Windows 服务器

项目实际部署路径：`C:\var\www\moocpay\moocpay`（假设路径结构相同）

#### 方法一：使用同步脚本（推荐）

```cmd
# 进入项目目录
cd C:\var\www\moocpay\moocpay

# 从 GitHub 同步最新代码
scripts\sync-from-github.bat master production
```

#### 方法二：手动更新

```cmd
# 进入项目目录
cd C:\var\www\moocpay\moocpay

# 拉取最新代码
git pull origin master

# 安装后端依赖
cd backend
npm install

# 安装前端依赖并构建
cd ..\frontend
npm install
npm run build

# 返回项目根目录
cd ..

# 重启应用（使用 PM2）
pm2 restart moocpay-backend
```

## 2. 验证更新

更新完成后，执行以下命令验证：

### 检查应用状态

```bash
# 检查 PM2 进程状态
pm2 list

# 检查应用日志
pm2 logs moocpay-backend

# 检查端口占用
netstat -tlnp | grep :5000
```

### 检查新功能

1. **微信分享功能**：
   - 访问转账页面，检查是否有分享按钮
   - 测试分享功能是否正常工作

2. **公众号入口功能**：
   - 访问 `/wechat-entry` 路径
   - 检查公众号入口页面是否正常显示

## 3. 故障排除

### 如果同步脚本不存在或不可用

如果 `sync-from-github.sh` 脚本不存在或不可用，可以使用以下手动更新步骤：

```bash
# 进入项目目录
cd /var/www/moocpay/moocpay

# 确保在 master 分支
git checkout master

# 拉取最新代码
git pull origin master

# 检查是否有冲突
git status

# 如果有冲突，解决冲突后继续

# 安装后端依赖
cd backend
npm install

# 安装前端依赖并构建
cd ../frontend
npm install
npm run build

# 返回项目根目录
cd ..

# 重启应用
pm2 restart all
```

### 如果构建失败

如果前端构建失败，尝试清理缓存：

```bash
# 进入前端目录
cd /var/www/moocpay/moocpay/frontend

# 清理缓存
rm -rf node_modules package-lock.json
npm install

# 再次尝试构建
npm run build
```

### 如果应用无法启动

检查应用日志：

```bash
# 查看 PM2 日志
pm2 logs moocpay-backend

# 或者查看系统日志
journalctl -u nginx
```

## 4. 备份策略

在更新前，建议创建备份：

```bash
# 创建备份目录
sudo mkdir -p /opt/backups

# 创建当前版本的备份
sudo cp -r /var/www/moocpay/moocpay /opt/backups/moocpay-$(date +%Y%m%d-%H%M%S)

# 验证备份
ls -la /opt/backups/
```

## 5. 回滚步骤

如果更新后出现问题，可以使用备份回滚：

```bash
# 停止当前应用
pm2 stop moocpay-backend

# 列出可用备份
ls -la /opt/backups/

# 恢复到指定备份（替换为实际备份名）
sudo rm -rf /var/www/moocpay/moocpay
sudo cp -r /opt/backups/moocpay-20231109-150000 /var/www/moocpay/moocpay

# 重启应用
cd /var/www/moocpay/moocpay
pm2 start moocpay-backend
```

## 6. 测试环境更新

如果项目也有测试环境，可以使用以下命令更新：

```bash
# 进入测试环境目录（假设测试环境在 /var/www/moocpay-test）
cd /var/www/moocpay-test

# 拉取最新代码
git pull origin develop

# 安装依赖并构建
cd backend && npm install
cd ../frontend && npm install && npm run build

# 重启测试环境应用
pm2 restart moocpay-test-backend
```

## 7. 自动化更新建议

为了简化未来的更新过程，可以考虑：

1. **创建自定义同步脚本**：
   ```bash
   # 创建 /var/www/moocpay/update.sh
   cat > /var/www/moocpay/update.sh << 'EOF'
   #!/bin/bash
   cd /var/www/moocpay/moocpay
   git pull origin master
   cd backend && npm install
   cd ../frontend && npm install && npm run build
   pm2 restart moocpay-backend
   EOF
   
   chmod +x /var/www/moocpay/update.sh
   ```

2. **设置定时任务**（可选，用于自动更新）：
   ```bash
   # 编辑 crontab
   crontab -e
   
   # 添加每日凌晨2点检查更新的任务
   0 2 * * * /var/www/moocpay/update.sh >> /var/log/moocpay-update.log 2>&1
   ```

这些命令应该能帮助您成功更新服务器上的项目。