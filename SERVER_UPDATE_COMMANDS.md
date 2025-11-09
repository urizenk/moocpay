# 服务器更新命令指南

## 本地代码已成功推送到GitHub

我已经成功将本地的所有修改推送到GitHub仓库。提交信息为："feat: 添加微信分享功能和公众号入口"。

## 服务器更新命令

### 1. Linux服务器更新命令

如果你使用的是Linux服务器，可以使用以下命令更新项目：

#### 方法一：使用项目提供的同步脚本（推荐）

```bash
# 进入项目目录
cd /opt/moocpay

# 使用同步脚本更新（默认从master分支拉取代码，使用production环境配置）
./scripts/sync-from-github.sh

# 或者指定分支和环境
./scripts/sync-from-github.sh master production
```

#### 方法二：手动更新

```bash
# 进入项目目录
cd /opt/moocpay

# 拉取最新代码
git pull origin master

# 安装/更新依赖
npm install --production

# 重启应用
pm2 restart moocpay
```

### 2. Windows服务器更新命令

如果你使用的是Windows服务器，可以使用以下命令：

#### 方法一：使用项目提供的同步脚本（推荐）

```batch
# 进入项目目录
cd C:\opt\moocpay

# 使用同步脚本更新（默认从master分支拉取代码，使用production环境配置）
scripts\sync-from-github.bat

# 或者指定分支和环境
scripts\sync-from-github.bat master production
```

#### 方法二：手动更新

```batch
# 进入项目目录
cd C:\opt\moocpay

# 拉取最新代码
git pull origin master

# 安装/更新依赖
npm install --production

# 重启应用
pm2 restart moocpay
```

### 3. 验证更新

更新完成后，可以使用以下命令验证应用是否正常运行：

```bash
# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs moocpay

# 检查应用是否响应
curl -I http://your-domain.com
```

## 注意事项

1. **环境配置**：确保服务器上有正确的`.env`文件，包含所有必要的环境变量
2. **备份**：脚本会自动创建备份，但建议在更新前手动备份重要数据
3. **权限**：确保运行脚本的用户有足够的权限操作项目目录和PM2
4. **依赖**：确保服务器上已安装Node.js、npm、pm2等必要软件
5. **端口**：确保应用使用的端口未被其他程序占用

## 故障排除

如果更新过程中遇到问题，可以尝试以下步骤：

1. 检查错误日志：`pm2 logs moocpay`
2. 检查网络连接：确保服务器能访问GitHub
3. 检查磁盘空间：确保有足够的空间安装依赖
4. 恢复备份：如果需要，可以从备份目录恢复之前的版本

## 测试环境更新

如果需要更新测试环境，可以使用：

```bash
# Linux测试环境
cd /opt/moocpay-test
./scripts/sync-test-env.sh develop

# Windows测试环境
cd C:\opt\moocpay-test
scripts\sync-test-env.bat develop
```