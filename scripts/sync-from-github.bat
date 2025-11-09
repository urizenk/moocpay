@echo off
REM GitHub同步脚本 - Windows版本
REM 使用方法: sync-from-github.bat [分支名] [环境]

REM 设置默认参数
set BRANCH=%1
if "%BRANCH%"=="" set BRANCH=master

set ENVIRONMENT=%2
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

REM 颜色输出函数
:log_info
echo [INFO] %~1
goto :eof

:log_warn
echo [WARN] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

REM 检查Git是否安装
:check_git
call :log_info "检查Git是否安装..."
git --version >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Git未安装，请先安装Git"
    exit /b 1
)
call :log_info "Git检查完成"
goto :eof

REM 备份当前应用
:backup_app
call :log_info "备份当前应用..."
set BACKUP_DIR=C:\backups\moocpay-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%

if not exist "C:\backups" mkdir "C:\backups"
mkdir "%BACKUP_DIR%"

if exist "C:\opt\moocpay" (
    xcopy "C:\opt\moocpay" "%BACKUP_DIR%\moocpay" /E /I /H /Y
    call :log_info "备份完成: %BACKUP_DIR%"
) else (
    call :log_warn "未找到现有应用，跳过备份"
)
goto :eof

REM 从GitHub拉取最新代码
:sync_from_github
call :log_info "从GitHub拉取最新代码 (分支: %BRANCH%)..."

REM 进入项目目录
cd /d "C:\opt\moocpay"

REM 获取当前分支
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i
call :log_info "当前分支: %CURRENT_BRANCH%"

REM 拉取最新代码
git fetch origin

REM 检查是否有新提交
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set LOCAL=%%i
for /f "tokens=*" %%i in ('git rev-parse origin/%BRANCH%') do set REMOTE=%%i

if "%LOCAL%"=="%REMOTE%" (
    call :log_info "已是最新版本，无需更新"
    goto :eof
)

REM 切换到指定分支
if not "%CURRENT_BRANCH%"=="%BRANCH%" (
    call :log_info "切换到分支: %BRANCH%"
    git checkout %BRANCH%
)

REM 拉取最新代码
git pull origin %BRANCH%

if %errorlevel% equ 0 (
    call :log_info "代码同步成功"
) else (
    call :log_error "代码同步失败"
    exit /b 1
)
goto :eof

REM 安装/更新依赖
:install_dependencies
call :log_info "安装/更新项目依赖..."

cd /d "C:\opt\moocpay"

REM 安装Node.js依赖
npm install --production

if %errorlevel% equ 0 (
    call :log_info "依赖安装成功"
) else (
    call :log_error "依赖安装失败"
    exit /b 1
)
goto :eof

REM 更新环境配置
:update_env_config
call :log_info "更新环境配置 (环境: %ENVIRONMENT%)..."

cd /d "C:\opt\moocpay"

REM 复制环境配置文件
if exist ".env.%ENVIRONMENT%" (
    copy ".env.%ENVIRONMENT%" ".env" >nul
    call :log_info "已加载 %ENVIRONMENT% 环境配置"
) else (
    call :log_warn "未找到 .env.%ENVIRONMENT% 文件，使用现有 .env 文件"
)

REM 检查必要的环境变量
if not exist ".env" (
    call :log_error ".env 文件不存在，请先创建环境配置文件"
    exit /b 1
)
goto :eof

REM 重启应用
:restart_app
call :log_info "重启应用..."

REM 使用PM2重启应用
pm2 restart moocpay

if %errorlevel% equ 0 (
    call :log_info "应用重启成功"
    
    REM 显示应用状态
    pm2 status moocpay
) else (
    call :log_error "应用重启失败"
    exit /b 1
)
goto :eof

REM 健康检查
:health_check
call :log_info "执行健康检查..."

REM 等待应用启动
timeout /t 10 /nobreak >nul

REM 检查应用是否正常运行
pm2 list | findstr "moocpay" | findstr "online" >nul
if %errorlevel% equ 0 (
    call :log_info "应用运行正常"
    
    REM 检查HTTP响应（如果有配置）
    where curl >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=2 delims==" %%i in ('findstr "^APP_URL=" .env') do set HTTP_URL=%%i
        if defined HTTP_URL (
            curl -s -o nul -w "%%{http_code}" "%HTTP_URL%" > temp_http_status.txt
            set /p HTTP_STATUS=<temp_http_status.txt
            del temp_http_status.txt
            
            if "%HTTP_STATUS%"=="200" (
                call :log_info "HTTP健康检查通过 (状态码: %HTTP_STATUS%)"
            ) else (
                call :log_warn "HTTP健康检查失败 (状态码: %HTTP_STATUS%)"
            )
        )
    )
) else (
    call :log_error "应用未正常运行"
    exit /b 1
)
goto :eof

REM 清理旧备份
:cleanup_old_backups
call :log_info "清理旧备份 (保留最近5个)..."

if exist "C:\backups" (
    cd /d "C:\backups"
    dir /b /ad /o-d > temp_dirs.txt
    setlocal enabledelayedexpansion
    set count=0
    for /f "tokens=*" %%i in (temp_dirs.txt) do (
        set /a count+=1
        if !count! gtr 5 (
            rmdir /s /q "%%i"
        )
    )
    endlocal
    del temp_dirs.txt
    call :log_info "旧备份清理完成"
)
goto :eof

REM 主函数
:main
call :log_info "开始GitHub同步流程..."
call :log_info "分支: %BRANCH%, 环境: %ENVIRONMENT%"

REM 检查Git
call :check_git
if %errorlevel% neq 0 exit /b 1

REM 备份当前应用
call :backup_app

REM 从GitHub同步代码
call :sync_from_github
if %errorlevel% neq 0 (
    call :log_error "代码同步失败，终止流程"
    exit /b 1
)

REM 安装/更新依赖
call :install_dependencies
if %errorlevel% neq 0 (
    call :log_error "依赖安装失败，终止流程"
    exit /b 1
)

REM 更新环境配置
call :update_env_config
if %errorlevel% neq 0 (
    call :log_error "环境配置更新失败，终止流程"
    exit /b 1
)

REM 重启应用
call :restart_app
if %errorlevel% neq 0 (
    call :log_error "应用重启失败，终止流程"
    exit /b 1
)

REM 健康检查
call :health_check
if %errorlevel% neq 0 (
    call :log_error "健康检查失败"
    exit /b 1
)

REM 清理旧备份
call :cleanup_old_backups

call :log_info "GitHub同步流程完成!"
goto :eof

REM 执行主函数
call :main