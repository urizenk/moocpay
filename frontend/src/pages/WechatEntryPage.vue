<template>
  <div class="wechat-entry">
    <div class="header">
      <div class="logo">
        <img src="/logo.svg" alt="Logo" />
      </div>
      <h1 class="title">模拟转账</h1>
      <p class="subtitle">生成逼真的微信转账截图</p>
    </div>
    
    <div class="features">
      <div class="feature-item">
        <div class="feature-icon">💰</div>
        <div class="feature-title">自定义金额</div>
        <div class="feature-desc">支持任意金额设置</div>
      </div>
      
      <div class="feature-item">
        <div class="feature-icon">📱</div>
        <div class="feature-title">逼真界面</div>
        <div class="feature-desc">完美还原微信转账界面</div>
      </div>
      
      <div class="feature-item">
        <div class="feature-icon">🔗</div>
        <div class="feature-title">分享链接</div>
        <div class="feature-desc">一键生成分享链接</div>
      </div>
    </div>
    
    <div class="actions">
      <van-button 
        type="primary" 
        round 
        block 
        @click="createTransfer"
        class="create-button"
        size="large"
      >
        创建转账
      </van-button>
      
      <van-button 
        type="default" 
        round 
        block 
        @click="viewHistory"
        class="history-button"
      >
        历史记录
      </van-button>
    </div>
    
    <div class="footer">
      <p class="disclaimer">本应用仅供娱乐，请勿用于非法用途</p>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { Button } from 'vant'

export default {
  name: 'WechatEntryPage',
  components: {
    [Button.name]: Button
  },
  setup() {
    const router = useRouter()
    
    const createTransfer = () => {
      router.push('/chat')
    }
    
    const viewHistory = () => {
      router.push('/admin')
    }
    
    return {
      createTransfer,
      viewHistory
    }
  }
}
</script>

<style scoped>
.wechat-entry {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background-color: #1aad19;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  color: #666;
}

.features {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
}

.feature-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.feature-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
  text-align: center;
}

.feature-desc {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.actions {
  margin-bottom: 40px;
}

.create-button {
  margin-bottom: 15px;
  background-color: #1aad19;
  border-color: #1aad19;
}

.history-button {
  color: #1aad19;
  border-color: #1aad19;
}

.footer {
  margin-top: auto;
  text-align: center;
}

.disclaimer {
  font-size: 12px;
  color: #999;
}
</style>