# 微信转账模拟系统

这是一个模拟微信转账功能的系统，包含前端展示页面和后端API服务。

## 功能特点

- 收款网页界面（100%还原微信转账界面）
- **6套微信官方风格主题（可自由选择）** ⭐⭐⭐ 最新
  - 💰 经典转账（橙黄色）
  - 🧧 红包样式（喜庆红色）
  - 🏢 企业转账（商务蓝色）
  - 💚 收款码（微信绿色）
  - 💜 零钱通（优雅紫色）
  - 🎁 活动奖励（尊贵金色）
- 收款成功页面
- 后台管理界面（创建/编辑/分享/撤销）
- 支付接口集成（模拟/真实微信支付）
- **微信网页授权（自动获取用户 OpenID）** ⭐ 
- **状态管理（可用/冻结切换）** ⭐ 
- **实时状态同步（每3秒自动刷新）** ⭐ 
- **移动端完美适配（支持所有手机）** ⭐ 
- Session 管理（用户授权状态持久化）
- 开发/生产环境自适应
- 主题动画效果（红包摇晃、奖励脉冲）

## 系统架构

```
moocpay/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── components/ # 公共组件
│   │   ├── utils/     # 工具函数
│   │   ├── styles/    # 样式文件
│   │   ├── App.vue    # 根组件
│   │   ├── main.js    # 入口文件
│   │   └── router.js  # 路由配置
│   ├── index.html     # HTML模板
│   ├── vite.config.js # Vite配置
│   └── package.json   # 项目依赖
├── backend/           # 后端项目
│   ├── src/
│   │   ├── routes/    # API路由
│   │   │   ├── payment.js    # 支付相关API
│   │   │   └── ...           # 其他路由
│   │   ├── utils/        # 工具函数
│   │   │   └── wechatPay.js  # 微信支付工具类
│   │   └── server.js  # 服务器入口
│   ├── .env          # 环境变量配置
│   └── package.json   # 项目依赖
├── shared/            # 共享资源
│   └── types/         # 类型定义
└── docs/              # 文档
    ├── WECHAT_PAY_SETUP.md    # 微信支付配置指南
    └── DEPLOYMENT_GUIDE.md     # 部署指南
```

## 安装与运行

### 前端安装与运行

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

### 后端安装与运行

1. 进入后端目录
```bash
cd backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
# 复制环境变量模板（如果存在）
cp .env.example .env

# 编辑环境变量
nano .env
```

至少需要配置以下参数：
```bash
# 基本配置
PORT=3000
NODE_ENV=development
SITE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# 微信公众号配置（必需，用于获取 OpenID）
WECHAT_APP_ID=你的公众号AppID
WECHAT_APP_SECRET=你的公众号AppSecret
WECHAT_TOKEN=你的微信Token

# Session 配置（必需）
SESSION_SECRET=随机生成的密钥

# 微信支付配置（可选，用于真实支付）
WECHAT_MCH_ID=你的商户号
WECHAT_API_KEY=你的API密钥
WECHAT_NOTIFY_URL=https://yourdomain.com/api/payment/notify
```

4. 启动服务器
```bash
npm run dev
```

5. 生产环境运行
```bash
npm start
```

## API接口

### 转账记录

- `GET /api/transfers` - 获取转账记录列表
- `GET /api/transfers/:id` - 获取单个转账记录
- `POST /api/transfers` - 创建新的转账记录
- `PATCH /api/transfers/:id` - 更新转账记录状态
- `DELETE /api/transfers/:id` - 删除转账记录

### 设置

- `GET /api/settings` - 获取系统设置
- `POST /api/settings` - 更新系统设置
- `POST /api/settings/reset` - 重置设置为默认值

### 统计

- `GET /api/statistics` - 获取统计数据
- `GET /api/statistics/daily` - 获取按日期分组的统计数据

### 支付

- `POST /api/payment/create` - 创建支付订单
- `GET /api/payment/status/:paymentId` - 查询支付状态
- `POST /api/payment/callback` - 支付回调
- `POST /api/payment/mock-success` - 模拟支付成功（测试用）

### 微信授权

