# 项目部署指南

## 1. 环境准备

### 1.1 服务器要求

- **操作系统**: Linux (推荐 Ubuntu 20.04 LTS 或更高版本)
- **内存**: 至少 2GB RAM (推荐 4GB 或更高)
- **存储**: 至少 20GB 可用空间
- **网络**: 稳定的互联网连接
- **域名**: 已备案的域名 (微信支付要求)

### 1.2 软件依赖

- **Node.js**: 14.0 或更高版本
- **NPM**: 6.0 或更高版本
- **Nginx**: 1.18 或更高版本 (用于反向代理和HTTPS)
- **PM2**: 进程管理器 (可选，但推荐)
- **SSL证书**: 用于HTTPS (微信支付要求)

## 2. 本地开发环境设置

### 2.1 克隆项目

```bash
git clone [项目仓库地址]
cd moocpay
```

### 2.2 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2.3 配置环境变量

1. 复制环境变量模板：
   ```bash
   cd ../backend
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入您的配置：
   ```bash
   nano .env
   ```

3. 至少需要配置以下参数：
   ```bash
   # 微信支付配置
   WECHAT_APP_ID=你的公众号AppID
   WECHAT_MCH_ID=你的商户号
   WECHAT_API_KEY=你的API密钥
   WECHAT_NOTIFY_URL=https://yourdomain.com/api/payment/callback
   
   # 服务器配置
   PORT=5000
   NODE_ENV=production
   ```

### 2.4 启动开发服务器

```bash
# 启动后端服务器 (在backend目录下)
npm start

# 启动前端开发服务器 (在frontend目录下，新终端)
npm run dev
```

## 3. 生产环境部署

### 3.1 服务器准备

1. 更新系统：
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. 安装Node.js：
   ```bash
   # 使用NodeSource仓库安装最新LTS版本
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. 安装PM2：
   ```bash
   sudo npm install -g pm2
   ```

4. 安装Nginx：
   ```bash
   sudo apt install nginx -y
   ```

### 3.2 部署应用代码

1. 创建应用目录：
   ```bash
   sudo mkdir -p /var/www/moocpay
   sudo chown -R $USER:$USER /var/www/moocpay
   ```

2. 上传项目代码：
   ```bash
   # 使用git克隆或上传项目文件到/var/www/moocpay
   cd /var/www/moocpay
   git clone [项目仓库地址] .
   ```

3. 安装依赖：
   ```bash
   # 安装后端依赖
   cd backend
   npm install --production
   
   # 安装前端依赖并构建
   cd ../frontend
   npm install
   npm run build
   ```

4. 配置生产环境变量：
   ```bash
   cd ../backend
   nano .env
   ```

### 3.3 配置PM2

1. 创建PM2配置文件：
   ```bash
   nano ecosystem.config.js
   ```

2. 添加以下内容：
   ```javascript
   module.exports = {
     apps: [{
       name: 'moocpay-backend',
       script: './src/server.js',
       cwd: '/var/www/moocpay/backend',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

3. 创建日志目录：
   ```bash
   mkdir -p /var/www/moocpay/backend/logs
   ```

4. 启动应用：
   ```bash
   cd /var/www/moocpay/backend
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### 3.4 配置Nginx

1. 创建Nginx站点配置：
   ```bash
   sudo nano /etc/nginx/sites-available/moocpay
   ```

2. 添加以下配置（替换yourdomain.com为您的域名）：
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;
   
       # SSL配置
       ssl_certificate /path/to/your/certificate.crt;
       ssl_certificate_key /path/to/your/private.key;
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

3. 启用站点：
   ```bash
   sudo ln -s /etc/nginx/sites-available/moocpay /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 3.5 配置SSL证书

#### 使用Let's Encrypt (免费)

1. 安装Certbot：
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. 获取证书：
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. 设置自动续期：
   ```bash
   sudo crontab -e
   ```
   添加以下行：
   ```
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

## 4. 微信支付配置

1. 按照 [微信支付配置指南](./WECHAT_PAY_SETUP.md) 完成微信支付设置
2. 确保支付回调URL可访问：`https://yourdomain.com/api/payment/callback`
3. 将服务器IP添加到微信商户平台白名单

## 5. 监控与维护

### 5.1 应用监控

1. 查看PM2状态：
   ```bash
   pm2 status
   ```

2. 查看日志：
   ```bash
   pm2 logs
   ```

3. 重启应用：
   ```bash
   pm2 restart moocpay-backend
   ```

### 5.2 系统监控

1. 查看Nginx状态：
   ```bash
   sudo systemctl status nginx
   ```

2. 查看Nginx日志：
   ```bash
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

### 5.3 数据备份

1. 创建备份脚本：
   ```bash
   nano /home/user/backup-moocpay.sh
   ```

2. 添加以下内容：
   ```bash
   #!/bin/bash
   
   # 创建备份目录
   BACKUP_DIR="/home/user/backups/moocpay"
   DATE=$(date +%Y%m%d-%H%M%S)
   mkdir -p $BACKUP_DIR
   
   # 备份应用代码
   tar -czf $BACKUP_DIR/moocpay-$DATE.tar.gz -C /var/www moocpay
   
   # 备份数据库（如果使用）
   # mysqldump -u username -p database_name > $BACKUP_DIR/database-$DATE.sql
   
   # 删除7天前的备份
   find $BACKUP_DIR -type f -mtime +7 -delete
   ```

3. 设置定时备份：
   ```bash
   chmod +x /home/user/backup-moocpay.sh
   crontab -e
   ```
   添加以下行：
   ```
   0 2 * * * /home/user/backup-moocpay.sh
   ```

## 6. 故障排除

### 6.1 常见问题

1. **应用无法启动**
   - 检查Node.js版本：`node -v`
   - 检查端口是否被占用：`sudo netstat -tlnp | grep :5000`
   - 查看PM2日志：`pm2 logs`

2. **Nginx配置错误**
   - 测试配置：`sudo nginx -t`
   - 查看错误日志：`sudo tail -f /var/log/nginx/error.log`

3. **微信支付回调失败**
   - 检查回调URL是否可访问
   - 检查服务器防火墙设置
   - 查看应用日志中的错误信息

### 6.2 性能优化

1. **启用Gzip压缩**
   - 在Nginx配置中添加Gzip设置

2. **配置缓存**
   - 为静态资源设置缓存头

3. **数据库优化**
   - 添加适当的索引
   - 考虑使用Redis缓存

## 7. 安全建议

1. 定期更新系统和依赖包
2. 使用强密码和SSH密钥认证
3. 配置防火墙，只开放必要端口
4. 定期备份数据
5. 监控异常访问和支付行为

## 8. 扩展部署

### 8.1 负载均衡

对于高流量应用，可以考虑：

1. 使用多个后端实例
2. 配置Nginx负载均衡
3. 使用Redis共享会话

### 8.2 容器化部署

使用Docker容器化部署：

1. 创建Dockerfile
2. 使用Docker Compose编排服务
3. 部署到Kubernetes或Swarm集群

## 9. 联系支持

如果在部署过程中遇到问题，可以：

1. 查看项目文档和GitHub Issues
2. 联系技术支持团队
3. 寻求社区帮助