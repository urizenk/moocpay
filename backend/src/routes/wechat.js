const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const WechatAuth = require('../utils/wechatAuth');

// 微信配置
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID || 'your_app_id', // 从环境变量获取微信应用ID
  appSecret: process.env.WECHAT_APP_SECRET || 'your_app_secret', // 从环境变量获取微信应用密钥
  token: process.env.WECHAT_TOKEN || 'your_token' // 从环境变量获取微信令牌
};

// 创建微信授权实例
const wechatAuth = new WechatAuth();

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

// ============= 微信网页授权相关接口 =============

/**
 * 微信网页授权 - 重定向到微信授权页面
 * 用户访问此接口后会跳转到微信授权页面
 */
router.get('/auth/redirect', (req, res) => {
  try {
    // 获取回调URL参数（授权成功后要返回的页面）
    const { returnUrl, scope } = req.query;

    // 保存回调URL到session，授权成功后使用
    if (returnUrl) {
      req.session.wechatAuthReturnUrl = returnUrl;
    }

    // 构建授权回调URL（授权成功后微信会回调这个地址）
    const redirectUri = `${process.env.SITE_URL || 'http://localhost:3000'}/api/wechat/auth/callback`;

    // 生成随机state参数，用于防止CSRF攻击
    const state = Math.random().toString(36).substring(2, 15);
    req.session.wechatAuthState = state;

    // 生成微信授权URL
    // scope: snsapi_base - 静默授权，只能获取openid
    // scope: snsapi_userinfo - 需要用户同意，可以获取用户详细信息
    const authScope = scope === 'userinfo' ? 'snsapi_userinfo' : 'snsapi_base';
    const authUrl = wechatAuth.generateAuthUrl(redirectUri, state, authScope);

    // 重定向到微信授权页面
    res.redirect(authUrl);
  } catch (error) {
    console.error('生成授权URL失败:', error);
    res.status(500).json({
      success: false,
      message: '生成授权URL失败'
    });
  }
});

/**
 * 微信网页授权回调接口
 * 用户授权成功后，微信会回调此接口，并带上 code 参数
 */
router.get('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    // 验证参数
    if (!code) {
      return res.status(400).send('缺少授权码');
    }

    // 验证state参数，防止CSRF攻击
    if (state && req.session.wechatAuthState && state !== req.session.wechatAuthState) {
      return res.status(403).send('state参数验证失败');
    }

    // 通过code换取access_token和openid
    const result = await wechatAuth.getAccessToken(code);

    if (!result.success) {
      return res.status(500).send(`获取OpenID失败: ${result.error}`);
    }

    const { openid, accessToken, scope } = result.data;

    // 将openid保存到session
    req.session.wechatOpenId = openid;
    req.session.wechatAccessToken = accessToken;
    req.session.wechatAuthScope = scope;

    console.log('用户授权成功，OpenID:', openid);

    // 如果授权作用域包含用户信息，获取用户详细信息
    let userInfo = null;
    if (scope && scope.includes('snsapi_userinfo')) {
      const userInfoResult = await wechatAuth.getUserInfo(accessToken, openid);
      if (userInfoResult.success) {
        userInfo = userInfoResult.data;
        req.session.wechatUserInfo = userInfo;
      }
    }

    // 获取之前保存的回调URL
    const returnUrl = req.session.wechatAuthReturnUrl || '/';

    // 清除session中的临时数据
    delete req.session.wechatAuthState;
    delete req.session.wechatAuthReturnUrl;

    // 重定向回原页面，并在URL中附加openid（作为备用方案）
    const separator = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${separator}wechat_auth=success&openid=${openid}`);
  } catch (error) {
    console.error('处理授权回调失败:', error);
    res.status(500).send('授权失败');
  }
});

/**
 * 获取当前用户的OpenID
 * 前端通过此接口检查用户是否已授权
 */
router.get('/auth/openid', (req, res) => {
  try {
    const openid = req.session.wechatOpenId;

    if (!openid) {
      return res.json({
        success: false,
        message: '未授权',
        authorized: false
      });
    }

    res.json({
      success: true,
      authorized: true,
      data: {
        openid,
        userInfo: req.session.wechatUserInfo || null
      }
    });
  } catch (error) {
    console.error('获取OpenID失败:', error);
    res.status(500).json({
      success: false,
      message: '获取OpenID失败'
    });
  }
});

/**
 * 清除授权信息（用于测试或用户主动退出）
 */
router.post('/auth/logout', (req, res) => {
  try {
    // 清除session中的授权信息
    delete req.session.wechatOpenId;
    delete req.session.wechatAccessToken;
    delete req.session.wechatUserInfo;
    delete req.session.wechatAuthScope;

    res.json({
      success: true,
      message: '已清除授权信息'
    });
  } catch (error) {
    console.error('清除授权信息失败:', error);
    res.status(500).json({
      success: false,
      message: '清除授权信息失败'
    });
  }
});

/**
 * 检查是否在微信浏览器中
 */
router.get('/check-wechat', (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isWechat = /micromessenger/i.test(userAgent);

  res.json({
    success: true,
    isWechat,
    userAgent
  });
});

module.exports = router;