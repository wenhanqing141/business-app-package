<template>
  <BuilderWorkspace
    class="admin-layout ai-surface-page"
    :class="{ 'admin-layout--permission': route.name === 'AdminPermission' }"
    :scroll-content="!isFrontendRegion"
  >
    <template #header>
      <header class="admin-header">
        <AppTooltip content="返回编辑页" placement="bottom">
          <el-button text class="back-btn" aria-label="返回编辑页" @click="goBack">
            <AppIcon name="左" size="16" />
          </el-button>
        </AppTooltip>
        <span class="header-title">应用后台</span>
        <AppTooltip :content="pkgName" placement="bottom" only-when-overflow>
          <span class="header-pkg">{{ pkgName }}</span>
        </AppTooltip>
      </header>
    </template>

    <template #aside>
      <aside class="admin-nav" aria-label="应用后台导航">
        <el-scrollbar class="admin-nav-scroll" always>
          <el-menu class="admin-menu" :default-active="route.path" router aria-label="应用后台设置">
            <el-menu-item-group v-for="group in navGroups" :key="group.title" :title="group.title">
              <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">
                <AppIcon :name="item.icon" size="16" aria-hidden="true" />
                <span>{{ item.title }}</span>
              </el-menu-item>
            </el-menu-item-group>
          </el-menu>
        </el-scrollbar>
      </aside>
    </template>

    <AppPreview v-if="isFrontendRegion" nested-only />
    <RouterView v-else />
  </BuilderWorkspace>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchBuilderDetail } from '@/api/appPackage'
import AppIcon from '@/components/icons/AppIcon.vue'
import BuilderWorkspace from '@/layouts/BuilderWorkspace.vue'
import AppPreview from '@/components/builder/AppPreview.vue'

const router = useRouter()
const route = useRoute()
const pkgName = ref('校园后勤管理')
const isFrontendRegion = computed(() =>
  ['AdminAggregate', 'AdminFlow', 'AdminFactory'].includes(route.name)
)

const navGroups = [
  {
    title: '基本设置',
    items: [
      { title: '应用包基础信息', icon: 'info', path: '/builder/admin/base-info' },
      { title: '权限设置', icon: '权限设置', path: '/builder/admin/permission' }
    ]
  },
  {
    title: '高级功能',
    items: [
      { title: '聚合表', icon: '聚合表', path: '/builder/admin/aggregate-table' },
      { title: '业务流', icon: '应用关联图谱', path: '/builder/admin/business-flow' },
      { title: '数据工厂', icon: '数据工厂', path: '/builder/admin/data-factory' }
    ]
  }
]

function goBack() {
  router.push('/builder/home')
}

onMounted(async () => {
  try {
    const detail = await fetchBuilderDetail()
    pkgName.value = detail.pkg.name
  } catch {
    // 详情加载失败时保留默认名称，设置页面独立处理数据状态。
  }
})
</script>

<style scoped>
.admin-layout--permission :deep(.workspace-scroll > .el-scrollbar__wrap > .el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: var(--spacing-lg);
}
@media (max-width: 768px) {
  .admin-layout--permission :deep(.workspace-scroll > .el-scrollbar__wrap > .el-scrollbar__view) {
    padding-top: var(--spacing-sm);
  }
}
.back-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  background: var(--fill-1);
  color: var(--text-1);
  flex-shrink: 0;
}
.back-btn:hover {
  background: var(--brand-7);
  border-color: var(--color-primary);
  color: var(--brand-1);
}
.header-title {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}
.header-pkg {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--text-3);
  margin-left: var(--spacing-xs);
}
.admin-nav-scroll {
  flex: 1;
  min-height: 0;
}
.admin-nav-scroll :deep(.el-scrollbar__view) {
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}
.admin-menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--text-1);
  --el-menu-active-color: var(--brand-1);
  --el-menu-hover-bg-color: var(--fill-2);
  --el-menu-item-height: var(--builder-nav-row-height);
  border-right: 0;
}
.admin-menu :deep(.el-menu-item-group + .el-menu-item-group) {
  margin-top: var(--spacing-sm);
}
.admin-menu :deep(.el-menu-item-group__title) {
  padding: var(--spacing-sm) var(--spacing-md);
  padding-left: var(--spacing-md) !important;
  color: var(--text-3);
  font-size: var(--font-size-md);
  line-height: var(--spacing-xl);
}
.admin-menu :deep(.el-menu-item) {
  gap: var(--spacing-sm);
  margin-bottom: var(--builder-menu-row-gap);
  padding: 0 var(--spacing-md) !important;
  border-radius: var(--radius-md);
}
.admin-menu :deep(.el-menu-item.is-active) {
  background: var(--brand-7);
  font-weight: 500;
}
.admin-menu :deep(.el-menu-item:focus-visible) {
  outline: 2px solid var(--brand-5);
  outline-offset: -2px;
}
</style>
