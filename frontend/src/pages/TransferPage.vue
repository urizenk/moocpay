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

onMounted(() => {
  // 获取ID并立即跳转到收款页面，无任何延迟或验证
  const id = route.params.id;
  console.log('TransferPage - 收到ID:', id);
  
  if (id) {
    console.log('TransferPage - 跳转到 /receive/' + id);
    // 使用replace替换当前历史记录，这样用户按返回不会回到这个中间页
    router.replace(`/receive/${id}`);
  } else {
    console.error('TransferPage - 没有ID参数！');
    // 如果真的没有ID，才跳转到主页
    router.replace('/');
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
