<template>
  <div class="wechat-receive-page">
    <!-- 顶部返回按钮 -->
    <div class="header-bar">
      <div class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 蓝色时钟图标 -->
      <div class="icon-wrapper">
        <div class="clock-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="#1AAD19" stroke-width="3"/>
            <line x1="32" y1="32" x2="32" y2="16" stroke="#1AAD19" stroke-width="3" stroke-linecap="round"/>
            <line x1="32" y1="32" x2="42" y2="32" stroke="#1AAD19" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      
      <!-- 状态文字 -->
      <div class="status-text">待你收款</div>
      
      <!-- 金额显示 -->
      <div class="amount-wrapper">
        <span class="currency-symbol">¥</span>
        <span class="amount-number">{{ displayAmount }}</span>
      </div>
      
      <!-- 转账时间 -->
      <div class="time-row">
        <span class="time-label">转账时间</span>
        <span class="time-value">{{ formatDateTime(transferData.createdAt) }}</span>
      </div>
    </div>
    
    <!-- 底部区域 -->
    <div class="bottom-section">
      <!-- 收款按钮 -->
      <button 
        class="receive-btn"
        :class="{ 'disabled': transferData.accountStatus === 'frozen' || transferData.status !== 'pending' }"
        @click="handleReceive"
        :disabled="transferData.accountStatus === 'frozen' || transferData.status !== 'pending'"
      >
        {{ getButtonStatus() }}
      </button>
      
      <!-- 提示文字 -->
      <div class="tips-text">
        1天内未确认，将退还给对方。<span class="link-text">退还</span>
      </div>
    </div>
    
    <!-- 冻结提示弹窗 -->
    <div class="freeze-dialog" v-if="showFreezeDialog" @click="showFreezeDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">提示</div>
        <div class="dialog-message">该转账已被冻结，暂时无法收款</div>
        <div class="dialog-btn" @click="showFreezeDialog = false">确定</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import axios from 'axios';
import { getWechatOpenId, isWechatBrowser } from '@/utils/wechatAuth';
import { initWechatSDK, setWechatShare } from '@/utils/wechat';

const router = useRouter();
const route = useRoute();

const showFreezeDialog = ref(false);

const transferData = ref({
  id: '',
  displayName: '100.00元',
  actualAmount: 0.1,
  senderName: '张三',
  senderAvatar: '',
  message: '',
  status: 'pending',
  accountStatus: 'available',
  theme: 'classic',
  createdAt: new Date().toISOString(),
  updatedAt: null
});

// 计算显示金额
const displayAmount = computed(() => {
  return transferData.value.displayName.replace('元', '').replace('，', '');
});

