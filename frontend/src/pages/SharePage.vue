<template>
  <div class="share-container">
    <van-nav-bar
      title="分享收款"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="share-content">
      <!-- 转账预览 -->
      <div class="preview-section" v-if="transferData">
        <div class="preview-title">转账预览</div>
        <div class="preview-card">
          <div class="preview-header">
            <div class="avatar">
              <img :src="transferData.senderAvatar || defaultAvatar" alt="头像" />
            </div>
            <div class="sender-info">
              <div class="sender-name">{{ transferData.senderName }}</div>
              <div class="transfer-label">向你转账</div>
            </div>
          </div>
          <div class="preview-body">
            <div class="amount-text">{{ transferData.displayName }}</div>
            <div class="message-text" v-if="transferData.message">{{ transferData.message }}</div>
          </div>
        </div>
      </div>
      
      <!-- 分享链接显示 -->
      <div class="link-section">
        <div class="link-title">分享链接</div>
        <div class="link-box" @click="copyLink">
          <div class="link-text">{{ shareLink }}</div>
          <div class="copy-icon">📋</div>
        </div>
      </div>
      
      <!-- 分享说明 -->
      <div class="tips-section">
        <div class="tips-title">📢 分享说明</div>
        <div class="tips-content">
          <div class="tip-item">
            <span class="tip-number">1</span>
            <span class="tip-text">点击右上角"⋯"按钮</span>
          </div>
          <div class="tip-item">
            <span class="tip-number">2</span>
            <span class="tip-text">选择"发送给朋友"</span>
          </div>
          <div class="tip-item">
            <span class="tip-number">3</span>
            <span class="tip-text">好友在微信聊天中看到转账卡片</span>
          </div>
          <div class="tip-item">
            <span class="tip-number">4</span>
            <span class="tip-text">好友点击卡片即可打开收款页面</span>
          </div>
        </div>
      </div>
      
      <!-- 预览模拟页面按钮 -->
      <div class="action-section">
        <van-button 
          type="success" 
          block 
          round 
          icon="eye-o"
          @click="previewReceivePage"
          class="preview-button"
        >
          👁️ 预览收款页面
        </van-button>
      </div>
      
      <!-- 快捷分享按钮（仅微信环境） -->
      <div class="action-section" v-if="isWechat">
        <div class="wechat-notice">
          <div class="notice-icon">💡</div>
          <div class="notice-text">预览确认无误后，点击右上角"⋯"选择"发送给朋友"进行分享</div>
        </div>
      </div>
      
      <!-- 非微信环境提示 -->
      <div class="action-section" v-else>
        <van-button 
          type="primary" 
          block 
          round 
          @click="copyLink"
          class="copy-button"
        >
          复制链接
        </van-button>
        <div class="non-wechat-tip">预览确认后，请在微信中打开链接分享给好友</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNlNWU1ZTUiLz4KICA8Y2lyY2xlIGN4PSIyNSIgY3k9IjIwIiByPSI4IiBmaWxsPSIjOTk5Ii8+CiAgPHBhdGggZD0iTTEwIDQ1QzEwIDM1IDE2IDMwIDI1IDMwQzM0IDMwIDQwIDM1IDQwIDQ1IiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iNSIvPgo8L3N2Zz4=';

const transferData = ref(null);
const isWechat = ref(false);

// 生成分享链接 - 直接指向收款页面，避免中转
const shareLink = computed(() => {
  if (!transferData.value) return '';
  return `${window.location.origin}/receive/${transferData.value.id}`;
});

// 检查是否在微信环境
const checkWechatEnv = () => {
  isWechat.value = /micromessenger/i.test(navigator.userAgent);
};

// 初始化微信JS-SDK
const initWechatSDK = async () => {
  try {
    console.log('开始初始化微信SDK...');
    const url = window.location.href.split('#')[0];
    console.log('当前页面URL:', url);
    
    const response = await axios.get(`/api/wechat/config?url=${encodeURIComponent(url)}`);
    console.log('微信config响应:', response.data);
    
    if (response.data.success) {
      const { appId, timestamp, nonceStr, signature } = response.data.data;
      
      wx.config({
        debug: false,  // 关闭调试弹窗
        appId,
        timestamp,
        nonceStr,
        signature,
        jsApiList: [
          'updateAppMessageShareData',
          'updateTimelineShareData',
          'onMenuShareAppMessage',
          'hideMenuItems'
        ]
      });
      
      wx.ready(() => {
        console.log('✅ 微信JS-SDK配置成功');
        setupWechatShare();
      });
      
      wx.error((res) => {
        console.error('❌ 微信JS-SDK配置失败:', res);
      });
    } else {
      console.error('获取微信config失败:', response.data);
    }
  } catch (error) {
    console.error('初始化微信SDK失败:', error);
  }
};

