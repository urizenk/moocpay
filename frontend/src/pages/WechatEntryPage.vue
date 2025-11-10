<template>
  <div class="wechat-entry-page">
    <div class="header-section">
      <div class="logo-wrapper">
        <img src="/logo.svg" alt="Logo" class="logo-img" />
      </div>
      <h1 class="app-title">微信转账模拟系统</h1>
      <p class="app-subtitle">生成逼真的微信转账页面</p>
    </div>
    
    <div class="features-section">
      <div class="feature-card">
        <div class="feature-icon">💰</div>
        <div class="feature-title">自定义金额</div>
        <div class="feature-desc">支持展示金额和实际金额设置</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <div class="feature-title">逼真界面</div>
        <div class="feature-desc">完美还原微信转账界面</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🔗</div>
        <div class="feature-title">分享链接</div>
        <div class="feature-desc">一键生成分享链接</div>
      </div>
    </div>
    
    <div class="actions-section">
      <button class="primary-btn" @click="goToAdmin">
        <span class="btn-icon">⚡</span>
        进入管理后台
      </button>
      
      <button class="secondary-btn" @click="viewDemo">
        <span class="btn-icon">👁️</span>
        查看演示
      </button>
    </div>
    
    <div class="footer-section">
      <p class="disclaimer">本应用仅供学习交流，请勿用于非法用途</p>
      <p class="version">Version 2.0</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToAdmin = () => {
  router.push('/admin');
};
    
const viewDemo = () => {
  // 直接进入管理后台
  router.push('/admin');
};
</script>

<style scoped>
.wechat-entry-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.logo-img {
  width: 60px;
  height: 60px;
  filter: brightness(0) invert(1);
}

.app-title {
  font-size: 32px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

.features-section {
  width: 100%;
  max-width: 400px;
  margin-bottom: 40px;
}

.feature-card {
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.feature-card:active {
  transform: scale(0.98);
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

.actions-section {
  width: 100%;
  max-width: 400px;
  margin-bottom: 40px;
}

.primary-btn,
.secondary-btn {
  width: 100%;
  height: 54px;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.primary-btn {
  background-color: #ffffff;
  color: #667eea;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.primary-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.secondary-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.secondary-btn:active {
  transform: scale(0.98);
  background-color: rgba(255, 255, 255, 0.3);
}

.btn-icon {
  margin-right: 8px;
  font-size: 20px;
}

.footer-section {
  text-align: center;
  margin-top: auto;
  padding-top: 20px;
}

.disclaimer {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  line-height: 1.5;
}

.version {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>