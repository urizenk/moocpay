<template>
  <div class="diag-page">
    <h1>🔍 微信分享诊断</h1>
    
    <div class="section">
      <h2>1. 环境检测</h2>
      <div class="item">
        <span class="label">是否在微信中：</span>
        <span :class="isWechat ? 'success' : 'error'">{{ isWechat ? '✅ 是' : '❌ 否' }}</span>
      </div>
      <div class="item">
        <span class="label">wx对象存在：</span>
        <span :class="wxExists ? 'success' : 'error'">{{ wxExists ? '✅ 是' : '❌ 否' }}</span>
      </div>
    </div>
    
    <div class="section">
      <h2>2. 转账信息</h2>
      <div class="item">
        <span class="label">转账ID：</span>
        <span>{{ transferId }}</span>
      </div>
      <div class="item">
        <span class="label">收款链接：</span>
        <input type="text" :value="receivePageUrl" readonly @click="copyUrl">
      </div>
    </div>
    
    <div class="section">
      <h2>3. SDK配置状态</h2>
      <div class="item">
        <span class="label">SDK配置：</span>
        <span :class="sdkConfigured ? 'success' : 'error'">{{ sdkConfigured ? '✅ 已配置' : '❌ 未配置' }}</span>
      </div>
      <div class="item">
        <span class="label">分享配置：</span>
        <span :class="shareConfigured ? 'success' : 'error'">{{ shareConfigured ? '✅ 已配置' : '❌ 未配置' }}</span>
      </div>
    </div>
    
    <div class="section">
      <h2>4. 后端SDK诊断</h2>
      <button @click="runBackendDiag" class="btn primary">🔍 运行后端诊断</button>
      <div v-if="backendDiag" class="diag-results">
        <div 
          v-for="(check, index) in backendDiag.checks" 
          :key="index"
          class="diag-item"
          :class="'diag-' + check.status"
        >
          <div class="diag-name">{{ check.name }}</div>
          <div class="diag-status">
            <span v-if="check.status === 'success'">✅</span>
            <span v-else-if="check.status === 'error'">❌</span>
            <span v-else>⚠️</span>
          </div>
          <pre class="diag-details">{{ JSON.stringify(check.details, null, 2) }}</pre>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>5. 前端SDK测试</h2>
      <button @click="testConfig" class="btn">测试SDK配置</button>
      <button @click="testShare" class="btn">测试分享配置</button>
      <button @click="openReceivePage" class="btn">直接打开收款页面</button>
    </div>
    
    <div class="section">
      <h2>6. 日志输出</h2>
      <div class="logs">
        <div v-for="(log, index) in logs" :key="index" :class="'log-' + log.type">
          {{ log.time }} - {{ log.message }}
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>7. 分享测试</h2>
      <p class="tip">点击右上角"⋯"选择"发送给朋友"，查看是否能正确分享</p>
      <button @click="triggerShare" class="btn primary">触发微信分享</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();

const isWechat = ref(false);
const wxExists = ref(false);
const transferId = ref('');
const sdkConfigured = ref(false);
const shareConfigured = ref(false);
const logs = ref([]);
const backendDiag = ref(null);

const receivePageUrl = computed(() => {
  return transferId.value ? `${window.location.origin}/receive/${transferId.value}` : '';
});

const addLog = (message, type = 'info') => {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ time, message, type });
  console.log(`[${type.toUpperCase()}] ${message}`);
};

const runBackendDiag = async () => {
  addLog('🔍 开始后端诊断...', 'info');
  try {
    const response = await axios.get('/api/wechat/diag');
    backendDiag.value = response.data.diagnostics;
    
    if (response.data.success) {
      addLog('✅ 后端诊断完成', 'success');
    } else {
      addLog(`❌ 后端诊断失败: ${response.data.message}`, 'error');
    }
    
    // 检查每个检查项
    backendDiag.value.checks.forEach(check => {
      if (check.status === 'success') {
        addLog(`✅ ${check.name} - 通过`, 'success');
      } else if (check.status === 'error') {
        addLog(`❌ ${check.name} - 失败`, 'error');
      } else {
        addLog(`⚠️ ${check.name} - 警告`, 'warning');
      }
    });
  } catch (error) {
    addLog(`❌ 后端诊断请求失败: ${error.message}`, 'error');
  }
};

const checkEnv = () => {
  isWechat.value = /micromessenger/i.test(navigator.userAgent);
  wxExists.value = typeof window.wx !== 'undefined';
  
  addLog(`是否在微信中: ${isWechat.value}`, isWechat.value ? 'success' : 'error');
  addLog(`wx对象存在: ${wxExists.value}`, wxExists.value ? 'success' : 'error');
};