- `GET /api/wechat/auth/redirect` - 重定向到微信授权页面
- `GET /api/wechat/auth/callback` - 微信授权回调处理
- `GET /api/wechat/auth/openid` - 获取当前用户 OpenID
- `POST /api/wechat/auth/logout` - 清除授权信息
- `GET /api/wechat/check-wechat` - 检查是否在微信浏览器中
- `GET /api/wechat/config` - 获取微信 JS-SDK 配置
- `GET /api/wechat/verify` - 验证微信服务器签名

## 页面路由

- `/` - 微信聊天卡片页面
- `/receive/:id` - 收款页面
- `/success/:id` - 收款成功页面
- `/admin` - 后台管理页面

## 微信功能集成

### 微信网页授权（OpenID 获取）⭐

本系统已完整实现微信网页授权功能，可自动获取用户 OpenID 用于支付。

**快速开始：**
- [OpenID 快速启动指南](./docs/QUICK_START_OPENID.md) - 5分钟快速上手
- [微信授权详细指南](./docs/WECHAT_AUTH_GUIDE.md) - 完整配置和使用说明

**核心特性：**
- ✅ 静默授权（无需用户手动同意）
- ✅ Session 持久化（授权状态保持）
- ✅ 自动重定向（授权后回到原页面）
- ✅ 开发模式（无需真实 OpenID 即可测试）
- ✅ 生产就绪（完整的错误处理和日志）

### 微信支付集成

如需集成真实微信支付功能，请参考：

- [微信支付配置指南](./docs/WECHAT_PAY_SETUP.md)
- [部署指南](./docs/DEPLOYMENT_GUIDE.md)

## 注意事项

1. **OpenID 获取**：系统已实现完整的微信网页授权，可自动获取用户 OpenID
2. **环境区分**：开发环境自动使用模拟支付，生产环境使用真实微信支付
3. **Session 管理**：使用 express-session 管理用户授权状态，需配置 SESSION_SECRET
4. **授权域名**：生产环境需在微信公众平台配置网页授权域名
5. **实际支付金额**：固定为0.1元，显示金额可通过后台设置
6. **数据存储**：当前使用本地文件系统，生产环境建议使用数据库
7. **前端构建**：构建后需将 dist 目录内容复制到后端项目根目录
8. **HTTPS 要求**：生产环境必须使用 HTTPS 协议

## 开发计划

### 已完成功能 ✅

- [x] 创建项目基础结构和配置文件
- [x] 开发微信聊天卡片组件（100%还原）
- [x] 开发收款网页界面（100%还原）
- [x] 开发收款成功页面
- [x] 开发后台管理界面（完整功能）
- [x] 实现后端API服务
- [x] 集成微信支付接口
- [x] **实现微信网页授权（自动获取 OpenID）** ⭐
- [x] **Session 管理和状态持久化** ⭐
- [x] **开发/生产环境自适应** ⭐
- [x] **管理后台（创建/编辑/分享/撤销）** ⭐
- [x] **状态管理（可用/冻结切换）** ⭐
- [x] **实时状态同步（每3秒自动刷新）** ⭐
- [x] **橙黄色配色方案（微信转账风格）** ⭐
- [x] **移动端完美适配（所有手机型号）** ⭐ 新增
- [x] **响应式设计（320px-768px+）** ⭐ 新增
- [x] **触摸体验优化（Apple标准）** ⭐ 新增
- [x] **刘海屏/药丸屏适配** ⭐ 新增
- [x] **横屏模式支持** ⭐ 新增
- [x] **6套微信官方风格主题** ⭐⭐⭐ 最新
- [x] **主题选择器** ⭐⭐⭐ 最新
- [x] **主题动画效果** ⭐⭐⭐ 最新

### 未来计划 📅

- [ ] 数据库集成（替代文件存储）
- [ ] Redis Session存储（分布式支持）
- [ ] 数据统计图表
- [ ] 批量操作功能
- [ ] 导出Excel报表

## 技术栈

### 前端
- **框架**：Vue 3.2+ (Composition API)
- **构建工具**：Vite 4.0+
- **UI组件库**：Vant 4.0+ (移动端)
- **HTTP客户端**：Axios
- **路由**：Vue Router 4.0+

### 后端
- **运行环境**：Node.js 16+
- **Web框架**：Express 4.18+
- **Session管理**：Express-Session 1.17+
- **数据存储**：JSON文件（可扩展为数据库）

