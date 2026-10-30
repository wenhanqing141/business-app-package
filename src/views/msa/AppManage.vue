<template>
  <div class="msa-page ai-surface-page">
    <!-- 顶部栏（模拟微服务管理后台） -->
    <div class="topbar">
      <div class="brand">
        <AppIcon :size="20" name="应用" />
        <span>微服务管理后台</span>
        <el-divider direction="vertical" />
        <span class="module">应用管理</span>
      </div>
      <el-button text @click="$router.push('/package/manage')">
        <AppIcon name="左" :size="16" />返回应用包管理
      </el-button>
    </div>

    <div class="content">
      <!-- 搜索与新建 -->
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索应用"
          clearable
          style="width: 260px"
          :prefix-icon="'Search'"
        />
        <el-radio-group v-model="viewMode" size="default">
          <el-radio-button value="card">卡片</el-radio-button>
          <el-radio-button value="list">列表</el-radio-button>
        </el-radio-group>
        <div class="spacer" />
        <!-- 2026-10-11（PRD v3.0）：本页不再提供「新建业务应用包」入口，
             业务应用包的创建与管理移至「业务应用包管理」页面 -->
        <el-button @click="$router.push('/package/manage')">
          <AppIcon name="应用" :size="16" />去业务应用包管理
        </el-button>
      </div>

      <div v-loading="loading">
        <!-- 卡片视图 -->
        <el-row v-if="viewMode === 'card'" :gutter="16">
          <el-col v-for="item in filtered" :key="item.id" :span="8">
            <el-card class="item-card" shadow="hover">
              <div class="card-body">
                <EngineIcon :engine="item.engine" :size="34" />
                <div class="card-info">
                  <div class="card-name">{{ item.name }}</div>
                  <div class="card-meta">
                    {{ ENGINE_MAP[item.engine]?.label }} · {{ item.updatedAt }}
                  </div>
                </div>
              </div>
              <div class="card-actions">
                <el-button text size="small" disabled>编辑</el-button>
                <el-button text type="danger" size="small" disabled
                  >删除（需应用管理 + 市场各删一遍）</el-button
                >
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 列表视图 -->
        <el-table v-else :data="filtered" style="width: 100%">
          <el-table-column label="名称" min-width="240">
            <template #default="{ row }">
              <EngineIcon :engine="row.engine" :size="16" style="vertical-align: -3px" />
              <span style="margin-left: 6px">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="140">
            <template #default="{ row }">{{ ENGINE_MAP[row.engine]?.label }}</template>
          </el-table-column>
          <el-table-column prop="desc" label="描述" min-width="220" show-overflow-tooltip />
          <el-table-column label="创建 / 更新时间" width="180">
            <template #default="{ row }">{{ row.createdAt || row.updatedAt }}</template>
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default>
              <el-button text size="small" disabled>编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 现状说明 -->
      <el-alert class="note" type="info" :closable="false" show-icon title="现状说明（Mock 演示）">
        <template #default>
          本页只列「应用」：业务应用包既不由微服务创建、也不列入本列表（2026-10-11 起，
          创建与管理统一在「业务应用包管理」页面）。
          应用市场是应用的汇集处：应用管理中创建的应用同时进入两处；包内创建的应用只进市场、不进应用管理。
          包内删除应用只移除当前入口、应用保留在市场，但不再被其他应用包引用。
          <el-button type="primary" link size="small" @click="$router.push('/package/manage')">
            → 进入「业务应用包管理」页面
          </el-button>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchMsaList } from '@/api/appPackage'
import { ENGINE_MAP } from '@/mock/pkgSeed'
import AppIcon from '@/components/icons/AppIcon.vue'
import EngineIcon from '@/components/icons/EngineIcon.vue'

const loading = ref(true)
const keyword = ref('')
const viewMode = ref('card')
const list = ref([])

const filtered = computed(() => {
  const kw = keyword.value.trim()
  if (!kw) return list.value
  return list.value.filter((i) => i.name.includes(kw) || (i.desc || '').includes(kw))
})

onMounted(async () => {
  try {
    list.value = await fetchMsaList()
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.msa-page {
  min-height: 100vh;
  background: var(--layout-main-bg, #f5f8ff);
}
.topbar {
  height: 64px;
  background: transparent;
  color: var(--text-1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-1);
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}
.module {
  font-weight: 600;
}
.topbar :deep(.el-button) {
  color: var(--text-2);
}
.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.spacer {
  flex: 1;
}
.item-card {
  margin-bottom: 16px;
}
.card-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.card-name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin: 4px 0;
}
.card-desc {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
}
.card-actions {
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 10px;
  padding-top: 6px;
  display: flex;
  justify-content: flex-end;
}
.note {
  margin-top: 16px;
}
.note :deep(.el-alert__description) {
  font-size: 12px;
}
</style>
