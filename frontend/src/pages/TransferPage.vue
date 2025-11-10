<template>
  <div class="transfer-loading">
    <!-- 加载动画 -->
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

// 获取转账信息并直接跳转到收款页面
const loadAndRedirect = async () => {
  try {
    const { id } = route.params;
    
    // 验证转账是否存在
    const response = await axios.get(`/api/transfers/${id}`);
    
    const isSuccess = response.data?.success ?? true;
    const data = response.data?.data ?? response.data;
    
    if (isSuccess && data) {
      // 转账存在，直接跳转到收款页面
      router.replace(`/receive/${id}`);
    } else {
      showToast('转账信息不存在');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  } catch (error) {
    console.error('获取转账信息失败:', error);
    showToast('链接已失效');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  }
};

onMounted(() => {
  // 立即跳转，不等待
  const { id } = route.params;
  if (id) {
    router.replace(`/receive/${id}`);
  } else {
    router.push('/');
  }
});
</script>

<style scoped>
.transfer-loading {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  border: 3px solid #e5e5e5;
  border-top-color: #ff7243;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #888;
}
</style>
