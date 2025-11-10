import axios from 'axios';

export async function checkWechatAuth() {
  try {
    const response = await axios.get('/api/wechat/auth/openid', {
      withCredentials: true
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

export async function getWechatOpenId(options = {}) {
  const {
    returnUrl = window.location.href,
    scope = 'base',
    forceAuth = false
  } = options;
  
  try {
    if (!forceAuth) {
      const authStatus = await checkWechatAuth();
      if (authStatus.authorized && authStatus.openid) {
        return authStatus.openid;
      }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlOpenId = urlParams.get('openid');
    const authSuccess = urlParams.get('wechat_auth');
    
    if (authSuccess === 'success' && urlOpenId) {
      cleanAuthParams();
      return urlOpenId;
    }
    
    redirectToWechatAuth(returnUrl, scope);
    return null;
  } catch (error) {
    console.error('获取OpenID失败:', error);
    return null;
  }
}

export function redirectToWechatAuth(returnUrl, scope = 'base') {
  const encodedReturnUrl = encodeURIComponent(returnUrl);
  const authUrl = `/api/wechat/auth/redirect?returnUrl=${encodedReturnUrl}&scope=${scope}`;
  window.location.href = authUrl;
}

function cleanAuthParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('wechat_auth');
  url.searchParams.delete('openid');
  window.history.replaceState({}, document.title, url.toString());
}

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

export function isWechatBrowser() {
  const ua = navigator.userAgent.toLowerCase();
  return /micromessenger/.test(ua);
}

export async function checkIsWechatBrowser() {
  try {
    const response = await axios.get('/api/wechat/check-wechat');
    return response.data.isWechat;
  } catch (error) {
    return isWechatBrowser();
  }
}

export async function ensureOpenIdForPayment(onSuccess, onError) {
  try {
    if (!isWechatBrowser()) {
      const error = new Error('请在微信中打开');
      if (onError) onError(error);
      return;
    }
    
    const openid = await getWechatOpenId({
      returnUrl: window.location.href,
      scope: 'base'
    });
    
    if (openid) {
      if (onSuccess) onSuccess(openid);
    }
  } catch (error) {
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

