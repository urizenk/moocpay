<template>
  <div class="admin-container">
    <van-nav-bar
      title="后台管理"
      class="nav-bar"
    />
    
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