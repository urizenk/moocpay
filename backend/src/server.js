// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// 导入路由
const transferRoutes = require('./routes/transfers');
const settingsRoutes = require('./routes/settings');
const statisticsRoutes = require('./routes/statistics');
const paymentRoutes = require('./routes/payment');
const wechatRoutes = require('./routes/wechat');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API路由
app.use('/api/transfers', transferRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/wechat', wechatRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 前端路由处理 - 所有非API请求都返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 确保数据目录存在
const ensureDataDir = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 初始化数据文件
  const transfersFile = path.join(dataDir, 'transfers.json');
  const settingsFile = path.join(dataDir, 'settings.json');
  
  if (!fs.existsSync(transfersFile)) {
    fs.writeFileSync(transfersFile, JSON.stringify([]));
  }
  
  if (!fs.existsSync(settingsFile)) {
    const defaultSettings = {
      displayName: '100.00元',
      actualAmount: 0.1,
      senderName: '张三',
      message: '恭喜发财，大吉大利'
    };
    fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings));
  }
};

// 启动服务器
app.listen(PORT, () => {
  ensureDataDir();
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`API地址: http://localhost:${PORT}/api`);
  console.log(`前端地址: http://localhost:${PORT}`);
});

module.exports = app;