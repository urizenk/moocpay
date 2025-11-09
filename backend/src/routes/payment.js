const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const WechatPay = require('../utils/wechatPay');

// 初始化微信支付实例
const wechatPay = new WechatPay(
  process.env.WECHAT_APP_ID || 'wx1234567890abcdef',
  process.env.WECHAT_MCH_ID || '1234567890',
  process.env.WECHAT_API_KEY || 'your_api_key_here',
  process.env.WECHAT_NOTIFY_URL || 'http://localhost:3000/api/payment/callback'
);

// 数据存储路径
const dataDir = path.join(__dirname, '../../data');
const transfersFile = path.join(dataDir, 'transfers.json');
const paymentsFile = path.join(dataDir, 'payments.json');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 读取支付记录
async function readPayments() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(paymentsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 读取转账记录
async function readTransfers() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(transfersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 保存转账记录
async function saveTransfers(transfers) {
  await ensureDataDir();
  await fs.writeFile(transfersFile, JSON.stringify(transfers, null, 2));
}

// 保存支付记录
async function savePayments(payments) {
  await ensureDataDir();
  await fs.writeFile(paymentsFile, JSON.stringify(payments, null, 2));
}

// 创建支付订单
router.post('/create', async (req, res) => {
  try {
    const { transferId, amount, description } = req.body;
    
    if (!transferId || !amount) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 读取转账记录
    const transfers = await readTransfers();
    const transfer = transfers.find(t => t.id === transferId);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: '转账记录不存在'
      });
    }

    // 创建支付订单
    const paymentId = uuidv4();
    const outTradeNo = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // 微信支付金额单位为分，这里固定为0.1元 = 10分
    const totalFee = 10;
    
    // 创建支付记录
    const payments = await readPayments();
    const newPayment = {
      id: paymentId,
      outTradeNo,
      transferId,
      amount: totalFee / 100, // 转换为元
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    payments.push(newPayment);
    await savePayments(payments);

    // 调用微信支付API创建订单
    const orderResult = await wechatPay.createOrder({
      outTradeNo,
      totalFee,
      body: description || '微信转账',
      openid: transfer.openid || 'test_openid' // 实际项目中应从用户信息中获取
    });

    if (orderResult.success) {
      // 更新支付记录
      newPayment.prepayId = orderResult.prepayId;
      newPayment.status = 'created';
      newPayment.updatedAt = new Date().toISOString();
      await savePayments(payments);

      res.json({
        success: true,
        data: {
          paymentId,
          outTradeNo,
          amount: totalFee / 100,
          paymentParams: orderResult.payParams
        }
      });
    } else {
      // 创建订单失败，更新支付记录状态
      newPayment.status = 'failed';
      newPayment.error = orderResult.error;
      newPayment.updatedAt = new Date().toISOString();
      await savePayments(payments);

      res.status(500).json({
        success: false,
        message: '创建支付订单失败',
        error: orderResult.error
      });
    }
  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 查询支付状态
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // 读取支付记录
    const payments = await readPayments();
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付记录不存在'
      });
    }

    // 如果支付状态是pending或created，查询微信支付状态
    if (payment.status === 'pending' || payment.status === 'created') {
      const queryResult = await wechatPay.queryOrder(payment.outTradeNo);
      
      if (queryResult.success) {
        // 更新支付状态
        payment.status = queryResult.tradeState === 'SUCCESS' ? 'success' : 'pending';
        payment.tradeState = queryResult.tradeState;
        payment.tradeStateDesc = queryResult.tradeStateDesc;
        payment.transactionId = queryResult.transactionId;
        payment.timeEnd = queryResult.timeEnd;
        payment.updatedAt = new Date().toISOString();
        
        // 如果支付成功，更新转账记录状态
        if (payment.status === 'success') {
          const transfers = await readTransfers();
          const transfer = transfers.find(t => t.id === payment.transferId);
          
          if (transfer) {
            transfer.status = 'success';
            transfer.completedAt = new Date().toISOString();
            transfer.updatedAt = new Date().toISOString();
            await saveTransfers(transfers);
          }
        }
        
        await savePayments(payments);
      }
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        tradeState: payment.tradeState,
        tradeStateDesc: payment.tradeStateDesc,
        transactionId: payment.transactionId,
        timeEnd: payment.timeEnd
      }
    });
  } catch (error) {
    console.error('查询支付状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 支付回调
router.post('/callback', async (req, res) => {
  try {
    // 微信支付回调是XML格式
    let xmlData = '';
    req.on('data', chunk => {
      xmlData += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // 解析XML数据
        const notifyData = wechatPay.xmlToObject(xmlData);
        
        // 验证签名
        if (!wechatPay.verifyNotify(notifyData)) {
          console.error('支付回调签名验证失败');
          return res.send(wechatPay.objectToXml({
            return_code: 'FAIL',
            return_msg: '签名验证失败'
          }));
        }
        
        // 处理支付结果
        if (notifyData.return_code === 'SUCCESS' && notifyData.result_code === 'SUCCESS') {
          // 支付成功，更新支付记录
          const payments = await readPayments();
          const payment = payments.find(p => p.outTradeNo === notifyData.out_trade_no);
          
          if (payment) {
            payment.status = 'success';
            payment.transactionId = notifyData.transaction_id;
            payment.timeEnd = notifyData.time_end;
            payment.updatedAt = new Date().toISOString();
            
            // 更新转账记录状态
            const transfers = await readTransfers();
            const transfer = transfers.find(t => t.id === payment.transferId);
            
            if (transfer) {
              transfer.status = 'success';
              transfer.completedAt = new Date().toISOString();
              transfer.updatedAt = new Date().toISOString();
              await saveTransfers(transfers);
            }
            
            await savePayments(payments);
          }
        }
        
        // 返回微信支付要求的响应
        res.send(wechatPay.objectToXml({
          return_code: 'SUCCESS',
          return_msg: 'OK'
        }));
      } catch (error) {
        console.error('处理支付回调失败:', error);
        res.send(wechatPay.objectToXml({
          return_code: 'FAIL',
          return_msg: '处理失败'
        }));
      }
    });
  } catch (error) {
    console.error('支付回调处理失败:', error);
    res.status(500).send(wechatPay.objectToXml({
      return_code: 'FAIL',
      return_msg: '服务器错误'
    }));
  }
});

// 模拟支付成功（测试用）
router.post('/mock-success', async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: '缺少支付ID'
      });
    }
    
    // 读取支付记录
    const payments = await readPayments();
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 更新支付状态为成功
    payment.status = 'success';
    payment.transactionId = `MOCK_TXN_${Date.now()}`;
    payment.timeEnd = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();
    
    // 更新转账记录状态
    const transfers = await readTransfers();
    const transfer = transfers.find(t => t.id === payment.transferId);
    
    if (transfer) {
      transfer.status = 'success';
      transfer.completedAt = new Date().toISOString();
      transfer.updatedAt = new Date().toISOString();
      await saveTransfers(transfers);
    }
    
    await savePayments(payments);
    
    res.json({
      success: true,
      message: '模拟支付成功',
      data: {
        paymentId: payment.id,
        status: payment.status,
        transactionId: payment.transactionId,
        timeEnd: payment.timeEnd
      }
    });
  } catch (error) {
    console.error('模拟支付成功失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 读取转账记录
async function readTransfers() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(transfersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 保存转账记录
async function saveTransfers(transfers) {
  await ensureDataDir();
  await fs.writeFile(transfersFile, JSON.stringify(transfers, null, 2));
}

module.exports = router;