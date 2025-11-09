<template>
  <div class="payment-container">
    <div class="payment-header">
      <van-nav-bar
        title="确认支付"
        left-arrow
        @click-left="goBack"
        class="nav-bar"
      />
    </div>
    
    <div class="payment-content">
      <div class="payment-card">
        <div class="card-header">
          <div class="payment-title">微信支付</div>
        </div>
        
        <div class="card-body">
          <div class="payment-info">
            <div class="info-row">
              <div class="info-label">收款方</div>
              <div class="info-value">{{ transferData.senderName }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">支付金额</div>
              <div class="info-value amount-value">¥{{ transferData.actualAmount }}</div>
            </div>
          </div>
          
          <div class="payment-notice">
            <div class="notice-title">支付说明</div>
            <div class="notice-content">
              <p>1. 点击下方按钮将跳转到微信支付页面</p>
              <p>2. 请在微信支付页面完成支付</p>
              <p>3. 支付完成后将自动返回本页面</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="payment-actions">
        <van-button 
          type="primary" 
          size="large" 
          round 
          block 
          @click="handlePayment"
          :loading="paymentLoading"
          class="payment-button"
        >
          立即支付
        </van-button>
      </div>
    </div>
    
    <div class="payment-footer">
      <div class="security-tip">
        <div class="tip-icon">!</div>
        <div class="tip-text">资金安全由微信支付保障</div>
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
const paymentLoading = ref(false);
const transferData = ref({});

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
  }
};

// 处理支付
const handlePayment = async () => {
  if (!transferData.value.id) return;
  
  paymentLoading.value = true;
  
  try {
    // 调用后端API创建支付订单
    const response = await axios.post('/api/payment/create', {
      transferId: transferData.value.id,
      amount: transferData.value.actualAmount,
      description: `向${transferData.value.senderName}转账`
    });
    
    if (response.data.success) {
      // 更新转账状态为处理中
      await updateTransferStatus('processing');
      
      // 获取支付参数
      const { paymentParams } = response.data.data;
      
      // 调用微信支付
      if (typeof WeixinJSBridge !== 'undefined') {
        WeixinJSBridge.invoke('getBrandWCPayRequest', paymentParams, (res) => {
          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            // 支付成功
            handlePaymentSuccess();
          } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
            // 用户取消支付
            showToast('您已取消支付');
          } else {
            // 支付失败
            showToast('支付失败，请重试');
          }
          paymentLoading.value = false;
        });
      } else {
        // 非微信环境，显示支付二维码或提示
        showToast('请在微信中打开此页面进行支付');
        paymentLoading.value = false;
      }
    } else {
      showToast(response.data.message || '创建支付订单失败');
      paymentLoading.value = false;
    }
  } catch (error) {
    console.error('支付失败:', error);
    showToast('支付失败，请重试');
    paymentLoading.value = false;
  }
};

// 处理支付成功
const handlePaymentSuccess = async () => {
  showToast('支付成功');
  
  // 更新转账状态为已收款
  await updateTransferStatus('received');
  
  // 跳转到成功页面
  setTimeout(() => {
    router.push(`/success/${transferData.value.id}`);
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

// 返回
const goBack = () => {
  router.push(`/transfer/${transferData.value.id}`);
};

onMounted(() => {
  fetchTransferInfo();
});
</script>

<style scoped>
.payment-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.payment-header {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-bar {
  background-color: #07c160;
  color: #fff;
}

.payment-content {
  flex: 1;
  padding: 20px;
}

.payment-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 30px;
}

.card-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.payment-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.card-body {
  padding: 20px;
}

.payment-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 16px;
  color: #666;
}

.info-value {
  font-size: 16px;
  color: #333;
}

.amount-value {
  font-size: 18px;
  font-weight: bold;
  color: #07c160;
}

.payment-notice {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
}

.notice-title {
  font-size: 16px;
  font-weight: bold;
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

.payment-actions {
  margin-bottom: 20px;
}

.payment-button {
  background-color: #07c160;
  border: none;
}

.payment-footer {
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
</style>