const loadTransferData = async () => {
  try {
    const id = route.params.id;
    if (!id) {
      addLog('❌ URL中没有转账ID', 'error');
      return;
    }
    
    transferId.value = id;
    addLog(`✅ 转账ID: ${id}`, 'success');
    addLog(`✅ 收款链接: ${receivePageUrl.value}`, 'success');
    
  } catch (error) {
    addLog(`❌ 加载转账信息失败: ${error.message}`, 'error');
  }
};

const testConfig = async () => {
  addLog('开始测试SDK配置...');
  
  try {
    const url = window.location.href.split('#')[0];
    const response = await axios.get(`/api/wechat/config?url=${encodeURIComponent(url)}`);
    
    if (response.data.success) {
      addLog('✅ 获取微信config成功', 'success');
      addLog(`AppID: ${response.data.data.appId}`, 'info');
      
      window.wx.config({
        debug: false,
        appId: response.data.data.appId,
        timestamp: response.data.data.timestamp,
        nonceStr: response.data.data.nonceStr,
        signature: response.data.data.signature,
        jsApiList: ['updateAppMessageShareData', 'onMenuShareAppMessage']
      });
      
      window.wx.ready(() => {
        sdkConfigured.value = true;
        addLog('✅ 微信SDK配置成功！', 'success');
      });
      
      window.wx.error((res) => {
        addLog(`❌ 微信SDK配置失败: ${JSON.stringify(res)}`, 'error');
      });
      
    } else {
      addLog('❌ 获取微信config失败', 'error');
    }
  } catch (error) {
    addLog(`❌ 测试失败: ${error.message}`, 'error');
  }
};

const testShare = () => {
  if (!transferId.value) {
    addLog('❌ 没有转账ID，无法配置分享', 'error');
    return;
  }
  
  if (!wxExists.value) {
    addLog('❌ wx对象不存在', 'error');
    return;
  }
  
  addLog('开始配置分享...');
  
  const shareData = {
    title: '微信转账模拟',
    desc: '张三向你转账9999.00元',
    link: receivePageUrl.value,
    imgUrl: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico'
  };
  
  addLog(`分享链接: ${shareData.link}`, 'info');
  
  window.wx.updateAppMessageShareData({
    ...shareData,
    success: () => {
      shareConfigured.value = true;
      addLog('✅ 分享配置成功！', 'success');
      addLog(`✅ 链接已设置为: ${shareData.link}`, 'success');
    },
    fail: (err) => {
      addLog(`❌ 分享配置失败: ${JSON.stringify(err)}`, 'error');
    }
  });
  
  window.wx.onMenuShareAppMessage(shareData);
  addLog('✅ 已调用旧版分享API', 'info');
};

const triggerShare = () => {
  addLog('💡 请点击右上角"⋯"选择"发送给朋友"', 'info');
  addLog(`📎 分享后，好友点击卡片应该打开: ${receivePageUrl.value}`, 'info');
};

const openReceivePage = () => {
  if (receivePageUrl.value) {
    window.location.href = receivePageUrl.value;
  }
};

const copyUrl = () => {
  navigator.clipboard.writeText(receivePageUrl.value);
  addLog('✅ 链接已复制', 'success');
};

onMounted(() => {
  checkEnv();
  loadTransferData();
  
  if (isWechat.value) {
    addLog('💡 检测到微信环境，可以测试分享', 'info');
  } else {
    addLog('⚠️  不在微信环境中，某些功能可能无法测试', 'warning');
  }
});
</script>

<style scoped>
.diag-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: monospace;
}

h1 {
  color: #333;
  border-bottom: 2px solid #07c160;
  padding-bottom: 10px;
}

h2 {
  color: #666;
  font-size: 16px;
  margin-top: 0;
}

.section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
}

.item:last-child {
  border-bottom: none;
}

.label {
  font-weight: bold;
  min-width: 140px;
  color: #666;
}

.success {
  color: #07c160;
  font-weight: bold;
}

.error {
  color: #ff4444;
  font-weight: bold;
}

input[type="text"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.btn {
  background: #1989fa;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  margin-right: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  font-size: 14px;
}

.btn.primary {
  background: #07c160;
}

.btn:hover {
  opacity: 0.8;
}

.logs {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 12px;
}

.logs > div {
  padding: 4px 0;
  border-bottom: 1px solid #e0e0e0;
}

.logs > div:last-child {
  border-bottom: none;
}

.log-success {
  color: #07c160;
}

.log-error {
  color: #ff4444;
}

.log-warning {
  color: #ff9800;
}

.log-info {
  color: #666;
}

.diag-results {
  margin-top: 12px;
}

.diag-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

.diag-success {
  border-color: #07c160;
  background: #f0fff4;
}

.diag-error {
  border-color: #ff4444;
  background: #fff0f0;
}

.diag-warning {
  border-color: #ff9800;
  background: #fff8e1;
}

.diag-name {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
}

.diag-status {
  font-size: 18px;
  margin-bottom: 8px;
}

.diag-details {
  font-size: 11px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.tip {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 12px;
  color: #856404;
  font-size: 14px;
}
</style>