// 获取转账信息
const fetchTransferInfo = async () => {
  try {
    const { id } = route.params;
    const response = await axios.get(`/api/transfers/${id}`);
    
    const isSuccess = response.data?.success ?? true;
    const data = response.data?.data ?? response.data;
    
    if (isSuccess && data) {
      transferData.value = {
        ...data,
        theme: data.theme || 'classic',
        createdAt: data.createdAt || data.createTime || new Date().toISOString(),
        updatedAt: data.updatedAt || data.receiveTime || null
      };
      
      // 设置页面标题和meta，用于微信分享（不需要SDK权限）
      const shareTitle = `${data.senderName}给你发了一个转账`;
      const shareDesc = `向你转账${data.displayName}`;
      const shareImage = 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico';
      
      document.title = shareTitle;
      
      // 设置普通meta标签
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = shareDesc;
      
      // 设置Open Graph标签（微信优先读取这些）
      const setOgMeta = (property, content) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };
      
      setOgMeta('og:title', shareTitle);
      setOgMeta('og:description', shareDesc);
      setOgMeta('og:image', shareImage);
      
      // 设置itemprop标签
      const setItemProp = (name, content) => {
        let meta = document.querySelector(`meta[itemprop="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('itemprop', name);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };
      
      setItemProp('name', shareTitle);
      setItemProp('description', shareDesc);
      setItemProp('image', shareImage);
      
      console.log('✅ 已设置微信分享meta标签:');
      console.log('标题:', shareTitle);
      console.log('描述:', shareDesc);
      console.log('图片:', shareImage);
      
      // 如果在微信中，使用JSSDK配置分享（认证公众号）- 转账样式
      if (isWechatBrowser()) {
        try {
          await initWechatSDK();
          const shareLink = `${window.location.origin}/receive/${data.id}?t=${Date.now()}`;
          // 修改为转账样式：标题显示金额
          const shareTitle2 = `￥${data.displayName}`;
          const shareDesc2 = `${data.senderName}向你转账，点击领取`;
          setWechatShare(shareTitle2, shareDesc2, shareLink, shareImage);
          console.log('✅ 微信JSSDK分享已配置（转账样式）');
        } catch (error) {
          console.error('配置微信JSSDK失败:', error);
        }
      }
    } else {
      showToast('转账信息不存在');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  } catch (error) {
    console.error('获取转账信息失败:', error);
    showToast('获取转账信息失败');
    // 不要跳转到主页，留在当前页显示错误
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }
};

// 获取按钮状态文字
const getButtonStatus = () => {
  if (transferData.value.status === 'received') {
    return '已被领取';
  }
  if (transferData.value.status === 'expired') {
    return '已过期';
  }
  if (transferData.value.accountStatus === 'frozen') {
    return '已冻结';
  }
  return '收款';
};

// 处理收款 - 调用JSAPI支付
const handleReceive = async () => {
  // 检查冻结状态
  if (transferData.value.accountStatus === 'frozen') {
    showFreezeDialog.value = true;
    return;
  }
  
  // 检查是否已被领取
  if (transferData.value.status === 'received') {
    showToast('该转账已被领取');
    return;
  }
  
  // 检查是否已过期
  if (transferData.value.status === 'expired') {
    showToast('该转账已过期');
    return;
  }
  
  // 只有pending状态才能收款
  if (transferData.value.status !== 'pending') {
    showToast('该转账已处理');
    return;
  }
  
  const isWechat = isWechatBrowser();
  
  showLoadingToast({
    message: '正在处理...',
    forbidClick: true,
    duration: 0
  });
  
  try {
    // 获取 OpenID
    let userOpenId = null;
    if (isWechat && process.env.NODE_ENV === 'production') {
      userOpenId = await getWechatOpenId({
        returnUrl: window.location.href,
        scope: 'base'
      });
      
      if (!userOpenId) {
        return;
      }
    }
    
    // 调用企业付款接口
    const response = await axios.post('/api/payment/create', {
      transferId: transferData.value.id,
      amount: transferData.value.actualAmount,
      description: `向你转账`,
      openid: userOpenId
    }, {
      withCredentials: true
    });
    
    const result = response.data;
    closeToast();
    
    if (result.success && result.data.transferSuccess) {
      // 企业付款成功
      showToast({
        message: '收款成功',
        duration: 2000
      });
      
      // 更新本地状态
      transferData.value.status = 'received';
      
      // 停止自动刷新
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // 微信会自动显示转账通知和成功页面，我们不需要跳转
    } else {
      showToast(result.message || '收款失败');
    }
  } catch (error) {
    closeToast();
    console.error('收款失败:', error);
    showToast('收款失败，请重试');
  }
};

// 返回
const goBack = () => {
  router.go(-1);
};

// 格式化日期时间（微信官方格式）
const formatDateTime = (datetime) => {
  if (!datetime) return '';
  
  const date = new Date(datetime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // 微信格式：2025年11月10日 15:08:04
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
};

let refreshInterval;

onMounted(() => {
  fetchTransferInfo();
  
  refreshInterval = setInterval(() => {
    fetchTransferInfo();
  }, 3000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.wechat-receive-page {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 顶部返回按钮 */
.header-bar {
  padding: 12px 16px;
  display: flex;
  align-items: center;
}

.back-btn {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.back-btn:active {
  opacity: 0.6;
}

/* 主内容区域 */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px 40px;
}

.icon-wrapper {
  margin-bottom: 20px;
}

.clock-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-text {
  font-size: 17px;
  color: #000000;
  margin-bottom: 24px;
  font-weight: 400;
}

.amount-wrapper {
  display: flex;
  align-items: baseline;
  margin-bottom: 40px;
}

.currency-symbol {
  font-size: 28px;
  color: #000000;
  font-weight: 400;
  margin-right: 2px;
}

.amount-number {
  font-size: 52px;
  color: #000000;
  font-weight: 500;
  letter-spacing: -1px;
}

.time-row {
  font-size: 14px;
  color: #888888;
  display: flex;
  align-items: center;
  gap: 40px;
}

.time-label {
  color: #888888;
}

.time-value {
  color: #000000;
}

/* 底部区域 */
.bottom-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  background-color: #ffffff;
}

.receive-btn {
  width: 100%;
  height: 50px;
  background-color: #09BB07;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 12px;
}

.receive-btn:active:not(:disabled) {
  background-color: #08A006;
}

.receive-btn.disabled,
.receive-btn:disabled {
  background-color: #c8c9cc;
  cursor: not-allowed;
}

.tips-text {
  text-align: center;
  font-size: 12px;
  color: #888888;
  line-height: 1.5;
}

.link-text {
  color: #576b95;
}

/* 冻结提示弹窗 */
.freeze-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-content {
  width: 280px;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

.dialog-title {
  padding: 24px 24px 8px;
  font-size: 17px;
  font-weight: 500;
  color: #000000;
  text-align: center;
}

.dialog-message {
  padding: 8px 24px 24px;
  font-size: 14px;
  color: #888888;
  text-align: center;
  line-height: 1.6;
}

.dialog-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #e5e5e5;
  font-size: 17px;
  color: #576b95;
  font-weight: 500;
  cursor: pointer;
}

.dialog-btn:active {
  background-color: #f5f5f5;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .amount-number {
    font-size: 46px;
  }
  
  .currency-symbol {
    font-size: 26px;
  }
  
  .clock-icon {
    width: 70px;
    height: 70px;
  }
}

@media (max-width: 320px) {
  .amount-number {
    font-size: 42px;
  }
  
  .currency-symbol {
    font-size: 24px;
  }
  
  .receive-btn {
    height: 46px;
    font-size: 16px;
  }
}

@media (min-width: 414px) {
  .amount-number {
    font-size: 58px;
  }
  
  .currency-symbol {
    font-size: 30px;
  }
}

@media (min-width: 768px) {
  .wechat-receive-page {
    max-width: 414px;
    margin: 0 auto;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  }
}

@supports (padding: max(0px)) {
  .bottom-section {
    padding-bottom: max(24px, env(safe-area-inset-bottom));
  }
}
</style>
