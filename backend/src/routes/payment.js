const express = require('express');
const router = express.Router();
const WechatPay = require('../utils/wechatPay');
const Transfer = require('../models/transfer');
const Payment = require('../models/payment');

// 创建支付订单
router.post('/create', async (req, res) => {
  try {
    const { transferId, amount, description } = req.body;
    
    // 验证转账是否存在
    const transfer = await Transfer.getById(transferId);
    if (!transfer) {
      return res.json({
        success: false,
        message: '转账信息不存在'
      });
    }
    
    // 创建支付记录
    const payment = await Payment.create({
      transferId,
      amount,
      description,
      status: 'pending'
    });
    
    // 调用微信支付统一下单
    const wechatPay = new WechatPay();
    const orderId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const notifyUrl = `${process.env.SITE_URL}/api/payment/notify`;
    
    const paymentResult = await wechatPay.createOrder({
      body: description,
      out_trade_no: orderId,
      total_fee: Math.round(amount * 100), // 转换为分
      spbill_create_ip: req.ip,
      notify_url: notifyUrl,
      trade_type: 'JSAPI',
      openid: transfer.receiverOpenId || 'test_openid' // 实际应用中需要获取用户的openid
    });
    
    if (paymentResult.return_code === 'SUCCESS' && paymentResult.result_code === 'SUCCESS') {
      // 更新支付记录
      await Payment.update(payment.id, {
        orderId,
        prepayId: paymentResult.prepay_id,
        status: 'created'
      });
      
      // 生成JSAPI支付参数
      const paymentParams = wechatPay.generateJSAPIParams(paymentResult.prepay_id);
      
      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          orderId,
          paymentParams
        }
      });
    } else {
      // 支付订单创建失败
      await Payment.update(payment.id, {
        status: 'failed',
        error: paymentResult.err_code_des || '支付订单创建失败'
      });
      
      res.json({
        success: false,
        message: paymentResult.err_code_des || '支付订单创建失败'
      });
    }
  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.json({
      success: false,
      message: '创建支付订单失败'
    });
  }
});

// 查询支付状态
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // 获取支付记录
    const payment = await Payment.getById(paymentId);
    if (!payment) {
      return res.json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 如果支付状态不是最终状态，查询微信支付状态
    if (payment.status === 'pending' || payment.status === 'created') {
      const wechatPay = new WechatPay();
      const queryResult = await wechatPay.queryOrder(payment.orderId);
      
      if (queryResult.return_code === 'SUCCESS' && queryResult.result_code === 'SUCCESS') {
        const tradeState = queryResult.trade_state;
        
        // 更新支付状态
        let newStatus = payment.status;
        if (tradeState === 'SUCCESS') {
          newStatus = 'paid';
        } else if (tradeState === 'REFUND') {
          newStatus = 'refunded';
        } else if (tradeState === 'NOTPAY') {
          newStatus = 'pending';
        } else if (tradeState === 'CLOSED') {
          newStatus = 'closed';
        } else if (tradeState === 'PAYERROR') {
          newStatus = 'failed';
        }
        
        if (newStatus !== payment.status) {
          await Payment.update(payment.id, { status: newStatus });
          payment.status = newStatus;
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('查询支付状态失败:', error);
    res.json({
      success: false,
      message: '查询支付状态失败'
    });
  }
});

// 微信支付回调
router.post('/notify', async (req, res) => {
  try {
    const wechatPay = new WechatPay();
    
    // 验证签名
    const isValid = wechatPay.verifyNotify(req.body);
    if (!isValid) {
      return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>');
    }
    
    // 解析回调数据
    const notifyData = wechatPay.parseNotify(req.body);
    const { out_trade_no, transaction_id, result_code } = notifyData;
    
    if (result_code === 'SUCCESS') {
      // 支付成功，更新支付记录
      const payment = await Payment.getByOrderId(out_trade_no);
      if (payment) {
        await Payment.update(payment.id, {
          status: 'paid',
          transactionId: transaction_id,
          paidAt: new Date()
        });
        
        // 更新转账状态
        await Transfer.update(payment.transferId, {
          status: 'received',
          receivedAt: new Date()
        });
      }
    }
    
    // 返回成功响应
    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
  } catch (error) {
    console.error('处理支付回调失败:', error);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理回调失败]]></return_msg></xml>');
  }
});

// 模拟支付成功（用于测试）
router.post('/mock-success', async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    // 获取支付记录
    const payment = await Payment.getById(paymentId);
    if (!payment) {
      return res.json({
        success: false,
        message: '支付记录不存在'
      });
    }
    
    // 更新支付状态为已支付
    await Payment.update(payment.id, {
      status: 'paid',
      transactionId: `MOCK_${Date.now()}`,
      paidAt: new Date()
    });
    
    // 更新转账状态为已收款
    await Transfer.update(payment.transferId, {
      status: 'received',
      receivedAt: new Date()
    });
    
    res.json({
      success: true,
      message: '模拟支付成功'
    });
  } catch (error) {
    console.error('模拟支付失败:', error);
    res.json({
      success: false,
      message: '模拟支付失败'
    });
  }
});

module.exports = router;