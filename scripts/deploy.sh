#!/bin/bash

# 自动化部署脚本 - 用于一键部署应用到服务器
# 使用方法: ./deploy.sh [环境] [分支]

# 默认参数
ENVIRONMENT=${1:-production}
BRANCH=${2:-master}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_error "此脚本需要以root权限运行"
        exit 1
    fi
}

# 显示部署信息
show_deployment_info() {
    log_info "=========================================="
    log_info "         自动化部署脚本"
    log_info "=========================================="
    log_info "环境: $ENVIRONMENT"
    log_info "分支: $BRANCH"
    log_info "时间: $(date)"
    log_info "=========================================="
}

# 检查系统要求
check_system_requirements() {
    log_step "检查系统要求..."
    
    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        log_info "操作系统: $OS $VER"
    else
        log_warn "无法检测操作系统版本"
    fi
    
    # 检查必要软件
    local missing_packages=()
    
    if ! command -v git &> /dev/null; then
        missing_packages+=("git")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_packages+=("nodejs")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_packages+=("npm")
    fi
    
    if ! command -v pm2 &> /dev/null; then
        missing_packages+=("pm2")
    fi
    
    if ! command -v nginx &> /dev/null; then
        missing_packages+=("nginx")
    fi
    
    if [ ${#missing_packages[@]} -gt 0 ]; then
        log_error "缺少以下软件包: ${missing_packages[*]}"
        log_info "正在安装缺少的软件包..."
        
        # 检测包管理器
        if command -v apt-get &> /dev/null; then
            apt-get update
            for package in "${missing_packages[@]}"; do
                case $package in
                    "nodejs")
                        curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
                        apt-get install -y nodejs
                        ;;
                    "pm2")
                        npm install -g pm2
                        ;;
                    *)
                        apt-get install -y $package
                        ;;
                esac
            done
        elif command -v yum &> /dev/null; then
            yum update -y
            for package in "${missing_packages[@]}"; do
                case $package in
                    "nodejs")
                        curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash -
                        yum install -y nodejs npm
                        ;;
                    "pm2")
                        npm install -g pm2
                        ;;
                    *)
                        yum install -y $package
                        ;;
                esac
            done
        else
            log_error "不支持的包管理器，请手动安装: ${missing_packages[*]}"
            exit 1
        fi
    fi
    
    log_info "系统要求检查完成"
}

# 创建应用目录
create_app_directories() {
    log_step "创建应用目录..."
    
    local app_dir="/opt/moocpay"
    local backup_dir="/opt/backups"
    local log_dir="/var/log/moocpay"
    local ssl_dir="/etc/ssl/moocpay"
    
    # 创建应用目录
    if [ ! -d "$app_dir" ]; then
        mkdir -p $app_dir
        log_info "创建应用目录: $app_dir"
    fi
    
    # 创建备份目录
    if [ ! -d "$backup_dir" ]; then
        mkdir -p $backup_dir
        log_info "创建备份目录: $backup_dir"
    fi
    
    # 创建日志目录
    if [ ! -d "$log_dir" ]; then
        mkdir -p $log_dir
        log_info "创建日志目录: $log_dir"
    fi
    
    # 创建SSL证书目录
    if [ ! -d "$ssl_dir" ]; then
        mkdir -p $ssl_dir
        log_info "创建SSL证书目录: $ssl_dir"
    fi
    
    # 设置目录权限
    chown -R $USER:$USER $app_dir
    chown -R $USER:$USER $backup_dir
    chown -R $USER:$USER $log_dir
    chown -R $USER:$USER $ssl_dir
    
    log_info "应用目录创建完成"
}

# 克隆或更新代码
clone_or_update_code() {
    log_step "克隆或更新代码..."
    
    local app_dir="/opt/moocpay"
    local repo_url="https://github.com/urizenk/moocpay.git"
    
    if [ -d "$app_dir/.git" ]; then
        # 更新现有代码
        cd $app_dir
        git fetch origin
        
        # 检查是否有新提交
        LOCAL=$(git rev-parse HEAD)
        REMOTE=$(git rev-parse origin/$BRANCH)
        
        if [ "$LOCAL" != "$REMOTE" ]; then
            log_info "发现新代码，正在更新..."
            git pull origin $BRANCH
            log_info "代码更新完成"
        else
            log_info "代码已是最新版本"
        fi
    else
        # 克隆新代码
        log_info "正在克隆代码..."
        git clone $repo_url $app_dir
        cd $app_dir
        git checkout $BRANCH
        log_info "代码克隆完成"
    fi
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖..."
    
    cd /opt/moocpay
    
    # 安装Node.js依赖
    npm install --production
    
    if [ $? -eq 0 ]; then
        log_info "依赖安装成功"
    else
        log_error "依赖安装失败"
        exit 1
    fi
}

