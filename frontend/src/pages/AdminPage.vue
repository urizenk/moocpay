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
            type="digit"
            :rules="[{ required: true, message: '请填写展示金额' }]"
          />
          <van-field
            v-model="form.actualAmount"
            name="actualAmount"
            label="实际金额（元）"
            placeholder="请输入实际金额"
            type="digit"
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
      <div class="section-title">| 我的转账记录</div>
      
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadRecords"
      >
        <div class="record-item" v-for="item in records" :key="item.id">
          <div class="record-header">
            <div class="record-amount">
              <span class="amount-value">{{ item.displayName }}</span>
              <span class="actual-amount">(实际到账: {{ item.actualAmount.toFixed(2) }}元)</span>
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
          v-if="!loading && records.length === 0" 
          description="暂无转账记录"
          image="search"
        />
      </van-list>
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
          type="digit"
        />
        <van-field
          v-model="editForm.actualAmount"
          label="实际金额（元）"
          placeholder="请输入实际金额"
          type="digit"
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
  theme: 'classic' // 默认经典转账主题
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
      
      // 刷新列表
      records.value = [];
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
    const response = await axios.get('/api/transfers');
    
    const data = response.data?.data || response.data;
    
    if (Array.isArray(data)) {
      // 按创建时间倒序排序（最新的在前面）
      records.value = data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    
    loading.value = false;
    finished.value = true;
  } catch (error) {
    console.error('加载转账记录失败:', error);
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
      
      // 更新本地记录
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
    // 复制到剪贴板
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('已复制到剪贴板');
      
      // 在微信中打开分享页面
      if (/micromessenger/i.test(navigator.userAgent)) {
        router.push(`/share/${item.id}`);
      }
    }).catch(() => {
      showToast('复制失败，请手动复制');
    });
  }).catch(() => {
    // 取消
  });
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
        
        // 从列表中移除
        records.value = records.value.filter(r => r.id !== item.id);
      } else {
        showToast('撤销失败');
      }
    } catch (error) {
      closeToast();
      console.error('撤销失败:', error);
      showToast('撤销失败，请重试');
    }
  }).catch(() => {
    // 取消
  });
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
    showCancelButton: true,
    beforeClose: (action, done) => {
      if (action === 'confirm') {
        // 这里可以添加保存逻辑
        done();
      } else {
        done();
      }
    }
  });
};

// 编辑头像
const editAvatar = () => {
  showToast('头像上传功能开发中...');
};

onMounted(() => {
  loadRecords();
});
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f7f8fa;
  padding-bottom: 20px;
  overflow-x: hidden;
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

/* 移动端响应式适配 */

/* 小屏幕适配 */
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
}

/* 超小屏幕适配 */
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

/* 大屏幕适配 */
@media (min-width: 414px) {
  .balance-amount {
    font-size: 32px;
  }
  
  .amount-value {
    font-size: 22px;
  }
}

/* 横屏适配 */
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

/* 平板适配 */
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

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .nav-bar {
    padding-top: max(0px, env(safe-area-inset-top));
  }
  
  .records-section {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}

/* 触摸优化 */
.record-item {
  -webkit-tap-highlight-color: transparent;
}

.record-actions :deep(.van-button) {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
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

@media (max-width: 375px) {
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
</style>

    
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
      
      // 更新本地记录
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
    // 复制到剪贴板
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('已复制到剪贴板');
      
      // 在微信中打开分享页面
      if (/micromessenger/i.test(navigator.userAgent)) {
        router.push(`/share/${item.id}`);
      }
    }).catch(() => {
      showToast('复制失败，请手动复制');
    });
  }).catch(() => {
    // 取消
  });
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
        
        // 从列表中移除
        records.value = records.value.filter(r => r.id !== item.id);
      } else {
        showToast('撤销失败');
      }
    } catch (error) {
      closeToast();
      console.error('撤销失败:', error);
      showToast('撤销失败，请重试');
    }
  }).catch(() => {
    // 取消
  });
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
    showCancelButton: true,
    beforeClose: (action, done) => {
      if (action === 'confirm') {
        // 这里可以添加保存逻辑
        done();
      } else {
        done();
      }
    }
  });
};

// 编辑头像
const editAvatar = () => {
  showToast('头像上传功能开发中...');
};

