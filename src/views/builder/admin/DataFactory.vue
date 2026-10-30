<template>
  <div class="df-page ai-surface-page" v-loading="loading">
    <!-- 深色数据流导航（线框 7） -->
    <aside class="df-nav">
      <div class="df-nav-item" :class="{ active: activeId === 'home' }" @click="activeId = 'home'">
        <AppIcon name="首页" :size="16" />
        <span>首页</span>
      </div>
      <div
        v-for="f in flows"
        :key="f.id"
        class="df-nav-item"
        :class="{ active: activeId === f.id }"
        @click="activeId = f.id"
      >
        <el-icon><DocumentCopy /></el-icon>
        <span class="df-flow-name">{{ f.name }}</span>
        <AppTooltip content="删除数据流" placement="right">
          <el-icon class="df-del" @click.stop="onDelete(f)"><Close /></el-icon>
        </AppTooltip>
      </div>
    </aside>

    <!-- 主区域 -->
    <main class="df-main">
      <div class="df-actions">
        <el-button type="primary" @click="createFlow">
          <AppIcon class="el-icon--left" name="添加" :size="16" />新建数据流
        </el-button>
        <el-button class="ai-btn" plain @click="ElMessage.info('AI 数据分析师（演示能力入口）')">
          <AppIcon name="业务维护AI助手" :size="16" />AI数据分析师
        </el-button>
      </div>

      <el-card shadow="never" class="sync-card">
        <template #header>
          <span class="sync-title">{{ activeId === 'home' ? '数据同步' : activeFlow?.name }}</span>
        </template>
        <div class="sync-row">
          <el-select
            v-model="syncTable"
            placeholder="选择要同步的数据表"
            class="sync-select"
            filterable
            fit-input-width
          >
            <el-option v-for="t in tables" :key="t" :label="t" :value="t" />
          </el-select>
          <el-button type="primary" :disabled="!syncTable" @click="onSync">开始同步</el-button>
        </div>
        <div class="sync-hint">
          数据表来源：<b>当前单位内的全部表单 / 审批</b
          >（含应用包外应用，G4）；同步结果可在数据流节点中作为数据源使用。
        </div>

        <el-table v-if="syncLogs.length" :data="syncLogs" size="small" border class="log-table">
          <el-table-column prop="table" label="数据表" min-width="220" />
          <el-table-column prop="rows" label="同步条数" width="100" align="center" />
          <el-table-column prop="syncedAt" label="同步时间" width="190" />
        </el-table>
      </el-card>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchDataFlows, createDataFlow, deleteDataFlow, startDataSync } from '@/api/appPackage'
import AppIcon from '@/components/icons/AppIcon.vue'

const loading = ref(false)
const flows = ref([])
const tables = ref([])
const activeId = ref('home')
const syncTable = ref('')
const syncLogs = ref([])

const activeFlow = computed(() => flows.value.find((f) => f.id === activeId.value))

async function load() {
  loading.value = true
  try {
    const data = await fetchDataFlows()
    flows.value = data.flows
    tables.value = data.tables
  } finally {
    loading.value = false
  }
}

async function createFlow() {
  let name
  try {
    const res = await ElMessageBox.prompt('请输入数据流名称', '新建数据流', {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
      inputPlaceholder: '如：后勤数据月度同步'
    })
    name = res.value
  } catch {
    return
  }
  if (!name.trim()) return ElMessage.warning('名称不能为空')
  const flow = await createDataFlow({ name })
  ElMessage.success('已新建数据流')
  await load()
  activeId.value = flow.id
}

async function onDelete(flow) {
  try {
    await ElMessageBox.confirm(`确认删除数据流「${flow.name}」？`, '删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'delete-confirm-button'
    })
  } catch {
    return
  }
  await deleteDataFlow(flow.id)
  if (activeId.value === flow.id) activeId.value = 'home'
  ElMessage.success('已删除')
  load()
}

async function onSync() {
  const data = await startDataSync(syncTable.value)
  ElMessage.success(data.message)
  syncLogs.value.unshift({ table: data.table, rows: data.rows, syncedAt: data.syncedAt })
}

onMounted(load)
</script>

<style scoped>
.df-page {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 560px;
}

/* 深色左导航 */
.df-nav {
  width: 220px;
  flex-shrink: 0;
  background: #12141a;
  border-radius: 8px;
  padding: 12px 8px;
  overflow-y: auto;
}
.df-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border-radius: 6px;
  color: #c5c6c9;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 2px;
}
.df-nav-item:hover {
  background: #2f3137;
  color: #fff;
}
.df-nav-item.active {
  background: #eaf2ff;
  color: var(--brand-1);
  font-weight: 600;
}
.df-flow-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.df-del {
  opacity: 0;
  font-size: 13px;
  color: #c5c6c9;
}
.df-nav-item:hover .df-del {
  opacity: 0.8;
}
.df-del:hover {
  color: #ec3327 !important;
}

/* 主区域 */
.df-main {
  flex: 1;
  min-width: 0;
}
.df-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.ai-btn {
  border-color: #b9d3ff;
  background: #fff;
  color: var(--brand-1);
  height: 32px;
}
.ai-btn:hover {
  border-color: var(--brand-1);
  background: #edf5ff;
}
.sync-card {
  border-radius: 8px;
}
.sync-title {
  font-weight: 600;
}
.sync-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.sync-select {
  width: 320px;
}
.sync-hint {
  font-size: 12px;
  color: #57585e;
  margin-top: 10px;
}
.log-table {
  margin-top: 14px;
}
</style>
