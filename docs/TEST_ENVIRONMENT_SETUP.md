# 测试环境配置指南

本文档详细介绍了如何配置和运行微信支付项目的测试环境，包括环境准备、配置步骤、测试流程和故障排除。

## 目录

1. [测试环境概述](#测试环境概述)
2. [环境准备](#环境准备)
3. [配置步骤](#配置步骤)
4. [测试流程](#测试流程)
5. [测试数据](#测试数据)
6. [故障排除](#故障排除)
7. [最佳实践](#最佳实践)

## 测试环境概述

测试环境是用于验证微信支付功能是否正常工作的隔离环境，具有以下特点：

- 与生产环境隔离，不影响线上业务
- 使用微信支付沙箱环境进行测试
- 可以模拟真实的支付流程
- 支持自动化测试和手动测试

## 环境准备

### 硬件要求

- 服务器配置：至少1核CPU、2GB内存、20GB存储
- 操作系统：Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- 网络：可访问互联网，能够连接微信支付API

### 软件要求

- Node.js 14.x 或更高版本
- npm 6.x 或更高版本
- PM2 进程管理器
- Nginx Web服务器（可选，用于反向代理）
- Git 版本控制工具

### 域名要求

- 测试环境需要一个可访问的域名（可以是子域名）
- 域名需要配置HTTPS证书（可以使用自签名证书）
- 域名需要在微信支付沙箱环境中进行配置

## 配置步骤

### 1. 创建测试环境目录

```bash
# 创建测试环境目录
sudo mkdir -p /opt/moocpay-test
sudo chown $USER:$USER /opt/moocpay-test

# 进入目录
cd /opt/moocpay-test
```

### 2. 克隆项目代码

```bash
# 克隆项目代码
git clone https://github.com/urizenk/moocpay.git .

# 切换到开发分支
git checkout develop
```

### 3. 安装项目依赖

```bash
# 安装依赖
npm install
```

### 4. 配置环境变量

```bash
# 复制环境配置文件
cp .env.example .env.test

# 编辑测试环境配置
nano .env.test
```

#### 测试环境配置示例

```env
# 应用配置
NODE_ENV=test
PORT=5001
APP_URL=https://test.yourdomain.com
DOMAIN=test.yourdomain.com

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=moocpay_test
DB_PASSWORD=test_password
DB_NAME=moocpay_test

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=test_redis_password

# 微信支付配置（沙箱环境）
WECHAT_APP_ID=your_test_app_id
WECHAT_MCH_ID=your_test_mch_id
WECHAT_API_KEY=your_test_api_key
WECHAT_CERT_PATH=/opt/moocpay-test/cert/apiclient_cert.pem
WECHAT_KEY_PATH=/opt/moocpay-test/cert/apiclient_key.pem
WECHAT_NOTIFY_URL=https://test.yourdomain.com/api/payment/notify

# 微信支付沙箱配置
WECHAT_SANDBOX=true
WECHAT_SANDBOX_SIGN_KEY=your_sandbox_sign_key

# 会话配置
SESSION_SECRET=test_session_secret
SESSION_NAME=moocpay_test_session

# 日志配置
LOG_LEVEL=debug
LOG_FILE=/var/log/moocpay-test/app.log

# 其他配置
UPLOAD_DIR=/opt/moocpay-test/uploads
MAX_FILE_SIZE=10485760
```

### 5. 配置微信支付沙箱环境

微信支付提供了沙箱环境，用于测试支付功能。以下是配置步骤：

#### 5.1 获取沙箱环境信息

1. 登录微信支付商户平台
2. 进入"产品中心" -> "开发配置"
3. 启用沙箱环境
4. 获取沙箱环境的商户号和API密钥

#### 5.2 获取沙箱签名密钥

使用以下API获取沙箱签名密钥：

```bash
curl -X POST \
  https://api.mch.weixin.qq.com/sandboxnew/pay/getsignkey \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'mch_id=YOUR_MCH_ID&nonce_str=RANDOM_STRING&sign=SIGNATURE'
```

#### 5.3 更新环境配置

将获取到的沙箱信息更新到`.env.test`文件中：

```env
# 微信支付配置（沙箱环境）
WECHAT_APP_ID=your_test_app_id
WECHAT_MCH_ID=sandbox_mch_id
WECHAT_API_KEY=sandbox_api_key
WECHAT_SANDBOX=true
WECHAT_SANDBOX_SIGN_KEY=sandbox_sign_key
```

### 6. 配置Nginx（可选）

如果使用Nginx作为反向代理，可以创建以下配置：

```nginx
server {
    listen 80;
    server_name test.yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name test.yourdomain.com;
    
    # SSL配置（可以使用自签名证书）
    ssl_certificate /etc/ssl/moocpay-test/cert.pem;
    ssl_certificate_key /etc/ssl/moocpay-test/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # 反向代理到Node.js应用
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. 启动测试环境

```bash
# 使用PM2启动应用
pm2 start ecosystem.config.js --env test

# 保存PM2配置
pm2 save

# 设置PM2开机自启
pm2 startup
```

### 8. 配置自动化同步

为了方便从GitHub同步代码到测试环境，可以使用提供的同步脚本：

```bash
# 复制同步脚本
cp /opt/moocpay/scripts/sync-test-env.sh /opt/moocpay-test/scripts/

# 设置执行权限
chmod +x /opt/moocpay-test/scripts/sync-test-env.sh

# 设置定时任务（每小时同步一次）
crontab -e
# 添加以下行：
# 0 * * * * /opt/moocpay-test/scripts/sync-test-env.sh develop
```

## 测试流程

### 1. 手动测试流程

#### 1.1 准备测试数据

```sql
-- 创建测试用户
INSERT INTO users (username, email, password, created_at) VALUES 
('testuser', 'test@example.com', 'hashed_password', NOW());

-- 创建测试商品
INSERT INTO products (name, description, price, created_at) VALUES 
('测试商品', '这是一个测试商品', 100, NOW());
```

#### 1.2 测试支付流程

1. 在微信中打开测试环境URL：`https://test.yourdomain.com`
2. 登录测试账号
3. 选择测试商品
4. 点击支付按钮
5. 使用微信沙箱环境完成支付
6. 验证支付结果和回调处理

#### 1.3 测试其他功能

- 用户注册和登录
- 商品浏览和搜索
- 订单管理
- 退款处理
- 数据统计

### 2. 自动化测试

#### 2.1 单元测试

```bash
# 运行单元测试
npm test
```

#### 2.2 集成测试

```bash
# 运行集成测试
npm run test:integration
```

#### 2.3 端到端测试

```bash
# 运行端到端测试
npm run test:e2e
```

#### 2.4 性能测试

```bash
# 运行性能测试
npm run test:performance
```

## 测试数据

### 微信支付沙箱测试账号

微信支付提供了一些测试账号和测试数据，可以用于测试：

| 测试项 | 测试数据 |
|--------|----------|
| 测试微信号 | sandbox_wxpay |
| 测试密码 | 123456 |
| 测试银行卡号 | 6222021234567890123 |
| 测试手机号 | 13800138000 |

### 测试场景

1. **正常支付流程**
   - 用户选择商品
   - 创建订单
   - 调用微信支付API
   - 用户完成支付
   - 接收支付回调
   - 更新订单状态

2. **支付取消流程**
   - 用户选择商品
   - 创建订单
   - 调用微信支付API
   - 用户取消支付
   - 处理取消结果

3. **支付失败流程**
   - 用户选择商品
   - 创建订单
   - 调用微信支付API
   - 支付失败
   - 处理失败结果

4. **退款流程**
   - 已支付订单
   - 申请退款
   - 调用退款API
   - 处理退款结果

## 故障排除

### 常见问题及解决方案

#### 1. 支付失败

**问题：** 支付请求失败，返回错误信息

**可能原因：**
- 参数错误
- 签名错误
- 商户配置错误
- 网络问题

**解决方案：**
1. 检查请求参数是否正确
2. 验证签名算法和密钥
3. 确认商户配置是否正确
4. 检查网络连接和防火墙设置

#### 2. 回调接收不到

**问题：** 支付成功但接收不到回调通知

**可能原因：**
- 回调URL配置错误
- 网络不通
- 防火墙拦截
- 服务器宕机

**解决方案：**
1. 检查回调URL是否正确配置
2. 确认网络是否通畅
3. 检查防火墙设置
4. 查看服务器日志

#### 3. 签名验证失败

**问题：** 回调签名验证失败

**可能原因：**
- API密钥错误
- 签名算法错误
- 数据格式错误

**解决方案：**
1. 检查API密钥是否正确
2. 确认签名算法是否正确
3. 验证数据格式

#### 4. 应用启动失败

**问题：** 应用无法启动

**可能原因：**
- 端口被占用
- 环境变量配置错误
- 依赖安装失败

**解决方案：**
1. 检查端口是否被占用
2. 验证环境变量配置
3. 重新安装依赖

### 调试技巧

1. **查看日志**
   ```bash
   # 查看应用日志
   pm2 logs moocpay-test
   
   # 查看Nginx日志
   tail -f /var/log/nginx/moocpay-test.access.log
   ```

2. **使用调试工具**
   ```bash
   # 使用Node.js调试器
   node --inspect app.js
   ```

3. **模拟微信支付回调**
   ```bash
   # 使用curl模拟回调
   curl -X POST \
     https://test.yourdomain.com/api/payment/notify \
     -H 'Content-Type: application/xml' \
     -d @test-notify.xml
   ```

## 最佳实践

### 1. 环境隔离

- 使用独立的数据库实例
- 使用独立的Redis实例
- 使用独立的文件存储目录
- 使用独立的域名和SSL证书

### 2. 数据管理

- 定期清理测试数据
- 使用模拟数据而非真实数据
- 定期备份测试环境配置

### 3. 安全考虑

- 不要在生产环境使用测试配置
- 不要在代码中硬编码敏感信息
- 定期更新依赖包，修复安全漏洞

### 4. 监控和日志

- 设置详细的日志记录
- 配置监控和告警
- 定期检查系统资源使用情况

### 5. 自动化

- 使用CI/CD流水线自动部署测试环境
- 使用自动化测试验证功能
- 使用脚本自动同步代码

## 总结

通过以上配置和步骤，可以搭建一个完整的微信支付测试环境，用于验证支付功能的正确性。测试环境应该与生产环境隔离，使用微信支付沙箱环境进行测试，确保不影响线上业务。

定期维护测试环境，更新测试数据和配置，确保测试环境的稳定性和可靠性。同时，建立完善的监控和日志系统，及时发现和解决问题。