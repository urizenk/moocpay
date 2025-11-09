<template>
  <div class="transfer-container">
    <div class="transfer-header">
      <div class="status-bar">
        <div class="time">{{ currentTime }}</div>
        <div class="status-icons">
          <div class="icon signal"></div>
          <div class="icon wifi"></div>
          <div class="icon battery"></div>
        </div>
      </div>
    </div>
    
    <div class="transfer-content">
      <div class="transfer-card">
        <div class="card-header">
          <div class="avatar">
            <img :src="transferData.senderAvatar || '/default-avatar.png'" alt="头像" />
          </div>
          <div class="sender-info">
            <div class="sender-name">{{ transferData.senderName }}</div>
            <div class="transfer-text">向你转账</div>
          </div>
        </div>
        
        <div class="card-body">
          <div class="amount-display">
            <span class="currency">¥</span>
            <span class="amount">{{ transferData.displayName }}</span>
          </div>
          <div class="message" v-if="transferData.message">{{ transferData.message }}</div>
        </div>
        
        <div class="card-footer">
          <div class="transfer-time">{{ transferTime }}</div>
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="btn receive-btn" @click="handleReceiveMoney">
          确认收款
        </button>
        <button class="btn cancel-btn" @click="handleCancel">
          拒绝收款
        </button>
      </div>
    </div>
    
    <div class="transfer-footer">
      <div class="security-tip">
        <div class="tip-icon">!</div>
        <div class="tip-text">资金安全由微信支付保障</div>
      </div>
    </div>
    
    <!-- 支付确认弹窗 -->
    <div class="payment-modal" v-if="showPaymentModal" @click="closePaymentModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">确认收款</div>
        </div>
        <div class="modal-body">
          <div class="actual-amount">
            <div class="amount-label">实际收款金额</div>
            <div class="amount-value">¥{{ transferData.actualAmount }}</div>
          </div>
          
          <div class="payment-options">
            <button class="btn modal-btn real-payment-btn" @click="handleRealPayment">
              实际支付
            </button>
            
            <button class="btn modal-btn mock-payment-btn" @click="handleMockReceive">
              模拟收款
            </button>
          </div>
          
          <div class="payment-notice">
            <p>选择"实际支付"将跳转到微信支付页面</p>
            <p>选择"模拟收款"将直接完成收款流程</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn modal-btn cancel" @click="closePaymentModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// 页面状态
const loading = ref(true);
const transferData = ref({});
const currentTime = ref('');
const transferTime = ref('');
const showPaymentModal = ref(false);

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

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
      
      // 设置转账时间为当前时间减去5分钟，模拟刚刚收到转账
      const now = new Date();
      now.setMinutes(now.getMinutes() - 5);
      transferTime.value = now.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
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

// 处理收款
const handleReceiveMoney = () => {
  showPaymentModal.value = true;
};

// 处理确认收款
const handleConfirmReceive = () => {
  showPaymentModal.value = true;
};

// 关闭支付弹窗
const closePaymentModal = () => {
  showPaymentModal.value = false;
};

// 确认支付
const confirmPayment = () => {
  // 这里应该调用微信支付接口，跳转到真实支付页面
  // 暂时使用提示代替
  showToast(`即将跳转到微信支付页面，实际支付金额：¥${transferData.value.actualAmount}`);
  
  // 更新转账状态为处理中
  updateTransferStatus('processing');
  
  // 模拟跳转到支付页面
  setTimeout(() => {
    // 这里应该跳转到实际的微信支付页面
    // window.location.href = paymentUrl;
    handleMockReceive();
  }, 2000);
};

// 处理实际支付
const handleRealPayment = () => {
  // 关闭弹窗
  showPaymentModal.value = false;
  
  // 跳转到支付页面
  router.push(`/payment/${transferData.value.id}`);
};

// 处理模拟收款
const handleMockReceive = async () => {
  if (!transferData.value.id) return;
  
  try {
    // 更新转账状态为已收款
    await axios.patch(`/api/transfers/${transferData.value.id}`, { 
      status: 'received',
      receiveTime: new Date().toISOString()
    });
    
    showToast('收款成功');
    
    // 跳转到成功页面
    setTimeout(() => {
      router.push(`/success/${transferData.value.id}`);
    }, 1500);
  } catch (error) {
    console.error('更新转账状态失败:', error);
    showToast('操作失败，请重试');
  }
};

// 拒绝收款
const handleCancel = () => {
  showToast('已拒绝收款');
  setTimeout(() => {
    router.push('/');
  }, 1500);
};

// 更新转账状态
const updateTransferStatus = async (status) => {
  try {
    await axios.patch(`/api/transfers/${transferData.value.id}`, { status });
  } catch (error) {
    console.error('更新转账状态失败:', error);
  }
};

// 定时更新时间
let timeInterval;

onMounted(() => {
  updateCurrentTime();
  timeInterval = setInterval(updateCurrentTime, 1000);
  fetchTransferInfo();
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.transfer-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.transfer-header {
  background-color: #ededed;
  padding: 10px 15px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #333;
}

.status-icons {
  display: flex;
  gap: 5px;
}

.icon {
  width: 15px;
  height: 15px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.signal::before {
  content: "📶";
}

.wifi::before {
  content: "📶";
}

.battery::before {
  content: "🔋";
}

.transfer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.transfer-card {
  width: 100%;
  max-width: 350px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 20px 10px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  margin-top: 3px;
}

.card-body {
  padding: 10px 20px 20px;
  text-align: center;
}

.amount-display {
  margin: 20px 0;
}

.currency {
  font-size: 30px;
  font-weight: 300;
  color: #333;
}

.amount {
  font-size: 40px;
  font-weight: bold;
  color: #333;
}

.message {
  font-size: 16px;
  color: #666;
  margin-top: 10px;
}

.card-footer {
  padding: 10px 20px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.transfer-time {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 350px;
}

.btn {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.receive-btn {
  background-color: #07c160;
  color: white;
}

.receive-btn:hover {
  background-color: #06ad56;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background-color: #ebebeb;
}

.transfer-footer {
  padding: 20px;
  text-align: center;
}

.security-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
  color: #999;
}

.tip-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #07c160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 10px;
}

/* 支付确认弹窗样式 */
.payment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 80%;
  max-width: 300px;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.actual-amount {
  text-align: center;
  margin-bottom: 15px;
}

.amount-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.amount-value {
  font-size: 24px;
  font-weight: bold;
  color: #07c160;
}

.payment-note {
  font-size: 14px;
  color: #999;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  padding: 12px 0;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
}

.modal-btn.cancel {
  color: #666;
  border-right: 1px solid #f0f0f0;
}

.modal-btn.confirm {
  color: #07c160;
  font-weight: bold;
}

.modal-btn:active {
  background-color: #f5f5f5;
}
</style>