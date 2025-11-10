const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * 微信企业付款到零钱
 */
class WechatTransfer {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID;
    this.mchId = process.env.WECHAT_MCH_ID;
    this.apiKey = process.env.WECHAT_API_KEY;
    this.apiUrl = 'https://api.mch.weixin.qq.com';
    
    // 证书路径（需要上传证书）
    this.certPath = process.env.WECHAT_CERT_PATH || path.join(__dirname, '../../cert/apiclient_cert.pem');
    this.keyPath = process.env.WECHAT_KEY_PATH || path.join(__dirname, '../../cert/apiclient_key.pem');
  }

  /**
   * 生成随机字符串
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
   */
  generateSign(params) {
    const filteredParams = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== '' && key !== 'sign')
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    const stringA = Object.keys(filteredParams)
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&');

    const stringSignTemp = `${stringA}&key=${this.apiKey}`;
    return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * 对象转XML
   */
  objectToXml(obj) {
    let xml = '<xml>';
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        xml += `<${key}><![CDATA[${obj[key]}]]></${key}>`;
      }
    }
    xml += '</xml>';
    return xml;
  }

  /**
   * XML转对象
   */
  xmlToObject(xml) {
    const result = {};
    const regex = /<([^>]+)><!\[CDATA\[(.*?)\]\]><\/\1>/g;
    let match;
    
    while ((match = regex.exec(xml)) !== null) {
      result[match[1]] = match[2];
    }
    
    // 处理没有CDATA的标签
    const simpleRegex = /<([^>]+)>([^<]*)<\/\1>/g;
    while ((match = simpleRegex.exec(xml)) !== null) {
      if (!result[match[1]]) {
        result[match[1]] = match[2];
      }
    }
    
    return result;
  }

  /**
   * 企业付款到零钱
   * @param {Object} params 付款参数
   * @returns {Promise<Object>} 付款结果
   */
  async transferToBalance(params) {
    const {
      partner_trade_no,  // 商户订单号
      openid,            // 用户openid
      amount,            // 金额（分）
      desc,              // 描述
      check_name = 'NO_CHECK',  // 是否校验真实姓名
      re_user_name = ''  // 真实姓名（check_name=FORCE_CHECK时必填）
    } = params;

    const transferParams = {
      mch_appid: this.appId,
      mchid: this.mchId,
      nonce_str: this.generateNonceStr(),
      partner_trade_no,
      openid,
      check_name,
      amount,
      desc,
      spbill_create_ip: params.spbill_create_ip || '127.0.0.1'
    };

    if (check_name === 'FORCE_CHECK' && re_user_name) {
      transferParams.re_user_name = re_user_name;
    }

    // 生成签名
    transferParams.sign = this.generateSign(transferParams);

    // 转换为XML
    const xml = this.objectToXml(transferParams);

    try {
      // 检查证书是否存在
      let httpsAgent = null;
      if (fs.existsSync(this.certPath) && fs.existsSync(this.keyPath)) {
        const https = require('https');
        httpsAgent = new https.Agent({
          cert: fs.readFileSync(this.certPath),
          key: fs.readFileSync(this.keyPath)
        });
      }

      const response = await axios.post(
        `${this.apiUrl}/mmpaymkttransfers/promotion/transfers`,
        xml,
        {
          headers: { 'Content-Type': 'application/xml' },
          httpsAgent
        }
      );

      const result = this.xmlToObject(response.data);
      return result;
    } catch (error) {
      console.error('企业付款失败:', error);
      return {
        return_code: 'FAIL',
        return_msg: error.message
      };
    }
  }

  /**
   * 查询企业付款
   */
  async queryTransfer(partnerTradeNo) {
    const params = {
      appid: this.appId,
      mch_id: this.mchId,
      partner_trade_no: partnerTradeNo,
      nonce_str: this.generateNonceStr()
    };

    params.sign = this.generateSign(params);
    const xml = this.objectToXml(params);

    try {
      const response = await axios.post(
        `${this.apiUrl}/mmpaymkttransfers/gettransferinfo`,
        xml,
        {
          headers: { 'Content-Type': 'application/xml' }
        }
      );

      const result = this.xmlToObject(response.data);
      return result;
    } catch (error) {
      console.error('查询企业付款失败:', error);
      return {
        return_code: 'FAIL',
        return_msg: error.message
      };
    }
  }
}

module.exports = WechatTransfer;