# 配置环境变量
configure_environment() {
    log_step "配置环境变量..."
    
    cd /opt/moocpay
    
    # 复制环境配置文件
    if [ -f ".env.$ENVIRONMENT" ]; then
        cp .env.$ENVIRONMENT .env
        log_info "已加载 $ENVIRONMENT 环境配置"
    else
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warn "未找到 .env.$ENVIRONMENT，已从 .env.example 创建配置文件"
            log_warn "请手动编辑 .env 文件配置正确的环境变量"
        else
            log_error "未找到环境配置文件"
            exit 1
        fi
    fi
    
    # 检查必要的环境变量
    if [ ! -f ".env" ]; then
        log_error ".env 文件不存在"
        exit 1
    fi
    
    log_info "环境变量配置完成"
}

# 配置Nginx
configure_nginx() {
    log_step "配置Nginx..."
    
    local nginx_conf="/etc/nginx/sites-available/moocpay"
    local nginx_enabled="/etc/nginx/sites-enabled/moocpay"
    
    # 创建Nginx配置文件
    cat > $nginx_conf << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL配置
    ssl_certificate /etc/ssl/moocpay/cert.pem;
    ssl_certificate_key /etc/ssl/moocpay/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # 日志
    access_log /var/log/nginx/moocpay.access.log;
    error_log /var/log/nginx/moocpay.error.log;
    
    # 反向代理到Node.js应用
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # 启用站点
    if [ ! -L "$nginx_enabled" ]; then
        ln -s $nginx_conf $nginx_enabled
        log_info "已启用Nginx站点配置"
    fi
    
    # 测试Nginx配置
    nginx -t
    
    if [ $? -eq 0 ]; then
        log_info "Nginx配置测试通过"
        systemctl reload nginx
        log_info "Nginx已重新加载"
    else
        log_error "Nginx配置测试失败"
        exit 1
    fi
    
    log_info "Nginx配置完成"
}

# 配置SSL证书
configure_ssl() {
    log_step "配置SSL证书..."
    
    local ssl_dir="/etc/ssl/moocpay"
    local cert_file="$ssl_dir/cert.pem"
    local key_file="$ssl_dir/key.pem"
    
    # 检查是否已有SSL证书
    if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
        log_info "已存在SSL证书，跳过证书生成"
        return 0
    fi
    
    # 检查是否安装了certbot
    if command -v certbot &> /dev/null; then
        log_info "使用Let's Encrypt生成SSL证书..."
        
        # 从.env文件获取域名
        local domain=$(grep -E "^DOMAIN=" /opt/moocpay/.env | cut -d '=' -f2)
        
        if [ -n "$domain" ]; then
            # 生成SSL证书
            certbot certonly --webroot -w /var/www/html -d $domain --non-interactive --agree-tos --email admin@$domain
            
            if [ $? -eq 0 ]; then
                # 复制证书到SSL目录
                cp /etc/letsencrypt/live/$domain/fullchain.pem $cert_file
                cp /etc/letsencrypt/live/$domain/privkey.pem $key_file
                
                log_info "SSL证书生成成功"
            else
                log_warn "Let's Encrypt证书生成失败，将生成自签名证书"
                generate_self_signed_cert
            fi
        else
            log_warn "未在.env文件中找到DOMAIN配置，将生成自签名证书"
            generate_self_signed_cert
        fi
    else
        log_warn "未安装certbot，将生成自签名证书"
        generate_self_signed_cert
    fi
    
    log_info "SSL证书配置完成"
}

# 生成自签名证书
generate_self_signed_cert() {
    log_info "生成自签名SSL证书..."
    
    local ssl_dir="/etc/ssl/moocpay"
    local cert_file="$ssl_dir/cert.pem"
    local key_file="$ssl_dir/key.pem"
    
    # 生成私钥
    openssl genrsa -out $key_file 2048
    
    # 生成证书
    openssl req -new -x509 -key $key_file -out $cert_file -days 365 -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
    
    log_info "自签名证书生成完成"
}

