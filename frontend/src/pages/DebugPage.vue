<template>
  <div class="debug-page">
    <h1>🔍 系统诊断</h1>
    
    <div class="debug-section">
      <h2>1. API测试</h2>
      <button @click="testAPI" class="test-btn">测试 GET /api/transfers</button>
      <pre>{{ apiResult }}</pre>
    </div>
    
    <div class="debug-section">
      <h2>2. 数据解析</h2>
      <pre>{{ parsedData }}</pre>
    </div>
    
    <div class="debug-section">
      <h2>3. 记录列表</h2>
      <pre>{{ recordsList }}</pre>
    </div>
    
    <div class="debug-section">
      <h2>4. 环境信息</h2>
      <pre>{{ envInfo }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const apiResult = ref('点击上方按钮测试API');
const parsedData = ref('');
const recordsList = ref('');
const envInfo = ref(JSON.stringify({
  location: window.location.href,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
}, null, 2));

const testAPI = async () => {
  try {
    apiResult.value = '正在请求...';
    
    const response = await axios.get('/api/transfers');
    apiResult.value = JSON.stringify(response.data, null, 2);
    
    // 解析数据
    const data = response.data?.data || response.data;
    parsedData.value = JSON.stringify(data, null, 2);
    
    // 提取列表
    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && Array.isArray(data.list)) {
      list = data.list;
    }
    
    recordsList.value = `记录数量: ${list.length}\n\n` + JSON.stringify(list, null, 2);
    
  } catch (error) {
    apiResult.value = `错误: ${error.message}\n\n` + JSON.stringify(error, null, 2);
  }
};
</script>

<style scoped>
.debug-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: monospace;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.debug-section {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  color: #666;
  font-size: 18px;
}

.test-btn {
  background: #07c160;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 12px;
}

.test-btn:hover {
  background: #06ad56;
}

pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}
</style>

