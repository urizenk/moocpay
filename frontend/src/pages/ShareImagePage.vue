<template>
  <div class="share-image-container">
    <van-nav-bar
      title="生成分享图片"
      left-arrow
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="content">
      <!-- 转账消息预览图 -->
      <div class="preview-section">
        <div class="preview-title">分享预览</div>
        <div class="transfer-message-card" ref="messageCard">
          <div class="message-bubble">
            <div class="amount-display">
              <div class="currency">¥</div>
              <div class="amount">{{ transferData?.displayName?.replace(/[^\d.]/g, '') || '0.00' }}</div>
            </div>
            <div class="receive-button">
              <div class="button-icon">💰</div>
              <div class="button-text">请收款</div>
            </div>
            <div class="sender-info">
              <div class="sender-name">{{ transferData?.senderName || '发件人' }}</div>
              <div class="message-text">{{ transferData?.message || '恭喜发财，大吉大利' }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="actions">
        <van-button 
          type="primary" 
          block 
          round
          @click="downloadImage"
          class="action-btn"
        >
          📸 保存图片
        </van-button>
        
        <van-button 
          type="success" 
          block 
          round
          @click="copyLinkAndImage"
          class="action-btn"
        >
          📋 复制链接（配图发送）
        </van-button>
        
        <div class="tip">
          💡 使用说明：<br>
          1. 点击"保存图片"保存转账截图<br>
          2. 点击"复制链接"复制收款链接<br>
          3. 在微信中先发送图片，再粘贴链接
        </div>
      </div>
      
      <!-- 收款链接 -->
      <div class="link-section">
        <div class="link-title">收款链接</div>
        <div class="link-box" @click="copyLink">
          <div class="link-text">{{ shareLink }}</div>
          <div class="copy-icon">📋</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import axios from 'axios';
import html2canvas from 'html2canvas';

const route = useRoute();
const router = useRouter();

const transferData = ref(null);
const messageCard = ref(null);
const shareTimestamp = Date.now();

const shareLink = `${window.location.origin}/receive/${route.params.id}?t=${shareTimestamp}`;

// 获取转账信息
const fetchTransferInfo = async () => {
  try {
    const { id } = route.params;
    const response = await axios.get(`/api/transfers/${id}`);
    
    const isSuccess = response.data?.success ?? true;
    const data = response.data?.data ?? response.data;
    
    if (isSuccess && data) {
      transferData.value = data;
    } else {
      showToast('转账信息不存在');
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    }
  } catch (error) {
    console.error('获取转账信息失败:', error);
    showToast('获取转账信息失败');
  }
};

// 下载图片
const downloadImage = async () => {
  try {
    showToast({
      type: 'loading',
      message: '生成中...',
      duration: 0
    });
    
    const canvas = await html2canvas(messageCard.value, {
      backgroundColor: '#f7f7f7',
      scale: 3,
      logging: false
    });
    
    const link = document.createElement('a');
    link.download = `微信转账-${transferData.value.displayName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showToast({
      type: 'success',
      message: '图片已保存'
    });
  } catch (error) {
    console.error('生成图片失败:', error);
    showToast('生成失败，请重试');
  }
};

// 复制链接和提示
const copyLinkAndImage = async () => {
  try {
    await navigator.clipboard.writeText(shareLink);
    showToast({
      message: '链接已复制！\n\n请先保存图片，然后在微信中：\n1. 发送图片\n2. 粘贴链接',
      duration: 3000
    });
  } catch (error) {
    showToast('复制失败，请手动复制');
  }
};

// 复制链接
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink);
    showToast('链接已复制');
  } catch (error) {
    showToast('复制失败，请手动复制');
  }
};

const goBack = () => {
  router.push('/admin');
};

onMounted(() => {
  fetchTransferInfo();
});
</script>

<style scoped>
.share-image-container {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 20px;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.nav-bar :deep(.van-nav-bar__title) {
  color: white;
  font-weight: 600;
}

.nav-bar :deep(.van-icon) {
  color: white;
}

.content {
  padding: 20px;
}

.preview-section {
  margin-bottom: 30px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.transfer-message-card {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.message-bubble {
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.message-bubble::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: shine 3s infinite;
}

@keyframes shine {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, -20px); }
}

.amount-display {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.currency {
  font-size: 32px;
  font-weight: 300;
  margin-right: 5px;
  margin-top: 5px;
}

.amount {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.receive-button {
  background: rgba(255, 255, 255, 0.95);
  color: #19547b;
  padding: 16px 50px;
  border-radius: 50px;
  margin: 0 auto 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  position: relative;
  z-index: 1;
}

.button-icon {
  font-size: 20px;
}

.sender-info {
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.3);
  position: relative;
  z-index: 1;
}

.sender-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 5px;
  opacity: 0.95;
}

.message-text {
  font-size: 14px;
  opacity: 0.85;
}

.actions {
  margin-bottom: 30px;
}

.action-btn {
  margin-bottom: 15px;
  font-weight: 600;
  font-size: 16px;
  height: 48px;
}

.tip {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  font-size: 14px;
  color: #856404;
  line-height: 1.8;
}

.link-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.link-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.link-box {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
}

.link-text {
  flex: 1;
  font-size: 13px;
  color: #333;
  word-break: break-all;
  line-height: 1.6;
}

.copy-icon {
  font-size: 20px;
  margin-left: 10px;
}
</style>

