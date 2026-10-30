<template>
  <div class="admin-layout ai-surface-page">
    <!-- 顶栏：红色返回 + 应用后台（线框 4） -->
    <header class="admin-header">
      <AppTooltip content="返回" placement="bottom">
        <el-button text class="back-btn" @click="goBack">
          <AppIcon class="back-icon" name="左" :size="16" />
        </el-button>
      </AppTooltip>
      <span class="header-title">应用后台</span>
      <span class="header-pkg">{{ pkgName }}</span>
    </header>

    <div class="admin-body">
      <!-- 左侧设置导航：基本设置 / 高级功能 / AI功能（线框 4） -->
      <aside class="admin-nav">
        <div v-for="grp in navGroups" :key="grp.title" class="nav-group">
          <div class="nav-group-title">{{ grp.title }}</div>
          <RouterLink
            v-for="item in grp.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            active-class="active"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </RouterLink>
        </div>
      </aside>

      <!-- 右侧配置显示区域（线框 9 空态：配置显示区域） -->
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchBuilderDetail } from '@/api/appPackage'
import AppIcon from '@/components/icons/AppIcon.vue'

const router = useRouter()
const pkgName = ref('校园后勤管理')

const navGroups = [
  {
    title: '基本设置',
    items: [
      { title: '应用包基础信息', icon: 'InfoFilled', path: '/builder/admin/base-info' },
      { title: '权限设置', icon: 'Lock', path: '/builder/admin/permission' }
    ]
  },
  {
    title: '高级功能',
    items: [
      { title: '聚合表', icon: 'Connection', path: '/builder/admin/aggregate-table' },
      { title: '业务流', icon: 'Share', path: '/builder/admin/business-flow' },
      { title: '数据工厂', icon: 'Coin', path: '/builder/admin/data-factory' }
    ]
  }
  // 2026-10-11 本版：原「AI功能 → 业务维护AI助手」分组已去掉
]

function goBack() {
  // 返回搭建工作台（线框 4 的「返回」语义）
  router.push('/builder/home')
}

onMounted(async () => {
  try {
    const detail = await fetchBuilderDetail()
    pkgName.value = detail.pkg.name
  } catch (e) {
    // 保持默认名称
  }
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-page);
}
/* 顶栏（设计稿：64px 高、浅蓝白底、无分割线） */
.admin-header {
  height: var(--builder-header-height);
  flex-shrink: 0;
  background: var(--brand-8);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
}
/* 返回：设计稿为白底 32×32 圆角方块 + 深色箭头（原红色箭头已按设计稿改） */
.back-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  background: var(--fill-1);
  color: var(--text-1) !important;
  flex-shrink: 0;
}
.back-btn:hover {
  background: var(--brand-7);
  border-color: var(--brand-4);
  color: var(--brand-1) !important;
}
.back-btn :deep(.el-icon) {
  color: inherit;
}
.back-icon {
  font-size: 16px;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}
.header-pkg {
  font-size: 14px;
  color: var(--text-3);
  margin-left: 4px;
}

.admin-body {
  flex: 1;
  display: flex;
  min-height: 0;
}
/* 左导航（设计稿：240px 宽、与顶栏同底、无分割线） */
.admin-nav {
  width: var(--builder-aside-width);
  flex-shrink: 0;
  background: var(--brand-8);
  padding: 24px 16px 16px;
  overflow-y: auto;
}
.nav-group {
  margin-bottom: 16px;
}
.nav-group-title {
  font-size: 12px;
  line-height: 24px;
  color: var(--text-3);
  padding: 0 12px;
}
/* 导航项：设计稿 40px 高、208px 宽、选中 #E5EDFF + 品牌色 */
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--builder-nav-row-height);
  padding: 0 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-2);
  text-decoration: none;
  margin-bottom: 2px;
}
.nav-item:hover {
  background: var(--fill-2);
  color: var(--text-1);
}
.nav-item.active {
  background: var(--brand-7);
  color: var(--brand-1);
  font-weight: 500;
}
/* 右侧配置面板：白底卡片贴齐顶栏与左栏，右 / 下留 16px（设计稿） */
.admin-content {
  flex: 1;
  min-width: 0;
  overflow: auto;
  margin: 0 var(--builder-panel-gap) var(--builder-panel-gap) 0;
  padding: 24px;
  background: var(--fill-1);
  border: 1px solid var(--border-2);
  border-radius: var(--builder-panel-radius);
  box-sizing: border-box;
}
</style>
