# 云服务器部署与GitHub同步指南

## 概述

本指南介绍如何使用云服务器进行测试，并通过GitHub实现代码同步的完整工作流程。这种开发模式可以确保本地开发、远程测试和生产部署的一致性。

## 1. 云服务器准备

### 1.1 服务器选择

推荐使用以下云服务提供商：
- 阿里云ECS
- 腾讯云CVM
- 华为云ECS
- AWS EC2
- 香港服务器（无需备案）

### 1.2 服务器配置

#### 最低配置要求
- CPU: 1核
- 内存: 2GB
- 存储: 20GB SSD
- 带宽: 1Mbps
- 操作系统: Ubuntu 20.04 LTS

#### 推荐配置
- CPU: 2核
- 内存: 4GB
- 存储: 40GB SSD
- 带宽: 3Mbps
- 操作系统: Ubuntu 20.04 LTS

### 1.3 服务器初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y git curl wget vim nginx certbot python3-certbot-nginx

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 创建应用目录
sudo mkdir -p /var/www/moocpay
sudo chown -R $USER:$USER /var/www/moocpay
```

## 2. GitHub仓库配置

### 2.1 生成SSH密钥

在云服务器上生成SSH密钥：

```bash
# 生成SSH密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 启动SSH代理
eval "$(ssh-agent -s)"

# 添加SSH密钥到代理
ssh-add ~/.ssh/id_rsa

# 查看公钥内容
cat ~/.ssh/id_rsa.pub
```

将公钥内容添加到GitHub账户的SSH密钥中。

### 2.2 克隆项目

```bash
# 进入应用目录
cd /var/www/moocpay

# 克隆项目
git clone git@github.com:urizenk/moocpay.git .

# 安装依赖
cd backend && npm install
cd ../frontend && npm install
npm run build
```

## 3. 测试环境配置

### 3.1 创建测试环境配置

```bash
# 创建测试环境配置文件
cd /var/www/moocpay/backend
cp .env .env.test
```

编辑`.env.test`文件，配置测试环境参数：

```bash
# 测试环境配置
NODE_ENV=test
PORT=5000

# 微信支付测试配置
WECHAT_APP_ID=测试公众号AppID
WECHAT_APP_SECRET=测试公众号AppSecret
WECHAT_MCH_ID=测试商户号
WECHAT_API_KEY=测试API密钥
WECHAT_NOTIFY_URL=https://test.yourdomain.com/api/payment/callback

# 数据库配置（如果使用）
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moocpay_test
DB_USER=test_user
DB_PASS=test_password
```

### 3.2 配置Nginx

创建测试环境Nginx配置：

```bash
sudo nano /etc/nginx/sites-available/moocpay-test
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name test.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name test.yourdomain.com;

    # SSL配置（使用Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/test.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 前端静态文件
    location / {
        root /var/www/moocpay/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:5000;
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

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/moocpay-test /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.3 获取SSL证书

```bash
# 获取Let's Encrypt证书
sudo certbot --nginx -d test.yourdomain.com

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 3.4 配置PM2

创建PM2测试环境配置文件：

```bash
cd /var/www/moocpay/backend
nano ecosystem.config.test.js
```

添加以下内容：

```javascript
module.exports = {
  apps: [{
    name: 'moocpay-test',
    script: './src/server.js',
    cwd: '/var/www/moocpay/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'test',
      PORT: 5000
    },
    error_file: './logs/test-err.log',
    out_file: './logs/test-out.log',
    log_file: './logs/test-combined.log',
    time: true
  }]
};
```

创建日志目录并启动应用：

```bash
mkdir -p logs
pm2 start ecosystem.config.test.js
pm2 save
pm2 startup
```

## 4. GitHub同步脚本

### 4.1 创建同步脚本

创建自动同步脚本：

```bash
cd /var/www/moocpay
nano scripts/sync.sh
```

添加以下内容：

```bash
#!/bin/bash

# 同步脚本
echo "开始同步代码..."

# 进入项目目录
cd /var/www/moocpay

# 拉取最新代码
git pull origin master

# 安装后端依赖
cd backend
npm install

# 构建前端
cd ../frontend
npm install
npm run build

# 重启应用
cd ../backend
pm2 restart moocpay-test

echo "代码同步完成！"
```

设置执行权限：

```bash
chmod +x scripts/sync.sh
```

### 4.2 创建生产环境同步脚本

```bash
cd /var/www/moocpay
nano scripts/sync-prod.sh
```

添加以下内容：

```bash
#!/bin/bash

# 生产环境同步脚本
echo "开始同步生产环境代码..."

# 进入项目目录
cd /var/www/moocpay

# 拉取最新代码
git pull origin master

# 安装后端依赖
cd backend
npm install --production

# 构建前端
cd ../frontend
npm install
npm run build

# 重启应用
cd ../backend
pm2 restart moocpay-prod

