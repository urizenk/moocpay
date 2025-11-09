<template>
  <div class="success-container">
    <van-nav-bar
      title="收款成功"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="success-content">
      <div class="success-icon">
        <div class="checkmark">
          <div class="checkmark-stem"></div>
          <div class="checkmark-kick"></div>
        </div>
      </div>
      
      <div class="success-title">收款成功</div>
      
      <div class="transfer-details">
        <div class="detail-item">
          <div class="detail-label">收款金额</div>
          <div class="detail-value">{{ transferData.displayName }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">实际金额</div>
          <div class="detail-value actual-amount">¥{{ transferData.actualAmount.toFixed(2) }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">付款方</div>
          <div class="detail-value">{{ transferData.senderName }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">创建时间</div>
          <div class="detail-value">{{ formatDateTime(transferData.createTime) }}</div>
        </div>
        
        <div class="detail-item" v-if="transferData.receiveTime">
          <div class="detail-label">收款时间</div>
          <div class="detail-value">{{ formatDateTime(transferData.receiveTime) }}</div>
        </div>
        
        <div class="detail-item" v-if="transferData.message">
          <div class="detail-label">转账留言</div>
          <div class="detail-value">{{ transferData.message }}</div>
        </div>
      </div>
      
      <div class="action-buttons">
        <van-button 
          type="primary" 
          size="large" 
          round 
          block 
          @click="goToChat"
        >
          返回聊天
        </van-button>
        
        <van-button 
          type="default" 
          size="large" 
          round 
          block 
          @click="viewDetails"
          class="details-button"
        >
          查看详情
        </van-button>
      </div>
      
      <div class="notice">
        <div class="notice-title">温馨提示</div>
        <div class="notice-content">
          <p>1. 实际收款金额为0.1元，显示金额仅为演示效果</p>
          <p>2. 如有疑问，请联系客服</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// 页面状态
const loading = ref(true);
const transfer = ref(null);

// 获取转账信息
const fetchTransferInfo = async () => {
  try {
    const { id } = route.params;
    const response = await axios.get(`/api/transfers/${id}`);
    
    if (response.data.success) {
      transfer.value = response.data.data;
    } else {
      showToast('转账信息不存在');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  } catch (error) {
    console.error('获取转账信息失败:', error);
    showToast('获取转账信息失败');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 返回聊天
const goBack = () => {
  router.push('/');
};

// 查看详情
const viewDetails = () => {
  router.push(`/transfer/${transfer.value.id}`);
};

onMounted(async () => {
  await fetchTransferInfo();
});
</script>

<style scoped>
.success-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.nav-bar {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.success-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-icon {
  margin: 30px 0;
  position: relative;
  width: 80px;
  height: 80px;
}

.checkmark {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #07c160;
  stroke-miterlimit: 10;
  box-shadow: inset 0px 0px 0px #07c160;
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
  position: relative;
}

.checkmark::after {
  content: '';
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: block;
  background-color: #07c160;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}

.checkmark-stem {
  position: absolute;
  width: 3px;
  height: 40px;
  background-color: #fff;
  top: 20px;
  left: 35px;
  transform: rotate(45deg);
}

.checkmark-kick {
  position: absolute;
  width: 3px;
  height: 20px;
  background-color: #fff;
  top: 40px;
  left: 50px;
  transform: rotate(-45deg);
}

.success-title {
  font-size: 24px;
  font-weight: 500;
  color: #333;
  margin-bottom: 30px;
}

.transfer-details {
  width: 100%;
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #888;
}

.detail-value {
  font-size: 16px;
  color: #333;
  text-align: right;
}

.actual-amount {
  color: #07c160;
  font-weight: 500;
}

.action-buttons {
  width: 100%;
  margin-bottom: 20px;
}

.details-button {
  margin-top: 10px;
}

.notice {
  width: 100%;
  background-color: #fff;
  border-radius: 10px;
  padding: 15px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.notice-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.notice-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.notice-content p {
  margin: 5px 0;
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px #07c160;
  }
}
</style>