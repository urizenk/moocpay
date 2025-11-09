# 微信支付配置指南

## 重要说明：微信支付与公众号的关系

微信支付必须在微信公众号内的网页中使用，不能在独立的网页上直接调用。用户需要通过微信公众号菜单或链接进入您的网页，才能正常使用微信支付功能。

### 使用流程
1. 用户关注您的微信公众号
2. 通过公众号菜单或链接进入您的网页
3. 在您的网页中进行支付操作
4. 调用微信支付完成交易

## 1. 获取微信支付凭证

### 1.1 注册微信公众号（服务号）

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 点击"立即注册"，选择"服务号"
3. 按照指引完成注册流程
4. 完成微信认证（需要企业资质）
5. 记录您的 **AppID**

**公众号用途描述建议**：
```
本公众号为企业提供以下服务：

1. 会员管理系统
   - 会员注册与信息管理
   - 会员等级与权益管理
   - 积分系统与奖励机制

2. 交易服务功能
   - 在线支付与结算服务
   - 订单管理与查询
   - 交易记录与统计分析

3. 客户服务支持
   - 在线客服与咨询
   - 问题反馈与处理
   - 售后服务与支持

4. 企业管理工具
   - 营销活动管理
   - 客户关系维护
   - 数据报表与分析

本平台旨在帮助企业提升客户服务质量，优化交易流程，提高运营效率。
```

### 1.2 申请微信支付

1. 登录微信公众平台
2. 在左侧菜单选择"微信支付"
3. 点击"开通"按钮
4. 提交企业资料审核：
   - 营业执照
   - 组织机构代码证
   - 法人身份证
   - 对公账户信息
   - 可能需要行业资质证明
5. 审核通过后，记录您的 **商户号(MchID)**

### 1.3 配置API密钥