echo "生产环境代码同步完成！"
```

设置执行权限：

```bash
chmod +x scripts/sync-prod.sh
```

## 5. 工作流程

### 5.1 开发流程

1. **本地开发**
   - 在Windows本地进行代码开发
   - 使用本地环境进行基本测试
   - 提交代码到GitHub

2. **推送代码**
   ```bash
   git add .
   git commit -m "功能描述"
   git push origin master
   ```

3. **远程测试**
   - 登录云服务器
   - 执行同步脚本
   ```bash
   cd /var/www/moocpay
   ./scripts/sync.sh
   ```
   - 在测试环境进行功能测试
   - 使用微信进行支付测试

4. **问题修复**
   - 如发现问题，在本地修复
   - 重复步骤2和3直到测试通过

### 5.2 生产部署流程

1. **准备生产环境**
   - 配置生产环境参数
   - 设置生产环境域名和SSL证书

2. **部署到生产环境**
   ```bash
   cd /var/www/moocpay
   ./scripts/sync-prod.sh
   ```

3. **生产环境验证**
   - 测试所有功能
   - 验证支付流程
   - 检查日志和监控

## 6. 自动化部署（可选）

### 6.1 使用GitHub Actions

创建`.github/workflows/deploy.yml`文件：

```yaml
name: Deploy to Server

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/moocpay
          git pull origin master
          cd backend && npm install
          cd ../frontend && npm install && npm run build
          cd ../backend && pm2 restart moocpay-test
```

在GitHub仓库设置中添加以下Secrets：
- HOST: 服务器IP地址
- USERNAME: 服务器用户名
- SSH_KEY: 服务器SSH私钥

### 6.2 使用Webhooks

创建webhook接收脚本：

```bash
cd /var/www/moocpay
nano scripts/webhook.js
```

添加以下内容：

```javascript
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// 验证GitHub签名
function verifySignature(payload, signature) {
  const secret = 'your-webhook-secret'; // 替换为您的密钥
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Webhook接收端点
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  
  if (!verifySignature(JSON.stringify(req.body), signature)) {
    return res.status(401).send('Unauthorized');
  }
  
  // 执行同步脚本
  exec('./scripts/sync.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`执行错误: ${error}`);
      return res.status(500).send('部署失败');
    }
    
    console.log(`执行输出: ${stdout}`);
    res.status(200).send('部署成功');
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Webhook服务器运行在端口 ${PORT}`);
});
```

启动webhook服务器：

```bash
cd /var/www/moocpay
node scripts/webhook.js
```

在GitHub仓库设置中添加Webhook，指向`http://your-server-ip:3001/webhook`。

## 7. 监控和日志

### 7.1 PM2监控

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs moocpay-test

# 查看监控面板
pm2 monit
```

### 7.2 Nginx日志

```bash
# 查看访问日志
sudo tail -f /var/log/nginx/access.log

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 7.3 系统监控

```bash
# 查看系统资源使用
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

## 8. 备份策略

### 8.1 代码备份

```bash
# 创建备份脚本
cd /var/www/moocpay
nano scripts/backup.sh
```

添加以下内容：

```bash
#!/bin/bash

# 备份脚本
BACKUP_DIR="/var/backups/moocpay"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库（如果使用）
mysqldump -u root -p moocpay_test > $BACKUP_DIR/moocpay_test_$DATE.sql

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz backend/.env backend/.env.test

# 清理旧备份（保留最近7天）
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR"
```

设置定时备份：

```bash
# 添加到crontab
echo "0 2 * * * /var/www/moocpay/scripts/backup.sh" | sudo crontab -
```

## 9. 故障排除

### 9.1 常见问题

1. **同步失败**
   - 检查网络连接
   - 验证SSH密钥配置
   - 查看Git错误日志

2. **构建失败**
   - 检查Node.js版本
   - 清理npm缓存：`npm cache clean --force`
   - 删除node_modules重新安装

3. **应用启动失败**
   - 查看PM2日志：`pm2 logs moocpay-test`
   - 检查环境变量配置
   - 验证端口占用情况

### 9.2 回滚操作

如果部署出现问题，可以快速回滚：

```bash
# 回滚到上一个版本
cd /var/www/moocpay
git log --oneline -10  # 查看提交历史
git reset --hard HEAD~1  # 回滚到上一个提交
./scripts/sync.sh  # 重新同步
```

## 10. 安全注意事项

1. **SSH安全**
   - 使用密钥认证，禁用密码认证
   - 修改默认SSH端口
   - 配置防火墙规则

2. **应用安全**
   - 定期更新依赖包
   - 使用HTTPS协议
   - 配置安全头信息

3. **数据安全**
   - 定期备份数据
   - 加密敏感信息
   - 限制数据库访问权限

通过以上配置，您可以实现本地开发、远程测试和生产部署的完整工作流程，确保代码质量和系统稳定性。