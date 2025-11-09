<template>
  <div class="share-container">
    <van-nav-bar
      title="分享收款"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="share-content">
      <div class="transfer-preview" v-if="transferData">
        <div class="preview-title">预览</div>
        <div class="preview-card">
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
          </div>
        </div>
      </div>
      
      <div class="share-actions">
        <van-button 
          type="primary" 
          size="large" 
          round 
          block 
          @click="handleShareToWechat"
          icon="wechat"
          class="share-button"
        >
          分享到微信
        </van-button>
        
        <van-button 
          type="default" 
          size="large" 
          round 
          block 
          @click="copyLink"
          icon="link"
          class="share-button"
        >
          复制链接
        </van-button>
      </div>
      
      <div class="share-tips">
        <div class="tips-title">分享说明</div>
        <div class="tips-content">
          <p>1. 点击"分享到微信"可直接分享到微信聊天或朋友圈</p>
          <p>2. 点击"复制链接"可复制收款链接，在微信中发送</p>
          <p>3. 对方点击链接后即可打开收款页面完成支付</p>
          <p>4. 收款有效期为24小时，请及时提醒对方完成支付</p>
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

import { generateShareLink } from '@/utils/wechat';

const route = useRoute();
const router = useRouter();

// 页面状态
const loading = ref(true);
const transferData = ref(null);
const shareLink = ref('');

// 初始化微信JS-SDK
const initWechatSDK = async () => {
  try {
    // 获取当前页面URL（去掉#后面的部分）
    const url = window.location.href.split('#')[0];
    
    // 调用后端API获取微信配置
    const response = await axios.get(`/api/wechat/config?url=${encodeURIComponent(url)}`);
    
    if (response.data.success) {
      const { appId, timestamp, nonceStr, signature } = response.data.data;
      
      // 配置微信JS-SDK
      wx.config({
        debug: false, // 开启调试模式
        appId, // 必填，公众号的唯一标识
        timestamp, // 必填，生成签名的时间戳
        nonceStr, // 必填，生成签名的随机串
        signature, // 必填，签名
        jsApiList: [
          'updateAppMessageShareData', // 分享给朋友
          'updateTimelineShareData' // 分享到朋友圈
        ] // 必填，需要使用的JS接口列表
      });
      
      return new Promise((resolve) => {
        // 配置成功后的回调
        wx.ready(() => {
          console.log('微信JS-SDK配置成功');
          resolve(true);
        });
        
        // 配置失败时的回调
        wx.error((res) => {
          console.error('微信JS-SDK配置失败:', res);
          resolve(false);
        });
      });
    } else {
      console.error('获取微信配置失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('初始化微信SDK失败:', error);
    return false;
  }
};

// 设置微信分享内容
const setWechatShare = (title, desc, link, imgUrl) => {
  // 设置分享给朋友的内容
  wx.updateAppMessageShareData({
    title, // 分享标题
    desc, // 分享描述
    link, // 分享链接
    imgUrl, // 分享图标
    success: () => {
      console.log('设置分享给朋友成功');
    },
    cancel: () => {
      console.log('取消分享给朋友');
    }
  });
  
  // 设置分享到朋友圈的内容
  wx.updateTimelineShareData({
    title, // 分享标题
    link, // 分享链接
    imgUrl, // 分享图标
    success: () => {
      console.log('设置分享到朋友圈成功');
    },
    cancel: () => {
      console.log('取消分享到朋友圈');
    }
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
      shareLink.value = generateShareLink(id);
      
      // 初始化微信分享
      initWechatShare();
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



// 初始化微信分享
const initWechatShare = async () => {
  // 检查是否在微信浏览器中
  const isWechat = /micromessenger/i.test(navigator.userAgent);
  
  if (isWechat) {
    const success = await initWechatSDK();
    if (success) {
      // 设置分享内容
      setWechatShare(
        `${transferData.value.senderName}向您转账`,
        `${transferData.value.displayName}，点击确认收款`,
        shareLink.value,
        transferData.value.senderAvatar
      );
    }
  }
};

// 分享到微信
const handleShareToWechat = async () => {
  if (!transferData.value) return;
  
  showLoadingToast({
    message: '正在准备分享...',
    forbidClick: true,
  });
  
  try {
    // 初始化微信JS-SDK
    const sdkReady = await initWechatSDK();
    
    if (sdkReady) {
      // 设置分享内容
      const shareTitle = '微信转账';
      const shareDesc = `${transferData.value.senderName}向您转账${transferData.value.displayName}`;
      const shareLink = generateShareLink(transferData.value.id);
      const shareImg = transferData.value.senderAvatar || '';
      
      setWechatShare(shareTitle, shareDesc, shareLink, shareImg);
      
      closeToast();
      showToast('请点击右上角分享按钮分享给朋友');
    } else {
      closeToast();
      showToast('微信分享初始化失败，请稍后再试');
    }
  } catch (error) {
    console.error('分享到微信失败:', error);
    closeToast();
    showToast('分享失败，请稍后再试');
  }
};

// 复制链接
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    showToast('链接已复制');
  } catch (error) {
    console.error('复制链接失败:', error);
    showToast('复制链接失败，请手动复制');
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
.share-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.nav-bar {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.share-content {
  flex: 1;
  padding: 20px;
}

.transfer-preview {
  margin-bottom: 30px;
}

.preview-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.preview-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
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
  font-size: 16px;
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
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.message {
  font-size: 14px;
  color: #666;
}

.share-actions {
  margin-bottom: 30px;
}

.share-button {
  margin-bottom: 15px;
}

.share-tips {
  margin-bottom: 30px;
}

.tips-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.tips-content {
  background-color: #fff;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tips-content p {
  margin: 0 0 10px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.tips-content p:last-child {
  margin-bottom: 0;
}


</style>