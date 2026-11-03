<template>
  <div v-loading="loading" class="agg-page ai-surface-page">
    <div class="page-head">
      <span class="page-title">首页</span>
      <el-button type="primary" @click="openCreate">
        <AppIcon class="el-icon--left" name="添加" :size="16" />新建聚合表
      </el-button>
    </div>

    <el-row :gutter="16">
      <el-col v-for="item in list" :key="item.id" :xs="24" :sm="12" :md="8" :lg="8">
        <el-card shadow="hover" class="agg-card">
          <!-- 启用中角标 -->
          <el-tag v-if="item.enabled" class="corner-tag" type="success" effect="dark" size="small"
            >启用中</el-tag
          >
          <el-tag v-else class="corner-tag" type="info" effect="plain" size="small">已停用</el-tag>

          <div class="agg-name">{{ item.name }}</div>

          <div class="agg-line">
            <span class="k">聚合：</span>
            <el-tag v-for="(v, i) in item.agg" :key="i" size="small" class="v-tag">{{ v }}</el-tag>
          </div>
          <div class="agg-line">
            <span class="k">根据：</span>
            <el-tag
              v-for="(v, i) in item.by"
              :key="i"
              size="small"
              type="success"
              plain
              class="v-tag"
              >{{ v }}</el-tag
            >
          </div>
          <div class="agg-line">
            <span class="k">计算：</span>
            <el-tag
              v-for="(v, i) in item.calc"
              :key="i"
              size="small"
              type="warning"
              plain
              class="v-tag"
              >{{ v }}</el-tag
            >
          </div>

          <div class="agg-actions">
            <el-button link type="primary" size="small" @click="onEdit(item)">编辑</el-button>
            <el-button link type="primary" size="small" @click="onCopy(item)">复制</el-button>
            <el-button link type="primary" size="small" @click="onLink(item)">链接</el-button>
            <el-button
              link
              :type="item.enabled ? 'warning' : 'success'"
              size="small"
              @click="onToggle(item)"
            >
              {{ item.enabled ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="onDelete(item)">删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!list.length && !loading" description="暂无聚合表，点击右上角新建" />

    <AppDialog
      v-model="createDialog"
      title="新建聚合表"
      description="填写名称，按需设置聚合字段、关联条件和计算公式"
      confirm-text="创建"
      :submit="submitCreate"
    >
      <template #default="{ submit, submitting }">
        <el-form
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-position="top"
          :disabled="submitting"
          @submit.prevent="submit"
        >
          <el-form-item label="名称" prop="name" required>
            <el-input
              v-model="form.name"
              placeholder="请输入聚合表名称"
              maxlength="30"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="聚合字段"
            ><el-input v-model="form.aggText" placeholder="多个字段用逗号分隔"
          /></el-form-item>
          <el-form-item label="关联条件"
            ><el-input v-model="form.byText" placeholder="多个条件用逗号分隔"
          /></el-form-item>
          <el-form-item label="计算公式"
            ><el-input v-model="form.calcText" placeholder="多个公式用逗号分隔"
          /></el-form-item>
        </el-form>
      </template>
    </AppDialog>
    <AppDialog
      v-model="deleteDialog.show"
      title="删除聚合表"
      :description="`确认删除聚合表「${deleteDialog.row?.name || ''}」？`"
      confirm-text="删除"
      danger
      :submit="confirmDelete"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/icons/AppIcon.vue'
import AppDialog from '@/components/AppDialog.vue'
import {
  fetchAggregateTables,
  createAggregateTable,
  toggleAggregateTable,
  deleteAggregateTable
} from '@/api/appPackage'

const loading = ref(false)
const list = ref([])
const formRef = ref(null)
const formRules = {
  name: [{ required: true, whitespace: true, message: '请输入聚合表名称', trigger: 'blur' }]
}
const createDialog = ref(false)
const deleteDialog = reactive({ show: false, row: null })
function openCreate() {
  Object.assign(form, { name: '', aggText: '', byText: '', calcText: '' })
  createDialog.value = true
}
const form = reactive({ name: '', aggText: '', byText: '', calcText: '' })

async function load() {
  loading.value = true
  try {
    list.value = await fetchAggregateTables()
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  if (!(await formRef.value.validate().catch(() => false))) return false
  const split = (s) =>
    s
      .split(/[,，]/)
      .map((x) => x.trim())
      .filter(Boolean)
  await createAggregateTable({
    name: form.name.trim(),
    agg: split(form.aggText) || ['聚合字段'],
    by: split(form.byText) || ['关联条件'],
    calc: split(form.calcText) || ['公式']
  })
  createDialog.value = false
  Object.assign(form, { name: '', aggText: '', byText: '', calcText: '' })
  ElMessage.success('已新建聚合表')
  load()
}

function onEdit(item) {
  ElMessage.info(`编辑「${item.name}」（演示入口）`)
}
function onCopy(item) {
  ElMessage.success(`已复制「${item.name}」（演示）`)
}
async function onLink(item) {
  try {
    await navigator.clipboard.writeText(`https://demo.example.com/aggregate/${item.id}`)
    ElMessage.success('聚合表链接已复制')
  } catch {
    ElMessage.info('链接：https://demo.example.com/aggregate/' + item.id)
  }
}
async function onToggle(item) {
  const data = await toggleAggregateTable(item.id)
  Object.assign(item, data)
  ElMessage.success(data.enabled ? '已启用' : '已停用')
}
function onDelete(item) {
  Object.assign(deleteDialog, { show: true, row: item })
}
async function confirmDelete() {
  await deleteAggregateTable(deleteDialog.row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
}
.agg-card {
  margin-bottom: 16px;
  position: relative;
}
.corner-tag {
  position: absolute;
  right: 12px;
  top: 12px;
}
.agg-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
  padding-right: 70px;
}
.agg-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: #57585e;
  margin-bottom: 8px;
}
.agg-line .k {
  flex-shrink: 0;
}
.v-tag {
  transform: scale(0.92);
  transform-origin: left center;
}
.agg-actions {
  margin-top: 12px;
  border-top: 1px dashed #eaeaeb;
  padding-top: 8px;
  display: flex;
  gap: 4px;
}
</style>
