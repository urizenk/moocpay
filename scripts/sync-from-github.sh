#!/bin/bash

# GitHub同步脚本 - 用于从GitHub仓库拉取最新代码并重启应用
# 使用方法: ./sync-from-github.sh [分支名] [环境]

# 默认参数
BRANCH=${1:-master}
ENVIRONMENT=${2:-production}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查是否为root用户
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_error "此脚本需要以root权限运行"
        exit 1
    fi
}

# 检查必要软件
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        exit 1
    fi
    
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2未安装，请先安装PM2"
        exit 1
    fi
    
    log_info "依赖检查完成"
}

# 备份当前应用
backup_app() {
    log_info "备份当前应用..."
    BACKUP_DIR="/opt/backups/moocpay-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    if [ -d "/opt/moocpay" ]; then
        cp -r /opt/moocpay $BACKUP_DIR/
        log_info "备份完成: $BACKUP_DIR"
    else
        log_warn "未找到现有应用，跳过备份"
    fi
}

# 从GitHub拉取最新代码
sync_from_github() {
    log_info "从GitHub拉取最新代码 (分支: $BRANCH)..."
    
    # 进入项目目录
    cd /opt/moocpay
    
    # 获取当前分支
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log_info "当前分支: $CURRENT_BRANCH"
    
    # 拉取最新代码
    git fetch origin
    
    # 检查是否有新提交
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$BRANCH)
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        log_info "已是最新版本，无需更新"
        return 0
    fi
    
    # 切换到指定分支
    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        log_info "切换到分支: $BRANCH"
        git checkout $BRANCH
    fi
    
    # 拉取最新代码
    git pull origin $BRANCH
    
    if [ $? -eq 0 ]; then
        log_info "代码同步成功"
        return 0
    else
        log_error "代码同步失败"
        return 1
    fi
}

# 安装/更新依赖
install_dependencies() {
    log_info "安装/更新项目依赖..."
    
    cd /opt/moocpay
    
    # 安装Node.js依赖
    npm install --production
    
    if [ $? -eq 0 ]; then
        log_info "依赖安装成功"
    else
        log_error "依赖安装失败"
        return 1
    fi
}

# 更新环境配置
update_env_config() {
    log_info "更新环境配置 (环境: $ENVIRONMENT)..."
    
    cd /opt/moocpay
    
    # 复制环境配置文件
    if [ -f ".env.$ENVIRONMENT" ]; then
        cp .env.$ENVIRONMENT .env
        log_info "已加载 $ENVIRONMENT 环境配置"
    else
        log_warn "未找到 .env.$ENVIRONMENT 文件，使用现有 .env 文件"
    fi
    
    # 检查必要的环境变量
    if [ ! -f ".env" ]; then
        log_error ".env 文件不存在，请先创建环境配置文件"
        return 1
    fi
}

# 重启应用
restart_app() {
    log_info "重启应用..."
    
    # 使用PM2重启应用
    pm2 restart moocpay
    
    if [ $? -eq 0 ]; then
        log_info "应用重启成功"
        
        # 显示应用状态
        pm2 status moocpay
    else
        log_error "应用重启失败"
        return 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待应用启动
    sleep 10
    
    # 检查应用是否正常运行
    if pm2 list | grep -q "moocpay.*online"; then
        log_info "应用运行正常"
        
        # 检查HTTP响应（如果有配置）
        if command -v curl &> /dev/null; then
            HTTP_URL=$(grep -E "^APP_URL=" .env | cut -d '=' -f2)
            if [ -n "$HTTP_URL" ]; then
                HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HTTP_URL" || echo "000")
                if [ "$HTTP_STATUS" = "200" ]; then
                    log_info "HTTP健康检查通过 (状态码: $HTTP_STATUS)"
                else
                    log_warn "HTTP健康检查失败 (状态码: $HTTP_STATUS)"
                fi
            fi
        fi
    else
        log_error "应用未正常运行"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份 (保留最近5个)..."
    
    BACKUP_DIR="/opt/backups"
    if [ -d "$BACKUP_DIR" ]; then
        cd $BACKUP_DIR
        ls -t | tail -n +6 | xargs -r rm -rf
        log_info "旧备份清理完成"
    fi
}

# 主函数
main() {
    log_info "开始GitHub同步流程..."
    log_info "分支: $BRANCH, 环境: $ENVIRONMENT"
    
    # 检查权限
    check_root
    
    # 检查依赖
    check_dependencies
    
    # 备份当前应用
    backup_app
    
    # 从GitHub同步代码
    if ! sync_from_github; then
        log_error "代码同步失败，终止流程"
        exit 1
    fi
    
    # 安装/更新依赖
    if ! install_dependencies; then
        log_error "依赖安装失败，终止流程"
        exit 1
    fi
    
    # 更新环境配置
    if ! update_env_config; then
        log_error "环境配置更新失败，终止流程"
        exit 1
    fi
    
    # 重启应用
    if ! restart_app; then
        log_error "应用重启失败，终止流程"
        exit 1
    fi
    
    # 健康检查
    if ! health_check; then
        log_error "健康检查失败"
        exit 1
    fi
    
    # 清理旧备份
    cleanup_old_backups
    
    log_info "GitHub同步流程完成!"
}

# 执行主函数
main