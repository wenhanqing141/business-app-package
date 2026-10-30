<template>
  <div class="flow-page ai-surface-page" v-loading="loading">
    <!-- 标题 + 说明 + 新建 -->
    <div class="page-head">
      <div>
        <span class="page-title">业务流程管理</span>
        <AppTooltip placement="right">
          <template #content>
            通过简单的可视化配置实现应用之间数据互联互通，以及自动发送通知等自动化业务流程。
          </template>
          <AppIcon class="info-icon" name="info" :size="16" />
        </AppTooltip>
      </div>
      <el-button type="primary" @click="createDialog = true">
        <AppIcon class="el-icon--left" name="添加" :size="16" />新建业务流程
      </el-button>
    </div>
    <div class="flow-intro">
      通过简单的可视化配置实现应用之间<b>数据互联互通</b>以及<b>自动发送通知</b>等自动化业务流程。
      <el-link
        type="primary"
        :underline="false"
        class="manual-link"
        @click="ElMessage.info('使用手册（演示链接）')"
        >使用手册</el-link
      >
    </div>

    <el-card shadow="never" class="flow-card">
      <div class="flow-toolbar">
        <div class="tags">
          <el-button size="small" plain @click="ElMessage.info('标签管理（演示）')">
            <AppIcon class="el-icon--left" name="添加" :size="16" />添加标签
          </el-button>
          <span class="tag-chip active">全部流程</span>
        </div>
        <div class="filters">
          <el-select v-model="filterSource" size="small" class="f-select" fit-input-width>
            <el-option label="全部表单/审批" value="all" />
            <el-option label="表单" value="form" />
            <el-option label="审批" value="approval" />
          </el-select>
          <el-select v-model="filterStatus" size="small" class="f-select" fit-input-width>
            <el-option label="全部状态" value="all" />
            <el-option label="启用中" value="on" />
            <el-option label="已停用" value="off" />
          </el-select>
          <el-input
            v-model="filterName"
            size="small"
            placeholder="流程名称"
            clearable
            class="f-input"
          />
        </div>
      </div>

      <el-tabs v-model="triggerTab" class="flow-tabs">
        <el-tab-pane :label="`表单/审批事件触发(${counts.event})`" name="event" />
        <el-tab-pane :label="`定时触发(${counts.timer})`" name="timer" />
      </el-tabs>

      <el-table :data="pagedList" border size="small" row-key="id" class="flow-table">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div v-if="row.children?.length" class="children-wrap">
              <div v-for="c in row.children" :key="c.id" class="child-row">
                <el-icon class="c-icon"><Switch /></el-icon>
                <span class="c-name">{{ c.name }}</span>
                <el-tag size="small" type="info" effect="plain">{{ c.event }}</el-tag>
                <el-icon class="c-arrow"><Right /></el-icon>
                <el-tag size="small" type="success" effect="plain">{{ c.action }}</el-tag>
              </div>
            </div>
            <el-empty v-else :image-size="48" description="暂无子流程节点" />
          </template>
        </el-table-column>
        <el-table-column label="名称" min-width="220">
          <template #default="{ row }">
            <span class="flow-name"
              >{{ row.name
              }}<span class="flow-count">（{{ row.children?.length || 0 }}）</span></span
            >
          </template>
        </el-table-column>
        <el-table-column label="运行状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" @change="onToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column label="执行方式" width="110" prop="execMode" />
        <el-table-column label="修改时间" width="170" prop="updatedAt" />
        <el-table-column label="修改人" width="100" prop="updater" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="ElMessage.info(`编辑「${row.name}」（演示）`)"
              >编辑</el-button
            >
            <el-button link type="primary" size="small" @click="ElMessage.info('执行日志（演示）')"
              >日志</el-button
            >
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!filteredList.length" :image-size="72" description="暂无业务流程" />

      <div class="flow-footer">
        <el-pagination
          v-model:current-page="page"
          :page-size="20"
          :total="filteredList.length"
          layout="total, prev, pager, next, jumper"
        />
        <span class="page-size">每页20条</span>
      </div>
    </el-card>

    <!-- 新建业务流程 -->
    <el-dialog v-model="createDialog" title="新建业务流程" width="460px">
      <el-form label-width="92px">
        <el-form-item label="流程名称" required>
          <el-input v-model="form.name" placeholder="请输入业务流程名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="触发方式">
          <el-radio-group v-model="form.trigger">
            <el-radio value="event">表单/审批事件触发</el-radio>
            <el-radio value="timer">定时触发</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/icons/AppIcon.vue'
import {
  fetchBusinessFlows,
  createBusinessFlow,
  toggleBusinessFlow,
  deleteBusinessFlow
} from '@/api/appPackage'

const loading = ref(false)
const list = ref([])
const counts = ref({ event: 0, timer: 0 })

const triggerTab = ref('event')
const filterSource = ref('all')
const filterStatus = ref('all')
const filterName = ref('')
const page = ref(1)

const createDialog = ref(false)
const form = reactive({ name: '', trigger: 'event' })

const filteredList = computed(() =>
  list.value.filter((r) => {
    if (filterStatus.value === 'on' && !r.enabled) return false
    if (filterStatus.value === 'off' && r.enabled) return false
    if (filterName.value && !r.name.includes(filterName.value.trim())) return false
    return true
  })
)
const pagedList = computed(() => filteredList.value.slice((page.value - 1) * 20, page.value * 20))

async function load() {
  loading.value = true
  try {
    const data = await fetchBusinessFlows(triggerTab.value)
    list.value = data.list
    counts.value = data.counts
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  if (!form.name.trim()) return ElMessage.warning('请输入流程名称')
  await createBusinessFlow({ name: form.name, trigger: form.trigger })
  createDialog.value = false
  triggerTab.value = form.trigger
  form.name = ''
  ElMessage.success('已新建业务流程')
  load()
}

async function onToggle(row) {
  const data = await toggleBusinessFlow(row.id)
  Object.assign(row, data)
  ElMessage.success(data.enabled ? '已启用' : '已停用')
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除业务流程「${row.name}」？`, '删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'delete-confirm-button'
    })
  } catch {
    return
  }
  await deleteBusinessFlow(row.id)
  ElMessage.success('已删除')
  load()
}

watch(triggerTab, load)
onMounted(load)
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
}
.info-icon {
  color: #a6a8ae;
  margin-left: 4px;
  cursor: help;
}
.flow-intro {
  font-size: 12px;
  color: #57585e;
  margin: 8px 0 14px;
}
.manual-link {
  margin-left: 10px;
}
.flow-card {
  border-radius: 6px;
}
.flow-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.tags {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tag-chip {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  background: #f3f4f5;
  color: #57585e;
}
.tag-chip.active {
  background: #e5edff;
  color: #0047ff;
}
.filters {
  display: flex;
  gap: 8px;
}
.f-select {
  width: 130px;
}
.f-input {
  width: 150px;
}
.flow-tabs {
  margin-top: 4px;
}
.flow-name {
  font-weight: 500;
}
.flow-count {
  color: #57585e;
  font-weight: 400;
  margin-left: 2px;
}
.children-wrap {
  padding: 10px 20px;
  background: #fafbfc;
}
.child-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 6px 0;
}
.c-icon {
  color: #0047ff;
}
.c-arrow {
  color: #c5c6c9;
}
.flow-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
  justify-content: flex-end;
}
.page-size {
  font-size: 12px;
  color: #57585e;
}
</style>
