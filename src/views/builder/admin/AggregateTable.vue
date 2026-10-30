<template>
  <div class="agg-page ai-surface-page" v-loading="loading">
    <div class="page-head">
      <span class="page-title">首页</span>
      <el-button type="primary" @click="createDialog = true">
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

    <!-- 新建聚合表 -->
    <el-dialog v-model="createDialog" title="新建聚合表" width="480px">
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入聚合表名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="聚合">
          <el-input v-model="form.aggText" placeholder="聚合字段，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="根据">
          <el-input v-model="form.byText" placeholder="关联条件，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="计算">
          <el-input v-model="form.calcText" placeholder="计算公式，多个用逗号分隔" />
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/icons/AppIcon.vue'
import {
  fetchAggregateTables,
  createAggregateTable,
  toggleAggregateTable,
  deleteAggregateTable
} from '@/api/appPackage'

const loading = ref(false)
const list = ref([])
const createDialog = ref(false)
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
  if (!form.name.trim()) return ElMessage.warning('请输入名称')
  const split = (s) =>
    s
      .split(/[,，]/)
      .map((x) => x.trim())
      .filter(Boolean)
  await createAggregateTable({
    name: form.name,
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
async function onDelete(item) {
  try {
    await ElMessageBox.confirm(`确认删除聚合表「${item.name}」？`, '删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'delete-confirm-button'
    })
  } catch {
    return
  }
  await deleteAggregateTable(item.id)
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
