<template>
  <div class="admin-container">
    <van-nav-bar
      title="⚡会员管理后台"
      right-text="⚙️"
      @click-right="showSettings = true"
      class="nav-bar"
    />
    
    <!-- 余额显示 -->
    <div class="balance-header">
      <div class="balance-label">余额：</div>
      <div class="balance-amount">{{ balance.toFixed(2) }} 元</div>
    </div>
    
    <!-- 快捷操作按钮 -->
    <div class="quick-actions">
      <van-button 
        type="warning" 
        size="small" 
        icon="warning-o"
        @click="router.push('/debug')"
      >
        数据诊断
      </van-button>
    </div>
    
    <!-- 创建新转账表单 -->
    <div class="create-form">
      <div class="form-title">| 创建新转账</div>
      
      <van-form @submit="createTransfer">
        <van-cell-group inset>
          <van-field
            v-model="form.displayName"
            name="displayName"
            label="展示金额（元）"
            placeholder="请输入展示金额"
            type="number"
            step="0.01"
            :rules="[{ required: true, message: '请填写展示金额' }]"
          />
          <van-field
            v-model="form.actualAmount"
            name="actualAmount"
            label="实际金额（元）"
            placeholder="请输入实际金额"
            type="number"
            step="0.01"
            :rules="[{ required: true, message: '请填写实际金额' }]"
          />
          <van-field
            v-model="form.message"
            name="message"
            label="转账备注"
            placeholder="请输入备注"
            type="textarea"
            rows="2"
          />
          
          <!-- 主题选择器 -->
          <van-field name="theme" label="收款样式">
            <template #input>
              <div class="theme-selector">
                <div 
                  v-for="theme in themes" 
                  :key="theme.id"
                  class="theme-option"
                  :class="{ 'active': form.theme === theme.id }"
                  @click="selectTheme(theme.id)"
                >
                  <div class="theme-icon">{{ theme.icon }}</div>
                  <div class="theme-name">{{ theme.name }}</div>
                </div>
              </div>
            </template>
          </van-field>
        </van-cell-group>
        
        <div class="submit-button">
          <van-button round block type="primary" native-type="submit" :loading="creating">
            创建转账
          </van-button>
        </div>
      </van-form>
    </div>
    
    <!-- 转账记录列表 -->
    <div class="records-section">
      <div class="section-title">| 我的转账记录（共{{ records.length }}条）</div>
      
      <!-- 直接渲染，不使用van-list -->
      <div class="records-container">
        <div class="record-item" v-for="item in records" :key="item.id">
          <div class="record-header">
            <div class="record-amount">
              <span class="amount-value">{{ item.displayName }}</span>
              <span class="actual-amount">(实际到账: {{ parseFloat(item.actualAmount).toFixed(2) }}元)</span>
            </div>
          </div>
          
          <div class="record-info">
            <div class="info-row">
              <span class="label">备注</span>
              <span class="value">{{ item.message || '- -' }}</span>
            </div>
            
            <div class="info-row">
              <span class="label">状态</span>
              <van-tag 
                :type="item.accountStatus === 'available' ? 'success' : 'danger'"
                round
              >
                {{ item.accountStatus === 'available' ? '可用' : '冻结' }}
              </van-tag>
            </div>
            
            <div class="info-row">
              <span class="label">时间</span>
              <span class="value">{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
          
          <div class="record-actions">
            <van-button 
              type="primary" 
              size="small" 
              round
              icon="edit"
              @click="editRecord(item)"
            >
              编辑
            </van-button>
            <van-button 
              type="success" 
              size="small" 
              round
              icon="share-o"
              @click="shareRecord(item)"
            >
              分享
            </van-button>
            <van-button 
              type="warning" 
              size="small" 
              round
              icon="search"
              @click="diagRecord(item)"
            >
              诊断
            </van-button>
            <van-button 
              type="danger" 
              size="small" 
              round
              icon="revoke"
              @click="revokeRecord(item)"
            >
              撤销
            </van-button>
          </div>
        </div>
        
        <van-empty 
          v-if="records.length === 0" 
          description="暂无转账记录"
          image="search"
        />
      </div>
    </div>
    
    <!-- 编辑弹窗 -->
    <van-dialog 
      v-model:show="showEditDialog" 
      title="📝 编辑转账信息"
      show-cancel-button
      @confirm="saveEdit"
    >
      <van-form style="padding: 20px;">
        <van-field
          v-model="editForm.displayName"
          label="展示金额（元）"
          placeholder="请输入展示金额"
          type="number"
          step="0.01"
        />
        <van-field
          v-model="editForm.actualAmount"
          label="实际金额（元）"
          placeholder="请输入实际金额"
          type="number"
          step="0.01"
        />
        <van-field
          v-model="editForm.message"
          label="转账说明"
          placeholder="请输入说明"
          type="textarea"
          rows="2"
        />
        
        <div style="margin-top: 16px;">
          <div style="margin-bottom: 8px; font-size: 14px; color: #646566;">收款样式</div>
          <div class="theme-selector-small">
            <div 
              v-for="theme in themes" 
              :key="theme.id"
              class="theme-option-small"
              :class="{ 'active': editForm.theme === theme.id }"
              @click="editForm.theme = theme.id"
            >
              <span class="theme-icon-small">{{ theme.icon }}</span>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 16px;">
          <div style="margin-bottom: 8px; font-size: 14px; color: #646566;">状态</div>
          <van-radio-group v-model="editForm.accountStatus" direction="horizontal">
            <van-radio name="available" icon-size="18px">
              <span style="color: #07c160;">✓ 可用</span>
            </van-radio>
            <van-radio name="frozen" icon-size="18px">
              <span style="color: #ee0a24;">✗ 冻结</span>
            </van-radio>
          </van-radio-group>
        </div>
      </van-form>
    </van-dialog>
    
    <!-- 设置弹窗 -->
    <van-popup v-model:show="showSettings" position="right" :style="{ width: '80%', height: '100%' }">
      <div class="settings-popup">
        <van-nav-bar
          title="系统设置"
          left-text="关闭"
          left-arrow
          @click-left="showSettings = false"
        />
        
        <van-cell-group inset style="margin-top: 16px;">
          <van-cell title="付款人姓名" :value="senderName" is-link @click="editSenderName" />
          <van-cell title="付款人头像" is-link @click="editAvatar" />
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast, showConfirmDialog, showDialog } from 'vant';
import axios from 'axios';
import { getAllThemes } from '@/styles/themes';

