<template>
  <div class="receive-container">
    <div class="receive-header">
      <div class="back-button" @click="goBack"></div>
      <div class="header-title">转账详情</div>
    </div>
    
    <div class="receive-content">
      <div class="transfer-info">
        <div class="sender-info">
          <div class="avatar">
            <img :src="transferData.senderAvatar" alt="头像" />
          </div>
          <div class="sender-details">
            <div class="sender-name">{{ transferData.senderName }}</div>
            <div class="transfer-time">{{ formatTime(transferData.createTime) }}</div>
          </div>
        </div>
        
        <div class="transfer-message" v-if="transferData.message">
          {{ transferData.message }}
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-label">转账金额</div>
        <div class="amount-display">
          <span class="currency-symbol">¥</span>
          <span class="amount-value">{{ transferData.displayName }}</span>
        </div>
        
        <div class="actual-amount-notice">
          <div class="notice-icon">ℹ️</div>
          <div class="notice-text">
            实际支付金额为 <span class="actual-amount">¥{{ transferData.actualAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      
      <div class="status-section">
        <div class="status-icon" :class="`status-${transferData.status}`">
          <div class="icon-content" v-if="transferData.status === 'pending'">⏰</div>
          <div class="icon-content" v-else-if="transferData.status === 'received'">✅</div>
          <div class="icon-content" v-else-if="transferData.status === 'expired'">❌</div>
        </div>
        
        <div class="status-text" v-if="transferData.status === 'pending'">
          待收款
        </div>
        <div class="status-text" v-else-if="transferData.status === 'received'">
          已收款
        </div>
        <div class="status-text" v-else-if="transferData.status === 'expired'">
          已过期
        </div>
        
        <div class="status-description" v-if="transferData.status === 'pending'">
          对方已转账，请在24小时内收款，否则将退回
        </div>
        <div class="status-description" v-else-if="transferData.status === 'received'">
          转账已成功收款
        </div>
        <div class="status-description" v-else-if="transferData.status === 'expired'">
          已超过24小时，转账已退回
        </div>
      </div>
      
      <div class="action-section" v-if="transferData.status === 'pending'">
        <button class="receive-button" @click="handleReceiveMoney">
          确认收款
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'ReceivePage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const transferData = ref({
      id: '',
      displayName: '100.00元',
      actualAmount: 0.1,
      senderName: '张三',
      senderAvatar: 'https://via.placeholder.com/50x50?text=张三',
      message: '恭喜发财，大吉大利',
      createTime: new Date(),
      receiveTime: null,
      status: 'pending',
      paymentId: null
    })
    
    const formatTime = (date) => {
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}小时前`
      
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}天前`
      
      return date.toLocaleDateString()
    }
    
    const goBack = () => {
      router.go(-1)
    }
    
    const handleReceiveMoney = async () => {
      try {
        // 创建支付订单
        const paymentResponse = await fetch('/api/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transferId: transferData.value.id,
            amount: transferData.value.actualAmount
          })
        })
        
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json()
          
          // 跳转到支付页面
          router.push(`/payment/${paymentData.paymentId}`)
        } else {
          const errorData = await paymentResponse.json()
          alert(`创建支付订单失败: ${errorData.message || '未知错误'}`)
        }
      } catch (error) {
        console.error('收款失败:', error)
        alert('收款失败，请稍后重试')
      }
    }
    
    onMounted(async () => {
      // 获取路由参数中的转账ID
      if (route.params.id) {
        try {
          const response = await fetch(`/api/transfers/${route.params.id}`)
          if (response.ok) {
            const data = await response.json()
            transferData.value = {
              ...transferData.value,
              ...data,
              createTime: new Date(data.createTime),
              receiveTime: data.receiveTime ? new Date(data.receiveTime) : null
            }
          } else {
            alert('获取转账信息失败')
            router.push('/')
          }
        } catch (error) {
          console.error('获取转账记录失败:', error)
          alert('获取转账信息失败')
          router.push('/')
        }
      } else {
        // 如果没有ID，则返回首页
        router.push('/')
      }
    })
    
    return {
      transferData,
      formatTime,
      goBack,
      handleReceiveMoney
    }
  }
}
</script>

<style scoped>
.receive-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.receive-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  background-color: #ededed;
  border-bottom: 1px solid #dcdcdc;
  position: relative;
}

.back-button {
  position: absolute;
  left: 10px;
  width: 20px;
  height: 20px;
  background-color: #999;
  -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>') no-repeat center;
  mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>') no-repeat center;
  cursor: pointer;
}

.header-title {
  font-size: 17px;
  font-weight: 500;
}

.receive-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.transfer-info {
  background-color: #fff;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sender-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 5px;
  overflow: hidden;
  margin-right: 15px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sender-details {
  flex: 1;
}

.sender-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 3px;
}

.transfer-time {
  font-size: 13px;
  color: #888;
}

.transfer-message {
  font-size: 14px;
  color: #555;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  margin-top: 10px;
}

.amount-section {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.amount-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 10px;
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

.actual-amount-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff8e1;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
}

.notice-icon {
  font-size: 16px;
  margin-right: 8px;
}

.notice-text {
  font-size: 14px;
  color: #ff9800;
}

.actual-amount {
  font-weight: 500;
}

.status-section {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.status-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
}

.status-pending {
  background-color: #ffeb3b;
}

.status-received {
  background-color: #4caf50;
}

.status-expired {
  background-color: #f44336;
}

.icon-content {
  font-size: 30px;
}

.status-text {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.status-description {
  font-size: 14px;
  color: #888;
  line-height: 1.5;
}

.action-section {
  text-align: center;
}

.receive-button {
  background-color: #1aad19;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.receive-button:hover {
  background-color: #179b16;
}

.receive-button:active {
  background-color: #158a15;
}
</style>