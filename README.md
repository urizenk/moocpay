# 微信转账模拟系统

这是一个模拟微信转账功能的系统，包含前端展示页面和后端API服务。

## 功能特点

- 微信聊天卡片展示
- 收款网页界面
- 收款成功页面
- 后台管理界面
- 支付接口集成（模拟/真实微信支付）

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
# 微信支付配置（可选，用于真实支付）
WECHAT_APP_ID=你的公众号AppID
WECHAT_MCH_ID=你的商户号
WECHAT_API_KEY=你的API密钥
WECHAT_NOTIFY_URL=https://yourdomain.com/api/payment/callback

# 服务器配置
PORT=5000
NODE_ENV=development
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

## 页面路由

- `/` - 微信聊天卡片页面
- `/receive/:id` - 收款页面
- `/success/:id` - 收款成功页面
- `/admin` - 后台管理页面

## 微信支付集成

如需集成真实微信支付功能，请参考：

- [微信支付配置指南](./docs/WECHAT_PAY_SETUP.md)
- [部署指南](./docs/DEPLOYMENT_GUIDE.md)

## 注意事项

1. 本系统默认为演示系统，不涉及真实的微信支付接口
2. 实际支付金额固定为0.1元，显示金额可通过后台设置
3. 数据存储在本地文件系统中，生产环境建议使用数据库
4. 前端构建后需要将dist目录内容复制到后端项目根目录，以便后端提供静态文件服务
5. 若要使用真实微信支付，需要配置.env文件中的微信支付参数

## 开发计划

- [x] 创建项目基础结构和配置文件
- [x] 开发微信聊天卡片组件
- [x] 开发收款网页界面
- [x] 开发收款成功页面
- [x] 开发后台管理界面
- [x] 实现后端API服务
- [x] 集成微信支付接口（代码已实现，需配置参数）
- [ ] 测试整个系统功能

## 技术栈

- 前端：Vue 3, Vite, Vant UI
- 后端：Node.js, Express
- 其他：Axios, UUID, CORS, dotenv