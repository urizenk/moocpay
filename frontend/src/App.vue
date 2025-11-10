<template>
    <router-view />
</template>

<script setup>
// 确保微信环境下可以正常滚动
if (typeof window !== 'undefined') {
  // 禁用页面弹性效果（防止下拉露出背景）
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
}
</script>

<style>
/* 全局样式重置 */
html {
  height: 100%;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

#app {
  min-height: 100%;
}

* {
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}
</style>