### 微信集成
- **微信网页授权**：OAuth 2.0（OpenID获取）
- **微信支付**：JSAPI（真实支付）
- **微信JS-SDK**：1.6.0（分享功能）

### 其他
- **工具库**：UUID, CORS, dotenv, crypto
- **移动端优化**：响应式设计、触摸优化、性能优化

## 📖 文档导航

### 核心文档（必读）
- [项目完成报告](./PROJECT_COMPLETE.md) - ⭐⭐⭐⭐⭐ 项目总览
- [多主题完成报告](./MULTI_THEME_COMPLETE.md) - ⭐⭐⭐⭐⭐ 6套主题说明
- [更新摘要](./UPDATES.md) - ⭐⭐⭐⭐⭐ 最新更新
- [新功能指南](./docs/NEW_FEATURES_GUIDE.md) - ⭐⭐⭐⭐⭐ 功能说明

### 快速开始
- [OpenID 快速启动](./docs/QUICK_START_OPENID.md) - 5分钟快速上手
- [完整部署指南](./docs/COMPLETE_DEPLOYMENT_GUIDE.md) - 生产部署

### 微信集成
- [微信授权指南](./docs/WECHAT_AUTH_GUIDE.md) - 完整配置说明
- [OpenID 实现总结](./docs/OPENID_IMPLEMENTATION_SUMMARY.md) - 技术详解
- [OpenID 演示](./docs/OPENID_DEMO.md) - 功能演示
- [微信支付配置](./docs/WECHAT_PAY_SETUP.md) - 支付功能配置

### 移动端优化
- [移动端响应式指南](./docs/MOBILE_RESPONSIVE_GUIDE.md) - ⭐⭐⭐⭐⭐ 响应式设计
- [移动端测试清单](./docs/MOBILE_TEST_CHECKLIST.md) - 测试标准
- [移动端优化报告](./docs/MOBILE_OPTIMIZATION_COMPLETE.md) - 优化成果

### 界面设计
- [多主题使用指南](./docs/MULTI_THEME_GUIDE.md) - ⭐⭐⭐⭐⭐ 6套主题详解
- [界面复刻说明](./docs/UI_REPLICATION_COMPLETE.md) - 界面对比

### 其他
- [部署指南](./docs/DEPLOYMENT_GUIDE.md) - 旧版部署
- [测试环境配置](./docs/TEST_ENVIRONMENT_SETUP.md) - 测试环境

## 微信功能集成

### 微信网页授权（OpenID 获取）⭐

本系统已完整实现微信网页授权功能，可自动获取用户 OpenID 用于支付。

**快速开始：**
- [OpenID 快速启动指南](./docs/QUICK_START_OPENID.md) - 5分钟快速上手
- [微信授权详细指南](./docs/WECHAT_AUTH_GUIDE.md) - 完整配置和使用说明

**核心特性：**
- ✅ 静默授权（无需用户手动同意）
- ✅ Session 持久化（授权状态保持）
- ✅ 自动重定向（授权后回到原页面）
- ✅ 开发模式（无需真实 OpenID 即可测试）
- ✅ 生产就绪（完整的错误处理和日志）

### 微信支付集成

如需集成真实微信支付功能，请参考：

- [微信支付配置指南](./docs/WECHAT_PAY_SETUP.md)
- [部署指南](./docs/DEPLOYMENT_GUIDE.md)

## 注意事项

1. **OpenID 获取**：系统已实现完整的微信网页授权，可自动获取用户 OpenID
2. **环境区分**：开发环境自动使用模拟支付，生产环境使用真实微信支付
3. **Session 管理**：使用 express-session 管理用户授权状态，需配置 SESSION_SECRET
4. **授权域名**：生产环境需在微信公众平台配置网页授权域名
5. **实际支付金额**：固定为0.1元，显示金额可通过后台设置
6. **数据存储**：当前使用本地文件系统，生产环境建议使用数据库
7. **前端构建**：构建后需将 dist 目录内容复制到后端项目根目录
8. **HTTPS 要求**：生产环境必须使用 HTTPS 协议

## 开发计划

### 已完成功能 ✅

