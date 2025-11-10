<template>
  <div class="transfer-loading">
    <!-- 正在跳转... -->
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 检测是否在微信环境
const isWechat = () => {
  return /micromessenger/i.test(navigator.userAgent);
};

onMounted(() => {
  // 获取ID并立即跳转到收款页面
  const id = route.params.id;
  console.log('TransferPage - 收到ID:', id);
  console.log('TransferPage - 是否微信环境:', isWechat());
  
  if (id) {
    const targetUrl = `/receive/${id}`;
    console.log('TransferPage - 跳转到:', targetUrl);
    
    // 微信环境使用硬跳转（刷新页面），普通浏览器使用路由跳转
    if (isWechat()) {
      console.log('TransferPage - 使用window.location.href硬跳转');
      // 微信环境必须使用硬跳转，否则路由不生效
      window.location.href = targetUrl;
    } else {
      console.log('TransferPage - 使用router.replace路由跳转');
      // 普通浏览器使用路由跳转（不刷新页面）
      router.replace(targetUrl);
    }
  } else {
    console.error('TransferPage - 没有ID参数！');
    // 如果真的没有ID，才跳转到主页
    if (isWechat()) {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  }
});
</script>

<style scoped>
.transfer-loading {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
}
</style>
