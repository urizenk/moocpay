const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '../../data');
const transfersFile = path.join(dataDir, 'transfers.json');

// 获取所有转账记录
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    
    if (!fs.existsSync(transfersFile)) {
      return res.json({
        success: true,
        data: {
          list: [],
          total: 0,
          page,
          size
        }
      });
    }
    
    const transfers = JSON.parse(fs.readFileSync(transfersFile, 'utf8'));
    const total = transfers.length;
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const list = transfers.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        list,
        total,
        page,
        size
      }
    });
  } catch (error) {
    console.error('获取转账记录失败:', error);
    res.status(500).json({ success: false, error: '获取转账记录失败' });
  }
});

// 获取单个转账记录
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!fs.existsSync(transfersFile)) {
      return res.status(404).json({ error: '转账记录不存在' });
    }
    
    const transfers = JSON.parse(fs.readFileSync(transfersFile, 'utf8'));
    const transfer = transfers.find(t => t.id === id);
    
    if (!transfer) {
      return res.status(404).json({ error: '转账记录不存在' });
    }
    
    // 返回符合前端期望的数据格式
    res.json({
      success: true,
      data: {
        id: transfer.id,
        displayName: transfer.displayName,
        actualAmount: transfer.actualAmount,
        senderName: transfer.senderName,
        senderAvatar: transfer.senderAvatar || '/default-avatar.png',
        message: transfer.message || '',
        createTime: transfer.createTime,
        receiveTime: transfer.receiveTime,
        status: transfer.status,
        paymentId: transfer.paymentId
      }
    });
  } catch (error) {
    console.error('获取转账记录失败:', error);
    res.status(500).json({ error: '获取转账记录失败' });
  }
});

// 创建新的转账记录
router.post('/', (req, res) => {
  try {
    const { displayName, actualAmount, senderName, senderAvatar, message } = req.body;
    
    if (!displayName || !actualAmount || !senderName) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }
    
    // 确保数据目录和文件存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    let transfers = [];
    if (fs.existsSync(transfersFile)) {
      transfers = JSON.parse(fs.readFileSync(transfersFile, 'utf8'));
    }
    
    const newTransfer = {
      id: uuidv4(),
      displayName,
      actualAmount: parseFloat(actualAmount),
      senderName,
      senderAvatar: senderAvatar || '/default-avatar.png',
      message: message || '',
      createTime: new Date().toISOString(),
      receiveTime: null,
      status: 'pending',
      paymentId: null
    };
    
    transfers.push(newTransfer);
    fs.writeFileSync(transfersFile, JSON.stringify(transfers, null, 2));
    
    res.status(201).json({
      success: true,
      data: newTransfer
    });
  } catch (error) {
    console.error('创建转账记录失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '创建转账记录失败' 
    });
  }
});

// 更新转账记录状态
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentId } = req.body;
    
    if (!fs.existsSync(transfersFile)) {
      return res.status(404).json({ 
        success: false, 
        error: '转账记录不存在' 
      });
    }
    
    let transfers = JSON.parse(fs.readFileSync(transfersFile, 'utf8'));
    const transferIndex = transfers.findIndex(t => t.id === id);
    
    if (transferIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: '转账记录不存在' 
      });
    }
    
    // 更新转账记录
    if (status) {
      transfers[transferIndex].status = status;
    }
    
    if (paymentId) {
      transfers[transferIndex].paymentId = paymentId;
    }
    
    // 如果状态为已收款，更新收款时间
    if (status === 'received') {
      transfers[transferIndex].receiveTime = new Date().toISOString();
    }
    
    fs.writeFileSync(transfersFile, JSON.stringify(transfers, null, 2));
    
    res.json({
      success: true,
      data: transfers[transferIndex]
    });
  } catch (error) {
    console.error('更新转账记录失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新转账记录失败' 
    });
  }
});

// 删除转账记录
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!fs.existsSync(transfersFile)) {
      return res.status(404).json({ 
        success: false, 
        error: '转账记录不存在' 
      });
    }
    
    let transfers = JSON.parse(fs.readFileSync(transfersFile, 'utf8'));
    const transferIndex = transfers.findIndex(t => t.id === id);
    
    if (transferIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: '转账记录不存在' 
      });
    }
    
    transfers.splice(transferIndex, 1);
    fs.writeFileSync(transfersFile, JSON.stringify(transfers, null, 2));
    
    res.json({ 
      success: true,
      message: '转账记录删除成功'
    });
  } catch (error) {
    console.error('删除转账记录失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '删除转账记录失败' 
    });
  }
});

module.exports = router;