- [x] 创建项目基础结构和配置文件
- [x] 开发微信聊天卡片组件（100%还原）
- [x] 开发收款网页界面（100%还原）
- [x] 开发收款成功页面
- [x] 开发后台管理界面（完整功能）
- [x] 实现后端API服务
- [x] 集成微信支付接口
- [x] **实现微信网页授权（自动获取 OpenID）** ⭐
- [x] **Session 管理和状态持久化** ⭐
- [x] **开发/生产环境自适应** ⭐
- [x] **管理后台（创建/编辑/分享/撤销）** ⭐
- [x] **状态管理（可用/冻结切换）** ⭐
- [x] **实时状态同步（每3秒自动刷新）** ⭐
- [x] **橙黄色配色方案（微信转账风格）** ⭐
- [x] **移动端完美适配（所有手机型号）** ⭐ 新增
- [x] **响应式设计（320px-768px+）** ⭐ 新增
- [x] **触摸体验优化（Apple标准）** ⭐ 新增
- [x] **刘海屏/药丸屏适配** ⭐ 新增
- [x] **横屏模式支持** ⭐ 新增
- [x] **6套微信官方风格主题** ⭐⭐⭐ 最新
- [x] **主题选择器** ⭐⭐⭐ 最新
- [x] **主题动画效果** ⭐⭐⭐ 最新

### 未来计划 📅

- [ ] 数据库集成（替代文件存储）
- [ ] Redis Session存储（分布式支持）
- [ ] 数据统计图表
- [ ] 批量操作功能
- [ ] 导出Excel报表

## 技术栈

### 前端
- **框架**：Vue 3.2+ (Composition API)
- **构建工具**：Vite 4.0+
- **UI组件库**：Vant 4.0+ (移动端)
- **HTTP客户端**：Axios
- **路由**：Vue Router 4.0+

### 后端
- **运行环境**：Node.js 16+
- **Web框架**：Express 4.18+
- **Session管理**：Express-Session 1.17+
- **数据存储**：JSON文件（可扩展为数据库）

### 微信集成
- **微信网页授权**：OAuth 2.0（OpenID获取）
- **微信支付**：JSAPI（真实支付）
- **微信JS-SDK**：1.6.0（分享功能）

### 其他
- **工具库**：UUID, CORS, dotenv, crypto
- **移动端优化**：响应式设计、触摸优化、性能优化

## 📖 文档导航

### 核心文档（必读）
- [项目完成报告](./PROJECT_COMPLETE.md) - ⭐⭐⭐⭐⭐ 项目总览
- [多主题完成报告](./MULTI_THEME_COMPLETE.md) - ⭐⭐⭐⭐⭐ 6套主题说明
- [更新摘要](./UPDATES.md) - ⭐⭐⭐⭐⭐ 最新更新
- [新功能指南](./docs/NEW_FEATURES_GUIDE.md) - ⭐⭐⭐⭐⭐ 功能说明

### 快速开始
- [OpenID 快速启动](./docs/QUICK_START_OPENID.md) - 5分钟快速上手
- [完整部署指南](./docs/COMPLETE_DEPLOYMENT_GUIDE.md) - 生产部署

### 微信集成
- [微信授权指南](./docs/WECHAT_AUTH_GUIDE.md) - 完整配置说明
- [OpenID 实现总结](./docs/OPENID_IMPLEMENTATION_SUMMARY.md) - 技术详解
- [OpenID 演示](./docs/OPENID_DEMO.md) - 功能演示
- [微信支付配置](./docs/WECHAT_PAY_SETUP.md) - 支付功能配置

### 移动端优化
- [移动端响应式指南](./docs/MOBILE_RESPONSIVE_GUIDE.md) - ⭐⭐⭐⭐⭐ 响应式设计
- [移动端测试清单](./docs/MOBILE_TEST_CHECKLIST.md) - 测试标准
- [移动端优化报告](./docs/MOBILE_OPTIMIZATION_COMPLETE.md) - 优化成果

### 界面设计
- [多主题使用指南](./docs/MULTI_THEME_GUIDE.md) - ⭐⭐⭐⭐⭐ 6套主题详解
- [界面复刻说明](./docs/UI_REPLICATION_COMPLETE.md) - 界面对比

### 其他
- [部署指南](./docs/DEPLOYMENT_GUIDE.md) - 旧版部署
- [测试环境配置](./docs/TEST_ENVIRONMENT_SETUP.md) - 测试环境
- 前端：Vue 3, Vite, Vant UI
- 后端：Node.js, Express
- 其他：Axios, UUID, CORS, dotenv