const router = useRouter();
const loading = ref(false);
const finished = ref(false);
const creating = ref(false);
const balance = ref(9989.08);
const senderName = ref('张三');
const showSettings = ref(false);
const showEditDialog = ref(false);

// 获取所有主题
const themes = ref(getAllThemes());

// 创建表单
const form = ref({
  displayName: '',
  actualAmount: '',
  message: '',
  theme: 'classic'
});

// 编辑表单
const editForm = ref({
  id: '',
  displayName: '',
  actualAmount: '',
  message: '',
  accountStatus: 'available',
  theme: 'classic'
});

// 选择主题
const selectTheme = (themeId) => {
  form.value.theme = themeId;
};

// 转账记录
const records = ref([]);

// 创建转账
const createTransfer = async () => {
  try {
    creating.value = true;
    
    const displayAmount = parseFloat(form.value.displayName);
    const actualAmount = parseFloat(form.value.actualAmount);
    
    if (isNaN(displayAmount) || displayAmount <= 0) {
      showToast('请输入有效的展示金额');
      creating.value = false;
      return;
    }
    
    if (isNaN(actualAmount) || actualAmount <= 0) {
      showToast('请输入有效的实际金额');
      creating.value = false;
      return;
    }
    
    showLoadingToast({
      message: '创建中...',
      forbidClick: true,
      duration: 0
    });
    
    console.log('开始创建转账...');
    const response = await axios.post('/api/transfers', {
      displayName: `${displayAmount.toFixed(2)}元`,
      actualAmount: actualAmount,
      senderName: senderName.value,
      senderAvatar: 'https://via.placeholder.com/50x50?text=' + encodeURIComponent(senderName.value),
      message: form.value.message || '',
      status: 'pending',
      accountStatus: 'available',
      theme: form.value.theme
    });
    
    console.log('创建响应:', response.data);
    closeToast();
    
    if (response.data.success || response.data.id) {
      showToast('创建成功');
      
      // 清空表单
      form.value = {
        displayName: '',
        actualAmount: '',
        message: '',
        theme: 'classic'
      };
      
      // 重新加载列表（最可靠的方式）
      console.log('重新加载转账列表...');
      loading.value = true;
      finished.value = false;
      await loadRecords();
    } else {
      showToast('创建失败');
    }
  } catch (error) {
    closeToast();
    console.error('创建转账失败:', error);
    showToast('创建失败，请重试');
  } finally {
    creating.value = false;
  }
};

