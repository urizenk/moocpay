const express = require('express');
const router = express.Router();
const Transfer = require('../models/transfer');

// 获取统计数据
router.get('/', async (req, res) => {
  try {
    // 获取所有转账记录
    const transfers = await Transfer.getAll();
    
    // 计算总数据
    const totalCount = transfers.length;
    const totalDisplayAmount = transfers.reduce((sum, transfer) => {
      // 从显示金额中提取数字部分
      const amount = parseFloat(transfer.displayName.replace(/[^0-9.]/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const totalActualAmount = transfers.reduce((sum, transfer) => {
      return sum + parseFloat(transfer.actualAmount);
    }, 0);
    
    // 计算今日数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransfers = transfers.filter(transfer => {
      const transferDate = new Date(transfer.createdAt);
      return transferDate >= today;
    });
    
    const todayCount = todayTransfers.length;
    const todayActualAmount = todayTransfers.reduce((sum, transfer) => {
      return sum + parseFloat(transfer.actualAmount);
    }, 0);
    
    // 计算最近7天的数据
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayTransfers = transfers.filter(transfer => {
        const transferDate = new Date(transfer.createdAt);
        return transferDate >= date && transferDate < nextDate;
      });
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        count: dayTransfers.length,
        actualAmount: dayTransfers.reduce((sum, transfer) => {
          return sum + parseFloat(transfer.actualAmount);
        }, 0)
      });
    }
    
    res.json({
      success: true,
      data: {
        totalCount,
        totalDisplayAmount: totalDisplayAmount.toFixed(2),
        totalActualAmount: totalActualAmount.toFixed(2),
        todayCount,
        todayActualAmount: todayActualAmount.toFixed(2),
        last7Days
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取统计数据失败' 
    });
  }
});

// 获取按日期分组的统计数据
router.get('/daily', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 获取所有转账记录
    const transfers = await Transfer.getAll();
    
    // 设置日期范围
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // 按日期分组
    const dailyStats = {};
    
    transfers.forEach(transfer => {
      const transferDate = new Date(transfer.createdAt);
      
      // 检查是否在日期范围内
      if (transferDate >= start && transferDate <= end) {
        const dateKey = transferDate.toISOString().split('T')[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            count: 0,
            actualAmount: 0
          };
        }
        
        dailyStats[dateKey].count++;
        dailyStats[dateKey].actualAmount += parseFloat(transfer.actualAmount);
      }
    });
    
    // 转换为数组并按日期排序
    const result = Object.values(dailyStats).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取每日统计数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取每日统计数据失败' 
    });
  }
});

module.exports = router;