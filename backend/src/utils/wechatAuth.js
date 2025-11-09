const axios = require('axios');

/**
 * 微信网页授权工具类
 * 用于获取用户的 OpenID
 */
class WechatAuth {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID || 'your_app_id';
    this.appSecret = process.env.WECHAT_APP_SECRET || 'your_app_secret';
  }

  /**
   * 生成微信授权URL
   * @param {string} redirectUri 授权后重定向的URI
   * @param {string} state 自定义状态参数，用于防止CSRF攻击
   * @param {string} scope 授权作用域，snsapi_base（静默授权）或 snsapi_userinfo（需用户同意）
   * @returns {string} 授权URL
   */
  generateAuthUrl(redirectUri, state = 'STATE', scope = 'snsapi_base') {
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${this.appId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
  }

  /**
   * 通过 code 换取网页授权 access_token 和 openid
   * @param {string} code 授权码
   * @returns {Promise<Object>} 包含 access_token, openid 等信息
   */
  async getAccessToken(code) {
    try {
      const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appId}&secret=${this.appSecret}&code=${code}&grant_type=authorization_code`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode) {
        throw new Error(`获取access_token失败: ${response.data.errmsg}`);
      }
      
      return {
        success: true,
        data: {
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in,
          refreshToken: response.data.refresh_token,
          openid: response.data.openid,
          scope: response.data.scope
        }
      };
    } catch (error) {
      console.error('获取access_token失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 刷新 access_token
   * @param {string} refreshToken 刷新令牌
   * @returns {Promise<Object>} 新的 access_token 信息
   */
  async refreshAccessToken(refreshToken) {
    try {
      const url = `https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=${this.appId}&grant_type=refresh_token&refresh_token=${refreshToken}`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode) {
        throw new Error(`刷新access_token失败: ${response.data.errmsg}`);
      }
      
      return {
        success: true,
        data: {
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in,
          refreshToken: response.data.refresh_token,
          openid: response.data.openid,
          scope: response.data.scope
        }
      };
    } catch (error) {
      console.error('刷新access_token失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户信息（需要 snsapi_userinfo 授权作用域）
   * @param {string} accessToken 网页授权接口调用凭证
   * @param {string} openid 用户的唯一标识
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(accessToken, openid) {
    try {
      const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`;
      
      const response = await axios.get(url);
      
      if (response.data.errcode) {
        throw new Error(`获取用户信息失败: ${response.data.errmsg}`);
      }
      
      return {
        success: true,
        data: {
          openid: response.data.openid,
          nickname: response.data.nickname,
          sex: response.data.sex,
          province: response.data.province,
          city: response.data.city,
          country: response.data.country,
          headimgurl: response.data.headimgurl,
          privilege: response.data.privilege,
          unionid: response.data.unionid
        }
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证 access_token 是否有效
   * @param {string} accessToken 网页授权接口调用凭证
   * @param {string} openid 用户的唯一标识
   * @returns {Promise<boolean>} 是否有效
   */
  async verifyAccessToken(accessToken, openid) {
    try {
      const url = `https://api.weixin.qq.com/sns/auth?access_token=${accessToken}&openid=${openid}`;
      
      const response = await axios.get(url);
      
      return response.data.errcode === 0;
    } catch (error) {
      console.error('验证access_token失败:', error);
      return false;
    }
  }
}

module.exports = WechatAuth;

