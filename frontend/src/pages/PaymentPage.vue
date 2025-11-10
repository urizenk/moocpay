<template>
  <div class="payment-container">
    <div class="payment-header">
      <div class="back-button" @click="goBack"></div>
      <div class="header-title">确认支付</div>
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
              <div class="info-label">显示金额</div>
              <div class="info-value">{{ transferData.displayName }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">实际支付</div>
              <div class="info-value amount-value">¥{{ transferData.actualAmount.toFixed(2) }}</div>
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
        <button 
          class="payment-button"
          @click="handlePayment"
          :disabled="paymentLoading"
        >
          {{ paymentLoading ? '处理中...' : '立即支付' }}
        </button>
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

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ensureOpenIdForPayment, getWechatOpenId, isWechatBrowser } from '@/utils/wechatAuth'
import axios from 'axios'

export default {
  name: 'PaymentPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // 页面状态
    const paymentLoading = ref(false)
    const userOpenId = ref(null) // 用户的 OpenID
    const transferData = ref({
      id: '',
      displayName: '100.00元',
      actualAmount: 0.1,
      senderName: '张三',
      senderAvatar: 'https://via.placeholder.com/50x50?text=张三',
      message: '恭喜发财，大吉大利',
      status: 'pending'
    })
    
    // 获取转账信息
    const fetchTransferInfo = async () => {
      try {
        const { id } = route.params
        const response = await axios.get(`/api/transfers/${id}`)
        
        // 适配新的API响应格式
        const isSuccess = response.data?.success ?? response.data?.id
        const data = response.data?.data ?? response.data
        
        if (isSuccess && data) {
          transferData.value = {
            ...transferData.value,
            ...data
          }
        } else {
          alert('转账信息不存在')
          router.push('/')
        }
      } catch (error) {
        console.error('获取转账信息失败:', error)
        alert('获取转账信息失败')
        router.push('/')
      }
    }
    
    // 初始化 OpenID
    const initOpenId = async () => {
      try {
        // 检查是否在微信浏览器中
        if (!isWechatBrowser()) {
          console.log('非微信浏览器，使用测试模式')
          return
        }
        
        // 获取 OpenID
        const openid = await getWechatOpenId({
          returnUrl: window.location.href,
          scope: 'base' // 支付只需要静默授权
        })
        
        if (openid) {
          userOpenId.value = openid
          console.log('OpenID 已获取:', openid)
        } else {
          console.log('正在跳转到微信授权页面...')
        }
      } catch (error) {
        console.error('初始化OpenID失败:', error)
      }
    }
    
    // 处理支付
    const handlePayment = async () => {
      if (!transferData.value.id) return
      
      // 检查是否在微信浏览器中
      const isWechat = isWechatBrowser()
      
      // 如果在微信浏览器中，确保已获取 OpenID
      if (isWechat && !userOpenId.value) {
        alert('正在获取授权，请稍候...')
        await initOpenId()
        return // 会跳转到授权页面
      }
      
      paymentLoading.value = true
      
      try {
        // 调用后端API创建支付订单
        const response = await axios.post('/api/payment/create', {
          transferId: transferData.value.id,
          amount: transferData.value.actualAmount,
          description: `向${transferData.value.senderName}转账`,
          openid: userOpenId.value // 传递 OpenID
        }, {
          withCredentials: true // 携带 cookie
        })
        
        const result = response.data
        
        if (result.success) {
          // 更新转账状态为处理中
          await updateTransferStatus('processing')
          
          // 获取支付参数
          const { paymentParams } = result.data
          
          // 检查是否在微信环境中
          const isWechat = /micromessenger/i.test(navigator.userAgent)
          
          if (isWechat && typeof window.WeixinJSBridge !== 'undefined') {
            // 微信环境，调用微信支付
            window.WeixinJSBridge.invoke('getBrandWCPayRequest', paymentParams, (res) => {
              if (res.err_msg === 'get_brand_wcpay_request:ok') {
                // 支付成功
                handlePaymentSuccess()
              } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
                // 用户取消支付
                alert('您已取消支付')
              } else {
                // 支付失败
                alert('支付失败，请重试')
              }
              paymentLoading.value = false
            })
          } else if (isWechat) {
            // 微信环境但JSAPI未加载，等待加载
            document.addEventListener('WeixinJSBridgeReady', () => {
              window.WeixinJSBridge.invoke('getBrandWCPayRequest', paymentParams, (res) => {
                if (res.err_msg === 'get_brand_wcpay_request:ok') {
                  // 支付成功
                  handlePaymentSuccess()
                } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
                  // 用户取消支付
                  alert('您已取消支付')
                } else {
                  // 支付失败
                  alert('支付失败，请重试')
                }
                paymentLoading.value = false
              })
            })
          } else {
            // 非微信环境，使用模拟支付
            console.log('非微信环境，使用模拟支付')
            await simulatePayment()
          }
        } else {
          alert(result.message || '创建支付订单失败')
          paymentLoading.value = false
        }
      } catch (error) {
        console.error('支付失败:', error)
        alert('支付失败，请重试')
        paymentLoading.value = false
      }
    }
    
    // 模拟支付（用于非微信环境测试）
    const simulatePayment = async () => {
      try {
        // 创建支付订单
        const createResponse = await axios.post('/api/payment/create', {
          transferId: transferData.value.id,
          amount: transferData.value.actualAmount,
          description: `向${transferData.value.senderName}转账`,
          openid: userOpenId.value || 'test_openid' // 测试环境使用默认值
        }, {
          withCredentials: true
        })
        
        const createResult = createResponse.data
        
        if (createResult.success) {
          // 调用模拟支付成功接口
          const mockResponse = await axios.post('/api/payment/mock-success', {
            paymentId: createResult.data.paymentId
          }, {
            withCredentials: true
          })
          
          const mockResult = mockResponse.data
          
          if (mockResult.success) {
            handlePaymentSuccess()
          } else {
            alert('模拟支付失败')
            paymentLoading.value = false
          }
        } else {
          alert('创建支付订单失败')
          paymentLoading.value = false
        }
      } catch (error) {
        console.error('模拟支付失败:', error)
        alert('模拟支付失败')
        paymentLoading.value = false
      }
    }
    
    // 处理支付成功
    const handlePaymentSuccess = async () => {
      alert('支付成功')
      
      // 更新转账状态为已收款
      await updateTransferStatus('received')
      
      // 跳转到成功页面
      setTimeout(() => {
        router.push(`/success/${transferData.value.id}`)
      }, 1500)
    }
    
    // 更新转账状态
    const updateTransferStatus = async (status) => {
      try {
        await axios.patch(`/api/transfers/${transferData.value.id}`, 
          { status },
          { withCredentials: true }
        )
      } catch (error) {
        console.error('更新转账状态失败:', error)
      }
    }
    
    // 返回
    const goBack = () => {
      router.push(`/receive/${transferData.value.id}`)
    }
    
    onMounted(async () => {
      await fetchTransferInfo()
      // 如果在微信浏览器中，初始化 OpenID
      if (isWechatBrowser()) {
        await initOpenId()
      }
    })
    
    return {
      paymentLoading,
      transferData,
      handlePayment,
      goBack,
      userOpenId
    }
  }
}
</script>

