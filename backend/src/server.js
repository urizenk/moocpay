// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');

// 导入数据模型
const Transfer = require('./models/transfer');
const Payment = require('./models/payment');

// 导入路由
const transferRoutes = require('./routes/transfers');
const paymentRoutes = require('./routes/payment');
const settingsRoutes = require('./routes/settings');
const wechatRoutes = require('./routes/wechat');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // 允许携带 cookie
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 管理中间件
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // 生产环境使用 https
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API路由
app.use('/api/transfers', transferRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/wechat', wechatRoutes);

// 数据初始化
const dataDir = path.join(__dirname, '../data');
const settingsFile = path.join(dataDir, 'settings.json');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 初始化默认设置
async function initDefaultSettings() {
  await ensureDataDir();
  try {
    await fs.access(settingsFile);
  } catch (error) {
    // 设置文件不存在，创建默认设置
    const defaultSettings = {
      displayName: "100.00元",
      actualAmount: 0.1,
      senderName: "张三",
      senderAvatar: "https://via.placeholder.com/50x50?text=张三",
      message: "恭喜发财，大吉大利",
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(settingsFile, JSON.stringify(defaultSettings, null, 2));
    console.log('已创建默认设置文件');
  }
}

// 启动服务器
async function startServer() {
  try {
    // 初始化数据目录和设置
    await initDefaultSettings();

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
}

// 处理前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

startServer();

module.exports = app;