// 加载转账记录
const loadRecords = async () => {
  try {
    console.log('========== 开始加载转账记录 ==========');
    const response = await axios.get('/api/transfers');
    console.log('1. 原始API响应:', JSON.stringify(response.data, null, 2));
    
    // 确保获取正确的data对象
    let data = null;
    if (response.data && response.data.data) {
      data = response.data.data;
      console.log('2. 提取data对象:', JSON.stringify(data, null, 2));
    } else {
      data = response.data;
      console.log('2. 直接使用response.data:', JSON.stringify(data, null, 2));
    }
    
    // 处理返回的数据结构
    let transferList = [];
    if (Array.isArray(data)) {
      // 如果data本身就是数组
      transferList = data;
      console.log('3. data是数组，直接使用');
    } else if (data && data.list && Array.isArray(data.list)) {
      // 如果data有list属性且是数组
      transferList = data.list;
      console.log('3. data.list是数组，使用data.list');
    } else {
      console.error('3. ❌ 未识别的数据格式:', data);
    }
    
    console.log('4. 转账列表长度:', transferList.length);
    console.log('5. 转账列表内容:', JSON.stringify(transferList, null, 2));
    
    // 按时间倒序排序
    records.value = transferList.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    console.log('6. ✅ 最终records.value长度:', records.value.length);
    console.log('7. ✅ 最终records.value:', records.value);
    console.log('========== 加载完成 ==========');
    
    loading.value = false;
    finished.value = true;
  } catch (error) {
    console.error('❌ 加载转账记录失败:', error);
    console.error('错误详情:', error.response?.data);
    showToast('加载失败:' + error.message);
    loading.value = false;
    finished.value = true;
  }
};

// 编辑记录
const editRecord = (item) => {
  editForm.value = {
    id: item.id,
    displayName: item.displayName.replace('元', ''),
    actualAmount: item.actualAmount.toString(),
    message: item.message || '',
    accountStatus: item.accountStatus || 'available',
    theme: item.theme || 'classic'
  };
  showEditDialog.value = true;
};

// 保存编辑
const saveEdit = async () => {
  try {
    showLoadingToast({
      message: '保存中...',
      forbidClick: true,
      duration: 0
    });
    
    const displayAmount = parseFloat(editForm.value.displayName);
    const actualAmount = parseFloat(editForm.value.actualAmount);
    
    const response = await axios.patch(`/api/transfers/${editForm.value.id}`, {
      displayName: `${displayAmount.toFixed(2)}元`,
      actualAmount: actualAmount,
      message: editForm.value.message,
      accountStatus: editForm.value.accountStatus,
      theme: editForm.value.theme
    });
    
    closeToast();
    
    if (response.data.success || response.data.data) {
      showToast('保存成功');
      
      const index = records.value.findIndex(r => r.id === editForm.value.id);
      if (index !== -1) {
        records.value[index] = {
          ...records.value[index],
          displayName: `${displayAmount.toFixed(2)}元`,
          actualAmount: actualAmount,
          message: editForm.value.message,
          accountStatus: editForm.value.accountStatus,
          theme: editForm.value.theme,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      showToast('保存失败');
    }
  } catch (error) {
    closeToast();
    console.error('保存失败:', error);
    showToast('保存失败，请重试');
  }
};

// 分享记录
const shareRecord = (item) => {
  const shareUrl = `${window.location.origin}/transfer/${item.id}`;
  
  showDialog({
    title: '分享链接',
    message: `链接已生成，点击"复制"按钮复制链接后，在微信中发送给好友。\n\n${shareUrl}`,
    showCancelButton: true,
    confirmButtonText: '复制链接',
    cancelButtonText: '取消'
  }).then(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('已复制到剪贴板');
      
      if (/micromessenger/i.test(navigator.userAgent)) {
        router.push(`/share/${item.id}`);
      }
    }).catch(() => {
      showToast('复制失败，请手动复制');
    });
  }).catch(() => {});
};

// 诊断记录
const diagRecord = (item) => {
  router.push(`/wechat-diag/${item.id}`);
};

