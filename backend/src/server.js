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
const wechatDiagRoutes = require('./routes/wechat-diag');

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

// ========== 动态meta标签路由（必须在静态文件之前！） ==========
// 处理 /receive/:id 页面的动态meta标签
app.get('/receive/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await Transfer.getById(id);
    
    if (transfer) {
      const htmlPath = path.join(__dirname, '../../frontend/dist/index.html');
      let html = await fs.readFile(htmlPath, 'utf-8');
      
      const title = `${transfer.senderName}给你发了一个转账`;
      const description = `向你转账${transfer.displayName}`;
      
      html = html.replace('<title>微信转账</title>', `<title>${title}</title>`);
      html = html.replace('<meta name="description" content="你收到一笔转账">', `<meta name="description" content="${description}">`);
      html = html.replace('<meta property="og:title" content="微信转账">', `<meta property="og:title" content="${title}">`);
      html = html.replace('<meta property="og:description" content="你收到一笔转账">', `<meta property="og:description" content="${description}">`);
      html = html.replace('<meta itemprop="name" content="微信转账">', `<meta itemprop="name" content="${title}">`);
      html = html.replace('<meta itemprop="description" content="你收到一笔转账">', `<meta itemprop="description" content="${description}">`);
      
      return res.send(html);
    }
  } catch (error) {
    console.error('生成动态HTML失败:', error);
  }
  
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// 处理 /share/:id 页面的动态meta标签
app.get('/share/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await Transfer.getById(id);
    
    if (transfer) {
      const htmlPath = path.join(__dirname, '../../frontend/dist/index.html');
      let html = await fs.readFile(htmlPath, 'utf-8');
      
      const title = `${transfer.senderName}给你发了一个转账`;
      const description = `向你转账${transfer.displayName}`;
      
      html = html.replace('<title>微信转账</title>', `<title>${title}</title>`);
      html = html.replace('<meta name="description" content="你收到一笔转账">', `<meta name="description" content="${description}">`);
      html = html.replace('<meta property="og:title" content="微信转账">', `<meta property="og:title" content="${title}">`);
      html = html.replace('<meta property="og:description" content="你收到一笔转账">', `<meta property="og:description" content="${description}">`);
      html = html.replace('<meta itemprop="name" content="微信转账">', `<meta itemprop="name" content="${title}">`);
      html = html.replace('<meta itemprop="description" content="你收到一笔转账">', `<meta itemprop="description" content="${description}">`);
      
      return res.send(html);
    }
  } catch (error) {
    console.error('生成动态HTML失败:', error);
  }
  
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API路由
app.use('/api/transfers', transferRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/wechat', wechatRoutes);
app.use('/api/wechat', wechatDiagRoutes);

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


// 处理其他前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

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

startServer();

module.exports = app;