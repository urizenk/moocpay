# GitHub同步脚本使用指南

本项目提供了多个脚本，用于从GitHub仓库同步代码到不同环境，并自动重启应用。

## 脚本列表

### 1. sync-from-github.sh (Linux/macOS)
用于从GitHub仓库拉取最新代码并重启应用，适用于生产环境。

**使用方法:**
```bash
sudo ./sync-from-github.sh [分支名] [环境]
```

**参数说明:**
- 分支名: 默认为 `master`
- 环境: 默认为 `production`

**示例:**
```bash
# 同步master分支到生产环境
sudo ./sync-from-github.sh master production

# 同步develop分支到测试环境
sudo ./sync-from-github.sh develop test
```

### 2. sync-from-github.bat (Windows)
Windows版本的GitHub同步脚本，功能与Linux/macOS版本相同。

**使用方法:**
```cmd
sync-from-github.bat [分支名] [环境]
```

**参数说明:**
- 分支名: 默认为 `master`
- 环境: 默认为 `production`

**示例:**
```cmd
# 同步master分支到生产环境
sync-from-github.bat master production

# 同步develop分支到测试环境
sync-from-github.bat develop test
```

### 3. sync-test-env.sh (Linux/macOS)
专门用于测试环境的同步脚本，包含自动测试功能。

**使用方法:**
```bash
sudo ./sync-test-env.sh [分支名]
```

**参数说明:**
- 分支名: 默认为 `develop`

**示例:**
```bash
# 同步develop分支到测试环境
sudo ./sync-test-env.sh develop

# 同步feature分支到测试环境
sudo ./sync-test-env.sh feature/new-payment
```

## 工作流程

### 生产环境同步流程
1. 备份当前应用
2. 从GitHub拉取最新代码
3. 安装/更新项目依赖
4. 更新环境配置
5. 重启应用
6. 健康检查
7. 清理旧备份

### 测试环境同步流程
1. 从GitHub拉取最新代码
2. 安装/更新项目依赖
3. 更新测试环境配置
4. 运行单元测试
5. 运行集成测试
6. 重启测试环境应用
7. 健康检查
8. 发送通知

## 前置条件

### 系统要求
- Linux/macOS/Windows操作系统
- Git已安装
- Node.js和npm已安装
- PM2已安装
- 服务器上已配置好项目目录

### 项目目录结构
```
/opt/moocpay          # 生产环境项目目录
/opt/moocpay-test     # 测试环境项目目录
/opt/backups          # 备份目录
```

### 环境配置文件
- `.env.production` - 生产环境配置
- `.env.test` - 测试环境配置
- `.env` - 当前环境配置（由脚本自动复制）

## 设置步骤

### 1. 克隆项目
```bash
# 生产环境
git clone https://github.com/urizenk/moocpay.git /opt/moocpay

# 测试环境
git clone https://github.com/urizenk/moocpay.git /opt/moocpay-test
```

### 2. 创建环境配置文件
```bash
# 生产环境
cp /opt/moocpay/.env.example /opt/moocpay/.env.production

# 测试环境
cp /opt/moocpay-test/.env.example /opt/moocpay-test/.env.test
```

### 3. 编辑环境配置文件
根据实际环境修改配置文件中的参数。

### 4. 安装依赖并启动应用
```bash
# 生产环境
cd /opt/moocpay
npm install --production
pm2 start ecosystem.config.js --env production

# 测试环境
cd /opt/moocpay-test
npm install
pm2 start ecosystem.config.js --env test
```

### 5. 设置脚本权限
```bash
chmod +x /opt/moocpay/scripts/sync-from-github.sh
chmod +x /opt/moocpay/scripts/sync-test-env.sh
```

## 定时同步

### 使用Cron定时任务
```bash
# 编辑crontab
crontab -e

# 添加定时任务（每天凌晨2点同步生产环境）
0 2 * * * /opt/moocpay/scripts/sync-from-github.sh master production

# 添加定时任务（每小时同步测试环境）
0 * * * * /opt/moocpay/scripts/sync-test-env.sh develop
```

### 使用Windows任务计划程序
1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器（如每天或每小时）
4. 设置操作为启动程序，选择`sync-from-github.bat`脚本
5. 添加参数（分支名和环境）

## 故障排除

### 常见问题

1. **权限错误**
   - 确保以root权限运行Linux/macOS脚本
   - 确保Windows用户有足够权限

2. **Git认证失败**
   - 检查SSH密钥配置
   - 或使用HTTPS并配置Git凭据存储

3. **依赖安装失败**
   - 检查Node.js版本是否兼容
   - 检查网络连接是否正常

4. **应用启动失败**
   - 检查环境配置是否正确
   - 查看PM2日志：`pm2 logs moocpay`

5. **健康检查失败**
   - 检查应用是否正确启动
   - 检查防火墙和网络配置

### 日志查看
```bash
# PM2日志
pm2 logs moocpay

# 同步脚本日志
./sync-from-github.sh 2>&1 | tee sync.log
```

## 高级用法

### 自定义通知
可以修改脚本中的`send_notification`函数，添加邮件、Slack、微信等通知方式。

### 自定义健康检查
可以修改脚本中的`health_check`函数，添加更复杂的健康检查逻辑。

### 多环境部署
可以复制现有脚本并修改，以支持更多环境（如预发布环境、灰度环境等）。

## 安全注意事项

1. 不要将敏感信息（如数据库密码、API密钥）提交到Git仓库
2. 使用环境变量存储敏感配置
3. 定期更新依赖包，修复安全漏洞
4. 限制脚本执行权限，避免未授权访问
5. 定期备份应用和数据