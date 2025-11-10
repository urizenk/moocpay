const express = require('express');
const router = express.Router();

// 导入数据模型
const Transfer = require('../models/transfer');
const Payment = require('../models/payment');

// 获取所有转账记录
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    
    const transfers = await Transfer.getAll();
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await Transfer.getById(id);
    
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
        theme: transfer.theme || 'classic',
        accountStatus: transfer.accountStatus || 'available',
        createTime: transfer.createdAt,
        receiveTime: transfer.updatedAt,
        status: transfer.status,
        paymentId: transfer.paymentId,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt
      }
    });
  } catch (error) {
    console.error('获取转账记录失败:', error);
    res.status(500).json({ error: '获取转账记录失败' });
  }
});

// 创建新的转账记录
router.post('/', async (req, res) => {
  try {
    const { displayName, actualAmount, senderName, senderAvatar, message, theme, accountStatus } = req.body;
    
    if (!displayName || !actualAmount || !senderName) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }
    
    const newTransfer = await Transfer.create({
      displayName,
      actualAmount: parseFloat(actualAmount),
      senderName,
      senderAvatar: senderAvatar || '/default-avatar.png',
      message: message || '',
      theme: theme || 'classic',
      accountStatus: accountStatus || 'available'
    });
    
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
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentId, displayName, actualAmount, message, accountStatus, theme } = req.body;
    
    const transfer = await Transfer.getById(id);
    if (!transfer) {
      return res.status(404).json({ 
        success: false, 
        error: '转账记录不存在' 
      });
    }
    
    // 更新转账记录
    const updateData = {};
    if (status) updateData.status = status;
    if (paymentId) updateData.paymentId = paymentId;
    if (displayName) updateData.displayName = displayName;
    if (actualAmount) updateData.actualAmount = parseFloat(actualAmount);
    if (message !== undefined) updateData.message = message;
    if (accountStatus) updateData.accountStatus = accountStatus;
    if (theme) updateData.theme = theme;
    
    // 如果状态为已收款，更新收款时间
    if (status === 'received') {
      updateData.receiveTime = new Date().toISOString();
    }
    
    const updatedTransfer = await Transfer.update(id, updateData);
    
    res.json({
      success: true,
      data: updatedTransfer
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await Transfer.delete(id);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: '转账记录不存在' 
      });
    }
    
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