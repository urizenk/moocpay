// 微信JS-SDK配置和分享功能
import axios from 'axios';

// 微信JS-SDK配置
export const initWechatSDK = async () => {
  try {
    // 从后端获取微信JS-SDK配置
    const response = await axios.get('/api/wechat/config', {
      params: {
        url: window.location.href.split('#')[0] // 获取当前页面URL（不包含#及其后面部分）
      }
    });
    
    if (response.data.success) {
      const { appId, timestamp, nonceStr, signature } = response.data.data;
      
      // 配置微信JS-SDK
      wx.config({
        debug: false, // 开启调试模式
        appId, // 必填，公众号的唯一标识
        timestamp, // 必填，生成签名的时间戳
        nonceStr, // 必填，生成签名的随机串
        signature, // 必填，签名
        jsApiList: [
          'updateAppMessageShareData', // 分享到聊天
          'updateTimelineShareData', // 分享到朋友圈
          'onMenuShareAppMessage', // 兼容旧版API
          'onMenuShareTimeline' // 兼容旧版API
        ] // 必填，需要使用的JS接口列表
      });
      
      return true;
    } else {
      console.error('获取微信配置失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('初始化微信SDK失败:', error);
    return false;
  }
};

// 设置微信分享
export const setWechatShare = (title, desc, link, imgUrl) => {
  // 等待微信JS-SDK配置完成
  wx.ready(() => {
    // 分享到聊天
    wx.updateAppMessageShareData({
      title, // 分享标题
      desc, // 分享描述
      link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
      imgUrl, // 分享图标
      success: () => {
        console.log('分享到聊天成功');
      },
      cancel: () => {
        console.log('取消分享到聊天');
      }
    });
    
    // 分享到朋友圈
    wx.updateTimelineShareData({
      title, // 分享标题
      link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
      imgUrl, // 分享图标
      success: () => {
        console.log('分享到朋友圈成功');
      },
      cancel: () => {
        console.log('取消分享到朋友圈');
      }
    });
    
    // 兼容旧版API
    wx.onMenuShareAppMessage({
      title, // 分享标题
      desc, // 分享描述
      link, // 分享链接
      imgUrl, // 分享图标
      success: () => {
        console.log('分享到聊天成功（旧版API）');
      },
      cancel: () => {
        console.log('取消分享到聊天（旧版API）');
      }
    });
    
    wx.onMenuShareTimeline({
      title, // 分享标题
      link, // 分享链接
      imgUrl, // 分享图标
      success: () => {
        console.log('分享到朋友圈成功（旧版API）');
      },
      cancel: () => {
        console.log('取消分享到朋友圈（旧版API）');
      }
    });
  });
  
  wx.error((res) => {
    console.error('微信JS-SDK配置失败:', res);
  });
};

// 生成分享链接
export const generateShareLink = (transferId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/transfer/${transferId}`;
};