<template>
  <div class="receive-container">
    <van-nav-bar
      title="收款"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="receive-content">
      <div class="sender-info">
        <div class="avatar">
          <img :src="transferData.senderAvatar" alt="头像" />
        </div>
        <div class="sender-name">{{ transferData.senderName }}向你转账</div>
      </div>
      
      <div class="transfer-amount">
        <div class="amount-label">转账金额</div>
        <div class="amount-value">{{ transferData.displayName }}</div>
      </div>
      
      <div class="transfer-message" v-if="transferData.message">
        <div class="message-label">转账留言</div>
        <div class="message-content">{{ transferData.message }}</div>
      </div>
      
      <div class="transfer-time">
        <div class="time-label">转账时间</div>
        <div class="time-content">{{ formatDateTime(transferData.createTime) }}</div>
      </div>
      
      <div class="countdown" v-if="transferData.status === 'pending'">
        <div class="countdown-label">剩余时间</div>
        <div class="countdown-content">{{ countdownText }}</div>
      </div>
      
      <div class="status-message" v-if="transferData.status === 'expired'">
        <div class="expired-text">已超过24小时，转账已退回</div>
      </div>
      
      <div class="action-button" v-if="transferData.status === 'pending'">
        <van-button 
          type="primary" 
          size="large" 
          round 
          block 
          @click="confirmReceive"
          :loading="isLoading"
        >
          确认收款
        </van-button>
      </div>
      
      <div class="action-button" v-else-if="transferData.status === 'received'">
        <van-button 
          type="default" 
          size="large" 
          round 
          block 
          disabled
        >
          已收款
        </van-button>
      </div>
      
      <div class="action-button" v-else-if="transferData.status === 'expired'">
        <van-button 
          type="default" 
          size="large" 
          round 
          block 
          disabled
        >
          已过期
        </van-button>
      </div>
      
      <div class="notice">
        <div class="notice-title">收款说明</div>
        <div class="notice-content">
          <p>1. 实际收款金额为0.1元，显示金额仅为演示效果</p>
          <p>2. 点击"确认收款"后将调用微信支付接口完成支付</p>
          <p>3. 请在24小时内完成收款，否则转账将自动退回</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// 页面状态
const loading = ref(true);
const transfer = ref(null);
const countdown = ref(300); // 5分钟倒计时
const paymentStatus = ref('pending'); // pending, processing, success, failed
const paymentId = ref('');
const timer = ref(null);
const statusTimer = ref(null);

// 格式化时间
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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

// 倒计时
const startCountdown = () => {
  timer.value = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer.value);
      paymentStatus.value = 'expired';
    }
  }, 1000);
};

// 确认收款
const confirmReceive = async () => {
  if (paymentStatus.value === 'processing') return;
  
  try {
    paymentStatus.value = 'processing';
    showLoadingToast({
      message: '正在创建支付订单...',
      forbidClick: true,
      duration: 0
    });
    
    // 创建支付订单
    const response = await axios.post('/api/payment/create', {
      transferId: transfer.value.id,
      amount: 0.1, // 固定0.1元
      description: `转账给${transfer.value.senderName}`
    });
    
    closeToast();
    
    if (response.data.success) {
      paymentId.value = response.data.data.paymentId;
      
      // 调用微信支付
      if (window.WeixinJSBridge) {
        // 微信浏览器环境
        window.WeixinJSBridge.invoke('getBrandWCPayRequest', response.data.data.payParams, (res) => {
          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            // 支付成功，开始查询支付状态
            checkPaymentStatus();
          } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
            paymentStatus.value = 'pending';
            showToast('支付已取消');
          } else {
            paymentStatus.value = 'failed';
            showToast('支付失败');
          }
        });
      } else {
        // 非微信浏览器环境，使用模拟支付
        showToast('非微信环境，使用模拟支付');
        setTimeout(() => {
          mockPaymentSuccess();
        }, 1500);
      }
    } else {
      paymentStatus.value = 'failed';
      showToast(response.data.message || '创建支付订单失败');
    }
  } catch (error) {
    closeToast();
    paymentStatus.value = 'failed';
    console.error('创建支付订单失败:', error);
    showToast('创建支付订单失败');
  }
};

// 检查支付状态
const checkPaymentStatus = async () => {
  try {
    showLoadingToast({
      message: '查询支付状态...',
      forbidClick: true,
      duration: 0
    });
    
    const response = await axios.get(`/api/payment/status/${paymentId.value}`);
    closeToast();
    
    if (response.data.success) {
      const { status } = response.data.data;
      
      if (status === 'success') {
        paymentStatus.value = 'success';
        clearInterval(timer.value);
        showToast('支付成功');
        
        // 跳转到成功页面
        setTimeout(() => {
          router.push(`/success/${transfer.value.id}`);
        }, 1500);
      } else if (status === 'pending') {
        // 继续查询
        statusTimer.value = setTimeout(() => {
          checkPaymentStatus();
        }, 2000);
      } else {
        paymentStatus.value = 'failed';
        showToast('支付失败');
      }
    } else {
      paymentStatus.value = 'failed';
      showToast('查询支付状态失败');
    }
  } catch (error) {
    closeToast();
    paymentStatus.value = 'failed';
    console.error('查询支付状态失败:', error);
    showToast('查询支付状态失败');
  }
};

// 模拟支付成功（测试用）
const mockPaymentSuccess = async () => {
  try {
    showLoadingToast({
      message: '模拟支付中...',
      forbidClick: true,
      duration: 0
    });
    
    const response = await axios.post('/api/payment/mock-success', {
      paymentId: paymentId.value
    });
    
    closeToast();
    
    if (response.data.success) {
      paymentStatus.value = 'success';
      clearInterval(timer.value);
      showToast('模拟支付成功');
      
      // 跳转到成功页面
      setTimeout(() => {
        router.push(`/success/${transfer.value.id}`);
      }, 1500);
    } else {
      paymentStatus.value = 'failed';
      showToast('模拟支付失败');
    }
  } catch (error) {
    closeToast();
    paymentStatus.value = 'failed';
    console.error('模拟支付失败:', error);
    showToast('模拟支付失败');
  }
};

// 返回聊天
const goBack = () => {
  router.push('/');
};

onMounted(async () => {
  await fetchTransferInfo();
  startCountdown();
});

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
  if (statusTimer.value) clearTimeout(statusTimer.value);
});
</script>

<style scoped>
.receive-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.nav-bar {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.receive-content {
  flex: 1;
  padding: 20px;
}

.sender-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sender-name {
  font-size: 16px;
  color: #333;
}

.transfer-amount {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.amount-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 10px;
}

.amount-value {
  font-size: 28px;
  font-weight: 500;
  color: #333;
}

.transfer-message, .transfer-time, .countdown {
  background-color: #fff;
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-label, .time-label, .countdown-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.message-content, .time-content, .countdown-content {
  font-size: 16px;
  color: #333;
}

.countdown-content {
  color: #e74c3c;
  font-weight: 500;
}

.status-message {
  text-align: center;
  margin-bottom: 15px;
}

.expired-text {
  color: #e74c3c;
  font-size: 16px;
}

.action-button {
  margin: 30px 0;
}

.notice {
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
</style>