<style scoped>
.payment-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.payment-header {
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

.payment-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
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
  color: #ff6034;
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
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #ff8a3d 0%, #ff6034 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(255, 106, 52, 0.3);
}

.payment-button:hover {
  background: linear-gradient(135deg, #ff7a2d 0%, #ff5024 100%);
}

.payment-button:active {
  transform: scale(0.98);
}

.payment-button:disabled {
  background: #c8c9cc;
  box-shadow: none;
  cursor: not-allowed;
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
  background-color: #ff6034;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 10px;
}

/* 移动端响应式适配 */

/* 小屏幕适配 */
@media (max-width: 375px) {
  .payment-content {
    padding: 16px;
  }
  
  .payment-card {
    margin-bottom: 20px;
  }
  
  .payment-button {
    padding: 13px;
    font-size: 16px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 320px) {
  .payment-content {
    padding: 12px;
  }
  
  .payment-title {
    font-size: 17px;
  }
  
  .info-label,
  .info-value {
    font-size: 15px;
  }
}

/* 大屏幕适配 */
@media (min-width: 414px) {
  .payment-button {
    padding: 16px;
    font-size: 18px;
  }
  
  .amount-value {
    font-size: 20px;
  }
}

/* 平板适配 */
@media (min-width: 768px) {
  .payment-container {
    max-width: 414px;
    margin: 0 auto;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  }
}

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .payment-header {
    padding-top: max(0px, env(safe-area-inset-top));
    height: max(44px, calc(44px + env(safe-area-inset-top)));
  }
  
  .payment-footer {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}

/* 触摸优化 */
.payment-button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
</style>}

.payment-button:active {
  transform: scale(0.98);
}

.payment-button:disabled {
  background: #c8c9cc;
  box-shadow: none;
  cursor: not-allowed;
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
  background-color: #ff6034;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 10px;
}
