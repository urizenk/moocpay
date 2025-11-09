import axios from 'axios';

/**
 * 微信授权工具类
 * 用于前端处理微信授权和获取 OpenID
 */

/**
 * 检查用户是否已授权（是否已获取 OpenID）
 * @returns {Promise<Object>} { authorized: boolean, openid: string|null, userInfo: Object|null }
 */
export async function checkWechatAuth() {
  try {
    const response = await axios.get('/api/wechat/auth/openid', {
      withCredentials: true // 携带 cookie
    });
    
    if (response.data.success && response.data.authorized) {
      return {
        authorized: true,
        openid: response.data.data.openid,
        userInfo: response.data.data.userInfo
      };
    } else {
      return {
        authorized: false,
        openid: null,
        userInfo: null
      };
    }
  } catch (error) {
    console.error('检查授权状态失败:', error);
    return {
      authorized: false,
      openid: null,
      userInfo: null
    };
  }
}

/**
 * 获取用户 OpenID，如果未授权则跳转到授权页面
 * @param {Object} options 配置选项
 * @param {string} options.returnUrl 授权成功后返回的URL，默认为当前页面
 * @param {string} options.scope 授权作用域：'base'（静默授权）或 'userinfo'（需用户同意）
 * @param {boolean} options.forceAuth 是否强制重新授权
 * @returns {Promise<string|null>} OpenID，如果未授权则返回null
 */
export async function getWechatOpenId(options = {}) {
  const {
    returnUrl = window.location.href,
    scope = 'base', // 默认静默授权
    forceAuth = false
  } = options;
  
  try {
    // 如果不强制授权，先检查是否已授权
    if (!forceAuth) {
      const authStatus = await checkWechatAuth();
      if (authStatus.authorized && authStatus.openid) {
        console.log('用户已授权，OpenID:', authStatus.openid);
        return authStatus.openid;
      }
    }
    
    // 检查URL参数中是否有openid（从授权回调返回）
    const urlParams = new URLSearchParams(window.location.search);
    const urlOpenId = urlParams.get('openid');
    const authSuccess = urlParams.get('wechat_auth');
    
    if (authSuccess === 'success' && urlOpenId) {
      console.log('从URL参数获取到OpenID:', urlOpenId);
      // 清除URL中的参数
      cleanAuthParams();
      return urlOpenId;
    }
    
    // 未授权，需要跳转到授权页面
    console.log('用户未授权，跳转到微信授权页面...');
    redirectToWechatAuth(returnUrl, scope);
    
    return null; // 即将跳转，返回null
  } catch (error) {
    console.error('获取OpenID失败:', error);
    return null;
  }
}

/**
 * 跳转到微信授权页面
 * @param {string} returnUrl 授权成功后返回的URL
 * @param {string} scope 授权作用域：'base' 或 'userinfo'
 */
export function redirectToWechatAuth(returnUrl, scope = 'base') {
  const encodedReturnUrl = encodeURIComponent(returnUrl);
  const authUrl = `/api/wechat/auth/redirect?returnUrl=${encodedReturnUrl}&scope=${scope}`;
  
  // 跳转到后端授权接口
  window.location.href = authUrl;
}

/**
 * 清除URL中的授权参数
 */
function cleanAuthParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('wechat_auth');
  url.searchParams.delete('openid');
  
  // 使用 replaceState 更新URL，不会刷新页面
  window.history.replaceState({}, document.title, url.toString());
}

/**
 * 退出登录，清除授权信息
 * @returns {Promise<boolean>} 是否成功
 */
export async function logout() {
  try {
    const response = await axios.post('/api/wechat/auth/logout', {}, {
      withCredentials: true
    });
    
    return response.data.success;
  } catch (error) {
    console.error('退出登录失败:', error);
    return false;
  }
}

/**
 * 检查是否在微信浏览器中
 * @returns {boolean}
 */
export function isWechatBrowser() {
  const ua = navigator.userAgent.toLowerCase();
  return /micromessenger/.test(ua);
}

/**
 * 检查是否在微信浏览器中（异步，通过后端验证）
 * @returns {Promise<boolean>}
 */
export async function checkIsWechatBrowser() {
  try {
    const response = await axios.get('/api/wechat/check-wechat');
    return response.data.isWechat;
  } catch (error) {
    console.error('检查微信浏览器失败:', error);
    // 降级方案：使用客户端检测
    return isWechatBrowser();
  }
}

/**
 * 在支付前确保已获取 OpenID
 * 这是一个便捷方法，用于支付页面
 * @param {Function} onSuccess OpenID获取成功的回调，参数为 openid
 * @param {Function} onError 获取失败的回调，参数为 error
 */
export async function ensureOpenIdForPayment(onSuccess, onError) {
  try {
    // 检查是否在微信浏览器中
    if (!isWechatBrowser()) {
      const error = new Error('请在微信中打开');
      if (onError) onError(error);
      return;
    }
    
    // 获取 OpenID
    const openid = await getWechatOpenId({
      returnUrl: window.location.href,
      scope: 'base' // 支付只需要静默授权
    });
    
    if (openid) {
      if (onSuccess) onSuccess(openid);
    } else {
      // 如果返回 null，说明正在跳转到授权页面
      console.log('正在跳转到授权页面...');
    }
  } catch (error) {
    console.error('确保OpenID失败:', error);
    if (onError) onError(error);
  }
}

export default {
  checkWechatAuth,
  getWechatOpenId,
  redirectToWechatAuth,
  logout,
  isWechatBrowser,
  checkIsWechatBrowser,
  ensureOpenIdForPayment
};

