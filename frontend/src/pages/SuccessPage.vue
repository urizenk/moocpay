<template>
  <div class="wechat-success-page">
    <!-- 成功图标 -->
    <div class="success-icon-wrapper">
      <div class="success-circle">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="29" fill="#09BB07"/>
          <path d="M16 30L26 40L44 22" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        </div>
      </div>
      
    <!-- 成功文字 -->
    <div class="success-title">收款成功</div>
    
    <!-- 金额显示 -->
    <div class="amount-section">
      <div class="amount-value">¥{{ transferData.actualAmount ? transferData.actualAmount.toFixed(2) : '0.00' }}</div>
        </div>
        
    <!-- 收款方式 -->
    <div class="payment-method">
      <span class="method-icon">💰</span>
      <span class="method-text">零钱</span>
      </div>
      
    <!-- 底部按钮 -->
      <div class="action-buttons">
      <button class="primary-button" @click="goBack">
        完成
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
    
    const transferData = ref({
      id: '',
      actualAmount: 0.1,
      senderName: '张三',
  message: ''
});

// 获取转账信息
const fetchTransferInfo = async () => {
  try {
    const { id } = route.params;
    const response = await axios.get(`/api/transfers/${id}`);
    
    const isSuccess = response.data?.success ?? true;
    const data = response.data?.data ?? response.data;
    
    if (isSuccess && data) {
      transferData.value = data;
          }
        } catch (error) {
    console.error('获取转账信息失败:', error);
        }
};

// 返回
const goBack = () => {
  router.push('/');
};

onMounted(() => {
  fetchTransferInfo();
});
</script>

<style scoped>
.wechat-success-page {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120px;
  padding-bottom: 40px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.success-icon-wrapper {
  margin-bottom: 24px;
}

.success-circle {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-title {
  font-size: 20px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 32px;
}

.amount-section {
  margin-bottom: 24px;
}

.amount-value {
  font-size: 48px;
  font-weight: 500;
  color: #000000;
  letter-spacing: -1px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #888888;
  margin-bottom: 80px;
}

.method-icon {
  font-size: 20px;
}

.method-text {
  font-size: 16px;
}

.action-buttons {
  width: 100%;
  max-width: 350px;
  padding: 0 24px;
  margin-top: auto;
}

.primary-button {
  width: 100%;
  height: 50px;
  background-color: #09BB07;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button:active {
  transform: scale(0.98);
  background-color: #08A006;
}

/* 响应式 */
@media (max-width: 375px) {
  .wechat-success-page {
    padding-top: 100px;
}

  .amount-value {
    font-size: 42px;
}

  .success-title {
    font-size: 18px;
  }
}

@media (max-width: 320px) {
  .amount-value {
    font-size: 36px;
}

  .primary-button {
    height: 46px;
    font-size: 16px;
}
}

@media (min-width: 414px) {
  .amount-value {
    font-size: 54px;
  }
}

@media (min-width: 768px) {
  .wechat-success-page {
    max-width: 414px;
    margin: 0 auto;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  }
}
</style>
