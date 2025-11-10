<template>
  <div class="success-container">
    <van-nav-bar
      title="收款成功"
      left-arrow
      @click-left="goBack"
      class="success-header"
    />
    
    <div class="success-content">
      <div class="success-icon">
        <div class="checkmark-circle">
          <div class="checkmark"></div>
        </div>
      </div>
      
      <div class="success-message">
        <div class="message-title">收款成功</div>
        <div class="message-subtitle">转账已成功到账</div>
      </div>
      
      <div class="amount-info">
        <div class="amount-label">转账通知</div>
        <div class="notify-text">向你转账</div>
        <div class="amount-display">
          <span class="currency-symbol">¥</span>
          <span class="amount-value">{{ transferData.actualAmount ? transferData.actualAmount.toFixed(2) : '0.00' }}</span>
        </div>
        
        <div class="transfer-details-box">
          <div class="detail-row">
            <span class="label">转账类型</span>
            <span class="value orange">活动奖励</span>
          </div>
          <div class="detail-row">
            <span class="label">转账备注</span>
            <span class="value">{{ transferData.message || '- -' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">收款方式</span>
            <span class="value">
              <span class="coin-icon">🪙</span> 零钱
            </span>
          </div>
        </div>
      </div>
      
      <div class="transfer-details">
        <div class="detail-item">
          <div class="detail-label">转账人</div>
          <div class="detail-value">{{ transferData.senderName }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">转账时间</div>
          <div class="detail-value">{{ formatDateTime(transferData.createdAt) }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">收款时间</div>
          <div class="detail-value">{{ formatDateTime(transferData.updatedAt) }}</div>
        </div>
        
        <div class="detail-item" v-if="transferData.message">
          <div class="detail-label">转账留言</div>
          <div class="detail-value">{{ transferData.message }}</div>
        </div>
      </div>
      
      <div class="action-buttons">
        <van-button 
          type="primary" 
          block 
          round 
          @click="goToChat"
          class="action-button"
        >
          返回聊天
        </van-button>
        
        <van-button 
          plain 
          block 
          round 
          @click="shareSuccess"
          class="action-button"
        >
          分享收款成功
        </van-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Button } from 'vant'
import axios from 'axios'

export default {
  name: 'SuccessPage',
  components: {
    [NavBar.name]: NavBar,
    [Button.name]: Button
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const transferData = ref({
      id: '',
      amount: '100.00',
      actualAmount: 0.1,
      senderName: '张三',
      senderAvatar: 'https://via.placeholder.com/50x50?text=张三',
      message: '恭喜发财，大吉大利',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'received',
      paymentId: null
    })
    
    const formatDateTime = (date) => {
      if (!date) return ''
      
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
    
    const goBack = () => {
      router.go(-1)
    }
    
    const goToChat = () => {
      router.push(`/chat/${transferData.value.id}`)
    }
    
    const shareSuccess = () => {
      // 实现分享功能
      if (navigator.share) {
        navigator.share({
          title: '微信转账收款成功',
          text: `我已成功收款¥${transferData.value.amount}`,
          url: window.location.href
        }).catch(err => {
          console.log('分享失败:', err)
        })
      } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('链接已复制到剪贴板')
        }).catch(err => {
          console.error('复制失败:', err)
          alert('复制失败，请手动复制链接')
        })
      }
    }
    
    onMounted(async () => {
      // 获取路由参数中的转账ID
      if (route.params.id) {
        try {
          const response = await axios.get(`/api/transfers/${route.params.id}`)
          if (response.data) {
            transferData.value = {
              ...transferData.value,
              ...response.data,
              createdAt: new Date(response.data.createdAt),
              updatedAt: new Date(response.data.updatedAt)
            }
          }
        } catch (error) {
          console.error('获取转账记录失败:', error)
          router.push('/')
        }
      } else {
        // 如果没有ID，则返回首页
        router.push('/')
      }
    })
    
    return {
      transferData,
      formatDateTime,
      goBack,
      goToChat,
      shareSuccess
    }
  }
}
</script>

<style scoped>
.success-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}

.success-header {
  background-color: #ededed;
  border-bottom: 1px solid #dcdcdc;
}

.success-content {
  flex: 1;
  padding: 30px 20px;
  overflow-y: auto;
  text-align: center;
}

.success-icon {
  margin-bottom: 20px;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff8a3d 0%, #ff6034 100%);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(255, 106, 52, 0.3);
}

.checkmark {
  width: 25px;
  height: 40px;
  border-right: 5px solid #fff;
  border-bottom: 5px solid #fff;
  transform: rotate(45deg);
  margin-top: -10px;
}

.success-message {
  margin-bottom: 30px;
}

.message-title {
  font-size: 22px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.message-subtitle {
  font-size: 16px;
  color: #888;
}

.amount-info {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.amount-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.notify-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 16px;
}

.amount-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 15px;
}

.currency-symbol {
  font-size: 24px;
  color: #333;
  margin-right: 5px;
}

.amount-value {
  font-size: 36px;
  font-weight: 500;
  color: #333;
}

.actual-amount-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 5px;
}

.actual-amount-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 3px;
}

.actual-amount-value {
  font-size: 16px;
  color: #ff6034;
  font-weight: 500;
}

.transfer-details-box {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row .label {
  color: #888;
}

.detail-row .value {
  color: #333;
}

.detail-row .value.orange {
  color: #ff6034;
}

.coin-icon {
  font-size: 16px;
}

.transfer-details {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 14px;
  color: #888;
}

.detail-value {
  font-size: 14px;
  color: #333;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-button {
  margin-bottom: 0;
}

/* 移动端响应式适配 */

/* 小屏幕适配 */
@media (max-width: 375px) {
  .success-content {
    padding: 24px 16px;
  }
  
  .checkmark-circle {
    width: 70px;
    height: 70px;
  }
  
  .message-title {
    font-size: 20px;
  }
  
  .amount-value {
    font-size: 32px;
  }
  
  .currency-symbol {
    font-size: 22px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 320px) {
  .success-content {
    padding: 20px 12px;
  }
  
  .checkmark-circle {
    width: 60px;
    height: 60px;
  }
  
  .checkmark {
    width: 20px;
    height: 35px;
  }
  
  .message-title {
    font-size: 18px;
  }
  
  .amount-value {
    font-size: 28px;
  }
  
  .detail-row {
    font-size: 13px;
  }
}

/* 大屏幕适配 */
@media (min-width: 414px) {
  .checkmark-circle {
    width: 90px;
    height: 90px;
  }
  
  .message-title {
    font-size: 24px;
  }
  
  .amount-value {
    font-size: 40px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .success-content {
    padding: 20px;
  }
  
  .success-icon {
    margin-bottom: 12px;
  }
  
  .success-message {
    margin-bottom: 20px;
  }
  
  .amount-info,
  .transfer-details {
    margin-bottom: 16px;
  }
}

/* 平板适配 */
@media (min-width: 768px) {
  .success-container {
    max-width: 414px;
    margin: 0 auto;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  }
}

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .success-header {
    padding-top: max(0px, env(safe-area-inset-top));
    height: max(44px, calc(44px + env(safe-area-inset-top)));
  }
  
  .action-buttons {
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}

/* 触摸优化 */
.action-button :deep(.van-button) {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  min-height: 44px;
}
</style>  color: #888;
}

.detail-row .value {
  color: #333;
}

.detail-row .value.orange {
  color: #ff6034;
}

.coin-icon {
  font-size: 16px;
}

.transfer-details {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 14px;
  color: #888;
}

.detail-value {
  font-size: 14px;
  color: #333;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-button {
  margin-bottom: 0;
}
