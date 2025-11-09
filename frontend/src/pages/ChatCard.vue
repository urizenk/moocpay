<template>
  <div class="chat-container">
    <van-nav-bar
      title="微信转账"
      left-arrow
      @click-left="goBack"
      class="chat-header"
    />
    
    <div class="chat-content">
      <div class="message-item sender-message">
        <div class="avatar">
          <img :src="transferData.senderAvatar" alt="头像" />
        </div>
        <div class="message-content">
          <div class="sender-name">{{ transferData.senderName }}</div>
          <div class="message-time">{{ formatTime(transferData.createdAt) }}</div>
          <div class="transfer-card" @click="goToReceivePage">
            <div class="card-header">
              <div class="icon-wrapper">
                <div class="transfer-icon">¥</div>
              </div>
              <div class="card-status">转账</div>
            </div>
            <div class="card-amount">{{ transferData.amount }}</div>
            <div class="card-message" v-if="transferData.message">{{ transferData.message }}</div>
          </div>
        </div>
      </div>
      
      <div class="system-message" v-if="transferData.status === 'pending'">
        <div class="message-content">对方已转账，请在24小时内收款，否则将退回</div>
      </div>
      
      <div class="system-message" v-else-if="transferData.status === 'received'">
        <div class="message-content">你已收款</div>
      </div>
      
      <div class="system-message" v-else-if="transferData.status === 'expired'">
        <div class="message-content">已超过24小时，转账已退回</div>
      </div>
      
      <div class="action-buttons" v-if="transferData.status === 'pending'">
        <van-button 
          type="primary" 
          round 
          @click="goToSharePage"
          class="share-button"
          icon="share-o"
        >
          分享
        </van-button>
      </div>
    </div>
    
    <div class="chat-footer">
      <div class="input-area">
        <div class="input-placeholder">输入消息...</div>
      </div>
      <div class="action-buttons">
        <div class="more-button">+</div>
        <div class="voice-button"></div>
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
  name: 'ChatCard',
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
      updatedAt: null,
      status: 'pending',
      paymentId: null
    })
    
    const formatTime = (date) => {
      const now = new Date()
      const diff = now - new Date(date)
      const minutes = Math.floor(diff / 60000)
      
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}小时前`
      
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}天前`
      
      return new Date(date).toLocaleDateString()
    }
    
    const goBack = () => {
      router.go(-1)
    }
    
    const goToReceivePage = () => {
      if (transferData.value.status === 'pending') {
        router.push(`/receive/${transferData.value.id}`)
      }
    }
    
    const goToSharePage = () => {
      if (transferData.value.id) {
        router.push(`/share/${transferData.value.id}`)
      }
    }
    
    onMounted(async () => {
      // 如果有路由参数，则获取对应的转账记录
      if (route.params.id) {
        try {
          const response = await axios.get(`/api/transfers/${route.params.id}`)
          if (response.data) {
            transferData.value = {
              ...transferData.value,
              ...response.data,
              createdAt: new Date(response.data.createdAt),
              updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : null
            }
          }
        } catch (error) {
          console.error('获取转账记录失败:', error)
        }
      } else {
        // 否则创建一个新的转账记录
        try {
          const response = await axios.post('/api/transfers', transferData.value)
          if (response.data) {
            transferData.value.id = response.data.id
            transferData.value.createdAt = new Date(response.data.createdAt)
          }
        } catch (error) {
          console.error('创建转账记录失败:', error)
        }
      }
    })
    
    return {
      transferData,
      formatTime,
      goBack,
      goToReceivePage,
      goToSharePage
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.chat-header {
  background-color: #ededed;
  border-bottom: 1px solid #dcdcdc;
}

.chat-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
}

.sender-message {
  justify-content: flex-start;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 5px;
  overflow: hidden;
  margin-right: 10px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
}

.sender-name {
  font-size: 13px;
  color: #888;
  margin-bottom: 3px;
}

.message-time {
  font-size: 11px;
  color: #aaa;
  margin-bottom: 3px;
}

.transfer-card {
  background-color: #fff;
  border-radius: 5px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.transfer-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.icon-wrapper {
  width: 20px;
  height: 20px;
  background-color: #1aad19;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
}

.transfer-icon {
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.card-status {
  font-size: 14px;
  color: #333;
}

.card-amount {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.card-message {
  font-size: 13px;
  color: #888;
}

.system-message {
  text-align: center;
  margin: 15px 0;
}

.system-message .message-content {
  display: inline-block;
  background-color: rgba(0, 0, 0, 0.05);
  color: #888;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 10px;
}

.chat-footer {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background-color: #f7f7f7;
  border-top: 1px solid #dcdcdc;
}

.input-area {
  flex: 1;
  background-color: #fff;
  border-radius: 5px;
  height: 35px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  margin-right: 10px;
}

.input-placeholder {
  color: #aaa;
  font-size: 15px;
}

.action-buttons {
  display: flex;
}

.more-button, .voice-button {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  font-size: 20px;
  color: #555;
}

.voice-button {
  width: 35px;
  height: 35px;
  background-color: #1aad19;
  color: #fff;
}

.share-button {
  margin: 20px auto;
  width: 80%;
}
</style>