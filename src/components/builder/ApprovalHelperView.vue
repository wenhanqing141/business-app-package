<template>
  <!-- 审批助手（每包唯一；固定链接 + appId 参数把数据范围收敛为包内审批） -->
  <div class="helper-view">
    <div class="hv-banner">
      <el-icon class="hv-icon"><Headset /></el-icon>
      <div>
        <div class="hv-title">审批助手</div>
        <div class="hv-tip">{{ scope.tip || '数据范围：本应用包内审批应用' }}</div>
      </div>
      <el-tag size="small" type="info" effect="plain"
        >{{ scope.appIds?.length || 0 }} 个审批应用</el-tag
      >
    </div>

    <el-tabs v-model="box" class="hv-tabs" @tab-change="load">
      <el-tab-pane label="待审批" name="todo" />
      <el-tab-pane label="已审批" name="done" />
      <el-tab-pane label="我发起的" name="sent" />
    </el-tabs>

    <div v-loading="loading" class="hv-list">
      <el-empty v-if="!list.length" description="暂无数据" :image-size="72" />
      <el-card v-for="r in list" :key="r.id" shadow="never" class="hv-card">
        <div class="hv-card-head">
          <el-tag
            size="small"
            :type="r.result === '驳回' ? 'danger' : r.result ? 'success' : 'warning'"
          >
            {{ r.result || '审批中' }}
          </el-tag>
          <span class="hv-type">{{ r.type }}</span>
          <span class="hv-amount">{{ r.amount }}</span>
        </div>
        <div class="hv-card-title">{{ r.title }}</div>
        <div class="hv-card-meta">
          <span>发起人：{{ r.applicant }}</span>
          <span>当前节点：{{ r.currentNode }}</span>
          <span>{{ r.createdAt }}</span>
        </div>
        <div v-if="box === 'todo'" class="hv-card-actions">
          <el-button size="small" type="primary" @click="act('通过', r)">通过</el-button>
          <el-button size="small" type="danger" plain @click="act('驳回', r)">驳回</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchApprovalData } from '@/api/approval'

const box = ref('todo')
const list = ref([])
const loading = ref(false)
const scope = ref({ appIds: [], tip: '' })

async function load() {
  loading.value = true
  try {
    const data = await fetchApprovalData(box.value)
    list.value = data.list
    scope.value = data.scope
  } finally {
    loading.value = false
  }
}

function act(type, r) {
  ElMessage.success(`已${type}「${r.title}」（演示）`)
  list.value = list.value.filter((x) => x.id !== r.id)
}

onMounted(load)
</script>

<style scoped>
.helper-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f8ff;
  min-height: 0;
}
.hv-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  padding: 14px 18px;
  border-bottom: 1px solid #eaeaeb;
}
.hv-icon {
  font-size: 30px;
  color: #13c2c2;
}
.hv-title {
  font-size: 15px;
  font-weight: 600;
}
.hv-tip {
  font-size: 12px;
  color: #57585e;
  margin-top: 2px;
}
.hv-tabs {
  padding: 0 18px;
  background: #fff;
  margin-bottom: 10px;
}
.hv-list {
  flex: 1;
  overflow: auto;
  padding: 0 18px 18px;
}
.hv-card {
  margin-bottom: 10px;
  border-radius: 6px;
}
.hv-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hv-type {
  font-size: 12px;
  color: #57585e;
}
.hv-amount {
  margin-left: auto;
  font-weight: 600;
  color: #ec3327;
}
.hv-card-title {
  font-size: 14px;
  font-weight: 500;
  margin: 8px 0 6px;
}
.hv-card-meta {
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: #57585e;
  flex-wrap: wrap;
}
.hv-card-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}
</style>