onMounted(() => {
  loadRecords();
});
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f7f8fa;
  padding-bottom: 20px;
  overflow-x: hidden;
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

/* 移动端响应式适配 */

/* 小屏幕适配 */
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
}

/* 超小屏幕适配 */
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

/* 大屏幕适配 */
@media (min-width: 414px) {
  .balance-amount {
    font-size: 32px;
  }
  
  .amount-value {
    font-size: 22px;
  }
}

/* 横屏适配 */
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

/* 平板适配 */
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

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .nav-bar {
    padding-top: max(0px, env(safe-area-inset-top));
  }
  
  .records-section {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}

/* 触摸优化 */
.record-item {
  -webkit-tap-highlight-color: transparent;
}

.record-actions :deep(.van-button) {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
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

@media (max-width: 375px) {
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
</style>
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="转账设置" name="settings">
        <div class="settings-container">
          <van-form @submit="saveSettings">
            <van-cell-group inset>
              <van-field
                v-model="settings.displayName"
                name="displayName"
                label="显示金额"
                placeholder="请输入显示金额"
                :rules="[{ required: true, message: '请填写显示金额' }]"
              />
              <van-field
                v-model="settings.actualAmount"
                name="actualAmount"
                label="实际金额"
                placeholder="请输入实际金额"
                type="number"
                :rules="[{ required: true, message: '请填写实际金额' }]"
              />
              <van-field
                v-model="settings.senderName"
                name="senderName"
                label="付款人姓名"
                placeholder="请输入付款人姓名"
                :rules="[{ required: true, message: '请填写付款人姓名' }]"
              />
              <van-field
                v-model="settings.message"
                name="message"
                label="转账留言"
                placeholder="请输入转账留言"
              />
            </van-cell-group>
            
            <div class="submit-button">
              <van-button round block type="primary" native-type="submit">
                保存设置
              </van-button>
              <van-button round block plain type="danger" @click="resetSettings" style="margin-top: 10px;">
                重置为默认值
              </van-button>
            </div>
          </van-form>
        </div>
      </van-tab>
      
      <van-tab title="转账记录" name="records">
        <div class="records-container">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <van-cell v-for="item in records" :key="item.id" :title="item.senderName" :value="item.displayName" @click="viewRecord(item)" />
          </van-list>
        </div>
      </van-tab>
      
      <van-tab title="数据统计" name="statistics">
        <div class="statistics-container">
          <van-cell-group inset>
            <van-cell title="总转账笔数" :value="statistics.totalCount" />
            <van-cell title="总显示金额" :value="'¥' + statistics.totalDisplayAmount" />
            <van-cell title="总实际金额" :value="'¥' + statistics.totalActualAmount" />
            <van-cell title="今日转账笔数" :value="statistics.todayCount" />
            <van-cell title="今日实际金额" :value="'¥' + statistics.todayActualAmount" />
          </van-cell-group>
          
          <div style="margin: 20px 16px;">
            <van-button round block type="primary" @click="refreshStatistics">
              刷新统计数据
            </van-button>
          </div>
          
          <div class="chart-container">
            <div class="chart-title">最近7天转账趋势</div>
            <div class="chart-placeholder">
              <p>图表功能开发中...</p>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showConfirmDialog } from 'vant'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('settings')
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = ref(10)

const settings = ref({
  displayName: '100.00元',
  actualAmount: '0.1',
  senderName: '张三',
  message: '恭喜发财，大吉大利'
})

const records = ref([])
const statistics = ref({
  totalCount: 0,
  totalDisplayAmount: '0.00',
  totalActualAmount: '0.00',
  todayCount: 0,
  todayActualAmount: '0.00'
})

const saveSettings = async () => {
  try {
    showLoadingToast({
      message: '保存中...',
      forbidClick: true,
      duration: 0
    })

    const response = await axios.post('/api/settings', settings.value)
    closeToast()

    // 处理API响应格式
    if (response.data || response.status === 200) {
      showToast('设置保存成功')
      // 重新加载设置以确保数据同步
      await loadSettings()
    } else {
      showToast('设置保存失败')
    }
  } catch (error) {
    closeToast()
    console.error('保存设置失败:', error)
    showToast('设置保存失败')
  }
}

const onLoad = async () => {
  try {
    const response = await axios.get(`/api/transfers?page=${page.value}&size=${pageSize.value}`)
    
    // 处理API响应格式
    const isSuccess = response.data?.success !== false
    const data = response.data?.data || response.data || []
    
    if (isSuccess && Array.isArray(data)) {
      // 如果直接是数组，则处理为分页格式
      if (Array.isArray(data)) {
        const paginatedData = {
          list: data.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
          total: data.length
        }
        
        records.value = [...records.value, ...paginatedData.list]
        loading.value = false
        
        if (paginatedData.list.length < pageSize.value) {
          finished.value = true
        } else {
          page.value++
        }
      } else {
        // 如果是分页格式对象
        records.value = [...records.value, ...data.list]
        loading.value = false
        
        if (data.list.length < pageSize.value) {
          finished.value = true
        } else {
          page.value++
        }
      }
    } else {
      loading.value = false
      finished.value = true
      showToast('获取转账记录失败')
    }
  } catch (error) {
    console.error('获取转账记录失败:', error)
    loading.value = false
    finished.value = true
    showToast('获取转账记录失败')
  }
}

const viewRecord = (record) => {
  showConfirmDialog({
    title: '转账详情',
    message: `
      付款人: ${record.senderName}\n
      显示金额: ${record.displayName}\n
      实际金额: ¥${record.actualAmount}\n
      留言: ${record.message || '无'}\n
      状态: ${getStatusText(record.status)}\n
      创建时间: ${formatDateTime(record.createdAt)}\n
      ${record.receiveTime ? `收款时间: ${formatDateTime(record.receiveTime)}` : ''}
    `,
    showCancelButton: false
  })
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return '待收款'
    case 'received':
      return '已收款'
    case 'expired':
      return '已过期'
    default:
      return '未知状态'
  }
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const loadSettings = async () => {
  try {
    const response = await axios.get('/api/settings')
    
    // 处理API响应格式
    const data = response.data?.data || response.data || {}
    
    if (data && Object.keys(data).length > 0) {
      settings.value = {
        displayName: data.displayName || '100.00元',
        actualAmount: data.actualAmount ? data.actualAmount.toString() : '0.1',
        senderName: data.senderName || '张三',
        message: data.message || '恭喜发财，大吉大利'
      }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const loadStatistics = async () => {
  try {
    const response = await axios.get('/api/statistics')
    
    // 处理API响应格式
    const data = response.data?.data || response.data || {}
    
    if (data && Object.keys(data).length > 0) {
      statistics.value = {
        totalCount: data.totalCount || 0,
        totalDisplayAmount: data.totalDisplayAmount || '0.00',
        totalActualAmount: data.totalActualAmount || '0.00',
        todayCount: data.todayCount || 0,
        todayActualAmount: data.todayActualAmount || '0.00'
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const resetSettings = async () => {
  try {
    showConfirmDialog({
      title: '确认重置',
      message: '确定要重置所有设置为默认值吗？此操作不可恢复。',
    }).then(async () => {
      showLoadingToast({
        message: '重置中...',
        forbidClick: true,
        duration: 0
      })

      const response = await axios.post('/api/settings/reset')
      closeToast()

      // 处理API响应格式
      if (response.data || response.status === 200) {
        showToast('设置重置成功')
        // 重新加载设置
        await loadSettings()
      } else {
        showToast('设置重置失败')
      }
    }).catch(() => {
      // 用户取消重置
    })
  } catch (error) {
    closeToast()
    console.error('重置设置失败:', error)
    showToast('设置重置失败')
  }
}

const refreshStatistics = async () => {
  try {
    loading.value = true
    await loadStatistics()
    showToast('统计数据已刷新')
  } catch (error) {
    console.error('刷新统计数据失败:', error)
    showToast('刷新统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadStatistics()
})
</script>

<style scoped>
.admin-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.nav-bar {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.settings-container {
  padding: 20px 0;
}

.submit-button {
  margin: 20px 16px;
}

.records-container {
  padding: 10px 0;
}

.statistics-container {
  padding: 10px 0;
}

.chart-container {
  margin: 20px 16px;
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  border-radius: 8px;
  color: #999;
}
</style>