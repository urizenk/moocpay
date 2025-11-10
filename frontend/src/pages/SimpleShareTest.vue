<template>
  <div class="test-page">
    <h1>微信分享测试</h1>
    
    <div class="section">
      <h2>当前环境</h2>
      <p>UserAgent: {{ ua }}</p>
      <p>是否微信: {{ isWechat ? '✅ 是' : '❌ 否' }}</p>
      <p>wx对象: {{ wxExists ? '✅ 存在' : '❌ 不存在' }}</p>
    </div>
    
    <div class="section">
      <h2>测试步骤</h2>
      <ol>
        <li>点击下面的"初始化SDK"按钮</li>
        <li>等待显示"SDK配置成功"</li>
        <li>点击右上角"⋯"</li>
        <li>选择"发送给朋友"</li>
        <li>查看分享卡片是否显示测试标题</li>
      </ol>
    </div>
    
    <div class="section">
      <button @click="initSDK" :disabled="sdkInited">
        {{ sdkInited ? '✅ SDK已配置' : '初始化SDK' }}
      </button>
    </div>
    
    <div class="section">
      <h2>目标分享链接</h2>
      <p style="word-break: break-all; background: #f0f0f0; padding: 10px;">
        {{ targetLink }}
      </p>
    </div>
    
    <div class="section">
      <h2>状态日志</h2>
      <div class="logs">
        <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const ua = ref(navigator.userAgent);
const isWechat = ref(false);
const wxExists = ref(false);
const sdkInited = ref(false);
const logs = ref([]);
const targetLink = ref('https://513761.com/receive/test-id-123');

const addLog = (msg) => {
  const time = new Date().toLocaleTimeString();
  logs.value.unshift(`[${time}] ${msg}`);
};

const checkEnv = () => {
  isWechat.value = /micromessenger/i.test(navigator.userAgent);
  wxExists.value = typeof window.wx !== 'undefined';
  addLog(`环境检测: 微信=${isWechat.value}, wx对象=${wxExists.value}`);
};

const initSDK = async () => {
  if (!isWechat.value) {
    addLog('❌ 不在微信环境中，无法测试');
    alert('请在微信中打开此页面');
    return;
  }
  
  if (!wxExists.value) {
    addLog('❌ wx对象不存在');
    alert('微信JS-SDK未加载');
    return;
  }
  
  try {
    addLog('开始获取微信config...');
    const url = window.location.href.split('#')[0];
    const response = await axios.get(`/api/wechat/config?url=${encodeURIComponent(url)}`);
    
    if (!response.data.success) {
      addLog('❌ 获取config失败: ' + JSON.stringify(response.data));
      return;
    }
    
    addLog('✅ 获取config成功');
    const { appId, timestamp, nonceStr, signature } = response.data.data;
    
    window.wx.config({
      debug: true, // 开启调试模式，会弹窗显示结果
      appId,
      timestamp,
      nonceStr,
      signature,
      jsApiList: ['updateAppMessageShareData', 'onMenuShareAppMessage']
    });
    
    addLog('调用wx.config...');
    
    window.wx.ready(() => {
      addLog('✅ wx.ready触发');
      
      // 设置分享
      const shareData = {
        title: '【测试】微信分享功能',
        desc: '如果你看到这个标题，说明SDK配置成功了！',
        link: targetLink.value,
        imgUrl: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico'
      };
      
      addLog('设置分享数据: ' + JSON.stringify(shareData));
      
      window.wx.updateAppMessageShareData({
        ...shareData,
        success: () => {
          addLog('✅ 分享设置成功！');
          sdkInited.value = true;
          alert('SDK配置成功！现在可以点击右上角分享了');
        },
        fail: (err) => {
          addLog('❌ 分享设置失败: ' + JSON.stringify(err));
        }
      });
    });
    
    window.wx.error((res) => {
      addLog('❌ wx.error: ' + JSON.stringify(res));
      alert('SDK配置失败: ' + JSON.stringify(res));
    });
    
  } catch (error) {
    addLog('❌ 异常: ' + error.message);
    alert('错误: ' + error.message);
  }
};

onMounted(() => {
  checkEnv();
});
</script>

<style scoped>
.test-page {
  padding: 20px;
  font-family: monospace;
}

.section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

h1 {
  color: #07c160;
}

h2 {
  font-size: 16px;
  color: #666;
}

button {
  background: #07c160;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
}

button:disabled {
  background: #ccc;
}

.logs {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 12px;
}

.logs > div {
  padding: 4px 0;
  border-bottom: 1px solid #e0e0e0;
}

ol {
  padding-left: 20px;
  line-height: 1.8;
}
</style>