// 撤销记录
const revokeRecord = (item) => {
  showConfirmDialog({
    title: '确认撤销',
    message: '确定要撤销这笔转账吗？撤销后将无法恢复。',
  }).then(async () => {
    try {
      showLoadingToast({
        message: '撤销中...',
        forbidClick: true,
        duration: 0
      });
      
      const response = await axios.delete(`/api/transfers/${item.id}`);
      
      closeToast();
      
      if (response.data.success) {
        showToast('撤销成功');
        records.value = records.value.filter(r => r.id !== item.id);
      } else {
        showToast('撤销失败');
      }
    } catch (error) {
      closeToast();
      console.error('撤销失败:', error);
      showToast('撤销失败，请重试');
    }
  }).catch(() => {});
};

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

// 编辑付款人姓名
const editSenderName = () => {
  showDialog({
    title: '修改付款人姓名',
    message: '请输入新的付款人姓名',
    showCancelButton: true
  });
};

// 编辑头像
const editAvatar = () => {
  showToast('头像上传功能开发中...');
};

onMounted(async () => {
  console.log('AdminPage mounted, 开始加载数据...');
  await loadRecords();
  console.log('数据加载完成，records长度:', records.value.length);
});
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.nav-bar :deep(.van-nav-bar__title) {
  color: white;
  font-weight: bold;
}

.nav-bar :deep(.van-nav-bar__text) {
  color: white;
}

.balance-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.balance-label {
  font-size: 16px;
  margin-right: 8px;
}

.balance-amount {
  font-size: 28px;
  font-weight: bold;
}

.quick-actions {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.create-form {
  background: white;
  margin: 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.form-title {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 4px solid #667eea;
}

.submit-button {
  margin-top: 16px;
}

.submit-button :deep(.van-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.records-section {
  margin: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #667eea;
}

.record-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.record-header {
  margin-bottom: 12px;
}

.record-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.amount-value {
  font-size: 20px;
  font-weight: bold;
  color: #323233;
}

.actual-amount {
  font-size: 12px;
  color: #969799;
}

.record-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f7f8fa;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-size: 14px;
  color: #969799;
}

.info-row .value {
  font-size: 14px;
  color: #323233;
}

.record-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px dashed #ebedf0;
}

.record-actions :deep(.van-button) {
  flex: 1;
  min-height: 32px;
}

.settings-popup {
  height: 100%;
  background-color: #f7f8fa;
}

/* 主题选择器样式 */
.theme-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px 0;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid #ebedf0;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.theme-option:active {
  transform: scale(0.95);
}

.theme-option.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.theme-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.theme-name {
  font-size: 12px;
  color: #646566;
  text-align: center;
}

.theme-option.active .theme-name {
  color: #667eea;
  font-weight: 500;
}

/* 编辑对话框中的主题选择器（小版） */
.theme-selector-small {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.theme-option-small {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 2px solid #ebedf0;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #fafafa;
}

.theme-option-small:active {
  transform: scale(0.9);
}

.theme-option-small.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
}

.theme-icon-small {
  font-size: 20px;
}

/* 移动端响应式适配 */
@media (max-width: 375px) {
  .balance-amount {
    font-size: 24px;
  }
  
  .form-title,
  .section-title {
    font-size: 15px;
  }
  
  .record-item {
    padding: 14px;
  }
  
  .amount-value {
    font-size: 18px;
  }
  
  .record-actions {
    gap: 6px;
  }
  
  .theme-selector {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .theme-icon {
    font-size: 24px;
  }
  
  .theme-name {
    font-size: 11px;
  }
}

@media (max-width: 320px) {
  .create-form,
  .records-section {
    margin: 12px 12px;
  }
  
  .balance-amount {
    font-size: 22px;
  }
  
  .record-actions :deep(.van-button) {
    font-size: 13px;
    padding: 0 8px;
  }
}

@media (min-width: 414px) {
  .balance-amount {
    font-size: 32px;
  }
  
  .amount-value {
    font-size: 22px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .balance-header {
    padding: 12px 20px;
  }
  
  .create-form,
  .records-section {
    margin: 12px 16px;
  }
  
  .record-item {
    padding: 12px;
  }
}

@media (min-width: 768px) {
  .admin-container {
    max-width: 414px;
    margin: 0 auto;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  }
  
  .nav-bar,
  .balance-header {
    border-radius: 0;
  }
}

@supports (padding: max(0px)) {
  .nav-bar {
    padding-top: max(0px, env(safe-area-inset-top));
  }
  
  .records-section {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}

.record-item {
  -webkit-tap-highlight-color: transparent;
}

.record-actions :deep(.van-button) {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
</style>
