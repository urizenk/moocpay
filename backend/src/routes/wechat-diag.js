const express = require('express');
const router = express.Router();
const axios = require('axios');

// 微信SDK诊断接口
router.get('/diag', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  try {
    // 1. 检查环境变量
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;
    
    diagnostics.checks.push({
      name: '环境变量检查',
      status: appId && appSecret ? 'success' : 'error',
      details: {
        hasAppId: !!appId,
        hasAppSecret: !!appSecret,
        appIdValue: appId ? `${appId.substring(0, 6)}...` : 'missing',
        env: process.env.NODE_ENV || 'not set'
      }
    });

    if (!appId || !appSecret) {
      return res.json({
        success: false,
        message: '微信配置缺失',
        diagnostics
      });
    }

    // 2. 测试access_token获取
    try {
      const tokenResponse = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
        { timeout: 10000 }
      );
      
      if (tokenResponse.data.access_token) {
        diagnostics.checks.push({
          name: 'Access Token获取',
          status: 'success',
          details: {
            token: `${tokenResponse.data.access_token.substring(0, 20)}...`,
            expiresIn: tokenResponse.data.expires_in
          }
        });

        // 3. 测试jsapi_ticket获取
        try {
          const ticketResponse = await axios.get(
            `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${tokenResponse.data.access_token}&type=jsapi`,
            { timeout: 10000 }
          );
          
          if (ticketResponse.data.ticket) {
            diagnostics.checks.push({
              name: 'JSAPI Ticket获取',
              status: 'success',
              details: {
                ticket: `${ticketResponse.data.ticket.substring(0, 20)}...`,
                expiresIn: ticketResponse.data.expires_in
              }
            });
          } else {
            diagnostics.checks.push({
              name: 'JSAPI Ticket获取',
              status: 'error',
              details: ticketResponse.data
            });
          }
        } catch (ticketError) {
          diagnostics.checks.push({
            name: 'JSAPI Ticket获取',
            status: 'error',
            details: {
              error: ticketError.message,
              response: ticketError.response?.data
            }
          });
        }
      } else {
        diagnostics.checks.push({
          name: 'Access Token获取',
          status: 'error',
          details: tokenResponse.data
        });
      }
    } catch (tokenError) {
      diagnostics.checks.push({
        name: 'Access Token获取',
        status: 'error',
        details: {
          error: tokenError.message,
          response: tokenError.response?.data
        }
      });
    }

    // 4. 检查域名配置
    diagnostics.checks.push({
      name: 'JS接口安全域名检查',
      status: 'warning',
      details: {
        message: '请在微信公众平台后台检查',
        requiredDomain: '513761.com',
        checkUrl: '微信公众平台 -> 设置与开发 -> 公众号设置 -> 功能设置 -> JS接口安全域名'
      }
    });

    res.json({
      success: true,
      message: '诊断完成',
      diagnostics
    });

  } catch (error) {
    diagnostics.checks.push({
      name: '整体诊断',
      status: 'error',
      details: {
        error: error.message
      }
    });

    res.json({
      success: false,
      message: '诊断失败',
      diagnostics
    });
  }
});

module.exports = router;

