const crypto = require('crypto');
const axios = require('axios');

class WechatPay {
  constructor(appId, mchId, apiKey, notifyUrl) {
    // 从环境变量或参数获取配置
    this.appId = appId || process.env.WECHAT_APP_ID;
    this.mchId = mchId || process.env.WECHAT_MCH_ID;
    this.apiKey = apiKey || process.env.WECHAT_API_KEY;
    this.notifyUrl = notifyUrl || process.env.WECHAT_NOTIFY_URL;
    this.apiUrl = 'https://api.mch.weixin.qq.com';
  }

  /**
   * 生成随机字符串
   * @param {number} length 长度
   * @returns {string} 随机字符串
   */
  generateNonceStr(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成签名
   * @param {Object} params 参数对象
   * @returns {string} 签名
   */
  generateSign(params) {
    // 过滤空值并排序
    const filteredParams = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== '' && key !== 'sign')
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    // 生成签名字符串
    const stringA = Object.keys(filteredParams)
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&');

    // 添加密钥并生成MD5签名
    const stringSignTemp = `${stringA}&key=${this.apiKey}`;
    return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
  }

  /**
   * 创建统一下单
   * @param {Object} order 订单信息
   * @returns {Promise<Object>} 下单结果
   */
  async createOrder(order) {
    const {
      out_trade_no,    // 商户订单号
      outTradeNo,      // 兼容旧版参数名
      total_fee,       // 总金额，单位为分
      totalFee,        // 兼容旧版参数名
      body,            // 商品描述
      trade_type = 'JSAPI', // 交易类型
      tradeType = 'JSAPI',  // 兼容旧版参数名
      openid,          // 用户openid
      spbill_create_ip = '127.0.0.1', // 终端IP
      spbillCreateIp = '127.0.0.1',   // 兼容旧版参数名
      notify_url,      // 回调URL
      notifyUrl        // 兼容旧版参数名
    } = order;

    // 使用统一的参数名（优先使用下划线格式）
    const orderNo = out_trade_no || outTradeNo;
    const orderFee = total_fee || totalFee;
    const orderType = trade_type || tradeType;
    const orderIp = spbill_create_ip || spbillCreateIp;
    const orderNotifyUrl = notify_url || notifyUrl || this.notifyUrl;

    const params = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr(),
      body,
      out_trade_no: orderNo,
      total_fee: orderFee,
      spbill_create_ip: orderIp,
      notify_url: orderNotifyUrl,
      trade_type: orderType,
      openid
    };

    // 添加签名
    params.sign = this.generateSign(params);

    // 转换为XML格式
    const xml = this.objectToXml(params);

    try {
      const response = await axios.post(`${this.apiUrl}/pay/unifiedorder`, xml, {
        headers: { 'Content-Type': 'application/xml' }
      });

      const result = this.xmlToObject(response.data);
      
      // 返回完整结果，包含所有字段
      return {
        ...result,
        return_code: result.return_code,
        result_code: result.result_code,
        prepay_id: result.prepay_id,
        err_code_des: result.err_code_des
      };
    } catch (error) {
      console.error('创建微信支付订单失败:', error);
      return {
        success: false,
        error: '创建订单失败'
      };
    }
  }

  /**
   * 查询订单
   * @param {string} outTradeNo 商户订单号
   * @returns {Promise<Object>} 查询结果
   */
  async queryOrder(outTradeNo) {
    const params = {
      appid: this.appId,
      mch_id: this.mchId,
      out_trade_no: outTradeNo,
      nonce_str: this.generateNonceStr()
    };

    params.sign = this.generateSign(params);
    const xml = this.objectToXml(params);

    try {
      const response = await axios.post(`${this.apiUrl}/pay/orderquery`, xml, {
        headers: { 'Content-Type': 'application/xml' }
      });

      const result = this.xmlToObject(response.data);
      
      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        return {
          success: true,
          tradeState: result.trade_state,
          tradeStateDesc: result.trade_state_desc,
          transactionId: result.transaction_id,
          totalFee: result.total_fee,
          timeEnd: result.time_end
        };
      } else {
        return {
          success: false,
          error: result.return_msg || result.err_code_des || '查询订单失败'
        };
      }
    } catch (error) {
      console.error('查询微信支付订单失败:', error);
      return {
        success: false,
        error: '查询订单失败'
      };
    }
  }

  /**
   * 生成JSAPI支付参数
   * @param {string} prepayId 预支付ID
   * @returns {Object} JSAPI支付参数
   */
  generateJSAPIParams(prepayId) {
    const payParams = {
      appId: this.appId,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: this.generateNonceStr(),
      package: `prepay_id=${prepayId}`,
      signType: 'MD5'
    };
    
    payParams.paySign = this.generateSign(payParams);
    
    return payParams;
  }

  /**
   * 验证支付回调
   * @param {Object} params 回调参数
   * @returns {boolean} 验证结果
   */
  verifyNotify(params) {
    const sign = params.sign;
    const calculatedSign = this.generateSign(params);
    return sign === calculatedSign;
  }

  /**
   * 解析支付回调数据
   * @param {string|Object} data 回调数据（XML字符串或已解析对象）
   * @returns {Object} 解析后的对象
   */
  parseNotify(data) {
    if (typeof data === 'string') {
      return this.xmlToObject(data);
    }
    return data;
  }

  /**
   * 对象转XML
   * @param {Object} obj 对象
   * @returns {string} XML字符串
   */
  objectToXml(obj) {
    let xml = '<xml>';
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        xml += `<${key}>${obj[key]}</${key}>`;
      }
    }
    
    xml += '</xml>';
    return xml;
  }

  /**
   * XML转对象
   * @param {string} xml XML字符串
   * @returns {Object} 对象
   */
  xmlToObject(xml) {
    const result = {};
    
    // 简单的XML解析，实际项目中建议使用专门的XML解析库
    const regex = /<([^>]+)>([^<]*)<\/\1>/g;
    let match;
    
    while ((match = regex.exec(xml)) !== null) {
      result[match[1]] = match[2];
    }
    
    return result;
  }
}

module.exports = WechatPay;