// 设置微信分享内容
const setupWechatShare = () => {
  if (!transferData.value) {
    console.error('❌ setupWechatShare: transferData为空');
    return;
  }
  
  // 关键：微信分享的链接必须是收款页面，而不是分享页面！
  const receivePageUrl = `${window.location.origin}/receive/${transferData.value.id}`;
  
  console.log('========================================');
  console.log('🔧 开始配置微信分享');
  console.log('转账ID:', transferData.value.id);
  console.log('收款链接:', receivePageUrl);
  console.log('========================================');
  
  // 简洁的分享卡片文案（模仿微信转账）
  const shareData = {
    title: '微信转账模拟',
    desc: `${transferData.value.senderName}向你转账${transferData.value.displayName}`,
    link: receivePageUrl,
    imgUrl: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico'
  };
  
  console.log('分享数据:', JSON.stringify(shareData, null, 2));
  
  // 新版API
  if (typeof wx !== 'undefined' && wx.updateAppMessageShareData) {
    wx.updateAppMessageShareData({
      ...shareData,
      success: () => {
        console.log('✅ 新版API配置成功');
        console.log('分享链接已设置为:', receivePageUrl);
      },
      fail: (err) => {
        console.error('❌ 新版API配置失败:', err);
      }
    });
  }
  
  // 旧版API（兼容）
  if (typeof wx !== 'undefined' && wx.onMenuShareAppMessage) {
    wx.onMenuShareAppMessage({
      ...shareData,
      success: () => {
        console.log('✅ 旧版API分享成功');
      },
      cancel: () => {
        console.log('⚠️ 用户取消分享');
      },
      fail: (err) => {
        console.error('❌ 旧版API失败:', err);
      }
    });
  }
  
  // 隐藏分享到朋友圈
  if (typeof wx !== 'undefined' && wx.hideMenuItems) {
    wx.hideMenuItems({
      menuList: ['menuItem:share:timeline'],
      success: () => {
        console.log('✅ 已隐藏朋友圈分享');
      }
    });
  }
  
  console.log('========================================');
  console.log('✅ 微信分享配置完成');
  console.log('========================================');
};

// 获取转账信息
const fetchTransferInfo = async () => {
  try {
    const { id } = route.params;
    const response = await axios.get(`/api/transfers/${id}`);
    
    const isSuccess = response.data?.success ?? true;
    const data = response.data?.data ?? response.data;
    
    if (isSuccess && data) {
      transferData.value = data;
      
      // 如果在微信环境，初始化分享
      if (isWechat.value) {
        await initWechatSDK();
      }
    } else {
      showToast('转账信息不存在');
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    }
  } catch (error) {
    console.error('获取转账信息失败:', error);
    showToast('获取转账信息失败');
  }
};

// 复制链接
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    showToast({
      message: '链接已复制',
      icon: 'success'
    });
  } catch (error) {
    console.error('复制失败:', error);
    showToast('复制失败，请手动复制');
  }
};

// 返回
const goBack = () => {
  router.push('/admin');
};

// 预览收款页面
const previewReceivePage = () => {
  if (transferData.value) {
    // 跳转到收款页面预览
    router.push(`/receive/${transferData.value.id}`);
  } else {
    showToast('转账信息不存在');
  }
};

onMounted(() => {
  checkWechatEnv();
  fetchTransferInfo();
});
</script>

<style scoped>
.share-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-bar {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.share-content {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
}

/* 预览区域 */
.preview-section {
  margin-bottom: 20px;
}

.preview-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 12px;
}

.preview-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.preview-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #e5e5e5;
}

.sender-info {
  flex: 1;
}

.sender-name {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.transfer-label {
  font-size: 14px;
  color: #969799;
}

.preview-body {
  padding-left: 56px;
}

.amount-text {
  font-size: 18px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 6px;
}

.message-text {
  font-size: 14px;
  color: #646566;
  line-height: 1.5;
}

/* 链接区域 */
.link-section {
  margin-bottom: 20px;
}

.link-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 12px;
}

.link-box {
  background-color: #fff;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.link-box:active {
  transform: scale(0.98);
  background-color: #f7f8fa;
}

.link-text {
  flex: 1;
  font-size: 13px;
  color: #576b95;
  word-break: break-all;
  line-height: 1.5;
}

.copy-icon {
  font-size: 20px;
  flex-shrink: 0;
}

/* 提示区域 */
.tips-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.tips-title {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 16px;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.tip-number {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #ff9e5f 0%, #ff7243 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.tip-text {
  flex: 1;
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
}

/* 操作区域 */
.action-section {
  margin-bottom: 20px;
}

.wechat-notice {
  background: linear-gradient(135deg, #fffbea 0%, #fff8dc 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #ffe58f;
}

.notice-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notice-text {
  flex: 1;
  font-size: 14px;
  color: #8c6d1f;
  line-height: 1.6;
}

.copy-button {
  background: linear-gradient(135deg, #ff9e5f 0%, #ff7243 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 114, 67, 0.25);
  margin-bottom: 12px;
}

.non-wechat-tip {
  text-align: center;
  font-size: 13px;
  color: #969799;
  line-height: 1.5;
}

/* 移动端适配 */
@media (max-width: 375px) {
  .share-content {
    padding: 16px 12px;
  }
  
  .amount-text {
    font-size: 17px;
  }
  
  .link-text {
    font-size: 12px;
  }
}

@media (max-width: 320px) {
  .preview-card,
  .tips-section {
    padding: 12px;
  }
  
  .tip-text {
    font-size: 13px;
  }
}

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .share-content {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}
</style>
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.tip-text {
  flex: 1;
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
}

/* 操作区域 */
.action-section {
  margin-bottom: 20px;
}

.wechat-notice {
  background: linear-gradient(135deg, #fffbea 0%, #fff8dc 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #ffe58f;
}

.notice-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notice-text {
  flex: 1;
  font-size: 14px;
  color: #8c6d1f;
  line-height: 1.6;
}

.copy-button {
  background: linear-gradient(135deg, #ff9e5f 0%, #ff7243 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 114, 67, 0.25);
  margin-bottom: 12px;
}

.non-wechat-tip {
  text-align: center;
  font-size: 13px;
  color: #969799;
  line-height: 1.5;
}

/* 移动端适配 */
@media (max-width: 375px) {
  .share-content {
    padding: 16px 12px;
  }
  
  .amount-text {
    font-size: 17px;
  }
  
  .link-text {
    font-size: 12px;
  }
}

@media (max-width: 320px) {
  .preview-card,
  .tips-section {
    padding: 12px;
  }
  
  .tip-text {
    font-size: 13px;
  }
}


