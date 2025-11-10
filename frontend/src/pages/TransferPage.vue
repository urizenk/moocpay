
<template>
  <div class="transfer-container">
    <van-nav-bar
      title="转账收款"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="transfer-content">
      <div class="transfer-card" v-if="transferData">
        <div class="card-header">
          <div class="avatar">
            <img :src="transferData.senderAvatar" alt="头像" />
          </div>
          <div class="sender-info">
            <div class="sender-name">{{ transferData.senderName }}</div>
            <div class="transfer-text">向你转账</div>
          </div>
        </div>
        <div class="card-body">
          <div class="amount">{{ transferData.displayName }}</div>
          <div class="message" v-if="transferData.message">{{ transferData.message }}</div>
          <div class="time">{{ formatTime(transferData.createdAt) }}</div>
        </div>
      </div>
      
      <div class="transfer-actions" v-if="transferData && transferData.status === 'pending'">
        <van-button 
          type="primary" 
          size="large" 
          round 
          block 
          @click="handleAccept"
          class="action-button accept-button"
        >
          确认收款
        </van-button>
        
        <van-button 
          type="default" 
          size="large" 
          round 
          block 
          @click="handleReject"
          class="action-button reject-button"
        >
          拒绝收款
        </van-button>
      </div>
      
      <div class="transfer-status" v-else-if="transferData">
        <div class="status-card">
          <div class="status-icon" v-if="transferData.status === 'accepted'">
            <van-icon name="success" color="#07c160" size="48" />
          </div>
          <div class="status-icon" v-else-if="transferData.status === 'rejected'">
            <van-icon name="cross" color="#ee0a24" size="48" />
          </div>
          <div class="status-text" v-if="transferData.status === 'accepted'">
            已收款
          </div>
          <div class="status-text" v-else-if="transferData.status === 'rejected'">
            已拒绝
          </div>
          <div class="status-time" v-if="transferData.status !== 'pending'">
            {{ formatTime(transferData.updatedAt) }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 支付弹窗 -->
    <van-dialog
      v-model:show="showPaymentDialog"
      title="确认收款"
      show-cancel-button
      confirm-button-text="确认收款"
      cancel-button-text="取消"
      @confirm="confirmPayment"
      class="payment-dialog"
    >
      <div class="payment-content">
        <div class="payment-amount" v-if="transferData">{{ transferData.displayName }}</div>
        <div class="payment-tips">确认收款后，款项将转入您的账户</div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// 页面状态
const loading = ref(true);
const transferData = ref(null);
const showPaymentDialog = ref(false);

// 获取转账信息
const fetchTransferInfo = async () => {
  try {
    const { id } = route.params;
    const response = await axios.get(`/api/transfers/${id}`);
    
    // 适配新的API响应格式
    const isSuccess = response.data?.success ?? response.success;
    const data = response.data?.data ?? response.data;
    
    if (isSuccess && data) {
      transferData.value = data;
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

// 处理确认收款
const handleAccept = () => {
  showPaymentDialog.value = true;
};

// 确认支付
const confirmPayment = async () => {
  if (!transferData.value) return;
  
  showLoadingToast({
    message: '正在确认收款...',
    forbidClick: true,
  });
  
  try {
    const response = await axios.post(`/api/transfers/${transferData.value.id}/accept`);
    
    // 适配新的API响应格式
    const isSuccess = response.data?.success ?? response.success;
    
    if (isSuccess) {
      closeToast();
      showToast('收款成功');
      
      // 更新转账状态
      transferData.value.status = 'accepted';
      transferData.value.updatedAt = new Date().toISOString();
      
      // 跳转到成功页面
      setTimeout(() => {
        router.push(`/success/${transferData.value.id}`);
      }, 1500);
    } else {
      closeToast();
      showToast('收款失败，请重试');
    }
  } catch (error) {
    console.error('确认收款失败:', error);
    closeToast();
    showToast('收款失败，请重试');
  }
};

// 处理拒绝收款
const handleReject = async () => {
  if (!transferData.value) return;
  
  try {
    await showDialog({
      title: '确认拒绝',
      message: '确定要拒绝这笔转账吗？',
    });
    
    showLoadingToast({
      message: '正在拒绝收款...',
      forbidClick: true,
    });
    
    const response = await axios.post(`/api/transfers/${transferData.value.id}/reject`);
    
    // 适配新的API响应格式
    const isSuccess = response.data?.success ?? response.success;
    
    if (isSuccess) {
      closeToast();
      showToast('已拒绝收款');
      
      // 更新转账状态
      transferData.value.status = 'rejected';
      transferData.value.updatedAt = new Date().toISOString();
    } else {
      closeToast();
      showToast('拒绝失败，请重试');
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('拒绝收款失败:', error);
      closeToast();
      showToast('拒绝失败，请重试');
    }
  }
};

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  const date = new Date(timeString);
  const now = new Date();
  const diff = now - date;
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }
  
  // 小于1天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  
  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}天前`;
  }
  
  // 超过7天显示具体日期
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
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
.transfer-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.nav-bar {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.transfer-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.transfer-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sender-info {
  flex: 1;
}

.sender-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.transfer-text {
  font-size: 14px;
  color: #666;
}

.card-body {
  text-align: center;
}

.amount {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.message {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}

.time {
  font-size: 14px;
  color: #999;
}

.transfer-actions {
  margin-top: auto;
}

.action-button {
  margin-bottom: 15px;
}

.accept-button {
  background-color: #07c160;
  border-color: #07c160;
}

.reject-button {
  color: #ee0a24;
  border-color: #ee0a24;
}

.transfer-status {
  margin-top: auto;
}

.status-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 30px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.status-icon {
  margin-bottom: 15px;
}

.status-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.status-time {
  font-size: 14px;
  color: #999;
}

.payment-content {
  padding: 20px 0;
  text-align: center;
}

.payment-amount {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.payment-tips {
  font-size: 14px;
  color: #666;
}
</style>