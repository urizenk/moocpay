const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

// 微信配置
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID || 'your_app_id', // 从环境变量获取微信应用ID
  appSecret: process.env.WECHAT_APP_SECRET || 'your_app_secret', // 从环境变量获取微信应用密钥
  token: process.env.WECHAT_TOKEN || 'your_token' // 从环境变量获取微信令牌
};

// 获取微信access_token
const getAccessToken = async () => {
  try {
    const response = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}`
    );
    
    if (response.data.access_token) {
      return response.data.access_token;
    } else {
      throw new Error('获取access_token失败');
    }
  } catch (error) {
    console.error('获取access_token失败:', error);
    throw error;
  }
};

// 获取微信jsapi_ticket
const getJsApiTicket = async (accessToken) => {
  try {
    const response = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
    );
    
    if (response.data.ticket) {
      return response.data.ticket;
    } else {
      throw new Error('获取jsapi_ticket失败');
    }
  } catch (error) {
    console.error('获取jsapi_ticket失败:', error);
    throw error;
  }
};

// 生成签名
const generateSignature = (ticket, nonceStr, timestamp, url) => {
  const string = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  return crypto.createHash('sha1').update(string).digest('hex');
};

// 生成随机字符串
const generateNonceStr = () => {
  return Math.random().toString(36).substr(2, 15);
};

// 获取微信JS-SDK配置
router.get('/config', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少url参数'
      });
    }
    
    // 开发环境下返回模拟配置
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        data: {
          appId: WECHAT_CONFIG.appId,
          timestamp: Math.floor(Date.now() / 1000),
          nonceStr: 'test_nonce_str',
          signature: 'test_signature_for_development'
        }
      });
    }
    
    // 生产环境下获取真实的微信配置
    // 获取access_token
    const accessToken = await getAccessToken();
    
    // 获取jsapi_ticket
    const ticket = await getJsApiTicket(accessToken);
    
    // 生成签名参数
    const nonceStr = generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(ticket, nonceStr, timestamp, url);
    
    // 返回配置
    res.json({
      success: true,
      data: {
        appId: WECHAT_CONFIG.appId,
        timestamp,
        nonceStr,
        signature
      }
    });
  } catch (error) {
    console.error('获取微信配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取微信配置失败'
    });
  }
});

// 验证微信服务器签名
router.get('/verify', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  
  if (!signature || !timestamp || !nonce || !echostr) {
    return res.status(400).send('缺少必要参数');
  }
  
  // 将token、timestamp、nonce三个参数进行字典序排序
  const params = [WECHAT_CONFIG.token, timestamp, nonce].sort().join('');
  
  // 将三个参数字符串拼接成一个字符串进行sha1加密
  const hash = crypto.createHash('sha1').update(params).digest('hex');
  
  // 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
  if (hash === signature) {
    res.send(echostr);
  } else {
    res.status(403).send('验证失败');
  }
});

module.exports = router;