# 配置PM2
configure_pm2() {
    log_step "配置PM2..."
    
    cd /opt/moocpay
    
    # 创建PM2配置文件
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'moocpay',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_test: {
      NODE_ENV: 'test',
      PORT: 5001
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: '/var/log/moocpay/error.log',
    out_file: '/var/log/moocpay/out.log',
    log_file: '/var/log/moocpay/combined.log',
    time: true
  }]
};
EOF
    
    # 启动应用
    pm2 start ecosystem.config.js --env $ENVIRONMENT
    
    if [ $? -eq 0 ]; then
        log_info "应用启动成功"
        
        # 保存PM2配置
        pm2 save
        
        # 设置PM2开机自启
        pm2 startup
    else
        log_error "应用启动失败"
        exit 1
    fi
    
    log_info "PM2配置完成"
}

# 配置防火墙
configure_firewall() {
    log_step "配置防火墙..."
    
    # 检查防火墙状态
    if command -v ufw &> /dev/null; then
        # 使用UFW防火墙
        ufw --force enable
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        log_info "UFW防火墙配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        # 使用firewalld防火墙
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        log_info "firewalld防火墙配置完成"
    else
        log_warn "未检测到支持的防火墙，请手动配置防火墙规则"
    fi
}

# 设置定时任务
setup_cron_jobs() {
    log_step "设置定时任务..."
    
    # 创建定时任务脚本目录
    mkdir -p /opt/moocpay/scripts
    
    # 复制同步脚本
    if [ -f "/opt/moocpay/scripts/sync-from-github.sh" ]; then
        chmod +x /opt/moocpay/scripts/sync-from-github.sh
        
        # 添加定时任务（每天凌晨2点同步）
        (crontab -l 2>/dev/null; echo "0 2 * * * /opt/moocpay/scripts/sync-from-github.sh $BRANCH $ENVIRONMENT") | crontab -
        
        log_info "定时任务设置完成"
    else
        log_warn "未找到同步脚本，跳过定时任务设置"
    fi
}

# 健康检查
health_check() {
    log_step "执行健康检查..."
    
    # 等待应用启动
    sleep 10
    
    # 检查应用是否正常运行
    if pm2 list | grep -q "moocpay.*online"; then
        log_info "应用运行正常"
    else
        log_error "应用未正常运行"
        return 1
    fi
    
    # 检查HTTP响应
    if command -v curl &> /dev/null; then
        # 从.env文件获取应用URL
        local app_url=$(grep -E "^APP_URL=" /opt/moocpay/.env | cut -d '=' -f2)
        
        if [ -n "$app_url" ]; then
            local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$app_url" || echo "000")
            
            if [ "$http_status" = "200" ]; then
                log_info "HTTP健康检查通过 (状态码: $http_status)"
            else
                log_warn "HTTP健康检查失败 (状态码: $http_status)"
            fi
        else
            log_warn "未在.env文件中找到APP_URL配置，跳过HTTP健康检查"
        fi
    else
        log_warn "未安装curl，跳过HTTP健康检查"
    fi
    
    log_info "健康检查完成"
}

# 显示部署结果
show_deployment_result() {
    log_info "=========================================="
    log_info "         部署完成"
    log_info "=========================================="
    log_info "应用URL: $(grep -E "^APP_URL=" /opt/moocpay/.env | cut -d '=' -f2)"
    log_info "PM2状态:"
    pm2 status moocpay
    log_info "=========================================="
    log_info "常用命令:"
    log_info "查看应用日志: pm2 logs moocpay"
    log_info "重启应用: pm2 restart moocpay"
    log_info "查看Nginx日志: tail -f /var/log/nginx/moocpay.access.log"
    log_info "同步代码: /opt/moocpay/scripts/sync-from-github.sh $BRANCH $ENVIRONMENT"
    log_info "=========================================="
}

# 主函数
main() {
    show_deployment_info
    
    # 检查权限
    check_root
    
    # 检查系统要求
    check_system_requirements
    
    # 创建应用目录
    create_app_directories
    
    # 克隆或更新代码
    clone_or_update_code
    
    # 安装依赖
    install_dependencies
    
    # 配置环境变量
    configure_environment
    
    # 配置SSL证书
    configure_ssl
    
    # 配置Nginx
    configure_nginx
    
    # 配置PM2
    configure_pm2
    
    # 配置防火墙
    configure_firewall
    
    # 设置定时任务
    setup_cron_jobs
    
    # 健康检查
    health_check
    
    # 显示部署结果
    show_deployment_result
    
    log_info "自动化部署完成!"
}

# 执行主函数
main