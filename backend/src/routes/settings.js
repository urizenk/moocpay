const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
const settingsFile = path.join(dataDir, 'settings.json');

// 获取设置
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(settingsFile)) {
      // 返回默认设置
      const defaultSettings = {
        displayName: '100.00元',
        actualAmount: 0.1,
        senderName: '张三',
        message: '恭喜发财，大吉大利'
      };
      return res.json({
        success: true,
        data: defaultSettings
      });
    }
    
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取设置失败' 
    });
  }
});

// 更新设置
router.post('/', (req, res) => {
  try {
    const { displayName, actualAmount, senderName, message } = req.body;
    
    // 验证必要参数
    if (!displayName || !actualAmount || !senderName) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }
    
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const settings = {
      displayName,
      actualAmount: parseFloat(actualAmount),
      senderName,
      message: message || '',
      updateTime: new Date().toISOString()
    };
    
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新设置失败' 
    });
  }
});

// 重置设置为默认值
router.post('/reset', (req, res) => {
  try {
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const defaultSettings = {
      displayName: '100.00元',
      actualAmount: 0.1,
      senderName: '张三',
      message: '恭喜发财，大吉大利',
      updateTime: new Date().toISOString()
    };
    
    fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2));
    
    res.json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    console.error('重置设置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '重置设置失败' 
    });
  }
});

module.exports = router;