1. 登录 [微信商户平台](https://pay.weixin.qq.com/)
2. 在左侧菜单选择"账户中心" > "API安全"
3. 设置API密钥（32位字符）
4. 下载证书并妥善保管
5. 记录您的 **API密钥**

## 2. 配置支付参数

### 2.1 设置支付授权目录

1. 登录微信商户平台
2. 选择"产品中心" > "开发配置"
3. 在"支付授权目录"中添加：
   ```
   https://yourdomain.com/
   ```

### 2.2 设置网页授权域名

1. 登录微信公众平台
2. 选择"设置与开发" > "公众号设置" > "功能设置"
3. 在"网页授权域名"中添加您的域名：
   ```
   yourdomain.com
   ```

### 2.3 设置JS接口安全域名

1. 登录微信公众平台
2. 选择"设置与开发" > "公众号设置" > "功能设置"
3. 在"JS接口安全域名"中添加您的域名：
   ```
   yourdomain.com
   ```
   *注意：此域名用于调用微信JS-SDK，包括微信支付*

### 2.4 配置公众号菜单

为了方便用户进入您的网页，需要在公众号中设置菜单：

1. 登录微信公众平台
2. 选择"内容与互动" > "自定义菜单"
3. 创建菜单项，类型选择"跳转网页"
4. 网址填写您的网页地址：
   ```
   https://yourdomain.com
   ```

### 2.5 配置支付回调URL

1. 登录微信商户平台
2. 选择"产品中心" > "开发配置"
3. 设置支付回调URL：
   ```
   https://yourdomain.com/api/payment/callback
   ```

## 3. 网页授权与支付集成

### 3.1 网页授权流程

微信支付需要在微信公众号内通过网页授权获取用户信息，以下是实现流程：

#### 3.1.1 前端获取授权

在您的网页中添加以下代码，用于获取微信授权：

```javascript
// 检测是否在微信环境中打开
function isWechatBrowser() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}

// 获取微信授权
function getWechatAuth() {
  if (!isWechatBrowser()) {
    alert('请在微信中打开此页面');
    return;
  }
  
  const appId = 'YOUR_APPID'; // 替换为您的公众号AppID
  const redirectUri = encodeURIComponent('https://yourdomain.com/auth/callback');
  const scope = 'snsapi_userinfo'; // 获取用户详细信息
  const state = 'STATE'; // 自定义参数，可用于防CSRF攻击
  
  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
  
  window.location.href = authUrl;
}

// 页面加载时检查是否需要授权
window.onload = function() {
  // 检查URL中是否有code参数，如果没有则需要获取授权
  if (!window.location.search.includes('code=')) {
    getWechatAuth();
  }
};
```

#### 3.1.2 后端处理授权回调

在您的后端添加处理微信授权回调的接口：

```javascript
// 在 backend/src/routes/auth.js 中添加
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 微信授权回调
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // 1. 使用code获取access_token
    const tokenResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: process.env.WECHAT_APP_ID,
        secret: process.env.WECHAT_APP_SECRET, // 需要在.env中添加
        code: code,
        grant_type: 'authorization_code'
      }
    });
    
    const { access_token, openid } = tokenResponse.data;
    
    // 2. 使用access_token获取用户信息
    const userResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: {
        access_token: access_token,
        openid: openid,
        lang: 'zh_CN'
      }
    });
    
    const userInfo = userResponse.data;
    
    // 3. 将用户信息保存到session或数据库
    req.session.wechatUser = userInfo;
    
    // 4. 重定向到主页面
    res.redirect('/');
  } catch (error) {
    console.error('微信授权失败:', error);
    res.status(500).send('授权失败');
  }
});

module.exports = router;
```

### 3.2 微信支付集成

#### 3.2.1 前端调用微信支付

在您的支付页面中添加以下代码：

```javascript
// 调用微信支付
function callWechatPay(paymentParams) {
  if (typeof WeixinJSBridge === "undefined") {
    alert("请在微信中打开");
    return;
  }
  
  WeixinJSBridge.invoke('getBrandWCPayRequest', {
    "appId": paymentParams.appId,
    "timeStamp": paymentParams.timeStamp,
    "nonceStr": paymentParams.nonceStr,
    "package": paymentParams.package,
    "signType": paymentParams.signType,
    "paySign": paymentParams.paySign
  }, function(res) {
    if (res.err_msg === "get_brand_wcpay_request:ok") {
      // 支付成功
      alert("支付成功");
      window.location.href = "/payment/success";
    } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
      // 用户取消支付
      alert("您已取消支付");
    } else {
      // 支付失败
      alert("支付失败，请重试");
    }
  });
}

// 发起支付请求
async function initiatePayment(orderInfo) {
  try {
    // 向后端请求支付参数
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderInfo)
    });
    
    const paymentParams = await response.json();
    
    if (paymentParams.success) {
      // 调用微信支付
      callWechatPay(paymentParams.data);
    } else {
      alert(paymentParams.message || "获取支付参数失败");
    }
  } catch (error) {
    console.error('支付请求失败:', error);
    alert("支付请求失败，请重试");
  }
}
```

#### 3.2.2 后端生成支付参数

在您的后端添加生成支付参数的接口：

```javascript
// 在 backend/src/routes/payment.js 中添加
const express = require('express');
const router = express.Router();
const wechatPay = require('../utils/wechatPay'); // 假设您已创建微信支付工具类

// 创建支付订单
router.post('/create', async (req, res) => {
  try {
    const { amount, description, orderId } = req.body;
    
    // 检查用户是否已授权
    if (!req.session.wechatUser) {
      return res.json({
        success: false,
        message: '用户未授权'
      });
    }
    
    // 生成支付参数
    const paymentParams = await wechatPay.createOrder({
      openid: req.session.wechatUser.openid,
      out_trade_no: orderId,
      total_fee: amount,
      body: description,
      notify_url: process.env.WECHAT_NOTIFY_URL
    });
    
    res.json({
      success: true,
      data: paymentParams
    });
  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.json({
      success: false,
      message: '创建支付订单失败'
    });
  }
});

module.exports = router;
```

## 4. 更新项目配置

### 4.1 修改.env文件

将以下配置填入 `backend/.env` 文件：

```bash
# 微信公众号配置
WECHAT_APP_ID=你的真实公众号AppID
WECHAT_APP_SECRET=你的真实公众号AppSecret

# 微信支付配置
WECHAT_MCH_ID=你的真实商户号
WECHAT_API_KEY=你的真实API密钥
WECHAT_NOTIFY_URL=https://yourdomain.com/api/payment/callback
```

**注意**：
- `WECHAT_APP_SECRET` 是公众号的AppSecret，可在微信公众平台获取
- `WECHAT_API_KEY` 是微信支付商户平台的API密钥
- 确保回调URL使用HTTPS协议

### 4.2 添加依赖包

在backend目录下安装必要的依赖：

```bash
npm install axios
```

### 4.3 更新路由配置

在 `backend/src/server.js` 中添加授权和支付路由：

```javascript
// 添加授权路由
app.use('/auth', require('./routes/auth'));

// 添加支付路由
app.use('/api/payment', require('./routes/payment'));
```

### 4.4 配置会话中间件

在 `backend/src/server.js` 中添加会话中间件：

```javascript
const session = require('express-session');

// 添加会话中间件
app.use(session({
  secret: 'your-secret-key', // 替换为您的密钥
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // 生产环境应设置为true
}));
```

### 4.5 测试环境配置（可选）

如果您想先在沙箱环境测试：

1. 登录微信商户平台
2. 选择"产品中心" > "沙箱"
3. 获取沙箱AppID和商户号
4. 在.env文件中添加：
   ```bash
   # 沙箱环境配置
   WECHAT_SANDBOX=true
   ```

## 5. 部署要求

### 5.1 域名和服务器

1. **HTTPS域名**：微信支付要求使用HTTPS协议
2. **ICP备案**：域名需要完成ICP备案
3. **服务器白名单**：将服务器IP添加到商户平台白名单

### 5.2 服务器环境

1. Node.js 14.0 或更高版本
2. 支持HTTPS的Web服务器（Nginx/Apache）
3. 建议使用云服务器（阿里云、腾讯云等）

## 6. 完整流程测试

### 6.1 本地测试

由于微信支付需要在真实域名下测试，本地测试可以使用内网穿透工具：

1. 使用ngrok或类似工具将本地服务映射到公网
2. 在微信商户平台添加测试域名
3. 在微信公众平台添加测试授权域名

### 6.2 生产环境测试

1. 确保域名已备案并配置HTTPS
2. 在微信商户平台添加正式支付授权目录
3. 在微信公众平台添加正式网页授权域名和JS接口安全域名
4. 使用真实微信账号进行测试

## 7. 常见问题

### 7.1 支付失败

1. 检查AppID和商户号是否正确
2. 确认API密钥是否正确
3. 检查支付授权目录是否包含当前页面
4. 确认服务器IP是否在白名单中
5. 确认是否在微信环境中打开网页

### 7.2 网页授权失败

1. 检查网页授权域名是否正确配置
2. 确认AppID和AppSecret是否正确
3. 检查授权回调URL是否可访问
4. 确认是否在微信环境中打开网页

### 7.3 回调通知接收不到

1. 检查回调URL是否可访问
2. 确认回调URL是否使用HTTPS
3. 检查服务器防火墙设置
4. 查看微信支付日志确认是否发送了回调

### 7.4 签名错误

1. 检查API密钥是否正确
2. 确认签名算法是否正确（MD5）
3. 检查参数格式是否正确
4. 确认参数顺序是否正确

## 8. 上线准备

1. 确保所有测试通过
2. 切换为正式环境配置
3. 配置生产环境服务器
4. 进行压力测试
5. 准备监控和日志系统

## 9. 安全注意事项

1. 妥善保管API密钥和证书
2. 不要在前端代码中暴露敏感信息
3. 实施适当的访问控制
4. 定期更新密钥和证书
5. 监控异常支付行为
6. 验证支付回调的合法性
7. 防止重复支付和虚假支付